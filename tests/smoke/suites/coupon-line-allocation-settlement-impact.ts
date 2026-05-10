import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import {
  CartContext,
  CartLine,
  CheckoutDiscountInput,
  CheckoutDiscountLineAllocation,
  CheckoutReviewResponse,
} from '../../../packages/contracts/src';
import { resetRepository as resetCartRepository } from '@hx/commerce';
import { resolvePrice } from '../../../services/pricing/src';
import { resetRepository as resetCheckoutRepository } from '../../../services/checkout/src/checkout';
import { startCheckout } from '../../../services/checkout/src';
import { calculateSettlement, resetSettlementCalculationGuardForTesting } from '@hx/settlement';
import { closePool } from '../../../packages/persistence/src';
import { SmokeResult, SmokeRunner } from '../types';

function setEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

function guestAddress() {
  return {
    kind: 'GUEST_ADDRESS' as const,
    recipientName: 'Coupon Allocation Guest',
    phone: '+905551112233',
    city: 'Istanbul',
    district: 'Kadikoy',
    addressLine: 'Coupon allocation smoke address',
  };
}

function cartContext(): CartContext {
  return {
    actorType: 'GUEST',
    actorId: `guest-${randomUUID()}`,
  };
}

function createCartRepository(linesByActor: Map<string, CartLine[]>) {
  const key = (context: CartContext) => `${context.actorType}:${context.actorId}`;

  return {
    getLines: async (context: CartContext) => linesByActor.get(key(context)) ?? [],
    saveLines: async (context: CartContext, lines: CartLine[]) => {
      linesByActor.set(key(context), lines);
    },
    clear: async (context: CartContext) => {
      linesByActor.delete(key(context));
    },
  };
}

function createCheckoutRepository(checkouts: Map<string, CheckoutReviewResponse>) {
  return {
    save: async (checkout: CheckoutReviewResponse) => {
      checkouts.set(checkout.checkoutId, checkout);
    },
    getById: async (checkoutId: string) => checkouts.get(checkoutId),
  };
}

async function createLine(quantity: number): Promise<CartLine> {
  const productId = 'p_valid';
  const variantId = 'v_1';
  const storefrontId = 's_feno_1';
  const price = await resolvePrice({ productId, variantId, storefrontId, quantity });
  assert.equal(price.status, 'OK');
  assert.ok(price.price);

  return {
    lineId: `line-${randomUUID()}`,
    productId,
    variantId,
    storefrontId,
    quantity,
    productName: 'Valid Product',
    productStatus: 'ACTIVE',
    unitPrice: price.price.activeUnitPrice,
    lineTotal: price.price.activeUnitPrice * quantity,
    warnings: [],
  };
}

async function checkoutWithDiscount(
  lines: CartLine[],
  linesByActor: Map<string, CartLine[]>,
  discount: { couponCode?: string; campaignId?: string; discountInputs?: CheckoutDiscountInput[] },
): Promise<CheckoutReviewResponse> {
  const context = cartContext();
  linesByActor.set(`${context.actorType}:${context.actorId}`, lines);
  return startCheckout({
    cartContext: context,
    addressSnapshot: guestAddress(),
    ...discount,
  });
}

function allocations(checkout: CheckoutReviewResponse): CheckoutDiscountLineAllocation[] {
  return checkout.discountSnapshots?.flatMap((snapshot) => snapshot.lineAllocations ?? []) ?? [];
}

function sumAllocations(items: CheckoutDiscountLineAllocation[]): number {
  return Math.round(items.reduce((sum, item) => sum + item.allocatedAmount, 0) * 100) / 100;
}

const creatorPolicy = {
  creatorId: 'creator-foundation',
  creatorStoreId: 'store-foundation',
  minCreatorMarginAmount: 20,
  selectedSalePrice: 150,
  poolBasePriceAmount: 90,
  couponDiscountAmount: 30,
};

export const couponLineAllocationSettlementImpactSmoke: SmokeRunner = {
  name: 'coupon-line-allocation-settlement-impact',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    const originalPersistenceMode = process.env.PERSISTENCE_MODE;
    const linesByActor = new Map<string, CartLine[]>();
    const checkouts = new Map<string, CheckoutReviewResponse>();

    try {
      process.env.PERSISTENCE_MODE = 'memory';
      resetCartRepository(createCartRepository(linesByActor));
      resetCheckoutRepository(createCheckoutRepository(checkouts));
      resetSettlementCalculationGuardForTesting();

      const platformCheckout = await checkoutWithDiscount(
        [await createLine(1), await createLine(2)],
        linesByActor,
        { couponCode: 'HX10' },
      );
      const platformAllocations = allocations(platformCheckout);
      assert.equal(platformCheckout.state, 'REVIEW_READY');
      assert.equal(platformCheckout.summary.discountTotal, 10);
      assert.equal(platformAllocations.length, 2);
      assert.equal(sumAllocations(platformAllocations), platformCheckout.summary.discountTotal);
      assert.ok(platformAllocations.every((allocation) => allocation.sponsorType === 'PLATFORM'));
      assert.ok(platformAllocations.every((allocation) => allocation.lineId && allocation.cartLineId));

      const creatorCheckout = await checkoutWithDiscount(
        [await createLine(1)],
        linesByActor,
        { discountInputs: [{ sourceType: 'COUPON', code: 'HX_CREATOR_30', creatorCouponPolicy: creatorPolicy }] },
      );
      const creatorAllocations = allocations(creatorCheckout);
      assert.equal(creatorCheckout.state, 'REVIEW_READY');
      assert.equal(creatorCheckout.summary.discountTotal, 30);
      assert.equal(sumAllocations(creatorAllocations), creatorCheckout.summary.discountTotal);
      assert.ok(creatorAllocations.every((allocation) => allocation.sponsorType === 'CREATOR'));
      assert.ok(creatorAllocations.every((allocation) => allocation.sponsorId === 'creator:foundation'));

      const supplierCheckout = await checkoutWithDiscount(
        [await createLine(1)],
        linesByActor,
        { couponCode: 'HX_SUPPLIER_25' },
      );
      assert.equal(supplierCheckout.state, 'BLOCKED');
      assert.equal(allocations(supplierCheckout).length, 0);

      const brandCheckout = await checkoutWithDiscount(
        [await createLine(1)],
        linesByActor,
        { campaignId: 'CAMP_BRAND_20' },
      );
      assert.equal(brandCheckout.state, 'BLOCKED');
      assert.equal(allocations(brandCheckout).length, 0);

      const platformSettlement = await calculateSettlement({
        idempotencyKey: `settlement-platform-${randomUUID()}`,
        sourceType: 'ORDER_LINE',
        sourceId: platformAllocations[0].lineId,
        currency: 'TRY',
        grossAmount: 1000,
        platformCommissionRate: 0.15,
        supplierId: 'supplier-1',
        couponSponsorType: 'PLATFORM',
        couponSponsorId: 'platform:hx',
        discountLineAllocations: platformAllocations,
      });
      assert.equal(platformSettlement.status, 'CALCULATED');
      assert.ok(platformSettlement.lines.some((line) => line.type === 'COUPON_SPONSOR_IMPACT'));
      assert.ok(platformSettlement.lines.some((line) => line.type === 'PLATFORM_DISCOUNT_COST'));
      assert.equal(platformSettlement.summary.platformDiscountCostAmount, 10);
      assert.equal(platformSettlement.summary.discountSponsorImpactAmount, 10);
      assert.equal(platformSettlement.limitationFlags?.includes('COUPON_SPONSOR_IMPACT_NOT_CALCULATED'), undefined);

      const creatorSettlement = await calculateSettlement({
        idempotencyKey: `settlement-creator-${randomUUID()}`,
        sourceType: 'ORDER_LINE',
        sourceId: creatorAllocations[0].lineId,
        currency: 'TRY',
        grossAmount: 1000,
        platformCommissionRate: 0.15,
        supplierId: 'supplier-1',
        creatorId: 'creator-foundation',
        selectedSalePrice: 150,
        poolBasePriceAmount: 90,
        couponSponsorType: 'CREATOR',
        couponSponsorId: 'creator:foundation',
        discountLineAllocations: creatorAllocations,
      });
      assert.equal(creatorSettlement.status, 'CALCULATED');
      assert.ok(creatorSettlement.lines.some((line) => line.type === 'COUPON_SPONSOR_IMPACT'));
      assert.ok(creatorSettlement.lines.some((line) => line.type === 'CREATOR_DISCOUNT_COST'));
      assert.equal(creatorSettlement.summary.creatorDiscountCostAmount, 30);
      assert.equal(creatorSettlement.summary.discountSponsorImpactAmount, 30);
      assert.equal(creatorSettlement.summary.payoutCreated, false);
      assert.equal(creatorSettlement.summary.payableCreated, false);
      assert.equal(creatorSettlement.summary.ledgerEntryCreated, false);
      assert.equal(creatorSettlement.summary.refundStateMutated, false);

      const unsupportedSettlement = await calculateSettlement({
        idempotencyKey: `settlement-brand-${randomUUID()}`,
        sourceType: 'ORDER_LINE',
        sourceId: 'order-line-brand',
        currency: 'TRY',
        grossAmount: 1000,
        platformCommissionRate: 0.15,
        supplierId: 'supplier-1',
        discountLineAllocations: [{
          ...platformAllocations[0],
          allocationId: `dla_${randomUUID()}`,
          sponsorType: 'BRAND',
          sponsorId: 'brand:foundation',
        }],
      });
      assert.equal(unsupportedSettlement.status, 'BLOCKED');
      assert.ok(unsupportedSettlement.errors?.includes('FIRST_PHASE_DISCOUNT_SPONSOR_IMPACT_UNSUPPORTED'));
      assert.equal(unsupportedSettlement.lines.length, 0);

      return {
        result: 'PASS',
        message:
          'coupon line allocation and settlement sponsor impact foundation passed without payout, payable, ledger, or refund mutation.',
      };
    } catch (error) {
      return { result: 'FAIL', message: (error as Error).message };
    } finally {
      resetCartRepository();
      resetCheckoutRepository();
      resetSettlementCalculationGuardForTesting();
      setEnv('PERSISTENCE_MODE', originalPersistenceMode);
      await closePool().catch(() => undefined);
    }
  },
};
