import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import { OrderResponse } from '../../../packages/contracts/src';
import { getOrderRepository, resetOrderRepository } from '../../../services/order/src/repository/index.ts';
import { createSettlementFromOrder } from '@hx/settlement';
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

function createOrder(input: { includeSnapshot: boolean }): OrderResponse {
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
      productId: 'product-economics',
      variantId: 'variant-economics',
      storefrontId: 'storefront-economics',
      quantity: 1,
      productNameSnapshot: 'Economics Settlement Product',
      unitPriceSnapshot: 150,
      lineTotalSnapshot: 150,
      economicsSnapshot: input.includeSnapshot ? {
        commercialPoolProductId: 'commercial-pool-product-1',
        creatorStoreProductId: 'creator-store-product-1',
        creatorStoreId: 'creator-store-1',
        supplierId: 'supplier-1',
        supplierSubmittedProductId: 'supplier-submitted-product-1',
        supplierVariantId: 'supplier-variant-1',
        supplierBaseAmount: 100,
        poolBasePriceAmount: 120,
        creatorSelectedPriceAmount: 150,
        platformMarginAmount: 20,
        creatorMarginAmount: 30,
        unitPriceSnapshot: 150,
        lineTotalSnapshot: 150,
        discountAllocationRefs: [{
          allocationId: 'allocation-1',
          discountSnapshotId: 'discount-snapshot-1',
          discountCode: 'HX10',
          discountKind: 'COUPON',
          sponsorType: 'PLATFORM',
          sponsorId: 'platform:hx',
          allocatedAmount: 10,
          currency: 'TRY',
        }],
        couponSnapshotRefs: [{
          discountSnapshotId: 'discount-snapshot-1',
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
        warnings: ['ORDER_LINE_ECONOMICS_SNAPSHOT_FOUNDATION_ONLY'],
        boundaryFlags: {
          economicsSnapshotOnly: true,
          settlementCreated: false,
          payoutCreated: false,
          ledgerEntryCreated: false,
          payableCreated: false,
        },
      } : undefined,
    }],
    summary: {
      totalQuantity: 1,
      subTotal: 150,
      discountTotal: input.includeSnapshot ? 10 : 0,
      shippingTotal: 0,
      grandTotal: input.includeSnapshot ? 140 : 150,
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
  ];
  const forbidden = [
    'append' + 'LedgerEntry',
    'create' + 'Payout',
    'execute' + 'Payout',
    'provider' + 'Payout(',
    'payableCreated: ' + 'true',
    'ledgerEntryCreated: ' + 'true',
    'payoutCreated: ' + 'true',
  ];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    for (const pattern of forbidden) {
      assert.equal(content.includes(pattern), false, `${pattern} found in ${file}`);
    }
  }
}

export const settlementFromOrderEconomicsSnapshotFoundationSmoke: SmokeRunner = {
  name: 'settlement-from-order-economics-snapshot-foundation',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    const originalPersistenceMode = process.env.PERSISTENCE_MODE;

    try {
      process.env.PERSISTENCE_MODE = 'memory';
      resetOrderRepository();
      resetSettlementRepository();

      const order = createOrder({ includeSnapshot: true });
      await getOrderRepository().save(order);

      const result = await createSettlementFromOrder({
        orderId: order.orderId,
        idempotencyKey: `settlement-from-order-${randomUUID()}`,
      });
      assert.equal(result.success, true, `createSettlementFromOrder failed: ${result.errors?.join(',')}`);
      assert.equal(result.settlementLines?.length, 1);

      const line = result.settlementLines![0];
      assert.equal(line.partyId, 'supplier-1');
      assert.equal(line.amountSummary.grossAmount, 150);
      assert.equal(line.amountSummary.netAmount, 150);
      assert.equal(line.amountSummary.supplierBaseAmount, 100);
      assert.equal(line.amountSummary.poolBasePriceAmount, 120);
      assert.equal(line.amountSummary.creatorSelectedPriceAmount, 150);
      assert.equal(line.amountSummary.platformMarginAmount, 20);
      assert.equal(line.amountSummary.platformShareAmount, 20);
      assert.equal(line.amountSummary.creatorMarginAmount, 30);
      assert.equal(line.amountSummary.creatorShareAmount, 30);
      assert.equal(line.amountSummary.supplierShareAmount, 100);
      assert.equal(line.amountSummary.ruleSourceAvailable, true, 'snapshot-backed settlement line should have rule source available');
      assert.equal(line.amountSummary.calculationFinalized, true, 'complete snapshot should finalize settlement calculation foundation fields');
      assert.equal(line.amountSummary.economicsSnapshotAvailable, true, 'economics snapshot should be marked available');
      assert.equal(line.amountSummary.economicsSnapshotStatus, 'COMPLETE');
      assert.equal(line.impactSummary.actualPayoutMutationPerformed, false);
      assert.equal(line.impactSummary.actualPaymentMutationPerformed, false);
      assert.equal(line.impactSummary.actualFinanceCorrectionMutationPerformed, false);
      assert.ok(line.sourceRefs.some((ref) => ref.sourceType === 'COMMERCIAL_POOL_PRODUCT' && ref.sourceId === 'commercial-pool-product-1'));
      assert.ok(line.sourceRefs.some((ref) => ref.sourceType === 'CREATOR_STORE_PRODUCT' && ref.sourceId === 'creator-store-product-1'));
      assert.ok(line.sourceRefs.some((ref) => ref.sourceType === 'CREATOR_STORE' && ref.sourceId === 'creator-store-1'));
      assert.ok(line.sourceRefs.some((ref) => ref.sourceType === 'SUPPLIER' && ref.sourceId === 'supplier-1'));
      assert.ok(line.sourceRefs.some((ref) => ref.sourceType === 'DISCOUNT_ALLOCATION' && ref.sourceId === 'allocation-1'));
      assert.ok(line.sourceRefs.some((ref) => ref.sourceType === 'COUPON_SNAPSHOT' && ref.sourceId === 'discount-snapshot-1'));
      assert.equal(line.warnings.includes('ORDER_LINE_ECONOMICS_SNAPSHOT_MISSING'), false);

      const missingSnapshotOrder = createOrder({ includeSnapshot: false });
      await getOrderRepository().save(missingSnapshotOrder);

      const missingSnapshotResult = await createSettlementFromOrder({
        orderId: missingSnapshotOrder.orderId,
        idempotencyKey: `settlement-from-order-missing-${randomUUID()}`,
      });
      assert.equal(missingSnapshotResult.success, true, `missing snapshot settlement failed: ${missingSnapshotResult.errors?.join(',')}`);
      assert.equal(missingSnapshotResult.settlementLines?.length, 1);
      const missingSnapshotLine = missingSnapshotResult.settlementLines![0];
      assert.equal(missingSnapshotLine.amountSummary.grossAmount, 150);
      assert.equal(missingSnapshotLine.amountSummary.netAmount, 150);
      assert.equal(missingSnapshotLine.amountSummary.ruleSourceAvailable, false);
      assert.equal(missingSnapshotLine.amountSummary.calculationFinalized, false);
      assert.equal(missingSnapshotLine.amountSummary.economicsSnapshotAvailable, false);
      assert.equal(missingSnapshotLine.amountSummary.economicsSnapshotStatus, 'DEGRADED');
      assert.ok(missingSnapshotLine.warnings.includes('ORDER_LINE_ECONOMICS_SNAPSHOT_MISSING'));
      assert.ok(missingSnapshotResult.warnings?.includes('ORDER_LINE_ECONOMICS_SNAPSHOT_MISSING'));

      await assertStaticGuard();

      return {
        result: 'PASS',
        message:
          'settlement create-from-order reads order line economics snapshot, carries source economics/refs, degrades when missing, and keeps payout/payable/ledger boundaries closed.',
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
