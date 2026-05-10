import { strict as assert } from 'node:assert';
import {
  getPaymentProviderAdapter,
} from '../../../services/payment/src/provider-adapter';
import {
  resolvePaymentProviderConfig,
  sanitizePaymentProviderConfig,
} from '../../../services/payment/src/provider-config';
import { SmokeRunner, SmokeResult } from '../types';

const PAYMENT_ENV_KEYS = [
  'PAYMENT_PROVIDER_NAME',
  'PAYMENT_PROVIDER_MODE',
  'PAYTR_PROVIDER_MODE',
  'IYZICO_PROVIDER_MODE',
  'PAYTR_MERCHANT_ID',
  'PAYTR_MERCHANT_KEY',
  'PAYTR_MERCHANT_SALT',
  'IYZICO_API_KEY',
  'IYZICO_SECRET_KEY',
];

function assertNoSecretLeak(value: unknown, secrets: readonly string[]) {
  const serialized = JSON.stringify(value);

  for (const secret of secrets) {
    assert.equal(
      serialized.includes(secret),
      false,
      `Sanitized provider config leaked secret value: ${secret}`,
    );
  }
}

async function withPaymentEnv<T>(
  env: NodeJS.ProcessEnv,
  fn: () => Promise<T>,
): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const key of PAYMENT_ENV_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }

  Object.assign(process.env, env);

  try {
    return await fn();
  } finally {
    for (const key of PAYMENT_ENV_KEYS) {
      const oldValue = previous.get(key);
      if (oldValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = oldValue;
      }
    }
  }
}

function baseInitiateCommand(simulationScenario?: 'succeeded' | 'pending' | 'unknown_result') {
  return {
    amount: 12345,
    currency: 'TRY',
    checkoutId: 'checkout-config-smoke',
    idempotencyKey: `payment-provider-config-${simulationScenario ?? 'default'}`,
    correlationId: `correlation-${simulationScenario ?? 'default'}`,
    ...(simulationScenario ? { simulationScenario } : {}),
  };
}

export const paymentProviderConfigSmoke: SmokeRunner = {
  name: 'payment-provider-config',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    try {
      const defaults = resolvePaymentProviderConfig({});
      assert.equal(defaults.activeProviderName, 'internal_simulation');
      assert.equal(defaults.providerMode, 'simulation');
      assert.deepEqual(defaults.errors, []);
      assert.equal(defaults.isUsableForInitiation, true);
      assert.equal(defaults.isUsableForCallbackVerification, true);

      const paytrConfigured = resolvePaymentProviderConfig({
        PAYMENT_PROVIDER_NAME: 'paytr',
        PAYMENT_PROVIDER_MODE: 'sandbox',
        PAYTR_MERCHANT_ID: 'merchant-test',
        PAYTR_MERCHANT_KEY: 'secret-key-test',
        PAYTR_MERCHANT_SALT: 'secret-salt-test',
      });
      assert.equal(paytrConfigured.activeProviderName, 'paytr');
      assert.equal(paytrConfigured.providerMode, 'sandbox');
      assert.equal(paytrConfigured.paytr.merchantIdConfigured, true);
      assert.equal(paytrConfigured.paytr.merchantKeyConfigured, true);
      assert.equal(paytrConfigured.paytr.merchantSaltConfigured, true);
      assert.equal(paytrConfigured.isUsableForInitiation, true);
      assert.equal(paytrConfigured.isUsableForCallbackVerification, true);
      assertNoSecretLeak(
        sanitizePaymentProviderConfig(paytrConfigured),
        ['secret-key-test', 'secret-salt-test'],
      );

      const paytrMissingKey = resolvePaymentProviderConfig({
        PAYMENT_PROVIDER_NAME: 'paytr',
        PAYMENT_PROVIDER_MODE: 'sandbox',
        PAYTR_MERCHANT_ID: 'merchant-test',
        PAYTR_MERCHANT_SALT: 'secret-salt-test',
      });
      assert.equal(paytrMissingKey.providerMode, 'not_configured');
      assert.equal(paytrMissingKey.errors.includes('PAYTR_MERCHANT_KEY_REQUIRED'), true);
      assert.equal(paytrMissingKey.isUsableForInitiation, false);
      assert.equal(paytrMissingKey.isUsableForCallbackVerification, false);

      const unsupportedProvider = resolvePaymentProviderConfig({
        PAYMENT_PROVIDER_NAME: 'unknown',
        PAYMENT_PROVIDER_MODE: 'sandbox',
      });
      assert.equal(unsupportedProvider.errors.includes('UNSUPPORTED_PAYMENT_PROVIDER_NAME'), true);
      assert.equal(unsupportedProvider.providerMode, 'not_configured');
      assert.equal(unsupportedProvider.isUsableForInitiation, false);
      assert.equal(unsupportedProvider.isUsableForCallbackVerification, false);

      const unsupportedMode = resolvePaymentProviderConfig({
        PAYMENT_PROVIDER_MODE: 'live_magic',
      });
      assert.equal(unsupportedMode.errors.includes('UNSUPPORTED_PAYMENT_PROVIDER_MODE'), true);
      assert.equal(unsupportedMode.providerMode, 'not_configured');
      assert.equal(unsupportedMode.isUsableForInitiation, false);

      const iyzicoMissingConfig = resolvePaymentProviderConfig({
        PAYMENT_PROVIDER_NAME: 'iyzico',
        PAYMENT_PROVIDER_MODE: 'sandbox',
      });
      assert.equal(iyzicoMissingConfig.activeProviderName, 'iyzico');
      assert.equal(iyzicoMissingConfig.errors.includes('IYZICO_API_KEY_REQUIRED'), true);
      assert.equal(iyzicoMissingConfig.errors.includes('IYZICO_SECRET_KEY_REQUIRED'), true);
      assert.equal(iyzicoMissingConfig.isUsableForInitiation, false);
      assert.equal(iyzicoMissingConfig.isUsableForCallbackVerification, false);

      const iyzicoConfigured = resolvePaymentProviderConfig({
        PAYMENT_PROVIDER_NAME: 'iyzico',
        PAYMENT_PROVIDER_MODE: 'sandbox',
        IYZICO_API_KEY: 'iyzico-api-key-test',
        IYZICO_SECRET_KEY: 'iyzico-secret-test',
      });
      assertNoSecretLeak(
        sanitizePaymentProviderConfig(iyzicoConfigured),
        ['iyzico-api-key-test', 'iyzico-secret-test'],
      );

      await withPaymentEnv({
        PAYMENT_PROVIDER_NAME: 'internal_simulation',
        PAYMENT_PROVIDER_MODE: 'simulation',
      }, async () => {
        const adapter = getPaymentProviderAdapter();
        const succeeded = await adapter.initiatePayment(baseInitiateCommand());
        assert.equal(succeeded.providerDomain, 'payment');
        assert.equal(succeeded.providerName, 'internal_simulation');
        assert.equal(succeeded.providerMode, 'simulation');
        assert.equal(succeeded.operationStatus, 'succeeded');

        const pending = await adapter.initiatePayment(baseInitiateCommand('pending'));
        assert.equal(pending.operationStatus, 'pending');

        const unknown = await adapter.initiatePayment(baseInitiateCommand('unknown_result'));
        assert.equal(unknown.operationStatus, 'unknown_result');
      });

      await withPaymentEnv({
        PAYMENT_PROVIDER_NAME: 'paytr',
        PAYMENT_PROVIDER_MODE: 'sandbox',
        PAYTR_MERCHANT_ID: 'merchant-test',
        PAYTR_MERCHANT_KEY: 'secret-key-test',
        PAYTR_MERCHANT_SALT: 'secret-salt-test',
      }, async () => {
        const adapter = getPaymentProviderAdapter();
        const result = await adapter.initiatePayment(baseInitiateCommand());
        assert.equal(result.providerDomain, 'payment');
        assert.equal(result.providerName, 'paytr');
        assert.equal(result.providerMode, 'sandbox');
        assert.equal(result.operation, 'initiatePayment');
        assert.equal(result.operationStatus, 'rejected');
        assert.equal(result.error?.code, 'PAYMENT_PROVIDER_NOT_IMPLEMENTED');
        assert.equal(result.boundary.providerTruth, false);
        assert.equal(result.boundary.businessTruthMutated, false);
        assert.equal(result.boundary.ownerStateMutated, false);
        assert.equal(result.boundary.eventTruthMutated, false);
        assert.equal(result.boundary.outboxDeliveryGuaranteed, false);
      });

      await withPaymentEnv({
        PAYMENT_PROVIDER_NAME: 'paytr',
        PAYMENT_PROVIDER_MODE: 'sandbox',
      }, async () => {
        const adapter = getPaymentProviderAdapter();
        const result = await adapter.initiatePayment(baseInitiateCommand());
        assert.equal(result.providerName, 'paytr');
        assert.equal(result.providerMode, 'not_configured');
        assert.equal(result.operationStatus, 'rejected');
        assert.equal(result.error?.code, 'PAYMENT_PROVIDER_NOT_CONFIGURED');
      });

      return {
        result: 'PASS',
        message: 'Payment provider config resolution, secret redaction, and adapter parking behavior are valid.',
      };
    } catch (error) {
      return { result: 'FAIL', message: (error as Error).message };
    }
  },
};
