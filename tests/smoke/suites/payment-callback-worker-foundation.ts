import { strict as assert } from 'node:assert';
import {
  createNormalizedPaymentCallbackCandidate,
  createProviderBoundaryFlags,
  NormalizedPaymentCallbackCandidate,
  ProviderBoundaryFlags,
  ProviderCallbackRecord,
} from '../../../packages/contracts/src';
import { InMemoryProviderCallbackEventRepository } from '../../../packages/persistence/src/provider-callback';
import { processPaymentCallbackRecordsDryRun } from '../../../services/payment/src/callback-worker';
import { SmokeRunner, SmokeResult } from '../types';

const assertBoundaryFalse = (boundary: ProviderBoundaryFlags) => {
  assert.equal(boundary.providerTruth, false);
  assert.equal(boundary.businessTruthMutated, false);
  assert.equal(boundary.ownerStateMutated, false);
  assert.equal(boundary.eventTruthMutated, false);
  assert.equal(boundary.outboxDeliveryGuaranteed, false);
};

const baseCandidate = (
  overrides: Partial<NormalizedPaymentCallbackCandidate> = {},
): NormalizedPaymentCallbackCandidate => ({
  ...createNormalizedPaymentCallbackCandidate({
    providerName: 'paytr',
    providerMode: 'sandbox',
    callbackRecordId: 'pending_insert',
    providerEventId: 'MERCHANT123',
    providerReference: 'MERCHANT123',
    callbackType: 'paytr.iframe.success',
    normalizedStatus: 'succeeded',
    paymentAttemptId: 'attempt-1',
    paymentId: 'payment-1',
    checkoutId: 'checkout-1',
    amount: 1000,
    currency: 'TRY',
    occurredAt: new Date('2026-05-06T00:00:00.000Z'),
    verificationStatus: 'verified',
    replayStatus: 'first_seen',
    signatureVerified: true,
    replayDetected: false,
    riskFlags: [],
  }),
  ...overrides,
});

const insertCallbackRecord = async (
  repository: InMemoryProviderCallbackEventRepository,
  input: {
    readonly providerDomain?: ProviderCallbackRecord['providerDomain'];
    readonly providerEventId?: string;
    readonly normalizedPayload?: unknown;
  } = {},
) =>
  repository.insertProviderCallbackEvent({
    providerDomain: input.providerDomain ?? 'payment',
    providerName: 'paytr',
    providerMode: 'sandbox',
    callbackType: 'paytr.iframe.callback',
    ...(input.providerEventId ? { providerEventId: input.providerEventId } : {}),
    verificationStatus: 'verified',
    processingStatus: 'received',
    replayStatus: 'first_seen',
    signatureVerified: true,
    replayDetected: false,
    receivedAt: new Date('2026-05-06T00:00:00.000Z'),
    normalizedPayload: input.normalizedPayload ?? { candidate: baseCandidate() },
    boundary: createProviderBoundaryFlags(),
  });

export const paymentCallbackWorkerFoundationSmoke: SmokeRunner = {
  name: 'payment-callback-worker-foundation',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    try {
      const commandRepository = new InMemoryProviderCallbackEventRepository();
      const commandRecord = await insertCallbackRecord(commandRepository, {
        providerEventId: 'MERCHANT123',
        normalizedPayload: { candidate: baseCandidate() },
      });
      const commandResult = await processPaymentCallbackRecordsDryRun({
        repository: commandRepository,
      });
      const processedCommandRecord = await commandRepository.getProviderCallbackEventById(commandRecord.id);
      assert.equal(commandResult.scanned, 1);
      assert.equal(commandResult.commandReady, 1);
      assert.equal(commandResult.decisions[0]?.ownerCommandType, 'MARK_PAYMENT_SUCCEEDED');
      assert.equal(
        commandResult.decisions[0]?.idempotencyKey,
        'payment-callback:payment:paytr:MERCHANT123:attempt-1:MARK_PAYMENT_SUCCEEDED',
      );
      assert.equal(processedCommandRecord?.processingStatus, 'accepted');
      assertBoundaryFalse(commandResult.decisions[0]!.boundary);

      const fallbackIdempotencyRepository = new InMemoryProviderCallbackEventRepository();
      const fallbackRecord = await insertCallbackRecord(fallbackIdempotencyRepository, {
        normalizedPayload: {
          candidate: baseCandidate({
            providerEventId: undefined,
            providerReference: undefined,
          }),
        },
      });
      const fallbackResult = await processPaymentCallbackRecordsDryRun({
        repository: fallbackIdempotencyRepository,
      });
      assert.equal(
        fallbackResult.decisions[0]?.idempotencyKey,
        `payment-callback:payment:paytr:record:${fallbackRecord.id}:attempt-1:MARK_PAYMENT_SUCCEEDED`,
      );

      const rejectedRepository = new InMemoryProviderCallbackEventRepository();
      const rejectedRecord = await insertCallbackRecord(rejectedRepository, {
        normalizedPayload: {
          candidate: baseCandidate({
            normalizedStatus: 'signature_failed',
            ownerCommandCandidate: 'NONE',
            shouldProcess: false,
            shouldReject: true,
            verificationStatus: 'failed',
            signatureVerified: false,
            rejectionReason: 'signature_verification_failed',
          }),
        },
      });
      const rejectedResult = await processPaymentCallbackRecordsDryRun({
        repository: rejectedRepository,
      });
      const processedRejectedRecord = await rejectedRepository.getProviderCallbackEventById(rejectedRecord.id);
      assert.equal(rejectedResult.rejected, 1);
      assert.equal(processedRejectedRecord?.processingStatus, 'rejected');

      const missingAttemptRepository = new InMemoryProviderCallbackEventRepository();
      const missingAttemptRecord = await insertCallbackRecord(missingAttemptRepository, {
        normalizedPayload: {
          candidate: baseCandidate({
            paymentAttemptId: undefined,
            shouldProcess: true,
            shouldReject: false,
          }),
        },
      });
      const missingAttemptResult = await processPaymentCallbackRecordsDryRun({
        repository: missingAttemptRepository,
      });
      const processedMissingAttemptRecord =
        await missingAttemptRepository.getProviderCallbackEventById(missingAttemptRecord.id);
      assert.equal(missingAttemptResult.reconciliationRequired, 1);
      assert.equal(missingAttemptResult.commandReady, 0);
      assert.equal(processedMissingAttemptRecord?.processingStatus, 'ignored');

      const pendingRepository = new InMemoryProviderCallbackEventRepository();
      const pendingRecord = await insertCallbackRecord(pendingRepository, {
        normalizedPayload: {
          candidate: baseCandidate({
            normalizedStatus: 'pending',
            ownerCommandCandidate: 'MARK_PAYMENT_PENDING',
            shouldProcess: true,
            shouldReconcile: true,
          }),
        },
      });
      const pendingResult = await processPaymentCallbackRecordsDryRun({
        repository: pendingRepository,
      });
      const processedPendingRecord = await pendingRepository.getProviderCallbackEventById(pendingRecord.id);
      assert.equal(pendingResult.reconciliationRequired, 1);
      assert.equal(processedPendingRecord?.processingStatus, 'ignored');

      const invalidRepository = new InMemoryProviderCallbackEventRepository();
      const invalidRecord = await insertCallbackRecord(invalidRepository, {
        normalizedPayload: { candidate: { providerDomain: 'payment' } },
      });
      const invalidResult = await processPaymentCallbackRecordsDryRun({
        repository: invalidRepository,
      });
      const processedInvalidRecord = await invalidRepository.getProviderCallbackEventById(invalidRecord.id);
      assert.equal(invalidResult.failed, 1);
      assert.equal(invalidResult.decisions[0]?.decisionStatus, 'invalid_normalized_payload');
      assert.equal(processedInvalidRecord?.processingStatus, 'failed');

      const nonPaymentRepository = new InMemoryProviderCallbackEventRepository();
      const nonPaymentRecord = await insertCallbackRecord(nonPaymentRepository, {
        providerDomain: 'notification',
        normalizedPayload: { event: 'notification.delivered' },
      });
      const nonPaymentResult = await processPaymentCallbackRecordsDryRun({
        repository: nonPaymentRepository,
      });
      const processedNonPaymentRecord = await nonPaymentRepository.getProviderCallbackEventById(nonPaymentRecord.id);
      assert.equal(nonPaymentResult.scanned, 1);
      assert.equal(nonPaymentResult.commandReady, 0);
      assert.equal(nonPaymentResult.rejected, 0);
      assert.equal(nonPaymentResult.reconciliationRequired, 0);
      assert.equal(nonPaymentResult.ignored, 0);
      assert.equal(nonPaymentResult.failed, 0);
      assert.equal(nonPaymentResult.decisions[0]?.decisionStatus, 'not_payment_callback');
      assert.equal(processedNonPaymentRecord?.processingStatus, 'received');

      const limitRepository = new InMemoryProviderCallbackEventRepository();
      await insertCallbackRecord(limitRepository, {
        providerEventId: 'MERCHANT-LIMIT-1',
        normalizedPayload: { candidate: baseCandidate({ providerEventId: 'MERCHANT-LIMIT-1' }) },
      });
      await insertCallbackRecord(limitRepository, {
        providerEventId: 'MERCHANT-LIMIT-2',
        normalizedPayload: { candidate: baseCandidate({ providerEventId: 'MERCHANT-LIMIT-2' }) },
      });
      const limitResult = await processPaymentCallbackRecordsDryRun({
        repository: limitRepository,
        limit: 1,
      });
      assert.equal(limitResult.scanned, 1);

      return {
        result: 'PASS',
        message:
          'Payment callback dry-run worker updates only provider callback lifecycle status and skips non-payment callbacks.',
      };
    } catch (error) {
      return { result: 'FAIL', message: (error as Error).message };
    }
  },
};
