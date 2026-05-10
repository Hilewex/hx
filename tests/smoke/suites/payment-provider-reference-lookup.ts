import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { PaymentInitiationResponse } from '../../../packages/contracts/src';
import { closePool } from '../../../packages/persistence/src';
import { InMemoryPaymentRepository } from '../../../services/payment/src/repository/in-memory';
import { PostgresPaymentRepository } from '../../../services/payment/src/repository/postgres';
import { SmokeRunner, SmokeResult } from '../types';

const createPayment = (
  overrides: Partial<PaymentInitiationResponse> = {},
): PaymentInitiationResponse => {
  const paymentId = overrides.paymentId ?? `payment-${randomUUID()}`;
  const checkoutId = overrides.checkoutId ?? `checkout-${randomUUID()}`;

  return {
    paymentId,
    checkoutId,
    cartContext: {
      actorType: 'GUEST',
      actorId: `guest-${randomUUID()}`,
    },
    state: 'INITIATED',
    attempt: {
      paymentAttemptId: `attempt-${randomUUID()}`,
      checkoutId,
      amount: 1000,
      currency: 'TRY',
      method: 'CARD',
      state: 'PROVIDER_REDIRECT_READY',
      providerName: 'paytr',
      providerReference: `MERCHANT-OID-${randomUUID()}`,
      idempotencyKey: `idem-${randomUUID()}`,
    },
    errors: [],
    warnings: [],
    ...overrides,
    attempt: {
      paymentAttemptId: `attempt-${randomUUID()}`,
      checkoutId,
      amount: 1000,
      currency: 'TRY',
      method: 'CARD',
      state: 'PROVIDER_REDIRECT_READY',
      providerName: 'paytr',
      providerReference: `MERCHANT-OID-${randomUUID()}`,
      idempotencyKey: `idem-${randomUUID()}`,
      ...overrides.attempt,
    },
  };
};

async function runPostgresBranch(): Promise<string> {
  if (process.env.PERSISTENCE_MODE !== 'postgres' || !process.env.DATABASE_URL) {
    return 'postgres branch not run: PERSISTENCE_MODE=postgres and DATABASE_URL not set';
  }

  const repo = new PostgresPaymentRepository();
  const providerReference = `MERCHANT-OID-PG-${randomUUID()}`;
  const paymentId = randomUUID();
  const checkoutId = randomUUID();
  const paymentAttemptId = randomUUID();
  const payment = createPayment({
    paymentId,
    checkoutId,
    attempt: {
      paymentAttemptId,
      checkoutId,
      amount: 1000,
      currency: 'TRY',
      method: 'CARD',
      state: 'PROVIDER_REDIRECT_READY',
      providerName: 'paytr',
      providerReference,
      idempotencyKey: `idem-pg-${randomUUID()}`,
    },
  });

  await repo.save(payment);
  const found = await repo.getByProviderReference('paytr', providerReference);
  assert.equal(found?.paymentId, payment.paymentId);

  return 'postgres providerReference lookup asserted';
}

export const paymentProviderReferenceLookupSmoke: SmokeRunner = {
  name: 'payment-provider-reference-lookup',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    try {
      const repo = new InMemoryPaymentRepository();
      const payment = createPayment({
        paymentId: 'payment-1',
        checkoutId: 'checkout-1',
        attempt: {
          paymentAttemptId: 'attempt-1',
          checkoutId: 'checkout-1',
          amount: 1000,
          currency: 'TRY',
          method: 'CARD',
          state: 'PROVIDER_REDIRECT_READY',
          providerName: 'paytr',
          providerReference: 'MERCHANT-OID-1',
          idempotencyKey: 'idem-1',
        },
      });

      await repo.save(payment);
      const found = await repo.getByProviderReference('paytr', 'MERCHANT-OID-1');
      assert.equal(found?.paymentId, 'payment-1');

      const wrongProvider = await repo.getByProviderReference('iyzico', 'MERCHANT-OID-1');
      assert.equal(wrongProvider, undefined);

      const wrongReference = await repo.getByProviderReference('paytr', 'UNKNOWN');
      assert.equal(wrongReference, undefined);

      const providerEventPayment = createPayment({
        paymentId: 'payment-provider-event-1',
        checkoutId: 'checkout-provider-event-1',
        attempt: {
          paymentAttemptId: 'attempt-provider-event-1',
          checkoutId: 'checkout-provider-event-1',
          amount: 1000,
          currency: 'TRY',
          method: 'CARD',
          state: 'PROVIDER_REDIRECT_READY',
          providerName: 'paytr',
          providerEventId: 'PAYTR-EVENT-1',
          idempotencyKey: 'idem-provider-event-1',
        },
      });
      await repo.save(providerEventPayment);
      const eventFallback = await repo.getByProviderReference('paytr', 'PAYTR-EVENT-1');
      assert.equal(eventFallback?.paymentId, 'payment-provider-event-1');

      const foundByAttempt = await repo.getByPaymentAttemptId('attempt-1');
      assert.equal(foundByAttempt?.paymentId, 'payment-1');

      const idempotentPayment = createPayment({
        paymentId: 'payment-idempotent-1',
        checkoutId: 'checkout-idempotent-1',
        attempt: {
          paymentAttemptId: 'attempt-idempotent-1',
          checkoutId: 'checkout-idempotent-1',
          amount: 1000,
          currency: 'TRY',
          method: 'CARD',
          state: 'PROVIDER_REDIRECT_READY',
          providerName: 'paytr',
          providerReference: 'MERCHANT-OID-IDEMPOTENT-1',
          idempotencyKey: 'idem-idempotent-1',
        },
      });
      await repo.saveWithIdempotency('payment', 'idem-idempotent-1', idempotentPayment);
      const foundByIdempotency = await repo.getByIdempotencyKey('payment', 'idem-idempotent-1');
      assert.equal(foundByIdempotency?.paymentId, 'payment-idempotent-1');

      const postgresBranch = await runPostgresBranch();

      return {
        result: 'PASS',
        message: `InMemory providerReference, providerEventId fallback, attempt, and idempotency lookup passed; ${postgresBranch}.`,
      };
    } catch (error) {
      return { result: 'FAIL', message: (error as Error).message };
    } finally {
      await closePool().catch(() => undefined);
    }
  },
};
