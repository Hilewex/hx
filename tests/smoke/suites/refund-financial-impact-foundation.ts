import { recordRefundFinancialImpact } from '@hx/finance';
import { _clearLedger, getLedgerEntries } from '@hx/persistence';
import { financeLedgerSmoke } from './finance-ledger';

export interface SmokeSuiteResult {
  result: 'PASS' | 'FAIL';
  message?: string;
}

export interface SmokeSuite {
  name: string;
  run: (baseUrl: string) => Promise<SmokeSuiteResult>;
}

function fail(message: string): SmokeSuiteResult {
  return { result: 'FAIL', message };
}

export const refundFinancialImpactFoundationSmoke: SmokeSuite = {
  name: 'refund-financial-impact-foundation',
  run: async (baseUrl: string): Promise<SmokeSuiteResult> => {
    try {
      _clearLedger();

      const valid = await recordRefundFinancialImpact({
        refundId: 'refund-1',
        orderId: 'order-1',
        orderLineId: 'line-1',
        paymentId: 'payment-1',
        amount: 25.5,
        currency: 'TRY',
        idempotencyKey: 'refund-impact-1',
      });

      if (!valid.success || valid.status !== 'RECORDED' || !valid.ledgerEntryId || !valid.entry) {
        return fail('Valid refund financial impact was not recorded');
      }
      if (
        valid.entry.sourceType !== 'REFUND' ||
        valid.entry.sourceId !== 'refund-1' ||
        valid.entry.entryType !== 'REFUND' ||
        valid.entry.direction !== 'DEBIT' ||
        valid.entry.amount !== 25.5 ||
        valid.entry.currency !== 'TRY'
      ) {
        return fail('Refund financial impact ledger entry shape is incorrect');
      }
      if (!valid.summary.ledgerEntryCreated || valid.summary.settlementAdjustedCreated || valid.summary.payoutReversalCreated) {
        return fail('Refund impact summary crossed settlement/payout boundary');
      }
      if (valid.summary.orderStateMutated || valid.summary.paymentStateMutated || valid.summary.refundStateMutated) {
        return fail('Refund impact summary indicates owner state mutation');
      }

      const missingRefundId = await recordRefundFinancialImpact({
        refundId: '',
        amount: 10,
        currency: 'TRY',
        idempotencyKey: 'missing-refund-id',
      });
      if (missingRefundId.success || !missingRefundId.errors?.includes('REFUND_ID_REQUIRED')) {
        return fail('Missing refundId/sourceId was not rejected deterministically');
      }

      const missingIdempotencyKey = await recordRefundFinancialImpact({
        refundId: 'refund-missing-idem',
        amount: 10,
        currency: 'TRY',
        idempotencyKey: '',
      });
      if (missingIdempotencyKey.success || !missingIdempotencyKey.errors?.includes('IDEMPOTENCY_KEY_REQUIRED')) {
        return fail('Missing idempotencyKey was not rejected deterministically');
      }

      const missingAmount = await recordRefundFinancialImpact({
        refundId: 'refund-missing-amount',
        currency: 'TRY',
        idempotencyKey: 'missing-amount',
      } as any);
      if (missingAmount.success || !missingAmount.errors?.includes('AMOUNT_REQUIRED')) {
        return fail('Missing amount was not rejected deterministically');
      }

      const missingCurrency = await recordRefundFinancialImpact({
        refundId: 'refund-missing-currency',
        amount: 10,
        currency: '',
        idempotencyKey: 'missing-currency',
      });
      if (missingCurrency.success || !missingCurrency.errors?.includes('CURRENCY_REQUIRED')) {
        return fail('Missing currency was not rejected deterministically');
      }

      const zeroAmount = await recordRefundFinancialImpact({
        refundId: 'refund-zero',
        amount: 0,
        currency: 'TRY',
        idempotencyKey: 'zero-amount',
      });
      if (zeroAmount.success || !zeroAmount.errors?.includes('AMOUNT_MUST_BE_POSITIVE')) {
        return fail('Zero amount was not rejected deterministically');
      }

      const negativeAmount = await recordRefundFinancialImpact({
        refundId: 'refund-negative',
        amount: -1,
        currency: 'TRY',
        idempotencyKey: 'negative-amount',
      });
      if (negativeAmount.success || !negativeAmount.errors?.includes('AMOUNT_MUST_BE_POSITIVE')) {
        return fail('Negative amount was not rejected deterministically');
      }

      const beforeDuplicateCount = getLedgerEntries({ sourceType: 'REFUND' }).length;
      const duplicate = await recordRefundFinancialImpact({
        refundId: 'refund-1',
        orderId: 'order-1',
        orderLineId: 'line-1',
        paymentId: 'payment-1',
        amount: 25.5,
        currency: 'TRY',
        idempotencyKey: 'refund-impact-1',
      });
      const afterDuplicateCount = getLedgerEntries({ sourceType: 'REFUND' }).length;

      if (!duplicate.success || duplicate.status !== 'DUPLICATE' || duplicate.ledgerEntryId !== valid.ledgerEntryId) {
        return fail('Duplicate same idempotency key and payload did not return existing ledger entry');
      }
      if (beforeDuplicateCount !== afterDuplicateCount) {
        return fail('Duplicate same idempotency key created a new ledger entry');
      }

      const conflict = await recordRefundFinancialImpact({
        refundId: 'refund-1',
        orderId: 'order-1',
        paymentId: 'payment-1',
        amount: 30,
        currency: 'TRY',
        idempotencyKey: 'refund-impact-1',
      });
      if (conflict.success || conflict.status !== 'REJECTED' || !conflict.errors?.includes('DUPLICATE_IDEMPOTENCY_KEY_CONFLICT')) {
        return fail('Duplicate same idempotency key with different payload was not rejected');
      }

      const reversal = await recordRefundFinancialImpact({
        refundId: 'refund-1',
        paymentId: 'payment-1',
        amount: 25.5,
        currency: 'TRY',
        idempotencyKey: 'refund-impact-reversal-1',
        impactType: 'REFUND_REVERSAL',
        originalRefundLedgerEntryId: valid.ledgerEntryId,
      });
      if (
        !reversal.success ||
        reversal.status !== 'RECORDED' ||
        reversal.ledgerEntryId === valid.ledgerEntryId ||
        reversal.entry?.entryType !== 'REFUND_REVERSAL' ||
        reversal.entry.direction !== 'CREDIT'
      ) {
        return fail('Refund reversal was not recorded as an append-only new ledger entry');
      }

      const allRefundEntries = getLedgerEntries({ sourceType: 'REFUND' });
      if (allRefundEntries.length !== 2) {
        return fail('Unexpected refund ledger entry count after duplicate and reversal checks');
      }

      const financeLedgerRegression = await financeLedgerSmoke.run(baseUrl);
      if (financeLedgerRegression.result !== 'PASS') {
        return fail(`finance-ledger-foundation regression failed: ${financeLedgerRegression.message || ''}`);
      }

      return { result: 'PASS', message: 'Refund financial impact foundation smoke passed.' };
    } catch (e: any) {
      return { result: 'FAIL', message: e.message };
    }
  },
};
