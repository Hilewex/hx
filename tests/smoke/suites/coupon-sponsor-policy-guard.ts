import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { CartContext, CartLine, CheckoutDiscountInput, CheckoutReviewResponse } from '../../../packages/contracts/src';
import { resetRepository as resetCartRepository } from '@hx/commerce';
import { resolvePrice } from '../../../services/pricing/src';
import { resetRepository as resetCheckoutRepository } from '../../../services/checkout/src/checkout';
import { startCheckout } from '../../../services/checkout/src';
import { initiatePayment } from '../../../services/payment/src/payment';
import { resetPaymentRepository } from '../../../services/payment/src/repository';
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
    recipientName: 'Coupon Policy Guard Guest',
    phone: '+905551112233',
    city: 'Istanbul',
    district: 'Kadikoy',
    addressLine: 'Coupon policy guard smoke address',
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

async function createLine(): Promise<CartLine> {
  const productId = 'p_valid';
  const variantId = 'v_1';
  const storefrontId = 's_feno_1';
  const quantity = 1;
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
  line: CartLine,
  linesByActor: Map<string, CartLine[]>,
  discount: { couponCode?: string; campaignId?: string; discountInputs?: CheckoutDiscountInput[] },
): Promise<CheckoutReviewResponse> {
  const context = cartContext();
  linesByActor.set(`${context.actorType}:${context.actorId}`, [line]);
  return startCheckout({
    cartContext: context,
    addressSnapshot: guestAddress(),
    ...discount,
  });
}

const creatorPolicy = {
  creatorId: 'creator-foundation',
  creatorStoreId: 'store-foundation',
  minCreatorMarginAmount: 20,
  selectedSalePrice: 150,
  poolBasePriceAmount: 90,
  couponDiscountAmount: 30,
};

export const couponSponsorPolicyGuardSmoke: SmokeRunner = {
  name: 'coupon-sponsor-policy-guard',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    const originalPersistenceMode = process.env.PERSISTENCE_MODE;
    const originalPaymentProviderName = process.env.PAYMENT_PROVIDER_NAME;
    const originalPaymentProviderMode = process.env.PAYMENT_PROVIDER_MODE;
    const linesByActor = new Map<string, CartLine[]>();
    const checkouts = new Map<string, CheckoutReviewResponse>();

    try {
      process.env.PERSISTENCE_MODE = 'memory';
      process.env.PAYMENT_PROVIDER_NAME = 'internal_simulation';
      process.env.PAYMENT_PROVIDER_MODE = 'simulation';
      resetCartRepository(createCartRepository(linesByActor));
      resetCheckoutRepository(createCheckoutRepository(checkouts));
      resetPaymentRepository();

      const platformCoupon = await checkoutWithDiscount(await createLine(), linesByActor, { couponCode: 'HX10' });
      assert.equal(platformCoupon.state, 'REVIEW_READY');
      assert.equal(platformCoupon.summary.discountTotal, 10);
      assert.equal(platformCoupon.discountSnapshots?.[0]?.sponsorType, 'PLATFORM');

      const supplierCoupon = await checkoutWithDiscount(await createLine(), linesByActor, {
        couponCode: 'HX_SUPPLIER_25',
      });
      assert.equal(supplierCoupon.state, 'BLOCKED');
      assert.ok(supplierCoupon.errors.includes('FIRST_PHASE_SUPPLIER_SPONSOR_DISABLED'));
      assert.equal(supplierCoupon.discountSnapshots?.[0]?.validationStatus, 'BLOCKED');
      assert.equal(supplierCoupon.discountSnapshots?.[0]?.sponsorType, 'SUPPLIER');

      const brandCampaign = await checkoutWithDiscount(await createLine(), linesByActor, {
        campaignId: 'CAMP_BRAND_20',
      });
      assert.equal(brandCampaign.state, 'BLOCKED');
      assert.ok(brandCampaign.errors.includes('FIRST_PHASE_BRAND_SPONSOR_DISABLED'));
      assert.equal(brandCampaign.discountSnapshots?.[0]?.validationStatus, 'BLOCKED');
      assert.equal(brandCampaign.discountSnapshots?.[0]?.sponsorType, 'BRAND');

      const creatorCoupon = await checkoutWithDiscount(await createLine(), linesByActor, {
        discountInputs: [{ sourceType: 'COUPON', code: 'HX_CREATOR_30', creatorCouponPolicy: creatorPolicy }],
      });
      assert.equal(creatorCoupon.state, 'REVIEW_READY');
      assert.equal(creatorCoupon.summary.discountTotal, 30);
      assert.equal(creatorCoupon.discountSnapshots?.[0]?.sponsorType, 'CREATOR');
      assert.equal(creatorCoupon.discountSnapshots?.[0]?.sponsorId, 'creator:foundation');

      const lowMarginCreatorCoupon = await checkoutWithDiscount(await createLine(), linesByActor, {
        discountInputs: [
          {
            sourceType: 'COUPON',
            code: 'HX_CREATOR_30',
            creatorCouponPolicy: { ...creatorPolicy, minCreatorMarginAmount: 40 },
          },
        ],
      });
      assert.equal(lowMarginCreatorCoupon.state, 'BLOCKED');
      assert.ok(lowMarginCreatorCoupon.errors.includes('CREATOR_COUPON_MINIMUM_MARGIN_VIOLATION'));

      const missingMarginCreatorCoupon = await checkoutWithDiscount(await createLine(), linesByActor, {
        couponCode: 'HX_CREATOR_30',
      });
      assert.equal(missingMarginCreatorCoupon.state, 'BLOCKED');
      assert.ok(missingMarginCreatorCoupon.errors.includes('CREATOR_COUPON_MARGIN_INPUTS_REQUIRED'));

      const platformSupportedWithoutRatio = await checkoutWithDiscount(await createLine(), linesByActor, {
        discountInputs: [
          { sourceType: 'COUPON', code: 'HX_CREATOR_PLATFORM_30', creatorCouponPolicy: creatorPolicy },
        ],
      });
      assert.equal(platformSupportedWithoutRatio.state, 'BLOCKED');
      assert.ok(
        platformSupportedWithoutRatio.errors.includes('PLATFORM_SUPPORTED_CREATOR_COUPON_ADMIN_RATIO_REQUIRED'),
      );

      const campaignProductCreatorCoupon = await checkoutWithDiscount(await createLine(), linesByActor, {
        discountInputs: [
          {
            sourceType: 'COUPON',
            code: 'HX_CREATOR_30',
            creatorCouponPolicy: creatorPolicy,
            isCampaignProduct: true,
          },
        ],
      });
      assert.equal(campaignProductCreatorCoupon.state, 'BLOCKED');
      assert.ok(campaignProductCreatorCoupon.errors.includes('CREATOR_COUPON_DISABLED_ON_CAMPAIGN_PRODUCT'));

      const blockedPayment = await initiatePayment({
        checkoutId: supplierCoupon.checkoutId,
        cartContext: supplierCoupon.cartContext,
        paymentMethod: 'CARD',
        idempotencyKey: `idem-${randomUUID()}`,
      });
      assert.equal(blockedPayment.state, 'FAILED');
      assert.ok(blockedPayment.errors.includes('CHECKOUT_NOT_READY'));
      assert.equal(blockedPayment.paymentId, '');

      return {
        result: 'PASS',
        message:
          'coupon sponsor policy guard blocks disabled supplier/brand sponsors, protects creator coupon margin, requires admin ratio for platform support, and keeps accepted sponsor snapshots.',
      };
    } catch (error) {
      return { result: 'FAIL', message: (error as Error).message };
    } finally {
      resetCartRepository();
      resetCheckoutRepository();
      resetPaymentRepository();
      setEnv('PERSISTENCE_MODE', originalPersistenceMode);
      setEnv('PAYMENT_PROVIDER_NAME', originalPaymentProviderName);
      setEnv('PAYMENT_PROVIDER_MODE', originalPaymentProviderMode);
      await closePool().catch(() => undefined);
    }
  },
};
