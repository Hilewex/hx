import { strict as assert } from 'node:assert';
import {
  createNormalizedPaymentCallbackCandidate,
  decidePaymentCallbackCandidate,
  NormalizedPaymentCallbackCandidate,
} from '../../../packages/contracts/src/payment';
import { SmokeRunner, SmokeResult } from '../types';

const baseCandidate = (
  overrides: Partial<NormalizedPaymentCallbackCandidate> = {},
) => createNormalizedPaymentCallbackCandidate({
  providerName: 'generic-payment-provider',
  providerMode: 'sandbox',
  callbackRecordId: 'callback-record-1',
  providerEventId: 'provider-event-1',
  providerReference: 'provider-reference-1',
  callbackType: 'payment.callback',
  normalizedStatus: 'succeeded',
  paymentAttemptId: 'payment-attempt-1',
  paymentId: 'payment-1',
  checkoutId: 'checkout-1',
  amount: 100,
  currency: 'TRY',
  occurredAt: new Date('2026-05-05T00:00:00.000Z'),
  verificationStatus: 'verified',
  replayStatus: 'first_seen',
  signatureVerified: true,
  replayDetected: false,
  riskFlags: [],
  ...overrides,
});

export const paymentCallbackCandidateSmoke: SmokeRunner = {
  name: 'payment-callback-candidate',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    try {
      const succeeded = baseCandidate();
      assert.equal(succeeded.providerDomain, 'payment');
      assert.equal(succeeded.ownerCommandCandidate, 'MARK_PAYMENT_SUCCEEDED');
      assert.equal(succeeded.shouldProcess, true);
      assert.equal(succeeded.shouldReject, false);
      assert.equal(succeeded.shouldReconcile, false);
      assert.equal(succeeded.boundary.providerTruth, false);
      assert.equal(succeeded.boundary.businessTruthMutated, false);
      assert.equal(succeeded.boundary.ownerStateMutated, false);
      assert.equal(succeeded.boundary.eventTruthMutated, false);
      assert.equal(succeeded.boundary.outboxDeliveryGuaranteed, false);

      const failed = baseCandidate({ normalizedStatus: 'failed' });
      assert.equal(failed.ownerCommandCandidate, 'MARK_PAYMENT_FAILED');
      assert.equal(failed.shouldProcess, true);
      assert.equal(failed.shouldReject, false);

      const pending = baseCandidate({ normalizedStatus: 'pending' });
      assert.equal(pending.ownerCommandCandidate, 'MARK_PAYMENT_PENDING');
      assert.equal(pending.shouldProcess, true);
      assert.equal(pending.shouldReconcile, true);

      const duplicate = baseCandidate({ normalizedStatus: 'duplicate' });
      assert.equal(duplicate.ownerCommandCandidate, 'NONE');
      assert.equal(duplicate.shouldProcess, false);
      assert.equal(duplicate.shouldReject, true);
      assert.equal(duplicate.rejectionReason, 'duplicate_callback');

      const signatureFailed = baseCandidate({
        normalizedStatus: 'signature_failed',
        verificationStatus: 'failed',
        signatureVerified: false,
      });
      assert.equal(signatureFailed.ownerCommandCandidate, 'NONE');
      assert.equal(signatureFailed.shouldProcess, false);
      assert.equal(signatureFailed.shouldReject, true);
      assert.equal(signatureFailed.rejectionReason, 'signature_verification_failed');

      const amountMismatch = baseCandidate({
        normalizedStatus: 'rejected_amount_mismatch',
        riskFlags: ['amount_mismatch'],
      });
      assert.equal(amountMismatch.ownerCommandCandidate, 'NONE');
      assert.equal(amountMismatch.shouldReject, true);
      assert.equal(amountMismatch.shouldReconcile, true);
      assert.deepEqual(amountMismatch.riskFlags, ['amount_mismatch']);

      const unknownWithoutAttempt = baseCandidate({
        normalizedStatus: 'unknown_result',
        paymentAttemptId: undefined,
      });
      assert.equal(unknownWithoutAttempt.ownerCommandCandidate, 'NONE');
      assert.equal(unknownWithoutAttempt.shouldProcess, false);
      assert.equal(unknownWithoutAttempt.shouldReconcile, true);
      assert.equal(unknownWithoutAttempt.shouldReject, true);
      assert.equal(unknownWithoutAttempt.rejectionReason, 'payment_attempt_missing');

      const signatureNotRequired = baseCandidate({
        verificationStatus: 'not_required',
        signatureVerified: false,
      });
      assert.equal(signatureNotRequired.ownerCommandCandidate, 'MARK_PAYMENT_SUCCEEDED');
      assert.equal(signatureNotRequired.shouldProcess, true);
      assert.equal(signatureNotRequired.shouldReject, false);

      const pureDecision = decidePaymentCallbackCandidate({
        normalizedStatus: 'expired',
        paymentAttemptId: 'payment-attempt-1',
        verificationStatus: 'verified',
        replayStatus: 'first_seen',
        signatureVerified: true,
        replayDetected: false,
      });
      assert.deepEqual(pureDecision, {
        ownerCommandCandidate: 'MARK_PAYMENT_EXPIRED',
        shouldProcess: true,
        shouldReconcile: true,
        shouldReject: false,
      });

      return {
        result: 'PASS',
        message: 'Normalized payment callback candidate helper keeps processing decisions pure and boundary flags false.',
      };
    } catch (error) {
      return { result: 'FAIL', message: (error as Error).message };
    }
  },
};
