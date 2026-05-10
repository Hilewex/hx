import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { deepStrictEqual, ok, strictEqual } from 'node:assert';
import {
  PaytrStatusInquiryErrorResponse,
  PaytrStatusInquirySuccessResponse,
} from '../../../packages/contracts/src/payment';
import { createProviderBoundaryFlags } from '../../../packages/contracts/src/provider';
import { getPaymentProviderAdapter } from '../../../services/payment/src/provider-adapter';
import { SmokeRunner, SmokeResult } from '../types';

const ENV_KEYS = [
  'PAYMENT_PROVIDER_NAME',
  'PAYMENT_PROVIDER_MODE',
  'PAYTR_PROVIDER_MODE',
  'PAYTR_MERCHANT_ID',
  'PAYTR_MERCHANT_KEY',
  'PAYTR_MERCHANT_SALT',
] as const;

function withProviderEnv<T>(
  env: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>,
  fn: () => Promise<T>,
): Promise<T> {
  const previous = new Map<(typeof ENV_KEYS)[number], string | undefined>();
  for (const key of ENV_KEYS) {
    previous.set(key, process.env[key]);
    const nextValue = env[key];
    if (nextValue === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = nextValue;
    }
  }

  return fn().finally(() => {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });
}

function assertNoLiveRequestSourceUsage(): void {
  const source = readFileSync(
    resolve(process.cwd(), 'services/payment/src/provider-adapter.ts'),
    'utf8',
  );

  ok(!/\bfetch\s*\(/.test(source), 'provider adapter must not call fetch');
  ok(!/\baxios\b/.test(source), 'provider adapter must not use axios');
  ok(!/\brequest\s*\(/.test(source), 'provider adapter must not call request');
  ok(!/node:http/.test(source), 'provider adapter must not import node:http');
  ok(!/node:https/.test(source), 'provider adapter must not import node:https');
  ok(!/require\(['"]http['"]\)/.test(source), 'provider adapter must not require http');
  ok(!/require\(['"]https['"]\)/.test(source), 'provider adapter must not require https');
}

const runTest = async (): Promise<{ result: SmokeResult; message: string }> => {
  try {
    await withProviderEnv(
      {
        PAYMENT_PROVIDER_NAME: 'internal_simulation',
        PAYMENT_PROVIDER_MODE: 'simulation',
        PAYTR_PROVIDER_MODE: undefined,
        PAYTR_MERCHANT_ID: undefined,
        PAYTR_MERCHANT_KEY: undefined,
        PAYTR_MERCHANT_SALT: undefined,
      },
      async () => {
        const adapter = getPaymentProviderAdapter();
        const successResponse: PaytrStatusInquirySuccessResponse = {
          status: 'success',
          payment_amount: '123.45',
          payment_total: '123.45',
          returns: {},
          currency: 'TRY',
        };

        const success = await adapter.statusInquiry({
          merchantOid: 'oid-success',
          expectedAmountMinor: 12345,
          expectedCurrency: 'TRY',
          idempotencyKey: 'idem-success',
          correlationId: 'corr-success',
          simulationResponse: successResponse,
        });

        strictEqual(success.providerDomain, 'payment');
        strictEqual(success.providerName, 'internal_simulation');
        strictEqual(success.providerMode, 'simulation');
        strictEqual(success.operation, 'statusInquiry');
        strictEqual(success.operationStatus, 'succeeded');
        strictEqual(success.idempotencyKey, 'idem-success');
        strictEqual(success.correlationId, 'corr-success');
        strictEqual(success.normalized?.normalizedStatus, 'succeeded_candidate');
        strictEqual(success.normalized?.merchantOid, 'oid-success');
        deepStrictEqual(success.boundary, createProviderBoundaryFlags());
        deepStrictEqual(success.normalized?.boundary, createProviderBoundaryFlags());

        const amountMismatchResponse: PaytrStatusInquirySuccessResponse = {
          status: 'success',
          payment_amount: '99.00',
          payment_total: '99.00',
          returns: {},
          currency: 'TRY',
        };

        const amountMismatch = await adapter.statusInquiry({
          merchantOid: 'oid-amount-mismatch',
          expectedAmountMinor: 10000,
          expectedCurrency: 'TRY',
          idempotencyKey: 'idem-amount-mismatch',
          correlationId: 'corr-amount-mismatch',
          simulationResponse: amountMismatchResponse,
        });

        strictEqual(amountMismatch.operationStatus, 'rejected');
        strictEqual(amountMismatch.normalized?.normalizedStatus, 'rejected_amount_mismatch');
        strictEqual(amountMismatch.normalized?.shouldReject, true);

        const inconclusiveResponse: PaytrStatusInquiryErrorResponse = {
          status: 'error',
          err_no: '003',
          err_msg: 'merchant_oid ile basarili odeme bulunamadi',
        };

        const inconclusive = await adapter.statusInquiry({
          merchantOid: 'oid-inconclusive',
          expectedAmountMinor: 10000,
          expectedCurrency: 'TRY',
          idempotencyKey: 'idem-inconclusive',
          correlationId: 'corr-inconclusive',
          simulationResponse: inconclusiveResponse,
        });

        ok(
          inconclusive.operationStatus === 'unknown_result' ||
          inconclusive.operationStatus === 'pending',
          'inconclusive status inquiry should be unknown_result or pending',
        );
        strictEqual(inconclusive.normalized?.normalizedStatus, 'status_query_inconclusive');

        const missingSimulationResponse = await adapter.statusInquiry({
          merchantOid: 'oid-missing-simulation-response',
          expectedAmountMinor: 10000,
          expectedCurrency: 'TRY',
          idempotencyKey: 'idem-missing-simulation-response',
          correlationId: 'corr-missing-simulation-response',
        });

        strictEqual(missingSimulationResponse.operationStatus, 'unknown_result');
        strictEqual(missingSimulationResponse.error?.retryable, false);
        strictEqual(missingSimulationResponse.normalized, undefined);
      },
    );

    await withProviderEnv(
      {
        PAYMENT_PROVIDER_NAME: 'paytr',
        PAYMENT_PROVIDER_MODE: 'sandbox',
        PAYTR_PROVIDER_MODE: 'sandbox',
        PAYTR_MERCHANT_ID: undefined,
        PAYTR_MERCHANT_KEY: undefined,
        PAYTR_MERCHANT_SALT: undefined,
      },
      async () => {
        const adapter = getPaymentProviderAdapter();
        const notConfigured = await adapter.statusInquiry({
          merchantOid: 'oid-not-configured',
          expectedAmountMinor: 12345,
          expectedCurrency: 'TRY',
          idempotencyKey: 'idem-not-configured',
          correlationId: 'corr-not-configured',
        });

        strictEqual(notConfigured.operationStatus, 'rejected');
        strictEqual(notConfigured.error?.code, 'PAYMENT_PROVIDER_NOT_CONFIGURED');
        strictEqual(notConfigured.error?.retryable, false);
        strictEqual(notConfigured.normalized, undefined);
        deepStrictEqual(notConfigured.boundary, createProviderBoundaryFlags());
      },
    );

    assertNoLiveRequestSourceUsage();

    return {
      result: 'PASS',
      message: 'PayTR status inquiry adapter boundary assertions passed without live request usage.',
    };
  } catch (error) {
    return { result: 'FAIL', message: (error as Error).stack || (error as Error).message };
  }
};

export const paytrStatusInquiryAdapterBoundarySmoke: SmokeRunner = {
  name: 'paytr-status-inquiry-adapter-boundary',
  run: async () => runTest(),
};
