import { calculateSettlement, resetSettlementCalculationGuardForTesting } from '@hx/settlement';
import { SmokeRunner, SmokeResult } from '../types';

export const settlementCalculationFoundationSmoke: SmokeRunner = {
  name: 'settlement-calculation-foundation',
  run: async (): Promise<{ result: SmokeResult; message?: string }> => {
    try {
      resetSettlementCalculationGuardForTesting();

      const first = await calculateSettlement({
        idempotencyKey: 'settlement-calc-smoke-1',
        sourceType: 'ORDER_LINE',
        sourceId: 'order-line-1',
        currency: 'TRY',
        grossAmount: 1000,
        platformCommissionRate: 0.15,
        supplierId: 'supplier-1',
      });

      if (first.status !== 'CALCULATED') {
        return { result: 'FAIL', message: `Expected CALCULATED, got ${first.status}` };
      }
      if (first.platformShareAmount !== 150 || first.supplierNetAmount !== 850) {
        return { result: 'FAIL', message: 'Platform and supplier shares were not deterministic' };
      }
      if (first.lines.length !== 3) {
        return { result: 'FAIL', message: 'Expected gross/platform/supplier settlement lines' };
      }
      if (first.summary.ledgerEntryCreated || first.summary.payoutCreated || first.summary.payableCreated || first.summary.paidOutCreated) {
        return { result: 'FAIL', message: 'Settlement calculation created ledger, payout, payable, or paid_out state' };
      }
      if (first.summary.orderStateMutated || first.summary.paymentStateMutated || first.summary.refundStateMutated) {
        return { result: 'FAIL', message: 'Settlement calculation mutated owner state' };
      }

      const duplicate = await calculateSettlement({
        idempotencyKey: 'settlement-calc-smoke-1',
        sourceType: 'ORDER_LINE',
        sourceId: 'order-line-1',
        currency: 'TRY',
        grossAmount: 1000,
        platformCommissionRate: 0.15,
        supplierId: 'supplier-1',
      });

      if (duplicate.settlementId !== first.settlementId || duplicate.summary.duplicateCalculation !== true) {
        return { result: 'FAIL', message: 'Duplicate calculation guard did not return the original calculation' };
      }

      const conflict = await calculateSettlement({
        idempotencyKey: 'settlement-calc-smoke-1',
        sourceType: 'ORDER_LINE',
        sourceId: 'order-line-1',
        currency: 'TRY',
        grossAmount: 1000,
        platformCommissionRate: 0.20,
        supplierId: 'supplier-1',
      });

      if (conflict.status !== 'BLOCKED' || !conflict.errors?.includes('DUPLICATE_IDEMPOTENCY_KEY_CONFLICT')) {
        return { result: 'FAIL', message: 'Conflicting duplicate calculation was not blocked' };
      }

      return { result: 'PASS', message: 'Settlement calculation foundation smoke passed.' };
    } catch (error: any) {
      return { result: 'FAIL', message: error.message };
    }
  },
};
