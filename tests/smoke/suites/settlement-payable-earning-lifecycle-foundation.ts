import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import { OrderResponse } from '../../../packages/contracts/src';
import { getOrderRepository, resetOrderRepository } from '../../../services/order/src/repository/index.ts';
import { createRiskCase } from '@hx/risk';
import {
  createSettlementFromOrder,
  listSettlementCreatorEarnings,
  listSettlementSupplierPayables,
} from '@hx/settlement';
import { resetRepositoryForTesting as resetSettlementRepository } from '../../../services/settlement/src/repository';
import { closePool } from '../../../packages/persistence/src';
import { SmokeResult, SmokeRunner } from '../types';

function setEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
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
      productId: 'product-payable-earning',
      variantId: 'variant-payable-earning',
      storefrontId: 'storefront-payable-earning',
      quantity: 1,
      productNameSnapshot: 'Payable Earning Product',
      unitPriceSnapshot: 150,
      lineTotalSnapshot: 150,
      economicsSnapshot: {
        commercialPoolProductId: 'commercial-pool-product-payable-1',
        creatorStoreProductId: 'creator-store-product-payable-1',
        creatorStoreId: 'creator-store-payable-1',
        supplierId: 'supplier-payable-1',
        supplierSubmittedProductId: 'supplier-submitted-product-payable-1',
        supplierVariantId: 'supplier-variant-payable-1',
        supplierBaseAmount: 100,
        poolBasePriceAmount: 120,
        creatorSelectedPriceAmount: 150,
        platformMarginAmount: 20,
        creatorMarginAmount: 30,
        unitPriceSnapshot: 150,
        lineTotalSnapshot: 150,
        discountAllocationRefs: [{
          allocationId: 'allocation-payable-1',
          discountSnapshotId: 'discount-snapshot-payable-1',
          discountCode: 'HX10',
          discountKind: 'COUPON',
          sponsorType: 'PLATFORM',
          sponsorId: 'platform:hx',
          allocatedAmount: 10,
          currency: 'TRY',
        }],
        couponSnapshotRefs: [{
          discountSnapshotId: 'discount-snapshot-payable-1',
          sourceType: 'COUPON',
          code: 'HX10',
          discountAmount: 10,
          sponsorType: 'PLATFORM',
          sponsorId: 'platform:hx',
        }],
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
      discountTotal: 10,
      shippingTotal: 0,
      grandTotal: 140,
      currency: 'TRY',
    },
    errors: [],
    warnings: [],
  };
}

async function assertStaticGuard(): Promise<void> {
  const files = [
    'services/settlement/src/settlement.ts',
    'packages/contracts/src/settlement.ts',
    'tests/smoke/suites/settlement-payable-earning-lifecycle-foundation.ts',
  ];
  const forbidden = [
    'execute' + 'Payout',
    'provider' + 'Payout(',
    'create' + 'PaymentInstruction',
    'append' + 'LedgerEntry',
    'mark' + 'Paid',
    'payoutCreated: ' + 'true',
    'ledgerEntryCreated: ' + 'true',
    'providerPayoutExecuted: ' + 'true',
  ];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    for (const pattern of forbidden) {
      assert.equal(content.includes(pattern), false, `${pattern} found in ${file}`);
    }
  }
}

export const settlementPayableEarningLifecycleFoundationSmoke: SmokeRunner = {
  name: 'settlement-payable-earning-lifecycle-foundation',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    const originalPersistenceMode = process.env.PERSISTENCE_MODE;

    try {
      process.env.PERSISTENCE_MODE = 'memory';
      resetOrderRepository();
      resetSettlementRepository();

      const pendingOrder = createOrder();
      await getOrderRepository().save(pendingOrder);
      const pendingResult = await createSettlementFromOrder({
        orderId: pendingOrder.orderId,
        idempotencyKey: `settlement-payable-earning-${randomUUID()}`,
      });

      assert.equal(pendingResult.success, true, `pending settlement failed: ${pendingResult.errors?.join(',')}`);
      assert.equal(pendingResult.supplierPayables?.length, 1);
      assert.equal(pendingResult.creatorEarnings?.length, 1);

      const supplierPayable = pendingResult.supplierPayables![0];
      const creatorEarning = pendingResult.creatorEarnings![0];

      assert.equal(supplierPayable.settlementLineId, pendingResult.settlementLines![0].settlementLineId);
      assert.equal(supplierPayable.orderId, pendingOrder.orderId);
      assert.equal(supplierPayable.orderLineId, pendingOrder.lines[0].orderLineId);
      assert.equal(supplierPayable.partyType, 'SUPPLIER');
      assert.equal(supplierPayable.partyId, 'supplier-payable-1');
      assert.equal(supplierPayable.amount, 100);
      assert.equal(supplierPayable.currency, 'TRY');
      assert.equal(supplierPayable.status, 'PENDING');
      assert.equal(supplierPayable.holdReasonCode, undefined);
      assert.equal(supplierPayable.boundaryFlags.payoutCreated, false);
      assert.equal(supplierPayable.boundaryFlags.ledgerEntryCreated, false);
      assert.equal(supplierPayable.boundaryFlags.providerPayoutExecuted, false);

      assert.equal(creatorEarning.settlementLineId, pendingResult.settlementLines![0].settlementLineId);
      assert.equal(creatorEarning.partyType, 'CREATOR');
      assert.equal(creatorEarning.partyId, 'creator-store-payable-1');
      assert.equal(creatorEarning.amount, 30);
      assert.equal(creatorEarning.currency, 'TRY');
      assert.equal(creatorEarning.status, 'PENDING');
      assert.equal(creatorEarning.boundaryFlags.payoutCreated, false);
      assert.equal(creatorEarning.boundaryFlags.ledgerEntryCreated, false);
      assert.equal(creatorEarning.boundaryFlags.providerPayoutExecuted, false);

      assert.ok(supplierPayable.sourceRefs.some((ref) => ref.sourceType === 'SUPPLIER' && ref.sourceId === 'supplier-payable-1'));
      assert.ok(supplierPayable.sourceRefs.some((ref) => ref.sourceType === 'CREATOR_STORE' && ref.sourceId === 'creator-store-payable-1'));
      assert.ok(supplierPayable.sourceRefs.some((ref) => ref.sourceType === 'DISCOUNT_ALLOCATION' && ref.sourceId === 'allocation-payable-1'));
      assert.ok(creatorEarning.sourceRefs.some((ref) => ref.sourceType === 'COUPON_SNAPSHOT' && ref.sourceId === 'discount-snapshot-payable-1'));

      const listedPayables = await listSettlementSupplierPayables({ orderId: pendingOrder.orderId });
      const listedEarnings = await listSettlementCreatorEarnings({ orderId: pendingOrder.orderId });
      assert.equal(listedPayables.total, 1);
      assert.equal(listedEarnings.total, 1);

      const blockedOrder = createOrder();
      await getOrderRepository().save(blockedOrder);
      await createRiskCase({
        target: { targetType: 'ORDER', targetId: blockedOrder.orderId },
        level: 'HIGH',
        source: 'FOUNDATION_SIMULATION',
        reasonCode: 'UNKNOWN',
        idempotencyKey: `risk-case-${randomUUID()}`,
        correlationId: `corr-${randomUUID()}`,
        actorId: 'smoke',
      });

      const blockedResult = await createSettlementFromOrder({
        orderId: blockedOrder.orderId,
        idempotencyKey: `settlement-payable-earning-blocked-${randomUUID()}`,
      });
      assert.equal(blockedResult.success, true, `blocked settlement failed: ${blockedResult.errors?.join(',')}`);
      assert.equal(blockedResult.settlementLines![0].status, 'BLOCKED');
      assert.equal(blockedResult.supplierPayables![0].status, 'HELD');
      assert.equal(blockedResult.creatorEarnings![0].status, 'HELD');
      assert.equal(blockedResult.supplierPayables![0].holdReasonCode, 'RISK_HOLD_RECOMMENDED');
      assert.equal(blockedResult.creatorEarnings![0].holdReasonCode, 'RISK_HOLD_RECOMMENDED');
      assert.equal(blockedResult.supplierPayables![0].boundaryFlags.payoutCreated, false);
      assert.equal(blockedResult.creatorEarnings![0].boundaryFlags.ledgerEntryCreated, false);

      await assertStaticGuard();

      return {
        result: 'PASS',
        message:
          'settlement lines create supplier payable and creator earning lifecycle foundation records, hold blocked lines, preserve source refs, and keep payout/ledger/provider boundaries closed.',
      };
    } catch (error) {
      return { result: 'FAIL', message: (error as Error).message };
    } finally {
      resetOrderRepository();
      resetSettlementRepository();
      setEnv('PERSISTENCE_MODE', originalPersistenceMode);
      await closePool().catch(() => undefined);
    }
  },
};
