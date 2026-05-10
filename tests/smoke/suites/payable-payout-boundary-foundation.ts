import assert from 'assert';
import {
  createPayoutItemFromSource,
  resetPayoutBoundaryGuardForTesting,
} from '@hx/payout';
import { calculateSettlement, resetSettlementCalculationGuardForTesting } from '@hx/settlement';
import { SmokeRunner, SmokeResult } from '../types';

export const payablePayoutBoundaryFoundationSmoke: SmokeRunner = {
  name: 'payable-payout-boundary-foundation',
  run: async (): Promise<{ result: SmokeResult; message?: string }> => {
    try {
      process.env.PERSISTENCE_MODE = 'memory';
      resetPayoutBoundaryGuardForTesting();
      resetSettlementCalculationGuardForTesting();

      const created = await createPayoutItemFromSource({
        sourceType: 'SETTLEMENT_LINE',
        sourceId: 'stl-payout-boundary-1',
        settlementId: 'stc-payout-boundary-1',
        settlementLineId: 'stl-payout-boundary-1',
        counterpartyType: 'SUPPLIER',
        counterpartyId: 'supplier-1',
        amount: 850,
        currency: 'TRY',
        idempotencyKey: 'payout-boundary-idem-1',
      });

      assert.equal(created.success, true);
      assert.equal(created.status, 'CREATED');
      assert.equal(created.payoutItem?.sourceType, 'SETTLEMENT_LINE');
      assert.equal(created.payoutItem?.sourceId, 'stl-payout-boundary-1');
      assert.equal(created.payoutItem?.amount, 850);
      assert.equal(created.payoutItem?.currency, 'TRY');
      assert.equal(created.payoutItem?.payableStatus, 'ELIGIBLE');
      assert.equal(created.payoutItem?.payoutStatus, 'REQUESTED');
      assert.equal(created.payoutItem?.amountSummary.paidAmount, 0);
      assert.equal(created.summary?.payableCreated, true);
      assert.equal(created.summary?.payoutRequested, true);
      assert.equal(created.summary?.actualProviderPayoutPerformed, false);
      assert.equal(created.summary?.settlementTruthMutated, false);
      assert.equal(created.summary?.ledgerTruthMutated, false);
      assert.equal(created.payoutItem?.boundaryFlags.actualProviderPayoutPerformed, false);
      assert.equal(created.payoutItem?.boundaryFlags.settlementTruthMutated, false);
      assert.equal(created.payoutItem?.boundaryFlags.ledgerTruthMutated, false);

      const duplicate = await createPayoutItemFromSource({
        sourceType: 'SETTLEMENT_LINE',
        sourceId: 'stl-payout-boundary-1',
        settlementId: 'stc-payout-boundary-1',
        settlementLineId: 'stl-payout-boundary-1',
        counterpartyType: 'SUPPLIER',
        counterpartyId: 'supplier-1',
        amount: 850,
        currency: 'TRY',
        idempotencyKey: 'payout-boundary-idem-1',
      });

      assert.equal(duplicate.success, true);
      assert.equal(duplicate.status, 'DUPLICATE');
      assert.equal(duplicate.payoutItemId, created.payoutItemId);
      assert.equal(duplicate.summary?.duplicatePayout, true);

      const idempotencyConflict = await createPayoutItemFromSource({
        sourceType: 'SETTLEMENT_LINE',
        sourceId: 'stl-payout-boundary-1',
        settlementId: 'stc-payout-boundary-1',
        settlementLineId: 'stl-payout-boundary-1',
        counterpartyType: 'SUPPLIER',
        counterpartyId: 'supplier-1',
        amount: 900,
        currency: 'TRY',
        idempotencyKey: 'payout-boundary-idem-1',
      });

      assert.equal(idempotencyConflict.success, false);
      assert.equal(idempotencyConflict.status, 'REJECTED');
      assert.ok(idempotencyConflict.errors?.includes('DUPLICATE_IDEMPOTENCY_KEY_CONFLICT'));

      const sourceConflict = await createPayoutItemFromSource({
        sourceType: 'SETTLEMENT_LINE',
        sourceId: 'stl-payout-boundary-1',
        settlementId: 'stc-payout-boundary-1',
        settlementLineId: 'stl-payout-boundary-1',
        counterpartyType: 'SUPPLIER',
        counterpartyId: 'supplier-1',
        amount: 900,
        currency: 'TRY',
        idempotencyKey: 'payout-boundary-idem-2',
      });

      assert.equal(sourceConflict.success, false);
      assert.ok(sourceConflict.errors?.includes('DUPLICATE_PAYOUT_SOURCE_CONFLICT'));

      const missingSource = await createPayoutItemFromSource({
        sourceType: '' as any,
        sourceId: '',
        counterpartyType: 'SUPPLIER',
        counterpartyId: 'supplier-1',
        amount: 100,
        currency: 'TRY',
        idempotencyKey: 'payout-boundary-missing-source',
      });
      assert.equal(missingSource.success, false);
      assert.ok(missingSource.errors?.includes('PAYOUT_SOURCE_TYPE_REQUIRED'));
      assert.ok(missingSource.errors?.includes('PAYOUT_SOURCE_ID_REQUIRED'));

      const missingMoney = await createPayoutItemFromSource({
        sourceType: 'MANUAL_ADJUSTMENT',
        sourceId: 'manual-1',
        counterpartyType: 'SUPPLIER',
        counterpartyId: 'supplier-1',
        amount: 0,
        currency: '',
        idempotencyKey: 'payout-boundary-missing-money',
      });
      assert.equal(missingMoney.success, false);
      assert.ok(missingMoney.errors?.includes('PAYOUT_CURRENCY_REQUIRED'));
      assert.ok(missingMoney.errors?.includes('PAYOUT_AMOUNT_MUST_BE_POSITIVE'));

      const held = await createPayoutItemFromSource({
        sourceType: 'PAYABLE',
        sourceId: 'payable-held-1',
        counterpartyType: 'SUPPLIER',
        counterpartyId: 'supplier-2',
        amount: 120,
        currency: 'TRY',
        riskHold: true,
        holdReason: 'RISK_REVIEW_OPEN',
        idempotencyKey: 'payout-boundary-held-1',
      });
      assert.equal(held.success, true);
      assert.equal(held.payoutItem?.status, 'ON_HOLD');
      assert.equal(held.payoutItem?.payableStatus, 'ON_HOLD');
      assert.equal(held.payoutItem?.amountSummary.paidAmount, 0);

      const settlement = await calculateSettlement({
        idempotencyKey: 'payout-boundary-settlement-calc',
        sourceType: 'ORDER_LINE',
        sourceId: 'order-line-payout-boundary',
        currency: 'TRY',
        grossAmount: 1000,
        platformCommissionRate: 0.15,
        supplierId: 'supplier-1',
      });

      assert.equal(settlement.summary.payableCreated, false);
      assert.equal(settlement.summary.payoutCreated, false);
      assert.equal(settlement.summary.paidOutCreated, false);

      return {
        result: 'PASS',
        message: 'Payable / payout boundary foundation smoke passed.',
      };
    } catch (error: any) {
      return { result: 'FAIL', message: error.message };
    }
  },
};
