import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import {
  createNormalizedPaymentCallbackCandidate,
  createProviderBoundaryFlags,
  NormalizedPaymentCallbackCandidate,
  PaymentInitiationResponse,
  ProviderCallbackRecord,
} from '../../../packages/contracts/src';
import { InMemoryProviderCallbackEventRepository } from '../../../packages/persistence/src/provider-callback';
import { getPaymentRepository, resetPaymentRepository } from '../../../services/payment/src/repository';
import { processPaymentCallbackRecordsDryRun } from '../../../services/payment/src/callback-worker';
import { SmokeRunner, SmokeResult } from '../types';

const createPayment = (
  overrides: Partial<PaymentInitiationResponse> = {},
): PaymentInitiationResponse => {
  const paymentId = overrides.paymentId ?? `payment-${randomUUID()}`;
  const checkoutId = overrides.checkoutId ?? `checkout-${randomUUID()}`;

  return {
    paymentId,
    checkoutId,
    cartContext: {
      actorType: 'CUSTOMER',
      actorId: `customer-${randomUUID()}`,
    },
    state: 'INITIATED',
    attempt: {
      paymentAttemptId: `attempt-${randomUUID()}`,
      checkoutId,
      amount: 1000,
      currency: 'TRY',
      method: 'CARD',
      state: 'PROVIDER_REDIRECT_READY',
      providerName: 'paytr',
      providerReference: `MERCHANT-OID-${randomUUID()}`,
      idempotencyKey: `idem-${randomUUID()}`,
    },
    errors: [],
    warnings: [],
    ...overrides,
    attempt: {
      paymentAttemptId: `attempt-${randomUUID()}`,
      checkoutId,
      amount: 1000,
      currency: 'TRY',
      method: 'CARD',
      state: 'PROVIDER_REDIRECT_READY',
      providerName: 'paytr',
      providerReference: `MERCHANT-OID-${randomUUID()}`,
      idempotencyKey: `idem-${randomUUID()}`,
      ...overrides.attempt,
    },
  };
};

const baseCandidate = (
  overrides: Partial<NormalizedPaymentCallbackCandidate> = {},
): NormalizedPaymentCallbackCandidate => ({
  ...createNormalizedPaymentCallbackCandidate({
    providerName: 'paytr',
    providerMode: 'sandbox',
    callbackRecordId: 'pending_insert',
    providerEventId: `event-${randomUUID()}`,
    providerReference: `MERCHANT-OID-${randomUUID()}`,
    callbackType: 'paytr.iframe.success',
    normalizedStatus: 'succeeded',
    paymentAttemptId: `attempt-${randomUUID()}`,
    paymentId: `payment-${randomUUID()}`,
    checkoutId: `checkout-${randomUUID()}`,
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

const providerReferenceOnlyCandidate = (
  providerReference: string,
  overrides: Partial<NormalizedPaymentCallbackCandidate> = {},
): NormalizedPaymentCallbackCandidate => ({
  ...baseCandidate({
    paymentAttemptId: undefined,
    paymentId: undefined,
    checkoutId: undefined,
    providerEventId: providerReference,
    providerReference,
    ownerCommandCandidate: 'MARK_PAYMENT_SUCCEEDED',
    shouldProcess: true,
    shouldReject: false,
    shouldReconcile: false,
    rejectionReason: undefined,
  }),
  ...overrides,
});

const insertCallbackRecord = async (
  repository: InMemoryProviderCallbackEventRepository,
  candidate: NormalizedPaymentCallbackCandidate,
) =>
  repository.insertProviderCallbackEvent({
    providerDomain: 'payment',
    providerName: candidate.providerName,
    providerMode: candidate.providerMode,
    callbackType: candidate.callbackType,
    ...(candidate.providerEventId ? { providerEventId: candidate.providerEventId } : {}),
    ...(candidate.providerReference ? { providerReference: candidate.providerReference } : {}),
    verificationStatus: candidate.verificationStatus,
    processingStatus: 'received',
    replayStatus: candidate.replayStatus,
    signatureVerified: candidate.signatureVerified,
    replayDetected: candidate.replayDetected,
    receivedAt: new Date('2026-05-06T00:00:00.000Z'),
    normalizedPayload: { candidate },
    boundary: createProviderBoundaryFlags(),
  } satisfies Omit<ProviderCallbackRecord, 'id' | 'createdAt' | 'updatedAt'>);

export const paymentCallbackOwnerTransitionSmoke: SmokeRunner = {
  name: 'payment-callback-owner-transition',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    const originalPersistenceMode = process.env.PERSISTENCE_MODE;

    try {
      process.env.PERSISTENCE_MODE = 'memory';
      resetPaymentRepository();
      const paymentRepository = getPaymentRepository();

      const succeededPayment = createPayment({
        paymentId: 'payment-succeeded-owner-transition',
        checkoutId: 'checkout-succeeded-owner-transition',
        attempt: {
          paymentAttemptId: 'attempt-succeeded-owner-transition',
          checkoutId: 'checkout-succeeded-owner-transition',
          amount: 1000,
          currency: 'TRY',
          method: 'CARD',
          state: 'PROVIDER_REDIRECT_READY',
          providerName: 'paytr',
          providerReference: 'MERCHANT-OID-SUCCEEDED',
          idempotencyKey: 'idem-succeeded-owner-transition',
        },
      });
      await paymentRepository.save(succeededPayment);

      const succeededCallbacks = new InMemoryProviderCallbackEventRepository();
      const succeededRecord = await insertCallbackRecord(
        succeededCallbacks,
        providerReferenceOnlyCandidate('MERCHANT-OID-SUCCEEDED'),
      );
      const succeededResult = await processPaymentCallbackRecordsDryRun({
        repository: succeededCallbacks,
        ownerTransitionMode: 'apply_owner_transition',
      });
      const succeededAfter = await paymentRepository.getById(succeededPayment.paymentId);
      const succeededCallbackAfter =
        await succeededCallbacks.getProviderCallbackEventById(succeededRecord.id);
      assert.equal(succeededResult.commandReady, 1);
      assert.equal(succeededResult.decisions[0]?.ownerTransitionApplied, true);
      assert.equal(succeededCallbackAfter?.processingStatus, 'accepted');
      assert.equal(succeededAfter?.state, 'SUCCEEDED');
      assert.equal(succeededAfter?.attempt.state, 'SUCCEEDED');
      assert.equal(succeededAfter?.attempt.callbackRecordId, succeededRecord.id);
      assert.equal(succeededAfter?.attempt.lastCallbackStatus, 'succeeded');

      const duplicateCallbacks = new InMemoryProviderCallbackEventRepository();
      await insertCallbackRecord(
        duplicateCallbacks,
        baseCandidate({
          providerEventId: 'MERCHANT-OID-SUCCEEDED-DUPLICATE',
          providerReference: 'MERCHANT-OID-SUCCEEDED',
          paymentAttemptId: succeededPayment.attempt.paymentAttemptId,
          paymentId: succeededPayment.paymentId,
          checkoutId: succeededPayment.checkoutId,
        }),
      );
      const duplicateResult = await processPaymentCallbackRecordsDryRun({
        repository: duplicateCallbacks,
        ownerTransitionMode: 'apply_owner_transition',
      });
      assert.equal(duplicateResult.commandReady, 1);
      assert.equal(duplicateResult.decisions[0]?.ownerTransitionApplied, false);
      assert.equal(duplicateResult.decisions[0]?.ownerTransitionAlreadyApplied, true);
      assert.equal((await paymentRepository.getById(succeededPayment.paymentId))?.state, 'SUCCEEDED');

      const failedPayment = createPayment({
        paymentId: 'payment-failed-owner-transition',
        checkoutId: 'checkout-failed-owner-transition',
        attempt: {
          paymentAttemptId: 'attempt-failed-owner-transition',
          checkoutId: 'checkout-failed-owner-transition',
          amount: 1000,
          currency: 'TRY',
          method: 'CARD',
          state: 'PROVIDER_REDIRECT_READY',
          providerName: 'paytr',
          providerReference: 'MERCHANT-OID-FAILED',
          idempotencyKey: 'idem-failed-owner-transition',
        },
      });
      await paymentRepository.save(failedPayment);
      const failedCallbacks = new InMemoryProviderCallbackEventRepository();
      await insertCallbackRecord(
        failedCallbacks,
        baseCandidate({
          providerEventId: 'MERCHANT-OID-FAILED',
          providerReference: 'MERCHANT-OID-FAILED',
          normalizedStatus: 'failed',
          ownerCommandCandidate: 'MARK_PAYMENT_FAILED',
          callbackType: 'paytr.iframe.failed',
          paymentAttemptId: failedPayment.attempt.paymentAttemptId,
          paymentId: failedPayment.paymentId,
          checkoutId: failedPayment.checkoutId,
        }),
      );
      const failedResult = await processPaymentCallbackRecordsDryRun({
        repository: failedCallbacks,
        ownerTransitionMode: 'apply_owner_transition',
      });
      const failedAfter = await paymentRepository.getById(failedPayment.paymentId);
      assert.equal(failedResult.commandReady, 1);
      assert.equal(failedResult.decisions[0]?.ownerTransitionApplied, true);
      assert.equal(failedAfter?.state, 'FAILED');
      assert.equal(failedAfter?.attempt.state, 'FAILED');
      assert.equal(failedAfter?.attempt.lastCallbackStatus, 'failed');

      const rejectedCallbacks = new InMemoryProviderCallbackEventRepository();
      await insertCallbackRecord(
        rejectedCallbacks,
        baseCandidate({
          normalizedStatus: 'signature_failed',
          ownerCommandCandidate: 'NONE',
          shouldProcess: false,
          shouldReject: true,
          verificationStatus: 'failed',
          signatureVerified: false,
          rejectionReason: 'signature_verification_failed',
          paymentAttemptId: failedPayment.attempt.paymentAttemptId,
          paymentId: failedPayment.paymentId,
        }),
      );
      const failedStateBeforeRejected = (await paymentRepository.getById(failedPayment.paymentId))?.state;
      const rejectedResult = await processPaymentCallbackRecordsDryRun({
        repository: rejectedCallbacks,
        ownerTransitionMode: 'apply_owner_transition',
      });
      assert.equal(rejectedResult.rejected, 1);
      assert.equal((await paymentRepository.getById(failedPayment.paymentId))?.state, failedStateBeforeRejected);

      const missingLookupCallbacks = new InMemoryProviderCallbackEventRepository();
      await insertCallbackRecord(
        missingLookupCallbacks,
        providerReferenceOnlyCandidate('MERCHANT-OID-MISSING'),
      );
      const missingLookupResult = await processPaymentCallbackRecordsDryRun({
        repository: missingLookupCallbacks,
        ownerTransitionMode: 'apply_owner_transition',
      });
      assert.equal(missingLookupResult.reconciliationRequired, 1);
      assert.equal(missingLookupResult.commandReady, 0);
      assert.equal(missingLookupResult.decisions[0]?.decisionStatus, 'missing_payment_attempt');

      const pendingCallbacks = new InMemoryProviderCallbackEventRepository();
      await insertCallbackRecord(
        pendingCallbacks,
        baseCandidate({
          providerEventId: 'MERCHANT-OID-PENDING',
          providerReference: 'MERCHANT-OID-PENDING',
          normalizedStatus: 'pending',
          ownerCommandCandidate: 'MARK_PAYMENT_PENDING',
          shouldProcess: true,
          shouldReconcile: true,
          paymentAttemptId: failedPayment.attempt.paymentAttemptId,
          paymentId: failedPayment.paymentId,
        }),
      );
      const pendingResult = await processPaymentCallbackRecordsDryRun({
        repository: pendingCallbacks,
        ownerTransitionMode: 'apply_owner_transition',
      });
      assert.equal(pendingResult.reconciliationRequired, 1);
      assert.equal((await paymentRepository.getById(failedPayment.paymentId))?.state, 'FAILED');

      return {
        result: 'PASS',
        message:
          'Opt-in callback worker owner transition applied succeeded/failed only; duplicate, rejected, pending, and missing lookup paths stayed bounded.',
      };
    } catch (error) {
      return { result: 'FAIL', message: (error as Error).message };
    } finally {
      resetPaymentRepository();
      if (originalPersistenceMode === undefined) {
        delete process.env.PERSISTENCE_MODE;
      } else {
        process.env.PERSISTENCE_MODE = originalPersistenceMode;
      }
    }
  },
};
