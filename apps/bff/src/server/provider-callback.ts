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
