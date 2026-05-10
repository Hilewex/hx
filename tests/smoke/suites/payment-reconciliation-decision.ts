import { deepStrictEqual, strictEqual } from 'node:assert';
import {
  decidePaymentReconciliationAction,
  mapPaytrStatusInquiryToReconciliationCandidate,
  NormalizedPaytrStatusInquiryCandidate,
  PaytrStatusInquiryErrorResponse,
  PaytrStatusInquirySuccessResponse,
  PaymentReconciliationDecision,
  PaymentReconciliationTriggerReason,
} from '../../../packages/contracts/src/payment';
import { createProviderBoundaryFlags } from '../../../packages/contracts/src/provider';
import { SmokeRunner, SmokeResult } from '../types';

function createCandidate(
  response: PaytrStatusInquirySuccessResponse | PaytrStatusInquiryErrorResponse,
  expectedAmountMinor = 10000,
  expectedCurrency = 'TRY',
): NormalizedPaytrStatusInquiryCandidate {
  return mapPaytrStatusInquiryToReconciliationCandidate({
    merchantOid: 'reconciliation-oid',
    expectedAmountMinor,
    expectedCurrency,
    response,
    occurredAt: new Date('2026-05-07T00:00:00.000Z'),
    inquiryRef: `inquiry-${response.status}`,
  });
}

function decide(input: {
  readonly currentStatus?: 'PENDING' | 'UNKNOWN_RESULT';
  readonly triggerReason: PaymentReconciliationTriggerReason;
  readonly statusInquiryCandidate?: NormalizedPaytrStatusInquiryCandidate;
  readonly attemptCount?: number;
  readonly maxAttempts?: number;
}): PaymentReconciliationDecision {
  return decidePaymentReconciliationAction({
    currentStatus: input.currentStatus ?? 'reconciliation_required',
    triggerReason: input.triggerReason,
    statusInquiryCandidate: input.statusInquiryCandidate,
    attemptCount: input.attemptCount ?? 0,
    maxAttempts: input.maxAttempts ?? 3,
    now: new Date('2026-05-07T00:00:00.000Z'),
  });
}

function assertSafeDecision(decision: PaymentReconciliationDecision): void {
  strictEqual(decision.shouldProcessPaymentMutation, false);
  deepStrictEqual(decision.boundary, createProviderBoundaryFlags());
}

const runTest = (): { result: SmokeResult; message: string } => {
  try {
    const unknownResult = decide({
      currentStatus: 'UNKNOWN_RESULT',
      triggerReason: 'payment_unknown_result',
    });
    strictEqual(unknownResult.decisionType, 'schedule_status_query');
    strictEqual(unknownResult.status, 'status_query_pending');
    strictEqual(unknownResult.shouldScheduleStatusQuery, true);
    assertSafeDecision(unknownResult);

    const pending = decide({
      currentStatus: 'PENDING',
      triggerReason: 'payment_pending',
    });
    strictEqual(pending.decisionType, 'schedule_status_query');
    strictEqual(pending.status, 'status_query_pending');
    strictEqual(pending.shouldScheduleStatusQuery, true);
    assertSafeDecision(pending);

    const inconclusiveCandidate = createCandidate({
      status: 'error',
      err_no: '003',
      err_msg: 'merchant_oid ile basarili odeme bulunamadi',
    });
    const inconclusiveRetry = decide({
      triggerReason: 'status_query_inconclusive',
      statusInquiryCandidate: inconclusiveCandidate,
      attemptCount: 1,
      maxAttempts: 3,
    });
    strictEqual(inconclusiveRetry.decisionType, 'retry_status_query');
    strictEqual(inconclusiveRetry.status, 'status_query_inconclusive');
    strictEqual(inconclusiveRetry.shouldRetry, true);
    assertSafeDecision(inconclusiveRetry);

    const inconclusiveExhausted = decide({
      triggerReason: 'status_query_inconclusive',
      statusInquiryCandidate: inconclusiveCandidate,
      attemptCount: 3,
      maxAttempts: 3,
    });
    strictEqual(inconclusiveExhausted.decisionType, 'require_manual_review');
    strictEqual(inconclusiveExhausted.status, 'manual_review_required');
    strictEqual(inconclusiveExhausted.shouldRequireManualReview, true);
    assertSafeDecision(inconclusiveExhausted);

    const succeededCandidate = createCandidate({
      status: 'success',
      payment_amount: '100.00',
      payment_total: '100.00',
      currency: 'TRY',
      returns: {},
    });
    const succeeded = decide({
      triggerReason: 'callback_requires_reconciliation',
      statusInquiryCandidate: succeededCandidate,
    });
    strictEqual(succeeded.decisionType, 'mark_reconciled_candidate');
    strictEqual(succeeded.status, 'status_query_succeeded');
    strictEqual(succeeded.normalizedStatus, 'succeeded_candidate');
    assertSafeDecision(succeeded);

    const amountMismatchCandidate = createCandidate(
      {
        status: 'success',
        payment_amount: '99.00',
        payment_total: '99.00',
        currency: 'TRY',
        returns: {},
      },
      10000,
      'TRY',
    );
    const amountMismatch = decide({
      triggerReason: 'amount_mismatch',
      statusInquiryCandidate: amountMismatchCandidate,
    });
    strictEqual(amountMismatch.decisionType, 'require_manual_review');
    strictEqual(amountMismatch.status, 'manual_review_required');
    strictEqual(amountMismatch.shouldRequireManualReview, true);
    assertSafeDecision(amountMismatch);

    const currencyMismatchCandidate = createCandidate(
      {
        status: 'success',
        payment_amount: '100.00',
        payment_total: '100.00',
        currency: 'USD',
        returns: {},
      },
      10000,
      'TRY',
    );
    const currencyMismatch = decide({
      triggerReason: 'currency_mismatch',
      statusInquiryCandidate: currencyMismatchCandidate,
    });
    strictEqual(currencyMismatch.decisionType, 'require_manual_review');
    strictEqual(currencyMismatch.status, 'manual_review_required');
    strictEqual(currencyMismatch.shouldRequireManualReview, true);
    assertSafeDecision(currencyMismatch);

    const failedCandidate = createCandidate({
      status: 'error',
      err_no: '999',
      err_msg: 'temporary provider status query failure',
    });
    const failedRetry = decide({
      triggerReason: 'status_query_failed',
      statusInquiryCandidate: failedCandidate,
      attemptCount: 0,
      maxAttempts: 2,
    });
    strictEqual(failedRetry.decisionType, 'retry_status_query');
    strictEqual(failedRetry.status, 'status_query_failed');
    strictEqual(failedRetry.shouldRetry, true);
    assertSafeDecision(failedRetry);

    const terminalConflict = decide({
      triggerReason: 'terminal_conflict',
    });
    strictEqual(terminalConflict.decisionType, 'require_manual_review');
    strictEqual(terminalConflict.status, 'manual_review_required');
    strictEqual(terminalConflict.shouldRequireManualReview, true);
    assertSafeDecision(terminalConflict);

    return {
      result: 'PASS',
      message: 'Payment reconciliation decision contract assertions passed without mutation decisions.',
    };
  } catch (error) {
    return { result: 'FAIL', message: (error as Error).stack || (error as Error).message };
  }
};

export const paymentReconciliationDecisionSmoke: SmokeRunner = {
  name: 'payment-reconciliation-decision',
  run: async () => runTest(),
};
