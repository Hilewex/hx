import { strict as assert } from 'node:assert';
import {
  createNormalizedPaymentCallbackCandidate,
  createPaymentCallbackOwnerCommandIdempotencyKey,
  createPaytrPaymentCallbackLookupPlan,
  decidePaymentCallbackOwnerCommand,
  NormalizedPaymentCallbackCandidate,
  PaymentAttemptState,
  PaymentState,
} from '../../../packages/contracts/src/payment';
import { SmokeRunner, SmokeResult } from '../types';

const assertBoundaryFalse = (boundary: NormalizedPaymentCallbackCandidate['boundary']) => {
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
    callbackRecordId: 'callback-1',
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

export const paymentCallbackOwnerCommandSmoke: SmokeRunner = {
  name: 'payment-callback-owner-command',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    try {
      const succeeded = decidePaymentCallbackOwnerCommand({
        candidate: baseCandidate(),
        callbackRecordId: 'callback-1',
      });
      assert.equal(succeeded.status, 'command_ready');
      assert.equal(succeeded.command?.commandType, 'MARK_PAYMENT_SUCCEEDED');
      assert.equal(
        succeeded.command?.idempotencyKey,
        'payment-callback:payment:paytr:MERCHANT123:attempt-1:MARK_PAYMENT_SUCCEEDED',
      );
      assertBoundaryFalse(succeeded.boundary);
      assertBoundaryFalse(succeeded.command!.boundary);

      const failed = decidePaymentCallbackOwnerCommand({
        candidate: baseCandidate({
          normalizedStatus: 'failed',
          ownerCommandCandidate: 'MARK_PAYMENT_FAILED',
          callbackType: 'paytr.iframe.failed',
        }),
        callbackRecordId: 'callback-1',
      });
      assert.equal(failed.status, 'command_ready');
      assert.equal(failed.command?.commandType, 'MARK_PAYMENT_FAILED');

      const pending = decidePaymentCallbackOwnerCommand({
        candidate: baseCandidate({
          normalizedStatus: 'pending',
          ownerCommandCandidate: 'MARK_PAYMENT_PENDING',
          shouldProcess: true,
          shouldReconcile: true,
        }),
        callbackRecordId: 'callback-1',
      });
      assert.equal(pending.status, 'candidate_requires_reconciliation');
      assert.equal(pending.command, undefined);
      assert.equal(pending.shouldReconcile, true);

      const unknownResult = decidePaymentCallbackOwnerCommand({
        candidate: baseCandidate({
          normalizedStatus: 'unknown_result',
          ownerCommandCandidate: 'NONE',
          shouldProcess: false,
          shouldReconcile: true,
        }),
        callbackRecordId: 'callback-1',
      });
      assert.equal(unknownResult.status, 'candidate_requires_reconciliation');
      assert.equal(unknownResult.command, undefined);
      assert.equal(unknownResult.shouldReconcile, true);

      const missingAttempt = decidePaymentCallbackOwnerCommand({
        candidate: baseCandidate({
          paymentAttemptId: undefined,
          shouldProcess: true,
          shouldReject: false,
        }),
        callbackRecordId: 'callback-1',
      });
      assert.equal(missingAttempt.status, 'missing_payment_attempt');
      assert.equal(missingAttempt.command, undefined);
      assert.equal(missingAttempt.shouldReconcile, true);

      const signatureFailed = decidePaymentCallbackOwnerCommand({
        candidate: baseCandidate({
          normalizedStatus: 'signature_failed',
          ownerCommandCandidate: 'NONE',
          shouldProcess: false,
          shouldReject: true,
          verificationStatus: 'failed',
          signatureVerified: false,
          rejectionReason: 'signature_verification_failed',
        }),
        callbackRecordId: 'callback-1',
      });
      assert.equal(signatureFailed.status, 'candidate_rejected');
      assert.equal(signatureFailed.command, undefined);

      const replayDetected = decidePaymentCallbackOwnerCommand({
        candidate: baseCandidate({
          replayDetected: true,
          replayStatus: 'replay_detected',
        }),
        callbackRecordId: 'callback-1',
      });
      assert.equal(replayDetected.status, 'candidate_rejected');
      assert.equal(replayDetected.command, undefined);

      const unsupportedVerification = decidePaymentCallbackOwnerCommand({
        candidate: baseCandidate({
          verificationStatus: 'unsupported',
        }),
        callbackRecordId: 'callback-1',
      });
      assert.notEqual(unsupportedVerification.status, 'command_ready');
      assert.equal(unsupportedVerification.command, undefined);

      assert.equal(
        createPaymentCallbackOwnerCommandIdempotencyKey({
          providerName: 'paytr',
          providerEventId: 'MERCHANT123',
          callbackRecordId: 'callback-1',
          paymentAttemptId: 'attempt-1',
          commandType: 'MARK_PAYMENT_SUCCEEDED',
        }),
        'payment-callback:payment:paytr:MERCHANT123:attempt-1:MARK_PAYMENT_SUCCEEDED',
      );

      assert.equal(
        createPaymentCallbackOwnerCommandIdempotencyKey({
          providerName: 'paytr',
          callbackRecordId: 'callback-1',
          paymentAttemptId: 'attempt-1',
          commandType: 'MARK_PAYMENT_FAILED',
        }),
        'payment-callback:payment:paytr:record:callback-1:attempt-1:MARK_PAYMENT_FAILED',
      );

      const lookupPlan = createPaytrPaymentCallbackLookupPlan();
      assert.equal(lookupPlan.primary, 'provider_reference');
      assert.deepEqual(lookupPlan.fallbacks, [
        'payment_attempt_id',
        'idempotency_key',
        'manual_reconciliation',
      ]);
      assert.equal(lookupPlan.providerReferenceStrategy, 'paytr_merchant_oid_as_provider_reference');
      assert.equal(lookupPlan.requiresInitiateContract, true);
      assertBoundaryFalse(lookupPlan.boundary);

      const paymentStates: PaymentState[] = ['PENDING', 'UNKNOWN_RESULT'];
      const attemptStates: PaymentAttemptState[] = [
        'FAILED',
        'CANCELLED',
        'EXPIRED',
        'UNKNOWN_RESULT',
      ];
      assert.deepEqual(paymentStates, ['PENDING', 'UNKNOWN_RESULT']);
      assert.deepEqual(attemptStates, ['FAILED', 'CANCELLED', 'EXPIRED', 'UNKNOWN_RESULT']);

      return {
        result: 'PASS',
        message:
          'Payment callback owner command contract, idempotency helper, lookup plan, and state extensions are pure and boundary-safe.',
      };
    } catch (error) {
      return { result: 'FAIL', message: (error as Error).message };
    }
  },
};
