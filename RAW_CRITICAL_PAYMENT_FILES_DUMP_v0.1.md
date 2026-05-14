# DOSYA: apps/bff/src/server/provider-callback.ts

## Satır 1-80
```typescript
import {
  createProviderBoundaryFlags,
  mapPaytrIframeCallbackToPaymentCandidate,
  PaytrIframeCallbackPayload,
  ProviderCallbackRecord,
  ProviderCallbackSignatureAlgorithm,
  ProviderCallbackVerificationStatus,
  ProviderCallbackProcessingStatus,
  ProviderCallbackReplayStatus,
  ProviderDomain,
  ProviderMode,
} from '@hx/contracts';
import { resolvePaymentProviderConfig } from '@hx/payment';
import {
  findExistingProviderCallbackByIdentity,
  recordProviderCallbackEvent,
} from '@hx/provider-callback';
import { createHmac, timingSafeEqual } from 'node:crypto';
import * as response from './response';

const providerDomains: ProviderDomain[] = [
  'payment',
  'shipment',
  'notification',
  'payout',
];

const providerModes: ProviderMode[] = [
  'simulation',
  'sandbox',
  'parked',
  'not_configured',
  'production',
];

const CALLBACK_FRESHNESS_WINDOW_MS = 5 * 60 * 1000;
const CALLBACK_FUTURE_TOLERANCE_MS = 60 * 1000;
const CALLBACK_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const CALLBACK_RATE_LIMIT_MAX_REQUESTS = 20;
const CALLBACK_RATE_LIMIT_BLOCK_MS = 60 * 1000;

type HeaderValue = string | string[] | undefined;

type CallbackFreshnessStatus =
  | 'not_provided'
  | 'valid'
  | 'invalid'
  | 'too_old'
  | 'too_far_in_future';

interface SignatureGuardResult {
  verificationStatus: ProviderCallbackVerificationStatus;
  signatureVerified: boolean;
  processingStatus: ProviderCallbackProcessingStatus;
}

interface CallbackIdentity {
  providerEventId?: string;
  idempotencyKey?: string;
}

interface FreshnessGuardResult {
  freshnessStatus: CallbackFreshnessStatus;
  replayDetected: boolean;
  processingStatus?: ProviderCallbackProcessingStatus;
  replayStatus?: ProviderCallbackReplayStatus;
}

interface CallbackRateLimitEntry {
  windowStartedAt: number;
  requestCount: number;
  blockedUntil?: number;
}

export type ProviderCallbackAckPolicy =
  | { kind: 'json'; status: number }
  | { kind: 'plain_text'; status: number; body: string; contentType: 'text/plain' };

export type ProviderCallbackIngestionResponse = response.BffResponse & {
  ackPolicy?: ProviderCallbackAckPolicy;
```

## Satır 81-160
```typescript
};

export interface ProviderCallbackIngestionInput {
  providerDomain: string;
  providerName: string;
  body: unknown;
  headers: Record<string, HeaderValue>;
  requestMetadata?: {
    requestId?: string;
    correlationId?: string;
    causationId?: string;
  };
}

const callbackRateLimitEntries = new Map<string, CallbackRateLimitEntry>();

function isProviderDomain(value: string): value is ProviderDomain {
  return providerDomains.includes(value as ProviderDomain);
}

function firstString(value: HeaderValue): string | undefined {
  if (Array.isArray(value)) {
    return value.find(item => item.trim().length > 0);
  }
  return value && value.trim().length > 0 ? value : undefined;
}

function getHeader(headers: Record<string, HeaderValue>, name: string): string | undefined {
  return firstString(headers[name.toLowerCase()]);
}

function resolveCallbackClientKey(headers: Record<string, HeaderValue>): string {
  const forwardedFor = getHeader(headers, 'x-forwarded-for');
  const firstForwardedFor = forwardedFor
    ?.split(',')[0]
    ?.trim();
  if (firstForwardedFor) {
    return firstForwardedFor;
  }

  return getHeader(headers, 'x-real-ip') || 'unknown';
}

function evaluateCallbackRateLimit(input: {
  providerDomain: ProviderDomain;
  providerName: string;
  headers: Record<string, HeaderValue>;
  nowMs: number;
}): { rateLimited: boolean } {
  const clientKey = resolveCallbackClientKey(input.headers);
  const key = [
    input.providerDomain,
    input.providerName,
    clientKey,
  ].join(':');
  const existing = callbackRateLimitEntries.get(key);

  if (existing?.blockedUntil && input.nowMs < existing.blockedUntil) {
    return { rateLimited: true };
  }

  if (
    !existing ||
    input.nowMs - existing.windowStartedAt >= CALLBACK_RATE_LIMIT_WINDOW_MS
  ) {
    callbackRateLimitEntries.set(key, {
      windowStartedAt: input.nowMs,
      requestCount: 1,
    });
    return { rateLimited: false };
  }

  existing.requestCount += 1;
  if (existing.requestCount > CALLBACK_RATE_LIMIT_MAX_REQUESTS) {
    existing.blockedUntil = input.nowMs + CALLBACK_RATE_LIMIT_BLOCK_MS;
    return { rateLimited: true };
  }

  return { rateLimited: false };
}
```

## Satır 161-240
```typescript

function getBodyString(body: unknown, keys: string[]): string | undefined {
  if (!body || typeof body !== 'object') {
    return undefined;
  }

  const record = body as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
}

function resolveProviderMode(body: unknown, headers: Record<string, HeaderValue>): ProviderMode {
  const candidate =
    getBodyString(body, ['providerMode', 'mode']) ||
    getHeader(headers, 'x-provider-mode');

  if (candidate && providerModes.includes(candidate as ProviderMode)) {
    return candidate as ProviderMode;
  }

  return 'sandbox';
}

function isProviderCallbackSignatureAlgorithm(
  value: string
): value is ProviderCallbackSignatureAlgorithm {
  return [
    'none',
    'hmac_sha256',
    'hmac_sha512',
    'rsa_sha256',
    'provider_managed',
    'unsupported',
  ].includes(value);
}

function resolveSignatureAlgorithm(
  headers: Record<string, HeaderValue>
): ProviderCallbackSignatureAlgorithm | undefined {
  const candidate = getHeader(headers, 'x-provider-signature-algorithm');
  if (!candidate) {
    return undefined;
  }

  const normalized = candidate.trim().toLowerCase();
  return isProviderCallbackSignatureAlgorithm(normalized)
    ? normalized
    : 'unsupported';
}

function safeEqualHex(left: string, right: string): boolean {
  try {
    const leftBuffer = Buffer.from(left, 'hex');
    const rightBuffer = Buffer.from(right, 'hex');

    return (
      leftBuffer.length > 0 &&
      leftBuffer.length === rightBuffer.length &&
      timingSafeEqual(leftBuffer, rightBuffer)
    );
  } catch {
    return false;
  }
}

function verifyProviderCallbackSignature(input: {
  providerName: string;
  body: unknown;
  headers: Record<string, HeaderValue>;
}): SignatureGuardResult {
  const signature = getHeader(input.headers, 'x-provider-signature');
  const algorithm = resolveSignatureAlgorithm(input.headers);

  if (!signature || algorithm !== 'hmac_sha256') {
```

## Satır 241-320
```typescript
    return {
      verificationStatus: 'unsupported',
      signatureVerified: false,
      processingStatus: 'received',
    };
  }

  if (input.providerName !== 'signature-test-provider') {
    return {
      verificationStatus: 'unsupported',
      signatureVerified: false,
      processingStatus: 'received',
    };
  }

  const expectedSignature = createHmac('sha256', 'test-callback-secret')
    .update(JSON.stringify(input.body))
    .digest('hex');

  if (safeEqualHex(signature, expectedSignature)) {
    return {
      verificationStatus: 'verified',
      signatureVerified: true,
      processingStatus: 'received',
    };
  }

  return {
    verificationStatus: 'failed',
    signatureVerified: false,
    processingStatus: 'rejected',
  };
}

function parseProviderTimestamp(value: string): Date | undefined {
  const trimmed = value.trim();
  if (/^-?\d+$/.test(trimmed)) {
    const numeric = Number(trimmed);
    if (!Number.isSafeInteger(numeric)) {
      return undefined;
    }

    const epochMs = Math.abs(numeric) < 1_000_000_000_000
      ? numeric * 1000
      : numeric;
    const parsed = new Date(epochMs);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  const parsedMs = Date.parse(trimmed);
  if (Number.isNaN(parsedMs)) {
    return undefined;
  }

  return new Date(parsedMs);
}

function evaluateCallbackFreshness(
  headers: Record<string, HeaderValue>,
  receivedAt: Date
): FreshnessGuardResult {
  const timestamp = getHeader(headers, 'x-provider-timestamp');
  getHeader(headers, 'x-provider-nonce');

  if (!timestamp) {
    return {
      freshnessStatus: 'not_provided',
      replayDetected: false,
    };
  }

  const parsedTimestamp = parseProviderTimestamp(timestamp);
  if (!parsedTimestamp) {
    return {
      freshnessStatus: 'invalid',
      processingStatus: 'rejected',
      replayStatus: 'replay_detected',
      replayDetected: true,
    };
  }
```

## Satır 321-400
```typescript

  const ageMs = receivedAt.getTime() - parsedTimestamp.getTime();
  if (ageMs > CALLBACK_FRESHNESS_WINDOW_MS) {
    return {
      freshnessStatus: 'too_old',
      processingStatus: 'rejected',
      replayStatus: 'replay_detected',
      replayDetected: true,
    };
  }

  if (ageMs < -CALLBACK_FUTURE_TOLERANCE_MS) {
    return {
      freshnessStatus: 'too_far_in_future',
      processingStatus: 'rejected',
      replayStatus: 'replay_detected',
      replayDetected: true,
    };
  }

  return {
    freshnessStatus: 'valid',
    replayDetected: false,
  };
}

async function findExistingCallbackByIdentity(input: {
  providerDomain: ProviderDomain;
  providerName: string;
  identity: CallbackIdentity;
}) {
  return findExistingProviderCallbackByIdentity(input);
}

function resolveFirstSeenReplayStatus(identity: CallbackIdentity): ProviderCallbackReplayStatus {
  return identity.providerEventId || identity.idempotencyKey ? 'first_seen' : 'unknown';
}

function isPaytrPaymentCallback(providerDomain: ProviderDomain, providerName: string): boolean {
  return providerDomain === 'payment' && providerName.toLowerCase() === 'paytr';
}

function resolveProviderCallbackAckPolicy(input: {
  providerDomain: ProviderDomain;
  providerName: string;
  status: number;
}): ProviderCallbackAckPolicy | undefined {
  if (
    input.status >= 200 &&
    input.status < 300 &&
    isPaytrPaymentCallback(input.providerDomain, input.providerName)
  ) {
    return {
      kind: 'plain_text',
      status: 200,
      body: 'OK',
      contentType: 'text/plain',
    };
  }

  return undefined;
}

function withProviderCallbackAckPolicy(
  providerDomain: ProviderDomain,
  providerName: string,
  result: response.BffResponse
): ProviderCallbackIngestionResponse {
  const ackPolicy = resolveProviderCallbackAckPolicy({
    providerDomain,
    providerName,
    status: result.status,
  });

  return ackPolicy ? { ...result, ackPolicy } : result;
}

function buildNormalizedPayloadForProviderCallback(input: {
  providerDomain: ProviderDomain;
  providerName: string;
```

## Satır 401-480
```typescript
  body: unknown;
  receivedAt: Date;
}): unknown | undefined {
  if (!isPaytrPaymentCallback(input.providerDomain, input.providerName)) {
    return undefined;
  }

  const config = resolvePaymentProviderConfig(process.env);
  if (
    config.activeProviderName !== 'paytr' ||
    !config.isUsableForCallbackVerification ||
    !config.paytr.merchantKey ||
    !config.paytr.merchantSalt
  ) {
    return {
      type: 'paytr_callback_mapping_not_configured',
      providerName: 'paytr',
      reason: 'PAYTR_CONFIG_NOT_USABLE_FOR_CALLBACK_VERIFICATION',
      boundary: createProviderBoundaryFlags(),
    };
  }

  return mapPaytrIframeCallbackToPaymentCandidate({
    payload: input.body as PaytrIframeCallbackPayload,
    callbackRecordId: 'pending_insert',
    providerName: 'paytr',
    providerMode: config.providerMode,
    merchantKey: config.paytr.merchantKey,
    merchantSalt: config.paytr.merchantSalt,
    occurredAt: input.receivedAt,
  });
}

export async function handleProviderCallbackIngestion(
  input: ProviderCallbackIngestionInput
): Promise<ProviderCallbackIngestionResponse> {
  const providerDomain = input.providerDomain.trim();
  const providerName = decodeURIComponent(input.providerName).trim();

  if (!isProviderDomain(providerDomain)) {
    return response.badRequest(
      'INVALID_PROVIDER_DOMAIN',
      'providerDomain must be one of payment, shipment, notification, payout'
    );
  }

  if (!providerName) {
    return response.badRequest('INVALID_PROVIDER_NAME', 'providerName is required');
  }

  const rateLimit = evaluateCallbackRateLimit({
    providerDomain,
    providerName,
    headers: input.headers,
    nowMs: Date.now(),
  });
  if (rateLimit.rateLimited) {
    return response.domainError(
      429,
      'PROVIDER_CALLBACK_RATE_LIMITED',
      'Provider callback rate limit exceeded',
      'transport'
    );
  }

  const callbackType =
    getBodyString(input.body, ['callbackType', 'eventType', 'type', 'event']) ||
    getHeader(input.headers, 'x-provider-callback-type') ||
    'unknown';
  const identity: CallbackIdentity = {
    providerEventId:
      getBodyString(input.body, ['providerEventId', 'eventId', 'id']) ||
      (isPaytrPaymentCallback(providerDomain, providerName)
        ? getBodyString(input.body, ['merchant_oid'])
        : undefined) ||
      getHeader(input.headers, 'x-provider-event-id'),
    idempotencyKey:
      getBodyString(input.body, ['idempotencyKey']) ||
      getHeader(input.headers, 'idempotency-key') ||
      getHeader(input.headers, 'x-idempotency-key'),
```

## Satır 481-560
```typescript
  };
  const verification = verifyProviderCallbackSignature({
    providerName,
    body: input.body,
    headers: input.headers,
  });
  const {
    existingByProviderEventId,
    existingByIdempotencyKey,
  } = await findExistingCallbackByIdentity({
    providerDomain,
    providerName,
    identity,
  });

  if (
    existingByProviderEventId &&
    existingByIdempotencyKey &&
    existingByProviderEventId.id !== existingByIdempotencyKey.id
  ) {
    return withProviderCallbackAckPolicy(providerDomain, providerName, {
      status: 202,
      body: {
        data: {
          id: existingByProviderEventId.id,
          processingStatus: 'rejected',
          replayStatus: 'replay_detected',
          replayDetected: true,
          errorCode: 'CALLBACK_IDENTITY_CONFLICT',
        },
      },
    });
  }

  const existing = existingByProviderEventId || existingByIdempotencyKey;
  if (existing) {
    return withProviderCallbackAckPolicy(providerDomain, providerName, {
      status: 202,
      body: {
        data: {
          id: existing.id,
          providerDomain: existing.providerDomain,
          providerName: existing.providerName,
          callbackType: existing.callbackType,
          processingStatus: 'duplicate',
          originalProcessingStatus: existing.processingStatus,
          verificationStatus: existing.verificationStatus,
          replayStatus: 'duplicate_event',
          replayDetected: true,
        },
      },
    });
  }

  const receivedAt = new Date();
  const freshness = evaluateCallbackFreshness(input.headers, receivedAt);
  const normalizedPayload = buildNormalizedPayloadForProviderCallback({
    providerDomain,
    providerName,
    body: input.body,
    receivedAt,
  });

  const record: Omit<ProviderCallbackRecord, 'id'> = {
    providerDomain,
    providerName,
    providerMode: resolveProviderMode(input.body, input.headers),
    callbackType,
    providerEventId: identity.providerEventId,
    providerReference:
      getBodyString(input.body, ['providerReference', 'reference']) ||
      (isPaytrPaymentCallback(providerDomain, providerName)
        ? getBodyString(input.body, ['merchant_oid'])
        : undefined) ||
      getHeader(input.headers, 'x-provider-reference'),
    idempotencyKey: identity.idempotencyKey,
    correlationId:
      input.requestMetadata?.correlationId ||
      getHeader(input.headers, 'x-correlation-id'),
    causationId:
```

## Satır 561-596
```typescript
      input.requestMetadata?.causationId ||
      getHeader(input.headers, 'x-causation-id'),
    requestId:
      input.requestMetadata?.requestId ||
      getHeader(input.headers, 'x-request-id'),
    verificationStatus: verification.verificationStatus,
    processingStatus: freshness.processingStatus || verification.processingStatus,
    replayStatus: freshness.replayStatus || resolveFirstSeenReplayStatus(identity),
    signatureVerified: verification.signatureVerified,
    replayDetected: freshness.replayDetected,
    rawPayload: input.body,
    normalizedPayload,
    error: undefined,
    boundary: createProviderBoundaryFlags(),
    receivedAt,
  };

  const inserted = await recordProviderCallbackEvent(record);

  return withProviderCallbackAckPolicy(providerDomain, providerName, {
    status: 202,
    body: {
      data: {
        id: inserted.id,
        providerDomain: inserted.providerDomain,
        providerName: inserted.providerName,
        callbackType: inserted.callbackType,
        processingStatus: inserted.processingStatus,
        verificationStatus: inserted.verificationStatus,
        replayStatus: inserted.replayStatus,
        replayDetected: inserted.replayDetected,
      },
    },
  });
}

```

# DOSYA: apps/bff/src/server/payment.ts

## Satır 1-61
```typescript
import { initiatePayment } from '@hx/payment';
import { getCheckoutReview } from '@hx/checkout';
import { ActorContext, CartContext, InitiatePaymentCommand } from '@hx/contracts';
import { createInternalRiskSignal } from '@hx/risk';
import { randomUUID } from 'node:crypto';
import * as response from './response';
import { requireGuestOrCustomer, extractCommerceContext, requireResourceOwnership } from './guards';

export async function handleInitiatePayment(context: ActorContext, body: any) {
  const guard = requireGuestOrCustomer(context);
  if (!guard.allowed) return guard.response;

  try {
    const { checkoutId } = body;
    if (!checkoutId) {
      return response.badRequest('BAD_REQUEST', 'checkoutId is required');
    }

    const checkout = await getCheckoutReview(checkoutId);
    if (!checkout) {
      return response.notFound('NOT_FOUND', 'Checkout not found');
    }

    if (!checkout.cartContext.actorId) {
      return response.forbidden('FORBIDDEN', 'Checkout has no owner');
    }

    const ownershipGuard = requireResourceOwnership(context, checkout.cartContext.actorId);
    if (!ownershipGuard.allowed) {
        // HARDENING-06D: Payment initiation ownership mismatch signal
        const commerceContext = extractCommerceContext(context);
        await createInternalRiskSignal({
            targetId: checkoutId,
            targetType: 'CHECKOUT',
            type: 'PAYMENT_ANOMALY',
            level: 'HIGH',
            source: 'PAYMENT_SIGNAL',
            reasonCode: 'PAYMENT_ANOMALY',
            metadata: { 
                checkoutOwner: checkout.cartContext.actorId, 
                actorId: commerceContext.actorId,
                reason: 'PAYMENT_INITIATE_OWNERSHIP_MISMATCH'
            },
            correlationId: randomUUID(),
        });
        return ownershipGuard.response;
    }

    const cartContext = extractCommerceContext(context) as CartContext;
    const command: InitiatePaymentCommand = {
      ...body,
      cartContext, // Override with secure context
    };

    const result = await initiatePayment(command);
    return response.ok(result);
  } catch (error) {
    return response.forbidden('FORBIDDEN', (error as Error).message);
  }
}

```

# DOSYA: services/payment/src/payment.ts

## Satır 1-80
```typescript
import {
  InitiatePaymentCommand,
  PaymentAttemptState,
  PaymentInitiationResponse,
  PaymentState,
  SimulatePaymentSuccessResponse,
  ProviderRefundSimulationInput,
  ProviderRefundSimulationResult,
  ProviderResultEnvelope,
} from '@hx/contracts';
import { PaymentCallbackOwnerCommand } from '../../../packages/contracts/src/payment';
import { getCheckoutReview } from '@hx/checkout';
import { createInternalRiskSignal } from '@hx/risk';
import { randomUUID } from 'node:crypto';
import { getPaymentRepository } from './repository/index';
import { getAuditEventRepositories } from '@hx/persistence';
import {
  getPaymentProviderAdapter,
  NormalizedPaymentInitiation,
} from './provider-adapter';

const FAILED_PAYMENT_WINDOW_MS = 60_000;
const FAILED_PAYMENT_SIGNAL_THRESHOLD = 2;
const failedPaymentAttempts = new Map<string, number[]>();

function createRejectedPaymentInitiationResponse(input: {
  readonly checkoutId: string;
  readonly command: InitiatePaymentCommand;
  readonly idempotencyKey: string;
  readonly errors: string[];
  readonly amount?: number;
  readonly currency?: string;
}): PaymentInitiationResponse {
  return {
    paymentId: '',
    checkoutId: input.checkoutId,
    cartContext: input.command.cartContext,
    state: 'FAILED',
    attempt: {
      paymentAttemptId: '',
      checkoutId: input.checkoutId,
      amount: input.amount ?? 0,
      currency: input.currency ?? 'TRY',
      method: input.command.paymentMethod,
      state: 'INITIATION_FAILED',
      idempotencyKey: input.idempotencyKey,
    },
    errors: input.errors,
    warnings: [],
  };
}

function validateCheckoutPaymentReadiness(
  checkout: NonNullable<Awaited<ReturnType<typeof getCheckoutReview>>>,
): string[] {
  const errors: string[] = [];

  if (checkout.state !== 'REVIEW_READY' || checkout.validationState !== 'VALID') {
    errors.push('CHECKOUT_NOT_READY');
  }

  if (!Number.isFinite(checkout.summary.grandTotal) || checkout.summary.grandTotal <= 0) {
    errors.push('CHECKOUT_AMOUNT_INVALID');
  }

  if (!checkout.summary.currency || checkout.summary.currency.trim().length === 0) {
    errors.push('CHECKOUT_CURRENCY_INVALID');
  }

  const hasBlockingLine = checkout.lines.some(
    (line) => line.validationState !== 'VALID' || line.errors.length > 0,
  );
  if (hasBlockingLine && !errors.includes('CHECKOUT_NOT_READY')) {
    errors.push('CHECKOUT_NOT_READY');
  }

  return errors;
}

async function recordFailedPaymentPattern(params: {
```

## Satır 81-160
```typescript
  checkoutId: string;
  actorId: string;
  actorType: string;
  reason: string;
}) {
  const key = `${params.actorType}:${params.actorId}:${params.checkoutId}`;
  const now = Date.now();
  const recentAttempts = (failedPaymentAttempts.get(key) || [])
    .filter((createdAt) => now - createdAt <= FAILED_PAYMENT_WINDOW_MS);
  recentAttempts.push(now);
  failedPaymentAttempts.set(key, recentAttempts);

  if (recentAttempts.length >= FAILED_PAYMENT_SIGNAL_THRESHOLD) {
    await createInternalRiskSignal({
      targetId: params.checkoutId,
      targetType: 'CHECKOUT',
      type: 'PAYMENT_ANOMALY',
      level: 'HIGH',
      source: 'PAYMENT_SIGNAL',
      reasonCode: 'PAYMENT_ANOMALY',
      metadata: {
        actorId: params.actorId,
        actorType: params.actorType,
        checkoutId: params.checkoutId,
        reason: 'REPEATED_FAILED_PAYMENT_ATTEMPT',
        lastFailureReason: params.reason,
        attemptCount: recentAttempts.length,
        windowMs: FAILED_PAYMENT_WINDOW_MS,
        paymentTruthMutated: false,
      },
      correlationId: randomUUID(),
    });
  }
}

export async function getPayment(paymentId: string): Promise<PaymentInitiationResponse | undefined> {
  return getPaymentRepository().getById(paymentId);
}

export interface ApplyPaymentCallbackOwnerCommandResult {
  readonly paymentId: string;
  readonly paymentAttemptId: string;
  readonly previousState: PaymentState;
  readonly nextState: PaymentState;
  readonly previousAttemptState: PaymentAttemptState;
  readonly nextAttemptState: PaymentAttemptState;
  readonly idempotencyKey: string;
  readonly applied: boolean;
  readonly alreadyApplied: boolean;
  readonly ignored: boolean;
  readonly errors: string[];
  readonly warnings: string[];
}

function emptyOwnerCommandResult(input: {
  readonly command: PaymentCallbackOwnerCommand;
  readonly errors?: string[];
  readonly warnings?: string[];
}): ApplyPaymentCallbackOwnerCommandResult {
  return {
    paymentId: input.command.paymentId ?? '',
    paymentAttemptId: input.command.paymentAttemptId,
    previousState: 'UNKNOWN_RESULT',
    nextState: 'UNKNOWN_RESULT',
    previousAttemptState: 'UNKNOWN_RESULT',
    nextAttemptState: 'UNKNOWN_RESULT',
    idempotencyKey: input.command.idempotencyKey,
    applied: false,
    alreadyApplied: false,
    ignored: true,
    errors: input.errors ?? [],
    warnings: input.warnings ?? [],
  };
}

function resolveOwnerCommandTargetState(
  commandType: PaymentCallbackOwnerCommand['commandType'],
): { state: PaymentState; attemptState: PaymentAttemptState } | undefined {
  switch (commandType) {
    case 'MARK_PAYMENT_SUCCEEDED':
```

## Satır 161-240
```typescript
      return { state: 'SUCCEEDED', attemptState: 'SUCCEEDED' };
    case 'MARK_PAYMENT_FAILED':
      return { state: 'FAILED', attemptState: 'FAILED' };
    default:
      return undefined;
  }
}

function isTerminalPaymentState(state: PaymentState): boolean {
  return state === 'SUCCEEDED' || state === 'FAILED' || state === 'CANCELLED';
}

function hasTerminalStateConflict(input: {
  readonly previousState: PaymentState;
  readonly targetState: PaymentState;
}): boolean {
  return (
    isTerminalPaymentState(input.previousState) &&
    input.previousState !== input.targetState
  );
}

export async function applyPaymentCallbackOwnerCommand(
  command: PaymentCallbackOwnerCommand,
): Promise<ApplyPaymentCallbackOwnerCommandResult> {
  if (
    (command.source as string) === 'reconciliation_worker' &&
    command.commandType !== 'MARK_PAYMENT_SUCCEEDED'
  ) {
    return emptyOwnerCommandResult({
      command,
      errors: ['RECONCILIATION_OWNER_COMMAND_TYPE_NOT_SUPPORTED'],
    });
  }

  const target = resolveOwnerCommandTargetState(command.commandType);
  if (!target) {
    return emptyOwnerCommandResult({
      command,
      errors: ['OWNER_COMMAND_TYPE_NOT_SUPPORTED'],
    });
  }

  const repo = getPaymentRepository();
  const foundByAttempt = await repo.getByPaymentAttemptId(command.paymentAttemptId);
  const foundByProviderReference =
    !foundByAttempt && command.providerReference
      ? await repo.getByProviderReference(command.providerName, command.providerReference)
      : undefined;
  const found = foundByAttempt ?? foundByProviderReference;

  if (!found) {
    return emptyOwnerCommandResult({
      command,
      errors: ['PAYMENT_NOT_FOUND'],
    });
  }

  if (command.paymentId && command.paymentId !== found.paymentId) {
    return emptyOwnerCommandResult({
      command,
      errors: ['PAYMENT_ID_MISMATCH'],
    });
  }

  if (command.checkoutId && command.checkoutId !== found.checkoutId) {
    return emptyOwnerCommandResult({
      command,
      errors: ['CHECKOUT_ID_MISMATCH'],
    });
  }

  const previousState = found.state;
  const previousAttemptState = found.attempt.state;
  const alreadyApplied =
    previousState === target.state &&
    previousAttemptState === target.attemptState &&
    found.attempt.lastCallbackStatus === command.normalizedStatus;

  if (alreadyApplied) {
```

## Satır 241-320
```typescript
    return {
      paymentId: found.paymentId,
      paymentAttemptId: found.attempt.paymentAttemptId,
      previousState,
      nextState: found.state,
      previousAttemptState,
      nextAttemptState: found.attempt.state,
      idempotencyKey: command.idempotencyKey,
      applied: false,
      alreadyApplied: true,
      ignored: false,
      errors: [],
      warnings: [],
    };
  }

  if (hasTerminalStateConflict({ previousState, targetState: target.state })) {
    return {
      paymentId: found.paymentId,
      paymentAttemptId: found.attempt.paymentAttemptId,
      previousState,
      nextState: found.state,
      previousAttemptState,
      nextAttemptState: found.attempt.state,
      idempotencyKey: command.idempotencyKey,
      applied: false,
      alreadyApplied: false,
      ignored: true,
      errors: ['PAYMENT_TERMINAL_STATE_CONFLICT'],
      warnings: [],
    };
  }

  found.state = target.state;
  found.attempt.state = target.attemptState;
  found.attempt.callbackRecordId = command.callbackRecordId;
  found.attempt.lastCallbackAt = command.occurredAt;
  found.attempt.lastCallbackStatus = command.normalizedStatus;
  if (command.providerReference && !found.attempt.providerReference) {
    found.attempt.providerReference = command.providerReference;
  }
  if (command.providerEventId && !found.attempt.providerEventId) {
    found.attempt.providerEventId = command.providerEventId;
  }

  await repo.save(found);

  return {
    paymentId: found.paymentId,
    paymentAttemptId: found.attempt.paymentAttemptId,
    previousState,
    nextState: found.state,
    previousAttemptState,
    nextAttemptState: found.attempt.state,
    idempotencyKey: command.idempotencyKey,
    applied: true,
    alreadyApplied: false,
    ignored: false,
    errors: [],
    warnings: [],
  };
}

export async function simulatePaymentSuccess(
  paymentAttemptId: string,
): Promise<SimulatePaymentSuccessResponse> {
  const repo = getPaymentRepository();
  const found = await repo.getByPaymentAttemptId(paymentAttemptId);

  if (!found) {
    return {
      paymentId: '',
      paymentAttemptId,
      state: 'FAILED',
      attemptState: 'INITIATION_FAILED',
      errors: ['PAYMENT_NOT_FOUND'],
    };
  }

  if (found.state === 'SUCCEEDED') {
```

## Satır 321-400
```typescript
    return {
      paymentId: found.paymentId,
      paymentAttemptId,
      state: found.state,
      attemptState: found.attempt.state,
      errors: [],
    };
  }

  // Update state to SUCCEEDED
  found.state = 'SUCCEEDED';
  found.attempt.state = 'SUCCEEDED';
  await repo.save(found);

  const errors: string[] = [];
  try {
    const auditEvent = getAuditEventRepositories();
    await auditEvent.audit.appendAuditLog({
      actorType: 'SYSTEM',
      actorId: 'payment-simulator',
      actionType: 'payment.succeeded',
      ownerService: 'payment',
      entityType: 'payment',
      entityId: found.paymentId,
      beforeState: { state: 'INITIATED', attemptState: 'PROVIDER_REDIRECT_READY' },
      afterState: found,
      correlationId: found.paymentId,
      metadata: {
        paymentAttemptId,
        orderCreated: false,
      },
    });
    await auditEvent.outbox.appendOutboxEvent({
      topic: 'payment.succeeded',
      payloadSchema: 'payment.succeeded.v1',
      payload: {
        paymentId: found.paymentId,
        paymentAttemptId,
        checkoutId: found.checkoutId,
        state: found.state,
        orderCreated: false,
      },
      ownerService: 'payment',
      entityType: 'payment',
      entityId: found.paymentId,
      idempotencyKey: `payment-success:${paymentAttemptId}`,
      correlationId: found.paymentId,
    });
  } catch (error) {
    errors.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
  }

  return {
    paymentId: found.paymentId,
    paymentAttemptId,
    state: found.state,
    attemptState: found.attempt.state,
    errors,
  };
}

export async function initiatePayment(
  command: InitiatePaymentCommand,
): Promise<PaymentInitiationResponse> {
  const {
    checkoutId,
    paymentMethod,
    idempotencyKey: initialIdempotencyKey,
  } = command;

  const idempotencyKey =
    initialIdempotencyKey || `${checkoutId}-${randomUUID()}`;

  const repo = getPaymentRepository();
  const existing = await repo.getByIdempotencyKey('payment', idempotencyKey);
  if (existing) {
    return existing;
  }

  const errors: string[] = [];
```

## Satır 401-480
```typescript
  const checkout = await getCheckoutReview(checkoutId);

  if (!checkout) {
    return createRejectedPaymentInitiationResponse({
      checkoutId,
      errors: ['CHECKOUT_NOT_FOUND'],
      command,
      idempotencyKey,
    });
  }

  const readinessErrors = validateCheckoutPaymentReadiness(checkout);
  if (readinessErrors.length > 0) {
    return createRejectedPaymentInitiationResponse({
      checkoutId,
      command,
      idempotencyKey,
      errors: readinessErrors,
      amount: checkout.summary.grandTotal,
      currency: checkout.summary.currency,
    });
  }

  if (checkout.cartContext.actorId !== command.cartContext.actorId) {
    await createInternalRiskSignal({
      targetId: checkoutId,
      targetType: 'CHECKOUT',
      type: 'PAYMENT_ANOMALY',
      level: 'HIGH',
      source: 'PAYMENT_SIGNAL',
      reasonCode: 'PAYMENT_ANOMALY',
      metadata: {
        checkoutOwner: checkout.cartContext.actorId,
        paymentActor: command.cartContext.actorId,
        reason: 'CHECKOUT_OWNER_MISMATCH',
      },
      correlationId: randomUUID(),
    });
  }

  const calculatedAmount = checkout.summary.grandTotal || 100;
  const calculatedCurrency = checkout.summary.currency || 'TRY';

  if (command.amount !== undefined && command.amount !== calculatedAmount) {
    await createInternalRiskSignal({
      targetId: checkoutId,
      targetType: 'CHECKOUT',
      type: 'PAYMENT_ANOMALY',
      level: 'CRITICAL',
      source: 'PAYMENT_SIGNAL',
      reasonCode: 'PAYMENT_ANOMALY',
      metadata: {
        clientAmount: command.amount,
        calculatedAmount,
        reason: 'CLIENT_AMOUNT_SPOOF_ATTEMPT',
      },
      correlationId: randomUUID(),
    });
  }

  if (
    command.currency !== undefined &&
    command.currency !== calculatedCurrency
  ) {
    await createInternalRiskSignal({
      targetId: checkoutId,
      targetType: 'CHECKOUT',
      type: 'PAYMENT_ANOMALY',
      level: command.currency === 'TRY' ? 'MEDIUM' : 'HIGH',
      source: 'PAYMENT_SIGNAL',
      reasonCode: 'PAYMENT_ANOMALY',
      metadata: {
        clientCurrency: command.currency,
        calculatedCurrency,
        reason: 'CLIENT_CURRENCY_SPOOF_ATTEMPT',
        paymentTruthMutated: false,
      },
      correlationId: randomUUID(),
    });
  }
```

## Satır 481-560
```typescript

  const amount = calculatedAmount;
  const currency = calculatedCurrency;

  const clientAmount = command.amount !== undefined ? command.amount : amount;

  if (clientAmount <= 0) {
    errors.push('INVALID_AMOUNT');
    await createInternalRiskSignal({
      targetId: checkoutId,
      targetType: 'CHECKOUT',
      type: 'PAYMENT_ANOMALY',
      level: 'MEDIUM',
      source: 'PAYMENT_SIGNAL',
      reasonCode: 'PAYMENT_ANOMALY',
      metadata: { amount: clientAmount, checkoutId, error: 'INVALID_AMOUNT' },
      correlationId: randomUUID(),
    });
    await recordFailedPaymentPattern({
      checkoutId,
      actorId: command.cartContext.actorId,
      actorType: command.cartContext.actorType,
      reason: 'INVALID_AMOUNT',
    });
  }
  if (command.currency !== undefined && command.currency !== 'TRY') {
    errors.push('UNSUPPORTED_CURRENCY');
    await createInternalRiskSignal({
      targetId: checkoutId,
      targetType: 'CHECKOUT',
      type: 'PAYMENT_ANOMALY',
      level: 'LOW',
      source: 'PAYMENT_SIGNAL',
      reasonCode: 'PAYMENT_ANOMALY',
      metadata: {
        currency: command.currency,
        checkoutId,
        error: 'UNSUPPORTED_CURRENCY',
      },
      correlationId: randomUUID(),
    });
    await recordFailedPaymentPattern({
      checkoutId,
      actorId: command.cartContext.actorId,
      actorType: command.cartContext.actorType,
      reason: 'UNSUPPORTED_CURRENCY',
    });
  }

  const paymentId = randomUUID();
  const adapter = getPaymentProviderAdapter();
  const providerResult = await adapter.initiatePayment({
    amount,
    currency,
    checkoutId,
    idempotencyKey,
    correlationId: paymentId,
    simulationScenario: command.simulationScenario, // HARDENING-09C
  });

  const response: PaymentInitiationResponse = {
    paymentId,
    checkoutId,
    cartContext: command.cartContext,
    state: 'INITIATED',
    attempt: {
      paymentAttemptId:
        providerResult.normalized?.paymentAttemptId || randomUUID(),
      checkoutId,
      amount,
      currency,
      method: paymentMethod,
      state: 'PROVIDER_REDIRECT_READY',
      providerSimulationRef: providerResult.providerReference,
      providerName: providerResult.providerName,
      ...(providerResult.providerReference
        ? {
            providerReference: providerResult.providerReference,
            providerEventId: providerResult.providerReference,
          }
```

## Satır 561-640
```typescript
        : {}),
      idempotencyKey,
    },
    redirectUrl: providerResult.normalized?.redirectUrl,
    errors: [],
    warnings: [],
    providerEnvelope: providerResult as any, 
  };

  await repo.saveWithIdempotency('payment', idempotencyKey, response);

  try {
    const auditEvent = getAuditEventRepositories();
    await auditEvent.audit.appendAuditLog({
      actorType: command.cartContext.actorType,
      actorId: command.cartContext.actorId,
      actionType: 'payment.initiated',
      ownerService: 'payment',
      entityType: 'payment',
      entityId: paymentId,
      afterState: response,
      idempotencyKey,
      correlationId: paymentId,
      metadata: {
        checkoutId,
        paymentAttemptId: response.attempt.paymentAttemptId,
        orderCreated: false,
        provider: {
          name: providerResult.providerName,
          mode: providerResult.providerMode,
          reference: providerResult.providerReference,
        },
      },
    });
    await auditEvent.outbox.appendOutboxEvent({
      topic: 'payment.initiated',
      payloadSchema: 'payment.initiated.v1',
      payload: {
        paymentId,
        paymentAttemptId: response.attempt.paymentAttemptId,
        checkoutId,
        state: response.state,
        orderCreated: false,
      },
      ownerService: 'payment',
      entityType: 'payment',
      entityId: paymentId,
      idempotencyKey: `event:${idempotencyKey}`,
      correlationId: paymentId,
    });
  } catch (error) {
    response.warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
  }

  return response;
}

export async function simulateProviderRefund(
  input: ProviderRefundSimulationInput,
): Promise<ProviderRefundSimulationResult> {
  const { paymentId, amount, currency } = input;

  const payment = await getPayment(paymentId);

  if (!payment) {
    return {
      success: false,
      error: 'PAYMENT_NOT_FOUND',
      simulationOnly: true,
      actualProviderRefundPerformed: false,
    };
  }

  if (payment.state !== 'SUCCEEDED') {
    return {
      success: false,
      error: 'PAYMENT_NOT_REFUNDABLE',
      simulationOnly: true,
      actualProviderRefundPerformed: false,
    };
```

## Satır 641-669
```typescript
  }

  if (amount <= 0) {
    return {
      success: false,
      error: 'INVALID_REFUND_AMOUNT',
      simulationOnly: true,
      actualProviderRefundPerformed: false,
    };
  }

  if (payment.attempt.currency !== currency) {
    return {
      success: false,
      error: 'REFUND_CURRENCY_MISMATCH',
      simulationOnly: true,
      actualProviderRefundPerformed: false,
    };
  }

  // Simulation success
  return {
    success: true,
    providerRefundReference: `ref_sim_${randomUUID()}`,
    simulationOnly: true,
    actualProviderRefundPerformed: false,
  };
}

```

# DOSYA: services/order/src/order.ts

## Satır 1-80
```typescript
import {
  CreateOrderCommand,
  OrderResponse,
  OrderDetailResponse,
  OrderLine,
  OrderLineEconomicsSnapshot,
  CheckoutLineValidation,
  CheckoutReviewResponse
} from '@hx/contracts';
import { getCheckoutReview } from '@hx/checkout';
import { getPayment } from '@hx/payment';
import { createInternalRiskSignal } from '@hx/risk';
import { randomUUID } from 'node:crypto';
import { getOrderRepository } from './repository/index';
import { getAuditEventRepositories } from '@hx/persistence';

const UNKNOWN_ECONOMICS_FIELDS = [
  'creatorStoreId',
  'supplierId',
  'supplierSubmittedProductId',
  'supplierVariantId',
  'poolBasePriceAmount',
  'creatorSelectedPriceAmount',
  'platformMarginAmount',
  'creatorMarginAmount',
  'supplierBaseAmount',
];

export async function getOrderById(orderId: string): Promise<OrderResponse | undefined> {
  return getOrderRepository().getById(orderId);
}

export async function getOrderDetail(orderId: string): Promise<OrderDetailResponse> {
  const order = await getOrderById(orderId);

  if (!order) {
    return {
      orderId: '',
      orderNumber: '',
      checkoutId: '',
      paymentId: '',
      paymentAttemptId: '',
      state: 'CREATE_FAILED',
      lines: [],
      summary: { totalQuantity: 0, subTotal: 0, grandTotal: 0, currency: 'TRY' },
      errors: ['ORDER_NOT_FOUND'],
      warnings: [],
      paymentSummary: { state: 'FAILED', method: 'UNKNOWN' },
      fulfillmentStateSummary: 'NOT_STARTED',
      shipmentStateSummary: 'NOT_AVAILABLE',
      actions: { canCancel: false, canReturn: false }
    };
  }

  return {
    ...order,
    paymentSummary: {
      state: order.state === 'CREATED' ? 'CAPTURED' : 'FAILED',
      method: 'CARD'
    },
    fulfillmentStateSummary: 'NOT_STARTED',
    shipmentStateSummary: 'NOT_AVAILABLE',
    actions: {
      canCancel: false,
      canReturn: false
    }
  };
}

export async function createOrderFromPayment(command: CreateOrderCommand): Promise<OrderResponse> {
  const { paymentId, paymentAttemptId, checkoutId, idempotencyKey: initialIdempotencyKey } = command;

  const idempotencyKey = initialIdempotencyKey || `order-${paymentAttemptId}`;

  const repo = getOrderRepository();
  const existingIdemp = await repo.getByIdempotencyKey('order', idempotencyKey);
  if (existingIdemp) {
    // HARDENING-06D: Duplicate order create attempt
    await createInternalRiskSignal({
        targetId: paymentAttemptId,
```

## Satır 81-160
```typescript
        targetType: 'ORDER',
        type: 'PAYMENT_ANOMALY',
        level: 'LOW',
        source: 'ORDER_SIGNAL',
        reasonCode: 'PAYMENT_ANOMALY',
        metadata: { 
            paymentAttemptId,
            reason: 'DUPLICATE_ORDER_CREATE_ATTEMPT'
        },
        correlationId: randomUUID(),
    });
    return existingIdemp;
  }

  const existingByAttempt = await repo.getByPaymentAttemptId(paymentAttemptId);
  if (existingByAttempt) {
    return existingByAttempt;
  }

  const payment = await getPayment(paymentId);
  if (!payment) {
    console.error('Order creation failed: payment not found');
    await createInternalRiskSignal({
      targetId: checkoutId,
      targetType: 'ORDER',
      type: 'PAYMENT_ANOMALY',
      level: 'HIGH',
      source: 'ORDER_SIGNAL',
      reasonCode: 'PAYMENT_ANOMALY',
      metadata: {
        paymentId,
        paymentAttemptId,
        checkoutId,
        error: 'PAYMENT_NOT_FOUND',
        reason: 'SUSPICIOUS_ORDER_CREATE_ATTEMPT',
        orderTruthMutated: false,
      },
      correlationId: randomUUID(),
    });
    return createErrorResponse(checkoutId, paymentId, paymentAttemptId, ['PAYMENT_NOT_FOUND']);
  }

  // HARDENING-06D: Another actor payment's order create attempt
  if (payment.cartContext.actorId !== command.customerId) {
    await createInternalRiskSignal({
        targetId: paymentId,
        targetType: 'PAYMENT',
        type: 'PAYMENT_ANOMALY',
        level: 'CRITICAL',
        source: 'ORDER_SIGNAL',
        reasonCode: 'PAYMENT_ANOMALY',
        metadata: { 
            paymentOwner: payment.cartContext.actorId, 
            orderActor: command.customerId,
            reason: 'PAYMENT_OWNER_MISMATCH'
        },
        correlationId: randomUUID(),
    });
  }

  if (payment.state !== 'SUCCEEDED') {
    console.error(`Order creation failed: payment not succeeded, state=${payment.state}`);
    await createInternalRiskSignal({
      targetId: checkoutId,
      targetType: 'ORDER',
      type: 'PAYMENT_ANOMALY',
      level: 'HIGH',
      source: 'ORDER_SIGNAL',
      reasonCode: 'PAYMENT_ANOMALY',
      metadata: {
        paymentId,
        paymentState: payment.state,
        checkoutId,
        error: 'PAYMENT_NOT_SUCCEEDED',
        reason: 'NON_SUCCESS_PAYMENT_ORDER_CREATE_ATTEMPT',
        orderTruthMutated: false,
      },
      correlationId: randomUUID(),
    });
    return createErrorResponse(checkoutId, paymentId, paymentAttemptId, ['PAYMENT_NOT_SUCCEEDED']);
```

## Satır 161-240
```typescript
  }

  if (payment.attempt.paymentAttemptId !== paymentAttemptId) {
    console.error('Order creation failed: payment attempt mismatch');
    return createErrorResponse(checkoutId, paymentId, paymentAttemptId, ['PAYMENT_ATTEMPT_MISMATCH']);
  }

  const checkout = await getCheckoutReview(checkoutId);
  if (!checkout || checkout.state !== 'REVIEW_READY' || checkout.validationState !== 'VALID') {
    console.error(`Order creation failed: checkout not ready, state=${checkout?.state}, validation=${checkout?.validationState}`);
    return createErrorResponse(checkoutId, paymentId, paymentAttemptId, ['CHECKOUT_NOT_READY']);
  }

  const orderId = randomUUID();
  const orderNumber = `ORD-${Date.now()}-${orderId.slice(0, 8).toUpperCase()}`;

  const lines: OrderLine[] = checkout.lines.map(cl => {
    const orderLineId = randomUUID();
    const unitPriceSnapshot = cl.unitPrice || 0;
    const lineTotalSnapshot = cl.lineTotal || 0;

    return {
      orderLineId,
      productId: cl.productId,
      variantId: cl.variantId,
      storefrontId: cl.storefrontId,
      quantity: cl.quantity,
      productNameSnapshot: `Product ${cl.productId}`,
      unitPriceSnapshot,
      lineTotalSnapshot,
      economicsSnapshot: buildOrderLineEconomicsSnapshot({
        checkout,
        checkoutLine: cl,
        unitPriceSnapshot,
        lineTotalSnapshot,
      }),
    };
  });

  const response: OrderResponse = {
    orderId,
    orderNumber,
    customerId: command.customerId,
    checkoutId,
    paymentId,
    paymentAttemptId,
    state: 'CREATED',
    lines,
    summary: { ...checkout.summary },
    errors: [],
    warnings: []
  };

  await repo.saveWithIdempotency('order', idempotencyKey, response);
  try {
    const auditEvent = getAuditEventRepositories();
    await auditEvent.audit.appendAuditLog({
      actorType: 'SYSTEM',
      actorId: 'order-service',
      actionType: 'order.created',
      ownerService: 'order',
      entityType: 'order',
      entityId: orderId,
      afterState: response,
      idempotencyKey,
      correlationId: orderId,
      metadata: {
        paymentId,
        paymentAttemptId,
        checkoutId,
      },
    });
    await auditEvent.outbox.appendOutboxEvent({
      topic: 'order.created',
      payloadSchema: 'order.created.v1',
      payload: {
        orderId,
        orderNumber,
        paymentId,
        paymentAttemptId,
```

## Satır 241-320
```typescript
        checkoutId,
        state: response.state,
      },
      ownerService: 'order',
      entityType: 'order',
      entityId: orderId,
      idempotencyKey: `event:${idempotencyKey}`,
      correlationId: orderId,
    });
  } catch (error) {
    response.warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
  }
  return response;
}

function buildOrderLineEconomicsSnapshot(input: {
  checkout: CheckoutReviewResponse;
  checkoutLine: CheckoutLineValidation;
  unitPriceSnapshot: number;
  lineTotalSnapshot: number;
}): OrderLineEconomicsSnapshot {
  const { checkout, checkoutLine, unitPriceSnapshot, lineTotalSnapshot } = input;
  const discountAllocationRefs = (checkout.discountSnapshots ?? [])
    .flatMap((snapshot) => snapshot.lineAllocations ?? [])
    .filter((allocation) => allocation.lineId === checkoutLine.lineId)
    .map((allocation) => ({
      allocationId: allocation.allocationId,
      discountSnapshotId: allocation.discountSnapshotId,
      discountCode: allocation.discountCode,
      discountKind: allocation.discountKind,
      sponsorType: allocation.sponsorType,
      sponsorId: allocation.sponsorId,
      allocatedAmount: allocation.allocatedAmount,
      currency: allocation.currency,
    }));

  const couponSnapshotRefs = (checkout.discountSnapshots ?? [])
    .filter((snapshot) =>
      snapshot.sourceType === 'COUPON' &&
      (snapshot.lineAllocations ?? []).some((allocation) => allocation.lineId === checkoutLine.lineId),
    )
    .map((snapshot) => ({
      discountSnapshotId: snapshot.discountSnapshotId,
      sourceType: snapshot.sourceType,
      code: snapshot.code,
      discountAmount: snapshot.discountAmount,
      sponsorType: snapshot.sponsorType,
      sponsorId: snapshot.sponsorId,
    }));

  const sourceFields = {
    creatorStoreId: checkoutLine.creatorStoreId,
    supplierId: checkoutLine.supplierId,
    supplierSubmittedProductId: checkoutLine.supplierSubmittedProductId,
    supplierVariantId: checkoutLine.supplierVariantId,
    poolBasePriceAmount: checkoutLine.poolBasePriceAmount,
    creatorSelectedPriceAmount: checkoutLine.creatorSelectedPriceAmount,
    platformMarginAmount: undefined as number | undefined,
    creatorMarginAmount: undefined as number | undefined,
    supplierBaseAmount: checkoutLine.supplierBaseAmount,
  };
  const warnings = [
    'ORDER_LINE_ECONOMICS_SNAPSHOT_FOUNDATION_ONLY',
  ];

  if (
    sourceFields.poolBasePriceAmount !== undefined &&
    sourceFields.supplierBaseAmount !== undefined
  ) {
    if (sourceFields.poolBasePriceAmount >= sourceFields.supplierBaseAmount) {
      sourceFields.platformMarginAmount = sourceFields.poolBasePriceAmount - sourceFields.supplierBaseAmount;
    } else {
      warnings.push('PLATFORM_MARGIN_PRICE_RELATION_INVALID');
    }
  }

  if (
    sourceFields.creatorSelectedPriceAmount !== undefined &&
    sourceFields.poolBasePriceAmount !== undefined
  ) {
```

## Satır 321-395
```typescript
    if (sourceFields.creatorSelectedPriceAmount >= sourceFields.poolBasePriceAmount) {
      sourceFields.creatorMarginAmount = sourceFields.creatorSelectedPriceAmount - sourceFields.poolBasePriceAmount;
    } else {
      warnings.push('CREATOR_MARGIN_PRICE_RELATION_INVALID');
    }
  }

  const unknownFields = UNKNOWN_ECONOMICS_FIELDS.filter((field) => {
    const value = sourceFields[field as keyof typeof sourceFields];
    return value === undefined || value === null;
  });

  if (!checkoutLine.commercialPoolProductId) {
    unknownFields.push('commercialPoolProductId');
    warnings.push('COMMERCIAL_POOL_PRODUCT_SOURCE_UNKNOWN');
  }

  if (!checkoutLine.creatorStoreProductId) {
    unknownFields.push('creatorStoreProductId');
    warnings.push('CREATOR_STORE_PRODUCT_SOURCE_UNKNOWN');
  }
  if (unknownFields.length > 0) {
    warnings.push('ORDER_LINE_ECONOMICS_SOURCE_DEGRADED');
  }
  if (
    unknownFields.includes('platformMarginAmount') ||
    unknownFields.includes('creatorMarginAmount') ||
    unknownFields.includes('supplierBaseAmount')
  ) {
    warnings.push('SUPPLIER_POOL_CREATOR_MARGIN_SOURCE_UNAVAILABLE');
  }

  return {
    commercialPoolProductId: checkoutLine.commercialPoolProductId,
    creatorStoreProductId: checkoutLine.creatorStoreProductId,
    ...sourceFields,
    unitPriceSnapshot,
    lineTotalSnapshot,
    discountAllocationRefs,
    couponSnapshotRefs,
    priceSource: 'CHECKOUT_LINE',
    economicsSnapshotCreatedAt: new Date().toISOString(),
    status: unknownFields.length === 0 ? 'COMPLETE' : 'DEGRADED',
    unknownFields,
    warnings,
    boundaryFlags: {
      economicsSnapshotOnly: true,
      settlementCreated: false,
      payoutCreated: false,
      ledgerEntryCreated: false,
      payableCreated: false,
    },
  };
}

function createErrorResponse(
  checkoutId: string, 
  paymentId: string, 
  paymentAttemptId: string, 
  errors: string[]
): OrderResponse {
  return {
    orderId: '',
    orderNumber: '',
    checkoutId,
    paymentId,
    paymentAttemptId,
    state: 'CREATE_FAILED',
    lines: [],
    summary: { totalQuantity: 0, subTotal: 0, grandTotal: 0, currency: 'TRY' },
    errors,
    warnings: []
  };
}

```

