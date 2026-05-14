import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import {
  SettlementCreatorEarning,
  SettlementSourceRef,
  SettlementSupplierPayable,
} from '../../../packages/contracts/src';
import {
  reverseSettlementCreatorEarning,
  reverseSettlementSupplierPayable,
  resetSettlementCalculationGuardForTesting,
} from '@hx/settlement';
import { getRepository, resetRepositoryForTesting as resetSettlementRepository } from '../../../services/settlement/src/repository';
import { closePool } from '../../../packages/persistence/src';
import { SmokeResult, SmokeRunner } from '../types';

function setEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

function sourceRefs(seed: string): SettlementSourceRef[] {
  return [
    { sourceType: 'ORDER', sourceId: `order-${seed}`, sourceState: 'CREATED' },
    { sourceType: 'ORDER_LINE', sourceId: `order-line-${seed}` },
    { sourceType: 'REFUND', sourceId: `refund-${seed}` },
    { sourceType: 'SUPPLIER', sourceId: `supplier-${seed}` },
    { sourceType: 'CREATOR_STORE', sourceId: `creator-store-${seed}` },
  ];
}

function supplierPayable(
  status: SettlementSupplierPayable['status'],
  amount = 100,
): SettlementSupplierPayable {
  const seed = randomUUID();
  const now = new Date().toISOString();

  return {
    payableId: `payable-${seed}`,
    settlementLineId: `settlement-line-${seed}`,
    orderId: `order-${seed}`,
    orderLineId: `order-line-${seed}`,
    partyType: 'SUPPLIER',
    partyId: `supplier-${seed}`,
    amount,
    currency: 'TRY',
    sourceRefs: sourceRefs(seed),
    status,
    createdAt: now,
    updatedAt: now,
    boundaryFlags: {
      payoutCreated: false,
      ledgerEntryCreated: false,
      providerPayoutExecuted: false,
    },
  };
}

function creatorEarning(
  status: SettlementCreatorEarning['status'],
  amount = 30,
): SettlementCreatorEarning {
  const seed = randomUUID();
  const now = new Date().toISOString();

  return {
    earningId: `earning-${seed}`,
    settlementLineId: `settlement-line-${seed}`,
    orderId: `order-${seed}`,
    orderLineId: `order-line-${seed}`,
    partyType: 'CREATOR',
    partyId: `creator-store-${seed}`,
    amount,
    currency: 'TRY',
    sourceRefs: sourceRefs(seed),
    status,
    holdReasonCode: status === 'HELD' ? 'RISK_HOLD_RECOMMENDED' : undefined,
    createdAt: now,
    updatedAt: now,
    boundaryFlags: {
      payoutCreated: false,
      ledgerEntryCreated: false,
      providerPayoutExecuted: false,
    },
  };
}

async function assertStaticGuard(): Promise<void> {
  const files = [
    'services/settlement/src/settlement.ts',
    'packages/contracts/src/settlement.ts',
    'tests/smoke/suites/settlement-payable-earning-reversal-foundation.ts',
  ];
  const forbiddenIncludes = [
    'append' + 'LedgerEntry',
    'execute' + 'Payout',
    'reverse' + 'ProviderPayout',
    'create' + 'PaymentInstruction',
    'financeCorrectionCreated: ' + 'true',
    'ledgerEntryCreated: ' + 'true',
    'providerPayoutReversed: ' + 'true',
    'payoutMutationPerformed: ' + 'true',
  ];
  const forbiddenRegex = [
    {
      label: 'provider' + 'Payout',
      regex: new RegExp('\\b' + 'provider' + 'Payout' + '(?!Executed\\b|Reversed\\b)'),
    },
  ];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    for (const pattern of forbiddenIncludes) {
      assert.equal(content.includes(pattern), false, `${pattern} found in ${file}`);
    }
    for (const pattern of forbiddenRegex) {
      assert.equal(pattern.regex.test(content), false, `${pattern.label} found in ${file}`);
    }
  }
}

function assertReversalBoundary(result: {
  boundaryFlags: {
    ledgerEntryCreated: false;
    providerPayoutReversed: false;
    payoutMutationPerformed: false;
    financeCorrectionCreated: false;
  };
}): void {
  assert.equal(result.boundaryFlags.ledgerEntryCreated, false);
  assert.equal(result.boundaryFlags.providerPayoutReversed, false);
  assert.equal(result.boundaryFlags.payoutMutationPerformed, false);
  assert.equal(result.boundaryFlags.financeCorrectionCreated, false);
}

export const settlementPayableEarningReversalFoundationSmoke: SmokeRunner = {
  name: 'settlement-payable-earning-reversal-foundation',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    const originalPersistenceMode = process.env.PERSISTENCE_MODE;

    try {
      process.env.PERSISTENCE_MODE = 'memory';
      resetSettlementRepository();
      resetSettlementCalculationGuardForTesting();

      const repo = getRepository();
      const pendingPayable = supplierPayable('PENDING');
      const heldEarning = creatorEarning('HELD');
      const overflowPayable = supplierPayable('PENDING');
      const payoutReadyPayable = supplierPayable('PAYOUT_READY');

      await repo.createSupplierPayables([pendingPayable, overflowPayable, payoutReadyPayable]);
      await repo.createCreatorEarnings([heldEarning]);

      const reversedPayable = await reverseSettlementSupplierPayable({
        refundId: 'refund-pending-payable',
        settlementLineId: pendingPayable.settlementLineId,
        payableId: pendingPayable.payableId,
        reasonCode: 'REFUND_ACTIVE',
        reversalAmount: pendingPayable.amount,
        actorId: 'settlement-reversal-smoke',
        idempotencyKey: 'reverse-pending-payable',
        sourceRefs: pendingPayable.sourceRefs,
      });
      assert.equal(reversedPayable.success, true);
      assert.equal(reversedPayable.status, 'REVERSED');
      assert.equal(reversedPayable.payable?.status, 'REVERSED');
      assert.equal(reversedPayable.reversal?.reversalAmount, pendingPayable.amount);
      assert.ok(reversedPayable.reversal?.sourceRefs.some((ref) => ref.sourceType === 'REFUND' && ref.sourceId.startsWith('refund-')));
      assertReversalBoundary(reversedPayable);

      const duplicatePayable = await reverseSettlementSupplierPayable({
        refundId: 'refund-pending-payable',
        settlementLineId: pendingPayable.settlementLineId,
        payableId: pendingPayable.payableId,
        reasonCode: 'REFUND_ACTIVE',
        reversalAmount: pendingPayable.amount,
        actorId: 'settlement-reversal-smoke',
        idempotencyKey: 'reverse-pending-payable',
        sourceRefs: pendingPayable.sourceRefs,
      });
      assert.equal(duplicatePayable.success, true);
      assert.equal(duplicatePayable.status, 'IDEMPOTENT');
      assert.equal(duplicatePayable.payable?.status, 'REVERSED');
      assertReversalBoundary(duplicatePayable);

      const reversedHeldEarning = await reverseSettlementCreatorEarning({
        sourceRefundId: 'source-refund-held-earning',
        settlementLineId: heldEarning.settlementLineId,
        earningId: heldEarning.earningId,
        reasonCode: 'REFUND_ACTIVE',
        reversalAmount: heldEarning.amount,
        systemActor: 'settlement-reversal-foundation',
        idempotencyKey: 'reverse-held-earning',
        sourceRefs: heldEarning.sourceRefs,
      });
      assert.equal(reversedHeldEarning.success, true);
      assert.equal(reversedHeldEarning.status, 'REVERSED');
      assert.equal(reversedHeldEarning.earning?.status, 'REVERSED');
      assert.equal(reversedHeldEarning.reversal?.sourceRefs.length, heldEarning.sourceRefs.length);
      assertReversalBoundary(reversedHeldEarning);

      const overAmount = await reverseSettlementSupplierPayable({
        refundId: 'refund-over-amount',
        settlementLineId: overflowPayable.settlementLineId,
        payableId: overflowPayable.payableId,
        reasonCode: 'REFUND_ACTIVE',
        reversalAmount: overflowPayable.amount + 1,
        actorId: 'settlement-reversal-smoke',
        idempotencyKey: 'reverse-over-amount',
      });
      assert.equal(overAmount.success, false);
      assert.equal(overAmount.status, 'REJECTED');
      assert.ok(overAmount.errors?.includes('REVERSAL_AMOUNT_EXCEEDS_CURRENT_AMOUNT'));
      assert.equal((await repo.getSupplierPayableById(overflowPayable.payableId))?.status, 'PENDING');
      assertReversalBoundary(overAmount);

      const partialAmount = await reverseSettlementSupplierPayable({
        refundId: 'refund-partial',
        settlementLineId: overflowPayable.settlementLineId,
        payableId: overflowPayable.payableId,
        reasonCode: 'REFUND_ACTIVE',
        reversalAmount: overflowPayable.amount / 2,
        actorId: 'settlement-reversal-smoke',
        idempotencyKey: 'reverse-partial',
      });
      assert.equal(partialAmount.success, false);
      assert.equal(partialAmount.status, 'REJECTED');
      assert.ok(partialAmount.errors?.includes('PARTIAL_REVERSAL_NOT_SUPPORTED'));
      assertReversalBoundary(partialAmount);

      const payoutReady = await reverseSettlementSupplierPayable({
        refundId: 'refund-payout-ready',
        settlementLineId: payoutReadyPayable.settlementLineId,
        payableId: payoutReadyPayable.payableId,
        reasonCode: 'REFUND_ACTIVE',
        reversalAmount: payoutReadyPayable.amount,
        actorId: 'settlement-reversal-smoke',
        idempotencyKey: 'reverse-payout-ready',
      });
      assert.equal(payoutReady.success, false);
      assert.equal(payoutReady.status, 'REVIEW_REQUIRED');
      assert.ok(payoutReady.warnings?.includes('PAYOUT_READY_REVERSAL_REQUIRES_MANUAL_REVIEW'));
      assert.equal((await repo.getSupplierPayableById(payoutReadyPayable.payableId))?.status, 'PAYOUT_READY');
      assertReversalBoundary(payoutReady);

      await assertStaticGuard();

      return {
        result: 'PASS',
        message:
          'payable and earning reversal foundation reverses pending/held records, keeps reversed calls idempotent, rejects invalid amounts, routes payout-ready to review, and keeps ledger/payout/provider/finance correction boundaries closed.',
      };
    } catch (error) {
      return { result: 'FAIL', message: (error as Error).message };
    } finally {
      resetSettlementRepository();
      resetSettlementCalculationGuardForTesting();
      setEnv('PERSISTENCE_MODE', originalPersistenceMode);
      await closePool().catch(() => undefined);
    }
  },
};
