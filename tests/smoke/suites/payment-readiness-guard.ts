import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { CheckoutReviewResponse } from '../../../packages/contracts/src';
import { resetRepository as resetCheckoutRepository } from '../../../services/checkout/src/checkout';
import { getPaymentRepository, resetPaymentRepository } from '../../../services/payment/src/repository';
import { initiatePayment } from '../../../services/payment/src/payment';
import { closePool } from '../../../packages/persistence/src';
import { SmokeRunner, SmokeResult } from '../types';

function setEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

function createCheckout(
  overrides: Partial<CheckoutReviewResponse> = {},
): CheckoutReviewResponse {
  const checkoutId = overrides.checkoutId ?? `checkout-${randomUUID()}`;
  const cartContext = overrides.cartContext ?? {
    actorType: 'CUSTOMER' as const,
    actorId: `customer-${randomUUID()}`,
  };

  return {
    checkoutId,
    cartContext,
    state: 'REVIEW_READY',
    validationState: 'VALID',
    lines: [
      {
        lineId: `line-${randomUUID()}`,
        productId: 'product-payment-readiness-guard',
        variantId: 'variant-payment-readiness-guard',
        storefrontId: 'storefront-payment-readiness-guard',
        quantity: 1,
        unitPrice: 1000,
        lineTotal: 1000,
        validationState: 'VALID',
        warnings: [],
        errors: [],
      },
    ],
    summary: {
      totalQuantity: 1,
      subTotal: 1000,
      grandTotal: 1000,
      currency: 'TRY',
    },
    errors: [],
    warnings: [],
    ...overrides,
  };
}

export const paymentReadinessGuardSmoke: SmokeRunner = {
  name: 'payment-readiness-guard',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    const originalPersistenceMode = process.env.PERSISTENCE_MODE;
    const originalPaymentProviderName = process.env.PAYMENT_PROVIDER_NAME;
    const originalPaymentProviderMode = process.env.PAYMENT_PROVIDER_MODE;

    try {
      process.env.PERSISTENCE_MODE = 'memory';
      process.env.PAYMENT_PROVIDER_NAME = 'internal_simulation';
      process.env.PAYMENT_PROVIDER_MODE = 'simulation';
      resetPaymentRepository();

      const readyCheckout = createCheckout();
      const blockedCheckout = createCheckout({
        checkoutId: `checkout-blocked-${randomUUID()}`,
        cartContext: readyCheckout.cartContext,
        state: 'BLOCKED',
        validationState: 'BLOCKED',
        lines: [
          {
            ...readyCheckout.lines[0],
            lineId: `line-blocked-${randomUUID()}`,
            validationState: 'STOCK_MISMATCH',
            errors: ['STOCK_UNAVAILABLE'],
          },
        ],
      });
      const invalidAmountCheckout = createCheckout({
        checkoutId: `checkout-invalid-amount-${randomUUID()}`,
        cartContext: readyCheckout.cartContext,
        summary: {
          totalQuantity: 1,
          subTotal: 0,
          grandTotal: 0,
          currency: 'TRY',
        },
      });
      const checkouts = new Map<string, CheckoutReviewResponse>([
        [readyCheckout.checkoutId, readyCheckout],
        [blockedCheckout.checkoutId, blockedCheckout],
        [invalidAmountCheckout.checkoutId, invalidAmountCheckout],
      ]);

      resetCheckoutRepository({
        save: async () => undefined,
        getById: async (checkoutId: string) => checkouts.get(checkoutId),
      });

      const readyPayment = await initiatePayment({
        checkoutId: readyCheckout.checkoutId,
        cartContext: readyCheckout.cartContext,
        paymentMethod: 'CARD',
        idempotencyKey: `idem-ready-${randomUUID()}`,
      });
      assert.equal(readyPayment.state, 'INITIATED');
      assert.equal(readyPayment.errors.length, 0);
      assert.equal(readyPayment.attempt.state, 'PROVIDER_REDIRECT_READY');
      assert.ok(readyPayment.providerEnvelope, 'ready checkout should call provider');

      const missingPayment = await initiatePayment({
        checkoutId: `checkout-missing-${randomUUID()}`,
        cartContext: readyCheckout.cartContext,
        paymentMethod: 'CARD',
        idempotencyKey: `idem-missing-${randomUUID()}`,
      });
      assert.equal(missingPayment.state, 'FAILED');
      assert.deepEqual(missingPayment.errors, ['CHECKOUT_NOT_FOUND']);
      assert.equal(missingPayment.paymentId, '');
      assert.equal(missingPayment.attempt.paymentAttemptId, '');
      assert.equal(missingPayment.providerEnvelope, undefined);

      const blockedPayment = await initiatePayment({
        checkoutId: blockedCheckout.checkoutId,
        cartContext: blockedCheckout.cartContext,
        paymentMethod: 'CARD',
        idempotencyKey: `idem-blocked-${randomUUID()}`,
      });
      assert.equal(blockedPayment.state, 'FAILED');
      assert.ok(blockedPayment.errors.includes('CHECKOUT_NOT_READY'));
      assert.equal(blockedPayment.paymentId, '');
      assert.equal(blockedPayment.attempt.paymentAttemptId, '');
      assert.equal(blockedPayment.providerEnvelope, undefined);

      const invalidAmountPayment = await initiatePayment({
        checkoutId: invalidAmountCheckout.checkoutId,
        cartContext: invalidAmountCheckout.cartContext,
        paymentMethod: 'CARD',
        idempotencyKey: `idem-invalid-amount-${randomUUID()}`,
      });
      assert.equal(invalidAmountPayment.state, 'FAILED');
      assert.ok(invalidAmountPayment.errors.includes('CHECKOUT_AMOUNT_INVALID'));
      assert.equal(invalidAmountPayment.paymentId, '');
      assert.equal(invalidAmountPayment.attempt.paymentAttemptId, '');
      assert.equal(invalidAmountPayment.providerEnvelope, undefined);

      const repo = getPaymentRepository();
      assert.equal(await repo.getById(missingPayment.paymentId), undefined);
      assert.equal(await repo.getByPaymentAttemptId(missingPayment.attempt.paymentAttemptId), undefined);
      assert.equal(await repo.getById(blockedPayment.paymentId), undefined);
      assert.equal(await repo.getByPaymentAttemptId(blockedPayment.attempt.paymentAttemptId), undefined);
      assert.equal(await repo.getById(invalidAmountPayment.paymentId), undefined);
      assert.equal(
        await repo.getByPaymentAttemptId(invalidAmountPayment.attempt.paymentAttemptId),
        undefined,
      );

      return {
        result: 'PASS',
        message:
          'payment initiation proceeds only for REVIEW_READY/VALID checkout; missing, blocked, and invalid amount checkouts return deterministic errors without persisted payment attempt or provider envelope.',
      };
    } catch (error) {
      return { result: 'FAIL', message: (error as Error).message };
    } finally {
      resetCheckoutRepository();
      resetPaymentRepository();
      setEnv('PERSISTENCE_MODE', originalPersistenceMode);
      setEnv('PAYMENT_PROVIDER_NAME', originalPaymentProviderName);
      setEnv('PAYMENT_PROVIDER_MODE', originalPaymentProviderMode);
      await closePool().catch(() => undefined);
    }
  },
};
