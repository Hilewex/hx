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

export const paymentInitiationProviderReferenceSmoke: SmokeRunner = {
  name: 'payment-initiation-provider-reference',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    const originalPersistenceMode = process.env.PERSISTENCE_MODE;
    const originalPaymentProviderName = process.env.PAYMENT_PROVIDER_NAME;
    const originalPaymentProviderMode = process.env.PAYMENT_PROVIDER_MODE;

    try {
      process.env.PERSISTENCE_MODE = 'memory';
      process.env.PAYMENT_PROVIDER_NAME = 'internal_simulation';
      process.env.PAYMENT_PROVIDER_MODE = 'simulation';
      resetPaymentRepository();

      const checkoutId = `checkout-${randomUUID()}`;
      const idempotencyKey = `idem-${randomUUID()}`;
      const cartContext = {
        actorType: 'CUSTOMER' as const,
        actorId: `customer-${randomUUID()}`,
      };
      const checkout: CheckoutReviewResponse = {
        checkoutId,
        cartContext,
        state: 'REVIEW_READY',
        validationState: 'VALID',
        lines: [
          {
            lineId: `line-${randomUUID()}`,
            productId: 'product-provider-reference-smoke',
            variantId: 'variant-provider-reference-smoke',
            storefrontId: 'storefront-provider-reference-smoke',
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
      };

      resetCheckoutRepository({
        save: async () => undefined,
        getById: async (candidateCheckoutId: string) =>
          candidateCheckoutId === checkoutId ? checkout : undefined,
      });

      const response = await initiatePayment({
        checkoutId,
        cartContext,
        paymentMethod: 'CARD',
        idempotencyKey,
      });

      assert.equal(response.state, 'INITIATED');
      assert.equal(response.attempt.state, 'PROVIDER_REDIRECT_READY');
      assert.equal(response.providerEnvelope?.providerName, 'internal_simulation');
      assert.ok(response.providerEnvelope?.providerReference);
      assert.equal(response.attempt.providerName, 'internal_simulation');
      assert.equal(response.attempt.providerReference, response.providerEnvelope.providerReference);
      assert.equal(response.attempt.providerEventId, response.providerEnvelope.providerReference);
      assert.equal(response.attempt.providerSimulationRef, response.providerEnvelope.providerReference);
      assert.equal(response.attempt.lastCallbackAt, undefined);
      assert.equal(response.attempt.lastCallbackStatus, undefined);

      const repo = getPaymentRepository();
      const foundByProviderReference = await repo.getByProviderReference(
        response.attempt.providerName,
        response.attempt.providerReference,
      );
      assert.equal(foundByProviderReference?.paymentId, response.paymentId);

      const foundByAttempt = await repo.getByPaymentAttemptId(response.attempt.paymentAttemptId);
      assert.equal(foundByAttempt?.paymentId, response.paymentId);

      const idempotentResponse = await initiatePayment({
        checkoutId,
        cartContext,
        paymentMethod: 'CARD',
        idempotencyKey,
      });
      assert.equal(idempotentResponse.paymentId, response.paymentId);
      assert.equal(idempotentResponse.attempt.providerReference, response.attempt.providerReference);
      assert.equal(idempotentResponse.state, 'INITIATED');
      assert.equal(idempotentResponse.attempt.lastCallbackAt, undefined);
      assert.equal(idempotentResponse.attempt.lastCallbackStatus, undefined);

      return {
        result: 'PASS',
        message:
          'initiatePayment persisted internal_simulation provider metadata; providerReference, attempt, and idempotency lookups passed; no callback/order mutation asserted.',
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
