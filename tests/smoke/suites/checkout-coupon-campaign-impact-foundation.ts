import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { CartContext, CartLine, CheckoutReviewResponse } from '../../../packages/contracts/src';
import { resolvePrice } from '../../../services/pricing/src';
import { resetRepository as resetCartRepository } from '@hx/commerce';
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
    recipientName: 'Coupon Smoke Guest',
    phone: '+905551112233',
    city: 'Istanbul',
    district: 'Kadikoy',
    addressLine: 'Coupon smoke validation address',
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
  discount: { couponCode?: string; campaignId?: string },
): Promise<CheckoutReviewResponse> {
  const context = cartContext();
  linesByActor.set(`${context.actorType}:${context.actorId}`, [line]);
  return startCheckout({
    cartContext: context,
    addressSnapshot: guestAddress(),
    ...discount,
  });
}

export const checkoutCouponCampaignImpactFoundationSmoke: SmokeRunner = {
  name: 'checkout-coupon-campaign-impact-foundation',
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

      const validCouponCheckout = await checkoutWithDiscount(await createLine(), linesByActor, {
        couponCode: 'HX10',
      });
      assert.equal(validCouponCheckout.state, 'REVIEW_READY');
      assert.equal(validCouponCheckout.validationState, 'VALID');
      assert.equal(validCouponCheckout.summary.discountTotal, 10);
      assert.equal(
        validCouponCheckout.summary.grandTotal,
        validCouponCheckout.summary.subTotal - 10,
      );
      assert.equal(validCouponCheckout.discountSnapshots?.[0]?.sourceType, 'COUPON');
      assert.equal(validCouponCheckout.discountSnapshots?.[0]?.code, 'HX10');
      assert.equal(validCouponCheckout.discountSnapshots?.[0]?.discountAmount, 10);
      assert.equal(validCouponCheckout.discountSnapshots?.[0]?.sponsorType, 'PLATFORM');
      assert.equal(validCouponCheckout.discountSnapshots?.[0]?.sponsorId, 'platform:hx');
      assert.equal(validCouponCheckout.discountSnapshots?.[0]?.validationStatus, 'VALID');

      const blockedBrandCampaignCheckout = await checkoutWithDiscount(await createLine(), linesByActor, {
        campaignId: 'CAMP_BRAND_20',
      });
      assert.equal(blockedBrandCampaignCheckout.state, 'BLOCKED');
      assert.equal(blockedBrandCampaignCheckout.validationState, 'BLOCKED');
      assert.equal(blockedBrandCampaignCheckout.summary.discountTotal, 0);
      assert.ok(blockedBrandCampaignCheckout.errors.includes('FIRST_PHASE_BRAND_SPONSOR_DISABLED'));
      assert.equal(blockedBrandCampaignCheckout.discountSnapshots?.[0]?.sourceType, 'CAMPAIGN');
      assert.equal(blockedBrandCampaignCheckout.discountSnapshots?.[0]?.sponsorType, 'BRAND');
      assert.equal(blockedBrandCampaignCheckout.discountSnapshots?.[0]?.sponsorId, 'brand:foundation');
      assert.equal(blockedBrandCampaignCheckout.discountSnapshots?.[0]?.validationStatus, 'BLOCKED');

      const expiredCouponCheckout = await checkoutWithDiscount(await createLine(), linesByActor, {
        couponCode: 'HX_EXPIRED',
      });
      assert.equal(expiredCouponCheckout.state, 'BLOCKED');
      assert.equal(expiredCouponCheckout.validationState, 'BLOCKED');
      assert.equal(expiredCouponCheckout.summary.discountTotal, 0);
      assert.ok(expiredCouponCheckout.errors.includes('COUPON_EXPIRED'));
      assert.equal(expiredCouponCheckout.discountSnapshots?.[0]?.validationStatus, 'EXPIRED');

      const usageLimitCheckout = await checkoutWithDiscount(await createLine(), linesByActor, {
        couponCode: 'HX_LIMITED',
      });
      assert.equal(usageLimitCheckout.state, 'BLOCKED');
      assert.equal(usageLimitCheckout.validationState, 'BLOCKED');
      assert.ok(usageLimitCheckout.errors.includes('COUPON_USAGE_LIMIT_EXCEEDED'));
      assert.equal(usageLimitCheckout.discountSnapshots?.[0]?.validationStatus, 'USAGE_LIMIT_EXCEEDED');

      const notEligibleCheckout = await checkoutWithDiscount(await createLine(), linesByActor, {
        couponCode: 'HX_CUSTOMER_10',
      });
      assert.equal(notEligibleCheckout.state, 'BLOCKED');
      assert.equal(notEligibleCheckout.validationState, 'BLOCKED');
      assert.ok(notEligibleCheckout.errors.includes('COUPON_NOT_ELIGIBLE'));
      assert.equal(notEligibleCheckout.discountSnapshots?.[0]?.validationStatus, 'NOT_ELIGIBLE');

      const invalidCouponCheckout = await checkoutWithDiscount(await createLine(), linesByActor, {
        couponCode: 'HX_UNKNOWN',
      });
      assert.equal(invalidCouponCheckout.state, 'BLOCKED');
      assert.equal(invalidCouponCheckout.validationState, 'BLOCKED');
      assert.ok(invalidCouponCheckout.errors.includes('COUPON_NOT_FOUND'));
      assert.equal(invalidCouponCheckout.discountSnapshots?.[0]?.validationStatus, 'INVALID');

      const blockedPayment = await initiatePayment({
        checkoutId: invalidCouponCheckout.checkoutId,
        cartContext: invalidCouponCheckout.cartContext,
        paymentMethod: 'CARD',
        idempotencyKey: `idem-${randomUUID()}`,
      });
      assert.equal(blockedPayment.state, 'FAILED');
      assert.ok(blockedPayment.errors.includes('CHECKOUT_NOT_READY'));
      assert.equal(blockedPayment.paymentId, '');
      assert.equal(blockedPayment.providerEnvelope, undefined);

      return {
        result: 'PASS',
        message:
          'service-level checkout coupon/campaign foundation applies valid platform discounts and blocks first-phase disabled brand, invalid, expired, ineligible, and usage-limited discounts before payment.',
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
