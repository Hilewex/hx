import { strict as assert } from 'node:assert';
import {
  createPaytrCallbackHash,
  mapPaytrIframeCallbackToPaymentCandidate,
  NormalizedPaymentCallbackCandidate,
  PaytrIframeCallbackPayload,
} from '../../../packages/contracts/src/payment';
import { SmokeRunner, SmokeResult } from '../types';

const merchantKey = 'test-merchant-key';
const merchantSalt = 'test-merchant-salt';
const occurredAt = new Date('2026-05-06T00:00:00.000Z');

const assertBoundaryFalse = (candidate: NormalizedPaymentCallbackCandidate) => {
  assert.equal(candidate.boundary.providerTruth, false);
  assert.equal(candidate.boundary.businessTruthMutated, false);
  assert.equal(candidate.boundary.ownerStateMutated, false);
  assert.equal(candidate.boundary.eventTruthMutated, false);
  assert.equal(candidate.boundary.outboxDeliveryGuaranteed, false);
};

const withHash = (
  payload: Omit<PaytrIframeCallbackPayload, 'hash'>,
): PaytrIframeCallbackPayload => ({
  ...payload,
  hash: createPaytrCallbackHash({
    merchantOid: payload.merchant_oid,
    merchantSalt,
    status: payload.status,
    totalAmount: payload.total_amount,
    merchantKey,
  }),
});

const map = (
  payload: PaytrIframeCallbackPayload,
  overrides: Partial<Parameters<typeof mapPaytrIframeCallbackToPaymentCandidate>[0]> = {},
) => mapPaytrIframeCallbackToPaymentCandidate({
  payload,
  callbackRecordId: 'callback-record-1',
  providerMode: 'sandbox',
  merchantKey,
  merchantSalt,
  paymentAttemptId: 'payment-attempt-1',
  paymentId: 'payment-1',
  checkoutId: 'checkout-1',
  expectedAmount: 3456,
  expectedCurrency: 'TRY',
  occurredAt,
  ...overrides,
});

export const paytrCallbackMappingSmoke: SmokeRunner = {
  name: 'paytr-callback-mapping',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    try {
      const validSuccessPayload = withHash({
        merchant_oid: 'HXORDER123',
        status: 'success',
        total_amount: '3456',
        payment_amount: '3456',
        currency: 'TL',
      });
      const success = map(validSuccessPayload);
      assert.equal(success.hashVerified, true);
      assert.equal(success.candidate.normalizedStatus, 'succeeded');
      assert.equal(success.candidate.verificationStatus, 'verified');
      assert.equal(success.candidate.signatureVerified, true);
      assert.equal(success.candidate.providerEventId, 'HXORDER123');
      assert.equal(success.candidate.providerReference, 'HXORDER123');
      assert.equal(success.candidate.ownerCommandCandidate, 'MARK_PAYMENT_SUCCEEDED');
      assert.equal(success.candidate.shouldProcess, true);
      assert.equal(success.candidate.shouldReject, false);
      assert.equal(success.candidate.shouldReconcile, false);
      assertBoundaryFalse(success.candidate);

      const failed = map(withHash({
        merchant_oid: 'HXORDER124',
        status: 'failed',
        total_amount: '3456',
        payment_amount: '3456',
        currency: 'TRY',
        failed_reason_code: '6',
        failed_reason_msg: 'Payment failed in PayTR test fixture.',
      }));
      assert.equal(failed.hashVerified, true);
      assert.equal(failed.candidate.normalizedStatus, 'failed');
      assert.equal(failed.candidate.ownerCommandCandidate, 'MARK_PAYMENT_FAILED');
      assert.equal(failed.candidate.shouldProcess, true);
      assert.equal(failed.candidate.shouldReject, false);
      assert.equal(failed.candidate.riskFlags.includes('PAYTR_FAILED_REASON_6'), true);
      assertBoundaryFalse(failed.candidate);

      const badHash = map({
        ...validSuccessPayload,
        hash: 'bad-hash',
      });
      assert.equal(badHash.hashVerified, false);
      assert.equal(badHash.candidate.normalizedStatus, 'signature_failed');
      assert.equal(badHash.candidate.verificationStatus, 'failed');
      assert.equal(badHash.candidate.signatureVerified, false);
      assert.equal(badHash.candidate.ownerCommandCandidate, 'NONE');
      assert.equal(badHash.candidate.shouldProcess, false);
      assert.equal(badHash.candidate.shouldReject, true);
      assert.equal(badHash.candidate.riskFlags.includes('PAYTR_HASH_FAILED'), true);
      assertBoundaryFalse(badHash.candidate);

      const missingMerchantOid = map(withHash({
        merchant_oid: '',
        status: 'success',
        total_amount: '3456',
        payment_amount: '3456',
        currency: 'TRY',
      }));
      assert.equal(missingMerchantOid.candidate.normalizedStatus, 'rejected_reference_missing');
      assert.equal(missingMerchantOid.candidate.providerReference, undefined);
      assert.equal(missingMerchantOid.candidate.ownerCommandCandidate, 'NONE');
      assert.equal(missingMerchantOid.candidate.shouldProcess, false);
      assert.equal(missingMerchantOid.candidate.shouldReject, true);
      assert.equal(missingMerchantOid.candidate.shouldReconcile, true);
      assert.equal(missingMerchantOid.candidate.riskFlags.includes('PAYTR_MERCHANT_OID_MISSING'), true);
      assertBoundaryFalse(missingMerchantOid.candidate);

      const unsupported = map(withHash({
        merchant_oid: 'HXORDER125',
        status: 'pending',
        total_amount: '3456',
        payment_amount: '3456',
        currency: 'TRY',
      }));
      assert.equal(unsupported.candidate.normalizedStatus, 'unsupported');
      assert.equal(unsupported.candidate.ownerCommandCandidate, 'NONE');
      assert.equal(unsupported.candidate.shouldProcess, false);
      assert.equal(unsupported.candidate.shouldReject, true);
      assert.equal(unsupported.candidate.shouldReconcile, true);
      assert.equal(unsupported.candidate.riskFlags.includes('PAYTR_STATUS_UNSUPPORTED'), true);
      assertBoundaryFalse(unsupported.candidate);

      const amountMismatch = map(withHash({
        merchant_oid: 'HXORDER126',
        status: 'success',
        total_amount: '3456',
        payment_amount: '3400',
        currency: 'TRY',
      }));
      assert.equal(amountMismatch.candidate.normalizedStatus, 'rejected_amount_mismatch');
      assert.equal(amountMismatch.candidate.shouldProcess, false);
      assert.equal(amountMismatch.candidate.shouldReject, true);
      assert.equal(amountMismatch.candidate.shouldReconcile, true);
      assert.equal(amountMismatch.candidate.riskFlags.includes('PAYTR_AMOUNT_MISMATCH'), true);
      assertBoundaryFalse(amountMismatch.candidate);

      const tlToTry = map(validSuccessPayload);
      assert.equal(tlToTry.candidate.currency, 'TRY');
      assert.equal(tlToTry.candidate.riskFlags.includes('PAYTR_CURRENCY_MISMATCH'), false);

      const currencyMismatch = map(withHash({
        merchant_oid: 'HXORDER127',
        status: 'success',
        total_amount: '3456',
        payment_amount: '3456',
        currency: 'USD',
      }));
      assert.equal(currencyMismatch.candidate.normalizedStatus, 'rejected_currency_mismatch');
      assert.equal(currencyMismatch.candidate.shouldReject, true);
      assert.equal(currencyMismatch.candidate.shouldReconcile, true);
      assert.equal(currencyMismatch.candidate.riskFlags.includes('PAYTR_CURRENCY_MISMATCH'), true);
      assertBoundaryFalse(currencyMismatch.candidate);

      const installmentFee = map(withHash({
        merchant_oid: 'HXORDER128',
        status: 'success',
        total_amount: '3600',
        payment_amount: '3456',
        currency: 'TRY',
      }));
      assert.equal(installmentFee.candidate.normalizedStatus, 'succeeded');
      assert.equal(installmentFee.candidate.riskFlags.includes('PAYTR_AMOUNT_MISMATCH'), false);
      assertBoundaryFalse(installmentFee.candidate);

      const successWithoutAttempt = map(validSuccessPayload, {
        paymentAttemptId: undefined,
      });
      assert.equal(successWithoutAttempt.candidate.normalizedStatus, 'succeeded');
      assert.equal(successWithoutAttempt.candidate.ownerCommandCandidate, 'NONE');
      assert.equal(successWithoutAttempt.candidate.shouldProcess, false);
      assert.equal(successWithoutAttempt.candidate.shouldReject, true);
      assert.equal(successWithoutAttempt.candidate.shouldReconcile, true);
      assert.equal(successWithoutAttempt.candidate.rejectionReason, 'PAYMENT_ATTEMPT_REQUIRED');
      assertBoundaryFalse(successWithoutAttempt.candidate);

      return {
        result: 'PASS',
        message: 'PayTR callback mapping foundation verifies hash, status, mismatch decisions, and boundary flags.',
      };
    } catch (error) {
      return { result: 'FAIL', message: (error as Error).message };
    }
  },
};
