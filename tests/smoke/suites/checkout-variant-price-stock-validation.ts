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
    recipientName: 'Smoke Guest',
    phone: '+905551112233',
    city: 'Istanbul',
    district: 'Kadikoy',
    addressLine: 'Smoke validation address',
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

async function createLine(overrides: Partial<CartLine> = {}): Promise<CartLine> {
  const productId = overrides.productId ?? 'p_valid';
  const variantId = overrides.variantId ?? 'v_1';
  const storefrontId = overrides.storefrontId ?? 's_feno_1';
  const quantity = overrides.quantity ?? 1;
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
    ...overrides,
  };
}

async function checkoutWithLine(line: CartLine, linesByActor: Map<string, CartLine[]>): Promise<CheckoutReviewResponse> {
  const context = cartContext();
  linesByActor.set(`${context.actorType}:${context.actorId}`, [line]);
  return startCheckout({
    cartContext: context,
    addressSnapshot: guestAddress(),
  });
}

export const checkoutVariantPriceStockValidationSmoke: SmokeRunner = {
  name: 'checkout-variant-price-stock-validation',
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

      const validCheckout = await checkoutWithLine(await createLine(), linesByActor);
      assert.equal(validCheckout.state, 'REVIEW_READY');
      assert.equal(validCheckout.validationState, 'VALID');
      assert.equal(validCheckout.lines[0].validationState, 'VALID');

      const invalidVariantCheckout = await checkoutWithLine(
        await createLine({ variantId: 'v_missing' }),
        linesByActor,
      );
      assert.equal(invalidVariantCheckout.state, 'BLOCKED');
      assert.equal(invalidVariantCheckout.validationState, 'BLOCKED');
      assert.deepEqual(invalidVariantCheckout.lines[0].errors, ['VARIANT_NOT_FOUND']);

      const currentPriceLine = await createLine();
      const priceMismatchCheckout = await checkoutWithLine(
        {
          ...currentPriceLine,
          unitPrice: currentPriceLine.unitPrice === undefined ? 1 : currentPriceLine.unitPrice + 1,
        },
        linesByActor,
      );
      assert.equal(priceMismatchCheckout.state, 'BLOCKED');
      assert.equal(priceMismatchCheckout.validationState, 'PRICE_MISMATCH');
      assert.equal(priceMismatchCheckout.lines[0].validationState, 'PRICE_MISMATCH');
      assert.ok(priceMismatchCheckout.lines[0].errors.includes('PRICE_MISMATCH'));

      const stockMismatchCheckout = await checkoutWithLine(
        await createLine({ quantity: 101 }),
        linesByActor,
      );
      assert.equal(stockMismatchCheckout.state, 'BLOCKED');
      assert.equal(stockMismatchCheckout.validationState, 'STOCK_MISMATCH');
      assert.equal(stockMismatchCheckout.lines[0].validationState, 'STOCK_MISMATCH');
      assert.ok(stockMismatchCheckout.lines[0].errors.includes('STOCK_UNAVAILABLE'));

      const blockedPayment = await initiatePayment({
        checkoutId: stockMismatchCheckout.checkoutId,
        cartContext: stockMismatchCheckout.cartContext,
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
          'service-level checkout validation blocks invalid variant, price mismatch, stock mismatch, and payment initiation after blocked checkout while allowing a valid line.',
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
