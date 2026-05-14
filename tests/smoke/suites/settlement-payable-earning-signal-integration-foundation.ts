import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import {
  OrderResponse,
  SettlementCreatorEarning,
  SettlementLine,
  SettlementSourceRef,
  SettlementSupplierPayable,
} from '../../../packages/contracts/src';
import { getOrderRepository, resetOrderRepository } from '../../../services/order/src/repository/index.ts';
import { createRiskCase } from '@hx/risk';
import {
  createSettlementFromOrder,
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

function sourceRefs(seed: string, extra: SettlementSourceRef[] = []): SettlementSourceRef[] {
  return [
    { sourceType: 'ORDER', sourceId: `order-${seed}`, sourceState: 'CREATED' },
    { sourceType: 'ORDER_LINE', sourceId: `order-line-${seed}` },
    { sourceType: 'SUPPLIER', sourceId: `supplier-${seed}` },
    { sourceType: 'CREATOR_STORE', sourceId: `creator-store-${seed}` },
    ...extra,
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
    status: 'PENDING',
    riskHoldActive: false,
    refundImpactPending: false,
    financeCorrectionPending: false,
    externalReviewRequired: false,
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
    status: 'PENDING',
    riskHoldActive: false,
    refundImpactPending: false,
    financeCorrectionPending: false,
    externalReviewRequired: false,
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

function createOrder(): OrderResponse {
  const orderId = `order-${randomUUID()}`;
  const orderLineId = `order-line-${randomUUID()}`;

  return {
    orderId,
    orderNumber: `ORD-${randomUUID()}`,
    customerId: `customer-${randomUUID()}`,
    checkoutId: `checkout-${randomUUID()}`,
    paymentId: `payment-${randomUUID()}`,
    paymentAttemptId: `attempt-${randomUUID()}`,
    state: 'CREATED',
    lines: [{
      orderLineId,
      productId: 'product-signal-integration',
      variantId: 'variant-signal-integration',
      storefrontId: 'storefront-signal-integration',
      quantity: 1,
      productNameSnapshot: 'Signal Integration Product',
      unitPriceSnapshot: 150,
      lineTotalSnapshot: 150,
      economicsSnapshot: {
        commercialPoolProductId: 'commercial-pool-product-signal-1',
        creatorStoreProductId: 'creator-store-product-signal-1',
        creatorStoreId: 'creator-store-signal-1',
        supplierId: 'supplier-signal-1',
        supplierSubmittedProductId: 'supplier-submitted-product-signal-1',
        supplierVariantId: 'supplier-variant-signal-1',
        supplierBaseAmount: 100,
        poolBasePriceAmount: 120,
        creatorSelectedPriceAmount: 150,
        platformMarginAmount: 20,
        creatorMarginAmount: 30,
        unitPriceSnapshot: 150,
        lineTotalSnapshot: 150,
        discountAllocationRefs: [],
        couponSnapshotRefs: [],
        priceSource: 'CHECKOUT_LINE',
        economicsSnapshotCreatedAt: new Date().toISOString(),
        status: 'COMPLETE',
        unknownFields: [],
        warnings: [],
        boundaryFlags: {
          economicsSnapshotOnly: true,
          settlementCreated: false,
          payoutCreated: false,
          ledgerEntryCreated: false,
          payableCreated: false,
        },
      },
    }],
    summary: {
      totalQuantity: 1,
      subTotal: 150,
      discountTotal: 0,
      shippingTotal: 0,
      grandTotal: 150,
      currency: 'TRY',
    },
    errors: [],
    warnings: [],
  };
}

async function seedSourceLines(records: Array<SettlementSupplierPayable | SettlementCreatorEarning>): Promise<void> {
  const repo = getRepository();
  await repo.createMany(records.map((record) => settlementLine(record.settlementLineId.replace('settlement-line-', ''))));
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

async function assertStaticGuard(): Promise<void> {
  const files = [
    'services/settlement/src/settlement.ts',
    'packages/contracts/src/settlement.ts',
    'tests/smoke/suites/settlement-payable-earning-signal-integration-foundation.ts',
  ];
  const forbiddenIncludes = [
    'execute' + 'Payout',
    'create' + 'PayoutBatch',
    'append' + 'LedgerEntry',
    'apply' + 'FinanceCorrection',
    'paymentInstructionCreated: ' + 'true',
    'payoutCreated: ' + 'true',
    'ledgerEntryCreated: ' + 'true',
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

export const settlementPayableEarningSignalIntegrationFoundationSmoke: SmokeRunner = {
  name: 'settlement-payable-earning-signal-integration-foundation',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    const originalPersistenceMode = process.env.PERSISTENCE_MODE;

    try {
      process.env.PERSISTENCE_MODE = 'memory';
      resetOrderRepository();
      resetSettlementRepository();
      resetSettlementCalculationGuardForTesting();

      const repo = getRepository();
      const riskPayable = supplierPayable({ riskHoldActive: true });
      const refundPayable = supplierPayable({ refundImpactPending: true });
      const financeEarning = creatorEarning({ financeCorrectionPending: true });
      const externalReviewEarning = creatorEarning({ externalReviewRequired: true });
      const normalPayable = supplierPayable();

      const records = [
        riskPayable,
        refundPayable,
        financeEarning,
        externalReviewEarning,
        normalPayable,
      ];
      await seedSourceLines(records);
      await repo.createSupplierPayables([riskPayable, refundPayable, normalPayable]);
      await repo.createCreatorEarnings([financeEarning, externalReviewEarning]);

      const riskRejected = await evaluateSupplierPayableReleaseEligibility({
        settlementLineId: riskPayable.settlementLineId,
        payableId: riskPayable.payableId,
      });
      assert.equal(riskRejected.eligible, false);
      assert.ok(riskRejected.blockingReasons.includes('RISK_HOLD_ACTIVE'));
      assert.equal((await repo.getSupplierPayableById(riskPayable.payableId))?.status, 'PENDING');
      assertReleaseBoundary(riskRejected);

      const refundRejected = await evaluateSupplierPayableReleaseEligibility({
        settlementLineId: refundPayable.settlementLineId,
        payableId: refundPayable.payableId,
      });
      assert.equal(refundRejected.eligible, false);
      assert.ok(refundRejected.blockingReasons.includes('REFUND_IMPACT_PENDING'));
      assert.equal((await repo.getSupplierPayableById(refundPayable.payableId))?.status, 'PENDING');
      assertReleaseBoundary(refundRejected);

      const financeRejected = await evaluateCreatorEarningReleaseEligibility({
        settlementLineId: financeEarning.settlementLineId,
        earningId: financeEarning.earningId,
      });
      assert.equal(financeRejected.eligible, false);
      assert.ok(financeRejected.blockingReasons.includes('FINANCE_CORRECTION_PENDING'));
      assert.equal((await repo.getCreatorEarningById(financeEarning.earningId))?.status, 'PENDING');
      assertReleaseBoundary(financeRejected);

      const externalReviewRejected = await evaluateCreatorEarningReleaseEligibility({
        settlementLineId: externalReviewEarning.settlementLineId,
        earningId: externalReviewEarning.earningId,
      });
      assert.equal(externalReviewRejected.eligible, false);
      assert.ok(externalReviewRejected.blockingReasons.includes('EXTERNAL_REVIEW_REQUIRED'));
      assert.equal((await repo.getCreatorEarningById(externalReviewEarning.earningId))?.status, 'PENDING');
      assertReleaseBoundary(externalReviewRejected);

      const normalEligible = await evaluateSupplierPayableReleaseEligibility({
        settlementLineId: normalPayable.settlementLineId,
        payableId: normalPayable.payableId,
      });
      assert.equal(normalEligible.eligible, true);
      assert.equal(normalEligible.statusAfter, 'RELEASE_ELIGIBLE');
      assert.equal((await repo.getSupplierPayableById(normalPayable.payableId))?.status, 'RELEASE_ELIGIBLE');
      assertReleaseBoundary(normalEligible);

      const riskOrder = createOrder();
      await getOrderRepository().save(riskOrder);
      const riskCase = await createRiskCase({
        target: { targetType: 'ORDER', targetId: riskOrder.orderId },
        level: 'HIGH',
        source: 'FOUNDATION_SIMULATION',
        reasonCode: 'UNKNOWN',
        idempotencyKey: `risk-case-${randomUUID()}`,
        correlationId: `corr-${randomUUID()}`,
        actorId: 'smoke',
      });
      assert.equal(riskCase.success, true);

      const propagated = await createSettlementFromOrder({
        orderId: riskOrder.orderId,
        idempotencyKey: `settlement-signal-propagation-${randomUUID()}`,
      });
      assert.equal(propagated.success, true, `signal propagation settlement failed: ${propagated.errors?.join(',')}`);
      assert.equal(propagated.settlementLines![0].status, 'BLOCKED');
      assert.equal(propagated.supplierPayables![0].riskHoldActive, true);
      assert.equal(propagated.creatorEarnings![0].riskHoldActive, true);
      assert.ok(propagated.supplierPayables![0].sourceRefs.some((ref) => ref.sourceType === 'RISK' && ref.sourceId === riskCase.caseId));
      assert.equal(propagated.supplierPayables![0].boundaryFlags.payoutCreated, false);
      assert.equal(propagated.creatorEarnings![0].boundaryFlags.ledgerEntryCreated, false);

      await assertStaticGuard();

      return {
        result: 'PASS',
        message:
          'payable and earning signal fields block release eligibility, normal pending records can become release-eligible, risk evidence propagates from settlement source refs, and payout/ledger/provider boundaries stay closed.',
      };
    } catch (error) {
      return { result: 'FAIL', message: (error as Error).message };
    } finally {
      resetOrderRepository();
      resetSettlementRepository();
      resetSettlementCalculationGuardForTesting();
      setEnv('PERSISTENCE_MODE', originalPersistenceMode);
      await closePool().catch(() => undefined);
    }
  },
};
