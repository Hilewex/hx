import { ProviderMode } from '@hx/contracts';

export type PaymentProviderName = 'internal_simulation' | 'paytr' | 'iyzico';

export interface PaytrPaymentProviderConfig {
  readonly providerName: 'paytr';
  readonly providerMode: ProviderMode;
  readonly merchantIdConfigured: boolean;
  readonly merchantKeyConfigured: boolean;
  readonly merchantSaltConfigured: boolean;
  readonly merchantId?: string;
  readonly merchantKey?: string;
  readonly merchantSalt?: string;
  readonly callbackPath: '/provider-callback/payment/paytr';
}

export interface IyzicoPaymentProviderConfig {
  readonly providerName: 'iyzico';
  readonly providerMode: ProviderMode;
  readonly apiKeyConfigured: boolean;
  readonly secretKeyConfigured: boolean;
  readonly apiKey?: string;
  readonly secretKey?: string;
  readonly callbackPath: '/provider-callback/payment/iyzico';
}

export interface PaymentProviderConfigResolution {
  readonly activeProviderName: PaymentProviderName;
  readonly requestedProviderName?: string;
  readonly providerMode: ProviderMode;
  readonly paytr: PaytrPaymentProviderConfig;
  readonly iyzico: IyzicoPaymentProviderConfig;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly isUsableForInitiation: boolean;
  readonly isUsableForCallbackVerification: boolean;
}

const PROVIDER_NAMES = new Set<PaymentProviderName>([
  'internal_simulation',
  'paytr',
  'iyzico',
]);

const PROVIDER_MODES = new Set<ProviderMode>([
  'simulation',
  'sandbox',
  'production',
  'parked',
  'not_configured',
]);

function envValue(env: NodeJS.ProcessEnv, key: string): string | undefined {
  const value = env[key]?.trim();

  return value ? value : undefined;
}

function resolveMode(
  rawMode: string | undefined,
  defaultMode: ProviderMode,
  errorCode: string,
  errors: string[],
): ProviderMode {
  if (!rawMode) {
    return defaultMode;
  }

  if (PROVIDER_MODES.has(rawMode as ProviderMode)) {
    return rawMode as ProviderMode;
  }

  errors.push(errorCode);
  return 'not_configured';
}

export function resolvePaymentProviderConfig(
  env: NodeJS.ProcessEnv = process.env,
): PaymentProviderConfigResolution {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requestedProviderName = envValue(env, 'PAYMENT_PROVIDER_NAME') ?? 'internal_simulation';
  const providerNameSupported = PROVIDER_NAMES.has(requestedProviderName as PaymentProviderName);
  const activeProviderName: PaymentProviderName = providerNameSupported
    ? requestedProviderName as PaymentProviderName
    : 'internal_simulation';

  if (!providerNameSupported) {
    errors.push('UNSUPPORTED_PAYMENT_PROVIDER_NAME');
  }

  const baseMode = resolveMode(
    envValue(env, 'PAYMENT_PROVIDER_MODE'),
    'simulation',
    'UNSUPPORTED_PAYMENT_PROVIDER_MODE',
    errors,
  );
  const paytrMode = resolveMode(
    envValue(env, 'PAYTR_PROVIDER_MODE'),
    baseMode,
    'UNSUPPORTED_PAYTR_PROVIDER_MODE',
    errors,
  );
  const iyzicoMode = resolveMode(
    envValue(env, 'IYZICO_PROVIDER_MODE'),
    baseMode,
    'UNSUPPORTED_IYZICO_PROVIDER_MODE',
    errors,
  );
  const merchantId = envValue(env, 'PAYTR_MERCHANT_ID');
  const merchantKey = envValue(env, 'PAYTR_MERCHANT_KEY');
  const merchantSalt = envValue(env, 'PAYTR_MERCHANT_SALT');
  const apiKey = envValue(env, 'IYZICO_API_KEY');
  const secretKey = envValue(env, 'IYZICO_SECRET_KEY');

  const paytr: PaytrPaymentProviderConfig = {
    providerName: 'paytr',
    providerMode: paytrMode,
    merchantIdConfigured: Boolean(merchantId),
    merchantKeyConfigured: Boolean(merchantKey),
    merchantSaltConfigured: Boolean(merchantSalt),
    ...(merchantId ? { merchantId } : {}),
    ...(merchantKey ? { merchantKey } : {}),
    ...(merchantSalt ? { merchantSalt } : {}),
    callbackPath: '/provider-callback/payment/paytr',
  };
  const iyzico: IyzicoPaymentProviderConfig = {
    providerName: 'iyzico',
    providerMode: iyzicoMode,
    apiKeyConfigured: Boolean(apiKey),
    secretKeyConfigured: Boolean(secretKey),
    ...(apiKey ? { apiKey } : {}),
    ...(secretKey ? { secretKey } : {}),
    callbackPath: '/provider-callback/payment/iyzico',
  };

  let providerMode: ProviderMode = activeProviderName === 'paytr'
    ? paytrMode
    : activeProviderName === 'iyzico'
      ? iyzicoMode
      : 'simulation';
  let isUsableForInitiation = activeProviderName === 'internal_simulation';
  let isUsableForCallbackVerification = activeProviderName === 'internal_simulation';

  if (!providerNameSupported) {
    providerMode = 'not_configured';
    isUsableForInitiation = false;
    isUsableForCallbackVerification = false;
  } else if (activeProviderName === 'paytr') {
    if (!merchantId) {
      errors.push('PAYTR_MERCHANT_ID_REQUIRED');
    }
    if (!merchantKey) {
      errors.push('PAYTR_MERCHANT_KEY_REQUIRED');
    }
    if (!merchantSalt) {
      errors.push('PAYTR_MERCHANT_SALT_REQUIRED');
    }

    const configured = Boolean(merchantId && merchantKey && merchantSalt);
    const runnableMode = paytrMode === 'sandbox' || paytrMode === 'production';
    providerMode = configured && runnableMode ? paytrMode : 'not_configured';
    isUsableForInitiation = configured && runnableMode;
    isUsableForCallbackVerification = configured && runnableMode;
  } else if (activeProviderName === 'iyzico') {
    if (!apiKey) {
      errors.push('IYZICO_API_KEY_REQUIRED');
    }
    if (!secretKey) {
      errors.push('IYZICO_SECRET_KEY_REQUIRED');
    }

    providerMode = apiKey && secretKey && (iyzicoMode === 'sandbox' || iyzicoMode === 'production')
      ? iyzicoMode
      : 'not_configured';
    isUsableForInitiation = false;
    isUsableForCallbackVerification = false;
    warnings.push('IYZICO_PROVIDER_IMPLEMENTATION_NOT_AVAILABLE');
  }

  if (baseMode === 'not_configured' && envValue(env, 'PAYMENT_PROVIDER_MODE')) {
    providerMode = 'not_configured';
    isUsableForInitiation = false;
    isUsableForCallbackVerification = false;
  }

  return {
    activeProviderName,
    ...(requestedProviderName !== activeProviderName ? { requestedProviderName } : {}),
    providerMode,
    paytr,
    iyzico,
    warnings,
    errors,
    isUsableForInitiation,
    isUsableForCallbackVerification,
  };
}

export function sanitizePaymentProviderConfig(
  config: PaymentProviderConfigResolution,
): unknown {
  return {
    activeProviderName: config.activeProviderName,
    ...(config.requestedProviderName ? { requestedProviderName: config.requestedProviderName } : {}),
    providerMode: config.providerMode,
    paytr: {
      providerName: config.paytr.providerName,
      providerMode: config.paytr.providerMode,
      merchantIdConfigured: config.paytr.merchantIdConfigured,
      merchantKeyConfigured: config.paytr.merchantKeyConfigured,
      merchantSaltConfigured: config.paytr.merchantSaltConfigured,
      callbackPath: config.paytr.callbackPath,
    },
    iyzico: {
      providerName: config.iyzico.providerName,
      providerMode: config.iyzico.providerMode,
      apiKeyConfigured: config.iyzico.apiKeyConfigured,
      secretKeyConfigured: config.iyzico.secretKeyConfigured,
      callbackPath: config.iyzico.callbackPath,
    },
    warnings: config.warnings,
    errors: config.errors,
    isUsableForInitiation: config.isUsableForInitiation,
    isUsableForCallbackVerification: config.isUsableForCallbackVerification,
  };
}
