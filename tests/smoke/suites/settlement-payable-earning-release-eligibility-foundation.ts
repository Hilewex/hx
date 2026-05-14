import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import {
  SettlementCreatorEarning,
  SettlementLine,
  SettlementSourceRef,
  SettlementSupplierPayable,
} from '../../../packages/contracts/src';
import {
  evaluateCreatorEarningReleaseEligibility,
  evaluateSupplierPayableReleaseEligibility,
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
    { sourceType: 'SUPPLIER', sourceId: `supplier-${seed}` },
    { sourceType: 'CREATOR_STORE', sourceId: `creator-store-${seed}` },
  ];
}

function settlementLine(seed: string): SettlementLine {
  const now = new Date().toISOString();

  return {
    settlementLineId: `settlement-line-${seed}`,
    orderId: `order-${seed}`,
    orderLineId: `order-line-${seed}`,
    storefrontId: `storefront-${seed}`,
    productId: `product-${seed}`,
    partyType: 'SUPPLIER',
    partyId: `supplier-${seed}`,
    status: 'PENDING',
    reasonCode: 'ORDER_CREATED_FOUNDATION',
    amountSummary: {
      currency: 'TRY',
      grossAmount: 120,
      netAmount: 100,
      supplierShareAmount: 100,
      creatorShareAmount: 20,
      ruleSourceAvailable: true,
      calculationFinalized: true,
    },
    impactSummary: {
      payoutEligible: false,
      payoutBlocked: false,
      refundImpactPending: false,
      financeCorrectionPending: false,
      riskHoldActive: false,
      actualPayoutMutationPerformed: false,
      actualPaymentMutationPerformed: false,
      actualRefundMutationPerformed: false,
      actualOrderMutationPerformed: false,
      actualCancelReturnMutationPerformed: false,
      actualFinanceCorrectionMutationPerformed: false,
      actualRiskMutationPerformed: false,
    },
    sourceRefs: sourceRefs(seed),
    createdAt: now,
    updatedAt: now,
    errors: [],
    warnings: [],
  };
}

function supplierPayable(
  status: SettlementSupplierPayable['status'],
  overrides: Partial<SettlementSupplierPayable> = {},
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
    amount: 100,
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
    ...overrides,
  };
}

function creatorEarning(
  status: SettlementCreatorEarning['status'],
  overrides: Partial<SettlementCreatorEarning> = {},
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
    amount: 20,
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
    ...overrides,
  };
}

async function seedSourceLines(records: Array<SettlementSupplierPayable | SettlementCreatorEarning>): Promise<void> {
  const repo = getRepository();
  await repo.createMany(records.map((record) => settlementLine(record.settlementLineId.replace('settlement-line-', ''))));
}

async function assertStaticGuard(): Promise<void> {
  const files = [
    'services/settlement/src/settlement.ts',
    'packages/contracts/src/settlement.ts',
    'tests/smoke/suites/settlement-payable-earning-release-eligibility-foundation.ts',
  ];
  const forbiddenIncludes = [
    'create' + 'PayoutItem',
    'create' + 'PayoutBatch',
    'execute' + 'Payout',
    'create' + 'PaymentInstruction',
    'append' + 'LedgerEntry',
    'payoutCreated: ' + 'true',
    'ledgerEntryCreated: ' + 'true',
    'providerPayoutExecuted: ' + 'true',
    'paymentInstructionCreated: ' + 'true',
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

function assertReleaseBoundary(result: {
  boundaryFlags: {
    payoutCreated: false;
    ledgerEntryCreated: false;
    providerPayoutExecuted: false;
    paymentInstructionCreated: false;
  };
}): void {
  assert.equal(result.boundaryFlags.payoutCreated, false);
  assert.equal(result.boundaryFlags.ledgerEntryCreated, false);
  assert.equal(result.boundaryFlags.providerPayoutExecuted, false);
  assert.equal(result.boundaryFlags.paymentInstructionCreated, false);
}

export const settlementPayableEarningReleaseEligibilityFoundationSmoke: SmokeRunner = {
  name: 'settlement-payable-earning-release-eligibility-foundation',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    const originalPersistenceMode = process.env.PERSISTENCE_MODE;

    try {
      process.env.PERSISTENCE_MODE = 'memory';
      resetSettlementRepository();
      resetSettlementCalculationGuardForTesting();

      const repo = getRepository();
      const pendingPayable = supplierPayable('PENDING');
      const pendingEarning = creatorEarning('PENDING');
      const heldPayable = supplierPayable('HELD');
      const reversedEarning = creatorEarning('REVERSED');
      const missingPartyPayable = supplierPayable('PENDING', { partyId: '' });
      const missingRefsEarning = creatorEarning('PENDING', { sourceRefs: [] });
      const zeroAmountPayable = supplierPayable('PENDING', { amount: 0 });
      const alreadyEligiblePayable = supplierPayable('RELEASE_ELIGIBLE');

      const records = [
        pendingPayable,
        pendingEarning,
        heldPayable,
        reversedEarning,
        missingPartyPayable,
        missingRefsEarning,
        zeroAmountPayable,
        alreadyEligiblePayable,
      ];
      await seedSourceLines(records);
      await repo.createSupplierPayables([pendingPayable, heldPayable, missingPartyPayable, zeroAmountPayable, alreadyEligiblePayable]);
      await repo.createCreatorEarnings([pendingEarning, reversedEarning, missingRefsEarning]);

      const payableEligible = await evaluateSupplierPayableReleaseEligibility({
        settlementLineId: pendingPayable.settlementLineId,
        payableId: pendingPayable.payableId,
        systemActor: 'settlement-release-eligibility-foundation',
      });
      assert.equal(payableEligible.eligible, true);
      assert.equal(payableEligible.statusBefore, 'PENDING');
      assert.equal(payableEligible.statusAfter, 'RELEASE_ELIGIBLE');
      assert.equal((await repo.getSupplierPayableById(pendingPayable.payableId))?.status, 'RELEASE_ELIGIBLE');
      assertReleaseBoundary(payableEligible);

      const earningEligible = await evaluateCreatorEarningReleaseEligibility({
        settlementLineId: pendingEarning.settlementLineId,
        earningId: pendingEarning.earningId,
        systemActor: 'settlement-release-eligibility-foundation',
      });
      assert.equal(earningEligible.eligible, true);
      assert.equal(earningEligible.statusBefore, 'PENDING');
      assert.equal(earningEligible.statusAfter, 'RELEASE_ELIGIBLE');
      assert.equal((await repo.getCreatorEarningById(pendingEarning.earningId))?.status, 'RELEASE_ELIGIBLE');
      assertReleaseBoundary(earningEligible);

      const held = await evaluateSupplierPayableReleaseEligibility({
        settlementLineId: heldPayable.settlementLineId,
        payableId: heldPayable.payableId,
      });
      assert.equal(held.eligible, false);
      assert.ok(held.blockingReasons.includes('RECORD_HELD'));
      assert.equal((await repo.getSupplierPayableById(heldPayable.payableId))?.status, 'HELD');
      assertReleaseBoundary(held);

      const reversed = await evaluateCreatorEarningReleaseEligibility({
        settlementLineId: reversedEarning.settlementLineId,
        earningId: reversedEarning.earningId,
      });
      assert.equal(reversed.eligible, false);
      assert.ok(reversed.blockingReasons.includes('RECORD_REVERSED'));
      assert.equal((await repo.getCreatorEarningById(reversedEarning.earningId))?.status, 'REVERSED');
      assertReleaseBoundary(reversed);

      const missingParty = await evaluateSupplierPayableReleaseEligibility({
        settlementLineId: missingPartyPayable.settlementLineId,
        payableId: missingPartyPayable.payableId,
      });
      assert.equal(missingParty.eligible, false);
      assert.ok(missingParty.blockingReasons.includes('PARTY_ID_REQUIRED'));
      assert.equal((await repo.getSupplierPayableById(missingPartyPayable.payableId))?.status, 'PENDING');
      assertReleaseBoundary(missingParty);

      const missingRefs = await evaluateCreatorEarningReleaseEligibility({
        settlementLineId: missingRefsEarning.settlementLineId,
        earningId: missingRefsEarning.earningId,
      });
      assert.equal(missingRefs.eligible, false);
      assert.ok(missingRefs.blockingReasons.includes('SOURCE_REFS_REQUIRED'));
      assert.equal((await repo.getCreatorEarningById(missingRefsEarning.earningId))?.status, 'PENDING');
      assertReleaseBoundary(missingRefs);

      const zeroAmount = await evaluateSupplierPayableReleaseEligibility({
        settlementLineId: zeroAmountPayable.settlementLineId,
        payableId: zeroAmountPayable.payableId,
      });
      assert.equal(zeroAmount.eligible, false);
      assert.ok(zeroAmount.blockingReasons.includes('AMOUNT_MUST_BE_POSITIVE'));
      assert.equal((await repo.getSupplierPayableById(zeroAmountPayable.payableId))?.status, 'PENDING');
      assertReleaseBoundary(zeroAmount);

      const idempotentEligible = await evaluateSupplierPayableReleaseEligibility({
        settlementLineId: alreadyEligiblePayable.settlementLineId,
        payableId: alreadyEligiblePayable.payableId,
      });
      assert.equal(idempotentEligible.eligible, true);
      assert.equal(idempotentEligible.statusBefore, 'RELEASE_ELIGIBLE');
      assert.equal(idempotentEligible.statusAfter, 'RELEASE_ELIGIBLE');
      assert.equal((await repo.getSupplierPayableById(alreadyEligiblePayable.payableId))?.status, 'RELEASE_ELIGIBLE');
      assertReleaseBoundary(idempotentEligible);

      await assertStaticGuard();

      return {
        result: 'PASS',
        message:
          'payable and earning release eligibility promotes eligible pending records, blocks held/reversed/incomplete/zero-amount records, keeps release-eligible idempotent, and keeps payout/ledger/provider/payment-instruction boundaries closed.',
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
