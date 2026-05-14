import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import {
  SettlementCreatorEarning,
  SettlementSourceRef,
  SettlementSupplierPayable,
} from '../../../packages/contracts/src';
import {
  blockPayoutCandidateForReview,
  listPayoutBatches,
  listPayoutCandidates,
  listPayoutItems,
  preparePayoutCandidates,
  resetPayoutBoundaryGuardForTesting,
} from '@hx/payout';
import {
  listPayoutCandidateReviewQueue,
  readPayoutCandidateReviewProjection,
} from '@hx/admin';
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
  overrides: Partial<SettlementSupplierPayable> = {},
): SettlementSupplierPayable {
  const seed = randomUUID();
  const now = new Date().toISOString();

  return {
    payableId: `review-payable-${seed}`,
    settlementLineId: `settlement-line-${seed}`,
    orderId: `order-${seed}`,
    orderLineId: `order-line-${seed}`,
    partyType: 'SUPPLIER',
    partyId: `supplier-${seed}`,
    amount: 100,
    currency: 'TRY',
    sourceRefs: sourceRefs(seed),
    status: 'RELEASE_ELIGIBLE',
    createdAt: now,
    updatedAt: now,
    boundaryFlags: boundaryFlags(),
    ...overrides,
  };
}

function creatorEarning(overrides: Partial<SettlementCreatorEarning> = {}): SettlementCreatorEarning {
  const seed = randomUUID();
  const now = new Date().toISOString();

  return {
    earningId: `review-earning-${seed}`,
    settlementLineId: `settlement-line-${seed}`,
    orderId: `order-${seed}`,
    orderLineId: `order-line-${seed}`,
    partyType: 'CREATOR',
    partyId: `creator-${seed}`,
    amount: 30,
    currency: 'TRY',
    sourceRefs: sourceRefs(seed),
    status: 'RELEASE_ELIGIBLE',
    createdAt: now,
    updatedAt: now,
    boundaryFlags: boundaryFlags(),
    ...overrides,
  };
}

async function assertStaticGuard(): Promise<void> {
  const files = [
    'packages/contracts/src/payout.ts',
    'services/payout/src/payout.ts',
    'services/admin/src/ops-projections.ts',
    'apps/web/src/components/admin-ops-surface.tsx',
    'tests/smoke/suites/payout-candidate-review-ops-foundation.ts',
  ];
  const forbiddenIncludes = [
    'execute' + 'Payout',
    'create' + 'PaymentInstruction',
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

export const payoutCandidateReviewOpsFoundationSmoke: SmokeRunner = {
  name: 'payout-candidate-review-ops-foundation',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    const originalPersistenceMode = process.env.PERSISTENCE_MODE;

    try {
      process.env.PERSISTENCE_MODE = 'memory';
      resetSettlementRepository();
      resetPayoutRepositoryForTesting();
      resetPayoutBoundaryGuardForTesting();

      const settlementRepo = getRepository();
      const reviewPayable = supplierPayable({
        sourceRefs: [{ sourceType: 'ORDER', sourceId: 'order-review-inconsistent' }],
      });
      const blockPayable = supplierPayable({ partyId: 'supplier-block-target' });
      const externalReviewEarning = creatorEarning({ externalReviewRequired: true });
      const highAmountPayable = supplierPayable({ amount: 12_000, currency: 'TRY' });

      await settlementRepo.createSupplierPayables([reviewPayable, blockPayable, highAmountPayable]);
      await settlementRepo.createCreatorEarnings([externalReviewEarning]);

      const reviewResult = await preparePayoutCandidates({
        supplierPayableIds: [reviewPayable.payableId],
      });
      assert.equal(reviewResult.success, true);
      assert.equal(reviewResult.candidates[0].reviewStatus, 'REVIEW_REQUIRED');
      assert.ok(reviewResult.candidates[0].reviewReasonCodes.includes('INCONSISTENT_SOURCE_CHAIN_REVIEW_REQUIRED'));

      const blockTargetResult = await preparePayoutCandidates({
        supplierPayableIds: [blockPayable.payableId],
      });
      assert.equal(blockTargetResult.candidates[0].reviewStatus, 'PENDING_REVIEW');

      const externalResult = await preparePayoutCandidates({
        creatorEarningIds: [externalReviewEarning.earningId],
      });
      assert.equal(externalResult.success, true);
      assert.equal(externalResult.candidates[0].reviewStatus, 'REVIEW_BLOCKED');
      assert.ok(externalResult.candidates[0].reviewReasonCodes.includes('EXTERNAL_REVIEW_REQUIRED'));

      const highAmountResult = await preparePayoutCandidates({
        supplierPayableIds: [highAmountPayable.payableId],
        reviewConfig: {
          highAmountReviewThresholds: { TRY: 10_000 },
        },
      });
      assert.equal(highAmountResult.candidates[0].reviewStatus, 'REVIEW_REQUIRED');
      assert.ok(highAmountResult.candidates[0].reviewReasonCodes.includes('HIGH_AMOUNT_THRESHOLD_REVIEW_REQUIRED'));

      const blockResult = await blockPayoutCandidateForReview({
        payoutCandidateId: blockTargetResult.candidates[0].payoutCandidateId,
        actorId: 'ops-reviewer-smoke',
        note: 'Manual ops review block foundation smoke.',
      });
      assert.equal(blockResult.success, true);
      assert.equal(blockResult.candidate?.reviewStatus, 'REVIEW_BLOCKED');
      assert.equal(blockResult.candidate?.blockedByOps, true);
      assert.equal(blockResult.candidate?.blockedBy, 'ops-reviewer-smoke');
      assert.equal(blockResult.candidate?.reviewNotes.length, 1);

      const queue = await listPayoutCandidateReviewQueue();
      assert.equal(queue.boundaryFlags.projectionOnly, true);
      assert.equal(queue.boundaryFlags.payoutTruthMutated, false);
      assert.equal(queue.boundaryFlags.providerPayoutExecuted, false);
      assert.equal(queue.boundaryFlags.ledgerTruthMutated, false);
      assert.ok(queue.items.some(item => item.payoutCandidateId === reviewResult.candidates[0].payoutCandidateId && item.reviewStatus === 'REVIEW_REQUIRED'));
      assert.ok(queue.items.some(item => item.payoutCandidateId === blockTargetResult.candidates[0].payoutCandidateId && item.reviewStatus === 'REVIEW_BLOCKED' && item.blockedByOps));
      assert.ok(queue.items.some(item => item.reviewRequiredReason.includes('HIGH_AMOUNT_THRESHOLD_REVIEW_REQUIRED')));

      const projection = await readPayoutCandidateReviewProjection(blockTargetResult.candidates[0].payoutCandidateId);
      assert.equal(projection?.projectionOnly, true);
      assert.equal(projection?.groupedSourceCount, 1);
      assert.equal(projection?.boundaryFlags.payoutExecuted, false);
      assert.equal(projection?.boundaryFlags.providerInstructionCreated, false);
      assert.equal(projection?.boundaryFlags.ledgerEntryCreated, false);

      for (const candidate of (await listPayoutCandidates()).candidates) {
        assertCandidateBoundary(candidate);
      }

      const items = await listPayoutItems({});
      const batches = await listPayoutBatches({});
      assert.equal(items.total, 0);
      assert.equal(batches.total, 0);

      const adminUi = await fs.readFile('apps/web/src/components/admin-ops-surface.tsx', 'utf8');
      const cockpitStart = adminUi.indexOf('function AdminFinanceOpsCockpit');
      const cockpitEnd = adminUi.indexOf('function FinanceOpsGroupList', cockpitStart);
      assert.ok(cockpitStart >= 0 && cockpitEnd > cockpitStart, 'Admin finance cockpit block must be discoverable');
      const cockpit = adminUi.slice(cockpitStart, cockpitEnd);
      assert.equal(cockpit.includes('execute' + 'Payout'), false);
      assert.equal(cockpit.includes('create' + 'PaymentInstruction'), false);

      await assertStaticGuard();

      return {
        result: 'PASS',
        message:
          'payout candidate review queue, manual ops block, read-only projection, maker/checker preparation fields, and closed payout/provider/ledger boundaries verified.',
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
