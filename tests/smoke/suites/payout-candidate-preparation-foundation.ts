import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import {
  SettlementCreatorEarning,
  SettlementSourceRef,
  SettlementSupplierPayable,
} from '../../../packages/contracts/src';
import {
  listPayoutBatches,
  listPayoutCandidates,
  listPayoutItems,
  preparePayoutCandidates,
  resetPayoutBoundaryGuardForTesting,
} from '@hx/payout';
import { closePool } from '../../../packages/persistence/src';
import {
  getRepository,
  resetRepositoryForTesting as resetSettlementRepository,
} from '../../../services/settlement/src/repository';
import { resetPayoutRepositoryForTesting } from '../../../services/payout/src/repository';
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

function boundaryFlags() {
  return {
    payoutCreated: false as const,
    ledgerEntryCreated: false as const,
    providerPayoutExecuted: false as const,
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
    createdAt: now,
    updatedAt: now,
    boundaryFlags: boundaryFlags(),
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
    amount: 25,
    currency: 'TRY',
    sourceRefs: sourceRefs(seed),
    status,
    createdAt: now,
    updatedAt: now,
    boundaryFlags: boundaryFlags(),
    ...overrides,
  };
}

async function assertStaticGuard(): Promise<void> {
  const files = [
    'services/payout/src/payout.ts',
    'packages/contracts/src/payout.ts',
    'tests/smoke/suites/payout-candidate-preparation-foundation.ts',
  ];
  const forbiddenIncludes = [
    'execute' + 'Payout',
    'create' + 'PaymentInstruction',
    'create' + 'ProviderTransfer',
    'append' + 'LedgerEntry',
    'payoutExecuted: ' + 'true',
    'providerInstructionCreated: ' + 'true',
    'ledgerEntryCreated: ' + 'true',
  ];
  const forbiddenRegex = [
    {
      label: 'provider' + 'Payout',
      regex: new RegExp('\\b' + 'provider' + 'Payout' + '(?!Reference\\b|Executed\\b)'),
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

function assertCandidateBoundary(candidate: {
  boundaryFlags: {
    payoutExecuted: false;
    providerInstructionCreated: false;
    ledgerEntryCreated: false;
  };
}): void {
  assert.equal(candidate.boundaryFlags.payoutExecuted, false);
  assert.equal(candidate.boundaryFlags.providerInstructionCreated, false);
  assert.equal(candidate.boundaryFlags.ledgerEntryCreated, false);
}

export const payoutCandidatePreparationFoundationSmoke: SmokeRunner = {
  name: 'payout-candidate-preparation-foundation',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    const originalPersistenceMode = process.env.PERSISTENCE_MODE;

    try {
      process.env.PERSISTENCE_MODE = 'memory';
      resetSettlementRepository();
      resetPayoutRepositoryForTesting();
      resetPayoutBoundaryGuardForTesting();

      const settlementRepo = getRepository();
      const eligiblePayable = supplierPayable('RELEASE_ELIGIBLE');
      const eligibleEarning = creatorEarning('RELEASE_ELIGIBLE');
      const groupedPayableA = supplierPayable('RELEASE_ELIGIBLE', { partyId: 'supplier-grouped', amount: 40 });
      const groupedPayableB = supplierPayable('RELEASE_ELIGIBLE', { partyId: 'supplier-grouped', amount: 60 });
      const heldPayable = supplierPayable('HELD');
      const reversedEarning = creatorEarning('REVERSED');
      const signalPayable = supplierPayable('RELEASE_ELIGIBLE', { riskHoldActive: true });
      const missingRefsPayable = supplierPayable('RELEASE_ELIGIBLE', { sourceRefs: [] });
      const negativePayable = supplierPayable('RELEASE_ELIGIBLE', { amount: -10 });
      const inconsistentPayable = supplierPayable('RELEASE_ELIGIBLE', {
        sourceRefs: [{ sourceType: 'ORDER', sourceId: 'order-inconsistent' }],
      });
      const duplicateReviewPayable = supplierPayable('RELEASE_ELIGIBLE');

      await settlementRepo.createSupplierPayables([
        eligiblePayable,
        groupedPayableA,
        groupedPayableB,
        heldPayable,
        signalPayable,
        missingRefsPayable,
        negativePayable,
        inconsistentPayable,
        duplicateReviewPayable,
      ]);
      await settlementRepo.createCreatorEarnings([eligibleEarning, reversedEarning]);

      const payableCandidateResult = await preparePayoutCandidates({
        supplierPayableIds: [eligiblePayable.payableId],
      });
      assert.equal(payableCandidateResult.success, true);
      assert.equal(payableCandidateResult.candidates.length, 1);
      assert.deepEqual(payableCandidateResult.candidates[0].sourcePayableIds, [eligiblePayable.payableId]);
      assert.equal(payableCandidateResult.candidates[0].totalAmount, 100);
      assert.equal(payableCandidateResult.candidates[0].status, 'PREPARED');
      assertCandidateBoundary(payableCandidateResult.candidates[0]);

      const earningCandidateResult = await preparePayoutCandidates({
        creatorEarningIds: [eligibleEarning.earningId],
      });
      assert.equal(earningCandidateResult.success, true);
      assert.equal(earningCandidateResult.candidates.length, 1);
      assert.deepEqual(earningCandidateResult.candidates[0].sourceEarningIds, [eligibleEarning.earningId]);
      assert.equal(earningCandidateResult.candidates[0].partyType, 'CREATOR');
      assertCandidateBoundary(earningCandidateResult.candidates[0]);

      const groupedResult = await preparePayoutCandidates({
        supplierPayableIds: [groupedPayableA.payableId, groupedPayableB.payableId],
        groupCandidates: true,
      });
      assert.equal(groupedResult.success, true);
      assert.equal(groupedResult.candidates.length, 1);
      assert.deepEqual(groupedResult.candidates[0].sourcePayableIds.sort(), [groupedPayableA.payableId, groupedPayableB.payableId].sort());
      assert.equal(groupedResult.candidates[0].totalAmount, 100);
      assert.equal(groupedResult.candidates[0].partyId, 'supplier-grouped');
      assertCandidateBoundary(groupedResult.candidates[0]);

      const blockedResult = await preparePayoutCandidates({
        supplierPayableIds: [heldPayable.payableId, signalPayable.payableId, missingRefsPayable.payableId, negativePayable.payableId],
        creatorEarningIds: [reversedEarning.earningId],
      });
      assert.equal(blockedResult.success, false);
      assert.ok(blockedResult.rejectedSourceIds.includes(heldPayable.payableId));
      assert.ok(blockedResult.rejectedSourceIds.includes(reversedEarning.earningId));
      assert.ok(blockedResult.rejectedSourceIds.includes(signalPayable.payableId));
      assert.ok(blockedResult.blockingReasons.includes('RECORD_HELD'));
      assert.ok(blockedResult.blockingReasons.includes('RECORD_REVERSED'));
      assert.ok(blockedResult.blockingReasons.includes('RISK_HOLD_ACTIVE'));
      assert.ok(blockedResult.blockingReasons.includes('SOURCE_REFS_REQUIRED'));
      assert.ok(blockedResult.blockingReasons.includes('AMOUNT_MUST_BE_POSITIVE'));
      assert.ok(blockedResult.warnings.includes('MISSING_REFS_REJECTED'));
      assert.ok(blockedResult.warnings.includes('NEGATIVE_AMOUNT_REJECTED'));

      const duplicateResult = await preparePayoutCandidates({
        supplierPayableIds: [eligiblePayable.payableId],
      });
      assert.equal(duplicateResult.status, 'IDEMPOTENT');
      assert.equal(duplicateResult.candidates[0].payoutCandidateId, payableCandidateResult.candidates[0].payoutCandidateId);

      const inconsistentReview = await preparePayoutCandidates({
        supplierPayableIds: [inconsistentPayable.payableId],
      });
      assert.equal(inconsistentReview.success, true);
      assert.equal(inconsistentReview.candidates[0].reviewRequired, true);
      assert.equal(inconsistentReview.candidates[0].status, 'REVIEW_REQUIRED');
      assert.ok(inconsistentReview.candidates[0].warnings.includes('INCONSISTENT_SOURCE_CHAIN_REVIEW_REQUIRED'));
      assertCandidateBoundary(inconsistentReview.candidates[0]);

      const duplicateReview = await preparePayoutCandidates({
        supplierPayableIds: [duplicateReviewPayable.payableId, duplicateReviewPayable.payableId],
      });
      assert.equal(duplicateReview.success, true);
      assert.equal(duplicateReview.candidates[0].reviewRequired, true);
      assert.ok(duplicateReview.candidates[0].warnings.includes('DUPLICATE_PAYABLE_OR_EARNING_REFS_REVIEW_REQUIRED'));
      assertCandidateBoundary(duplicateReview.candidates[0]);

      const items = await listPayoutItems({});
      const batches = await listPayoutBatches({});
      const candidates = await listPayoutCandidates();
      assert.equal(items.total, 0);
      assert.equal(batches.total, 0);
      assert.equal(candidates.total, 5);

      await assertStaticGuard();

      return {
        result: 'PASS',
        message:
          'release-eligible payable and creator earning records become idempotent grouped payout candidates; held/reversed/signal/incomplete records are rejected; review visibility works; payout/provider-instruction/ledger boundaries remain closed.',
      };
    } catch (error) {
      return { result: 'FAIL', message: (error as Error).message };
    } finally {
      resetSettlementRepository();
      resetPayoutRepositoryForTesting();
      resetPayoutBoundaryGuardForTesting();
      setEnv('PERSISTENCE_MODE', originalPersistenceMode);
      await closePool().catch(() => undefined);
    }
  },
};
