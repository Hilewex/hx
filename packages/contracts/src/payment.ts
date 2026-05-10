import { createHmac, timingSafeEqual } from 'node:crypto';
import { CartContext } from './cart';
import {
  createProviderBoundaryFlags,
  ProviderBoundaryFlags,
  ProviderCallbackReplayStatus,
  ProviderCallbackVerificationStatus,
  ProviderMode,
  ProviderResultEnvelope,
} from './provider';

export type PaymentState =
  | 'CREATED'
  | 'INITIATED'
  | 'PENDING'
  | 'UNKNOWN_RESULT'
  | 'FAILED'
  | 'CANCELLED'
  | 'SUCCEEDED';


export type PaymentAttemptState =
  | 'CREATED'
  | 'PROVIDER_REDIRECT_READY'
  | 'INITIATION_FAILED'
  | 'PENDING'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'UNKNOWN_RESULT'
  | 'SUCCEEDED';

export type PaymentMethodType = 'CARD';

export interface InitiatePaymentCommand {
  checkoutId: string;
  cartContext: {
    actorType: 'GUEST' | 'CUSTOMER';
    actorId: string;
  };
  amount?: number;
  currency?: string;
  paymentMethod: PaymentMethodType;
  idempotencyKey?: string;
  simulationScenario?: 'succeeded' | 'pending' | 'unknown_result'; // HARDENING-09C
}

export interface PaymentAttempt {
  paymentAttemptId: string;
  checkoutId: string;
  amount: number;
  currency: string;
  method: PaymentMethodType;
  state: PaymentAttemptState;
  providerSimulationRef?: string;
  providerName?: string;
  providerReference?: string;
  providerEventId?: string;
  providerOrderId?: string;
  callbackRecordId?: string;
  lastCallbackAt?: Date;
  lastCallbackStatus?: NormalizedPaymentCallbackStatus;
  idempotencyKey: string;
}

export interface PaymentInitiationResponse {
  paymentId: string;
  cartContext: CartContext;
  checkoutId: string;
  state: PaymentState;
  attempt: PaymentAttempt;
  redirectUrl?: string;
  errors: string[];
  warnings: string[];
  providerEnvelope?: ProviderResultEnvelope;
}

export interface SimulatePaymentSuccessResponse {
  paymentId: string;
  paymentAttemptId: string;
  state: PaymentState;
  attemptState: PaymentAttemptState;
  errors: string[];
}

export type NormalizedPaymentCallbackStatus =
  | 'succeeded'
  | 'failed'
  | 'pending'
  | 'cancelled'
  | 'expired'
  | 'unknown_result'
  | 'duplicate'
  | 'signature_failed'
  | 'unsupported'
  | 'rejected_amount_mismatch'
  | 'rejected_currency_mismatch'
  | 'rejected_reference_missing'
  | 'payment_attempt_not_found'
  | 'rejected_identity_conflict'
  | 'rejected_replay'
  | 'rejected_freshness'
  | 'ignored';

export type PaymentCallbackOwnerCommandCandidate =
  | 'MARK_PAYMENT_SUCCEEDED'
  | 'MARK_PAYMENT_FAILED'
  | 'MARK_PAYMENT_PENDING'
  | 'MARK_PAYMENT_CANCELLED'
  | 'MARK_PAYMENT_EXPIRED'
  | 'NONE';

export type PaymentCallbackOwnerCommandType =
  | 'MARK_PAYMENT_SUCCEEDED'
  | 'MARK_PAYMENT_FAILED'
  | 'MARK_PAYMENT_PENDING'
  | 'MARK_PAYMENT_CANCELLED'
  | 'MARK_PAYMENT_EXPIRED'
  | 'MARK_PAYMENT_UNKNOWN_RESULT';

export interface PaymentCallbackOwnerCommand {
  readonly commandType: PaymentCallbackOwnerCommandType;
  readonly providerName: string;
  readonly providerEventId?: string;
  readonly providerReference?: string;
  readonly callbackRecordId: string;
  readonly paymentAttemptId: string;
  readonly paymentId?: string;
  readonly checkoutId?: string;
  readonly amount?: number;
  readonly currency?: string;
  readonly normalizedStatus: NormalizedPaymentCallbackStatus;
  readonly idempotencyKey: string;
  readonly occurredAt: Date;
  readonly source: 'provider_callback_worker' | 'reconciliation_worker';
  readonly boundary: ProviderBoundaryFlags;
}

export type PaymentCallbackOwnerCommandDecisionStatus =
  | 'command_ready'
  | 'missing_payment_attempt'
  | 'candidate_rejected'
  | 'candidate_requires_reconciliation'
  | 'candidate_not_processable';

export interface PaymentCallbackOwnerCommandDecision {
  readonly status: PaymentCallbackOwnerCommandDecisionStatus;
  readonly command?: PaymentCallbackOwnerCommand;
  readonly shouldProcess: boolean;
  readonly shouldReject: boolean;
  readonly shouldReconcile: boolean;
  readonly reason?: string;
  readonly boundary: ProviderBoundaryFlags;
}

export type PaymentCallbackLookupStrategy =
  | 'payment_attempt_id'
  | 'payment_id'
  | 'provider_reference'
  | 'idempotency_key'
  | 'manual_reconciliation';

export interface PaymentCallbackLookupPlan {
  readonly primary: PaymentCallbackLookupStrategy;
  readonly fallbacks: readonly PaymentCallbackLookupStrategy[];
  readonly providerReferenceStrategy?: 'paytr_merchant_oid_as_provider_reference';
  readonly requiresInitiateContract: boolean;
  readonly boundary: ProviderBoundaryFlags;
}

export interface NormalizedPaymentCallbackCandidate {
  readonly providerDomain: 'payment';
  readonly providerName: string;
  readonly providerMode: ProviderMode;
  readonly callbackRecordId: string;
  readonly providerEventId?: string;
  readonly providerReference?: string;
  readonly idempotencyKey?: string;
  readonly callbackType: string;
  readonly normalizedStatus: NormalizedPaymentCallbackStatus;
  readonly paymentAttemptId?: string;
  readonly paymentId?: string;
  readonly checkoutId?: string;
  readonly amount?: number;
  readonly currency?: string;
  readonly occurredAt: Date;
  readonly verificationStatus: ProviderCallbackVerificationStatus;
  readonly replayStatus: ProviderCallbackReplayStatus;
  readonly signatureVerified: boolean;
  readonly replayDetected: boolean;
  readonly riskFlags: readonly string[];
  readonly ownerCommandCandidate: PaymentCallbackOwnerCommandCandidate;
  readonly shouldProcess: boolean;
  readonly shouldReconcile: boolean;
  readonly shouldReject: boolean;
  readonly rejectionReason?: string;
  readonly boundary: ProviderBoundaryFlags;
}

export function createPaymentCallbackOwnerCommandIdempotencyKey(input: {
  readonly providerDomain?: 'payment';
  readonly providerName: string;
  readonly providerEventId?: string;
  readonly callbackRecordId: string;
  readonly paymentAttemptId: string;
  readonly commandType: PaymentCallbackOwnerCommandType;
}): string {
  const providerDomain = input.providerDomain ?? 'payment';

  if (input.providerEventId) {
    return `payment-callback:${providerDomain}:${input.providerName}:${input.providerEventId}:${input.paymentAttemptId}:${input.commandType}`;
  }

  return `payment-callback:${providerDomain}:${input.providerName}:record:${input.callbackRecordId}:${input.paymentAttemptId}:${input.commandType}`;
}

export function mapPaymentCallbackOwnerCommandCandidateToCommandType(
  candidate: PaymentCallbackOwnerCommandCandidate,
): PaymentCallbackOwnerCommandType | undefined {
  switch (candidate) {
    case 'MARK_PAYMENT_SUCCEEDED':
    case 'MARK_PAYMENT_FAILED':
    case 'MARK_PAYMENT_PENDING':
    case 'MARK_PAYMENT_CANCELLED':
    case 'MARK_PAYMENT_EXPIRED':
      return candidate;
    case 'NONE':
      return undefined;
  }
}

export function decidePaymentCallbackOwnerCommand(input: {
  readonly candidate: NormalizedPaymentCallbackCandidate;
  readonly callbackRecordId: string;
  readonly resolvedPaymentAttemptId?: string;
  readonly resolvedPaymentId?: string;
  readonly resolvedCheckoutId?: string;
}): PaymentCallbackOwnerCommandDecision {
  const boundary = createProviderBoundaryFlags();
  const candidate = input.candidate;
  const paymentAttemptId = input.resolvedPaymentAttemptId ?? candidate.paymentAttemptId;

  if (
    candidate.shouldReject ||
    !candidate.signatureVerified ||
    candidate.replayDetected ||
    (candidate.normalizedStatus === 'succeeded' && candidate.verificationStatus !== 'verified')
  ) {
    return {
      status: 'candidate_rejected',
      shouldProcess: false,
      shouldReject: true,
      shouldReconcile: candidate.shouldReconcile,
      reason:
        candidate.rejectionReason ??
        (!candidate.signatureVerified || candidate.verificationStatus !== 'verified'
          ? 'signature_verification_failed'
          : undefined) ??
        (candidate.replayDetected ? 'replay_rejected' : undefined) ??
        candidate.normalizedStatus,
      boundary,
    };
  }

  if (candidate.normalizedStatus === 'unknown_result' || candidate.normalizedStatus === 'pending') {
    return {
      status: 'candidate_requires_reconciliation',
      shouldProcess: false,
      shouldReject: false,
      shouldReconcile: true,
      reason: candidate.normalizedStatus,
      boundary,
    };
  }

  if (candidate.shouldReconcile && !candidate.shouldProcess) {
    return {
      status: 'candidate_requires_reconciliation',
      shouldProcess: false,
      shouldReject: false,
      shouldReconcile: true,
      reason: candidate.normalizedStatus,
      boundary,
    };
  }

  if (!candidate.shouldProcess) {
    return {
      status: 'candidate_not_processable',
      shouldProcess: false,
      shouldReject: false,
      shouldReconcile: candidate.shouldReconcile,
      reason: candidate.normalizedStatus,
      boundary,
    };
  }

  if (!paymentAttemptId) {
    return {
      status: 'missing_payment_attempt',
      shouldProcess: false,
      shouldReject: false,
      shouldReconcile: true,
      reason: 'payment_attempt_missing',
      boundary,
    };
  }

  const commandType = mapPaymentCallbackOwnerCommandCandidateToCommandType(
    candidate.ownerCommandCandidate,
  );

  if (!commandType) {
    return {
      status: 'candidate_not_processable',
      shouldProcess: false,
      shouldReject: false,
      shouldReconcile: candidate.shouldReconcile,
      reason: candidate.normalizedStatus,
      boundary,
    };
  }

  const callbackRecordId = input.callbackRecordId;
  const idempotencyKey = createPaymentCallbackOwnerCommandIdempotencyKey({
    providerName: candidate.providerName,
    providerEventId: candidate.providerEventId,
    callbackRecordId,
    paymentAttemptId,
    commandType,
  });

  return {
    status: 'command_ready',
    command: {
      commandType,
      providerName: candidate.providerName,
      ...(candidate.providerEventId ? { providerEventId: candidate.providerEventId } : {}),
      ...(candidate.providerReference ? { providerReference: candidate.providerReference } : {}),
      callbackRecordId,
      paymentAttemptId,
      ...(input.resolvedPaymentId ?? candidate.paymentId
        ? { paymentId: input.resolvedPaymentId ?? candidate.paymentId }
        : {}),
      ...(input.resolvedCheckoutId ?? candidate.checkoutId
        ? { checkoutId: input.resolvedCheckoutId ?? candidate.checkoutId }
        : {}),
      ...(candidate.amount !== undefined ? { amount: candidate.amount } : {}),
      ...(candidate.currency ? { currency: candidate.currency } : {}),
      normalizedStatus: candidate.normalizedStatus,
      idempotencyKey,
      occurredAt: candidate.occurredAt,
      source: 'provider_callback_worker',
      boundary,
    },
    shouldProcess: true,
    shouldReject: false,
    shouldReconcile: false,
    boundary,
  };
}

export function createPaytrPaymentCallbackLookupPlan(): PaymentCallbackLookupPlan {
  return {
    primary: 'provider_reference',
    fallbacks: ['payment_attempt_id', 'idempotency_key', 'manual_reconciliation'],
    providerReferenceStrategy: 'paytr_merchant_oid_as_provider_reference',
    requiresInitiateContract: true,
    boundary: createProviderBoundaryFlags(),
  };
}

export interface PaymentCallbackCandidateDecisionInput {
  readonly normalizedStatus: NormalizedPaymentCallbackStatus;
  readonly paymentAttemptId?: string;
  readonly providerReference?: string;
  readonly providerEventId?: string;
  readonly verificationStatus: ProviderCallbackVerificationStatus;
  readonly replayStatus: ProviderCallbackReplayStatus;
  readonly signatureVerified: boolean;
  readonly replayDetected: boolean;
}

export interface PaymentCallbackCandidateDecision {
  readonly ownerCommandCandidate: PaymentCallbackOwnerCommandCandidate;
  readonly shouldProcess: boolean;
  readonly shouldReconcile: boolean;
  readonly shouldReject: boolean;
  readonly rejectionReason?: string;
}

export interface PaytrIframeCallbackPayload {
  readonly merchant_oid: string;
  readonly status: 'success' | 'failed' | string;
  readonly total_amount: string | number;
  readonly hash: string;
  readonly failed_reason_code?: string;
  readonly failed_reason_msg?: string;
  readonly test_mode?: string | number;
  readonly payment_type?: 'card' | 'eft' | string;
  readonly currency?: 'TL' | 'TRY' | 'USD' | 'EUR' | 'GBP' | 'RUB' | string;
  readonly payment_amount?: string | number;
}

export interface PaytrCallbackMappingResult {
  readonly candidate: NormalizedPaymentCallbackCandidate;
  readonly hashVerified: boolean;
  readonly paytrStatus: string;
}

const OWNER_COMMAND_BY_STATUS: Partial<
  Record<NormalizedPaymentCallbackStatus, PaymentCallbackOwnerCommandCandidate>
> = {
  succeeded: 'MARK_PAYMENT_SUCCEEDED',
  failed: 'MARK_PAYMENT_FAILED',
  pending: 'MARK_PAYMENT_PENDING',
  cancelled: 'MARK_PAYMENT_CANCELLED',
  expired: 'MARK_PAYMENT_EXPIRED',
};

const RECONCILIATION_STATUSES = new Set<NormalizedPaymentCallbackStatus>([
  'pending',
  'expired',
  'unknown_result',
  'unsupported',
  'rejected_amount_mismatch',
  'rejected_currency_mismatch',
  'rejected_reference_missing',
  'payment_attempt_not_found',
  'rejected_identity_conflict',
]);

const REJECT_REASONS: Partial<Record<NormalizedPaymentCallbackStatus, string>> = {
  duplicate: 'duplicate_callback',
  signature_failed: 'signature_verification_failed',
  unsupported: 'unsupported_callback_status',
  rejected_amount_mismatch: 'amount_mismatch',
  rejected_currency_mismatch: 'currency_mismatch',
  rejected_reference_missing: 'provider_reference_missing',
  payment_attempt_not_found: 'payment_attempt_not_found',
  rejected_identity_conflict: 'identity_conflict',
  rejected_replay: 'replay_rejected',
  rejected_freshness: 'freshness_rejected',
};

export function decidePaymentCallbackCandidate(
  input: PaymentCallbackCandidateDecisionInput,
): PaymentCallbackCandidateDecision {
  const verificationFailed =
    input.verificationStatus === 'failed' ||
    input.verificationStatus === 'unsupported' ||
    input.normalizedStatus === 'signature_failed' ||
    (input.verificationStatus === 'verified' && !input.signatureVerified);
  const replayRejected =
    input.replayDetected ||
    input.replayStatus === 'replay_detected' ||
    input.normalizedStatus === 'rejected_replay';
  const missingPaymentAttempt =
    !input.paymentAttemptId && input.normalizedStatus !== 'ignored';
  const statusRejectReason = REJECT_REASONS[input.normalizedStatus];
  const shouldReject = Boolean(statusRejectReason || verificationFailed || replayRejected || missingPaymentAttempt);
  const shouldReconcile =
    RECONCILIATION_STATUSES.has(input.normalizedStatus) ||
    (missingPaymentAttempt && input.normalizedStatus !== 'duplicate') ||
    input.normalizedStatus === 'unknown_result';
  const ownerCommandCandidate = shouldReject || missingPaymentAttempt
    ? 'NONE'
    : OWNER_COMMAND_BY_STATUS[input.normalizedStatus] ?? 'NONE';
  const shouldProcess = ownerCommandCandidate !== 'NONE' && !shouldReject;
  const rejectionReason =
    statusRejectReason ??
    (verificationFailed ? 'signature_verification_failed' : undefined) ??
    (replayRejected ? 'replay_rejected' : undefined) ??
    (missingPaymentAttempt ? 'payment_attempt_missing' : undefined);

  return {
    ownerCommandCandidate,
    shouldProcess,
    shouldReconcile,
    shouldReject,
    ...(rejectionReason ? { rejectionReason } : {}),
  };
}

export function createNormalizedPaymentCallbackCandidate(
  init: Omit<
    NormalizedPaymentCallbackCandidate,
    | 'providerDomain'
    | 'ownerCommandCandidate'
    | 'shouldProcess'
    | 'shouldReconcile'
    | 'shouldReject'
    | 'rejectionReason'
    | 'boundary'
  > & {
    readonly providerDomain?: 'payment';
  },
): NormalizedPaymentCallbackCandidate {
  const decision = decidePaymentCallbackCandidate(init);

  return {
    ...init,
    providerDomain: 'payment',
    ownerCommandCandidate: decision.ownerCommandCandidate,
    shouldProcess: decision.shouldProcess,
    shouldReconcile: decision.shouldReconcile,
    shouldReject: decision.shouldReject,
    ...(decision.rejectionReason ? { rejectionReason: decision.rejectionReason } : {}),
    boundary: createProviderBoundaryFlags(),
  };
}

export function createPaytrCallbackHash(input: {
  readonly merchantOid: string;
  readonly merchantSalt: string;
  readonly status: string;
  readonly totalAmount: string | number;
  readonly merchantKey: string;
}): string {
  const payload = `${input.merchantOid}${input.merchantSalt}${input.status}${input.totalAmount}`;

  return createHmac('sha256', input.merchantKey)
    .update(payload)
    .digest('base64');
}

export function verifyPaytrCallbackHash(input: {
  readonly payload: PaytrIframeCallbackPayload;
  readonly merchantSalt: string;
  readonly merchantKey: string;
}): boolean {
  const merchantOid = input.payload.merchant_oid;
  const status = input.payload.status;
  const totalAmount = input.payload.total_amount;
  const hash = input.payload.hash;

  if (
    !merchantOid ||
    !status ||
    totalAmount === undefined ||
    totalAmount === null ||
    !hash ||
    !input.merchantSalt ||
    !input.merchantKey
  ) {
    return false;
  }

  const expectedHash = createPaytrCallbackHash({
    merchantOid,
    merchantSalt: input.merchantSalt,
    status,
    totalAmount,
    merchantKey: input.merchantKey,
  });
  const expected = Buffer.from(expectedHash);
  const actual = Buffer.from(hash);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function normalizePaytrCurrency(currency: string | undefined): string | undefined {
  if (!currency) {
    return undefined;
  }

  const normalized = currency.trim().toUpperCase();

  if (normalized === 'TL' || normalized === 'TRY') {
    return 'TRY';
  }

  if (['USD', 'EUR', 'GBP', 'RUB'].includes(normalized)) {
    return normalized;
  }

  return normalized;
}

function normalizePaytrAmount(amount: string | number | undefined): number | undefined {
  if (amount === undefined || amount === null || amount === '') {
    return undefined;
  }

  const normalized = typeof amount === 'number' ? amount : Number(amount);

  return Number.isInteger(normalized) ? normalized : undefined;
}

export function mapPaytrIframeCallbackToPaymentCandidate(input: {
  readonly payload: PaytrIframeCallbackPayload;
  readonly callbackRecordId: string;
  readonly providerName?: string;
  readonly providerMode: ProviderMode;
  readonly merchantKey: string;
  readonly merchantSalt: string;
  readonly paymentAttemptId?: string;
  readonly paymentId?: string;
  readonly checkoutId?: string;
  readonly expectedAmount?: number;
  readonly expectedCurrency?: string;
  readonly occurredAt?: Date;
}): PaytrCallbackMappingResult {
  const merchantOid = input.payload.merchant_oid?.trim();
  const paytrStatus = input.payload.status;
  const paymentAmount = normalizePaytrAmount(input.payload.payment_amount);
  const totalAmount = normalizePaytrAmount(input.payload.total_amount);
  const amountForMatch = paymentAmount ?? totalAmount;
  const currency = normalizePaytrCurrency(input.payload.currency);
  const expectedCurrency = normalizePaytrCurrency(input.expectedCurrency);
  const hashVerified = verifyPaytrCallbackHash({
    payload: input.payload,
    merchantSalt: input.merchantSalt,
    merchantKey: input.merchantKey,
  });
  const riskFlags: string[] = [];

  if (!merchantOid) {
    riskFlags.push('PAYTR_MERCHANT_OID_MISSING');
  }

  if (!hashVerified && merchantOid) {
    riskFlags.push('PAYTR_HASH_FAILED');
  }

  const unsupportedStatus = paytrStatus !== 'success' && paytrStatus !== 'failed';
  if (unsupportedStatus) {
    riskFlags.push('PAYTR_STATUS_UNSUPPORTED');
  }

  const amountMismatch =
    input.expectedAmount !== undefined &&
    amountForMatch !== undefined &&
    input.expectedAmount !== amountForMatch;
  if (amountMismatch) {
    riskFlags.push('PAYTR_AMOUNT_MISMATCH');
  }

  const currencyMismatch =
    expectedCurrency !== undefined &&
    (currency === undefined || expectedCurrency !== currency);
  if (currencyMismatch) {
    riskFlags.push('PAYTR_CURRENCY_MISMATCH');
  }

  if (paytrStatus === 'failed' && input.payload.failed_reason_code) {
    riskFlags.push(`PAYTR_FAILED_REASON_${input.payload.failed_reason_code}`);
  }

  let normalizedStatus: NormalizedPaymentCallbackStatus;
  if (!merchantOid) {
    normalizedStatus = 'rejected_reference_missing';
  } else if (!hashVerified) {
    normalizedStatus = 'signature_failed';
  } else if (unsupportedStatus) {
    normalizedStatus = 'unsupported';
  } else if (amountMismatch) {
    normalizedStatus = 'rejected_amount_mismatch';
  } else if (currencyMismatch) {
    normalizedStatus = 'rejected_currency_mismatch';
  } else {
    normalizedStatus = paytrStatus === 'success' ? 'succeeded' : 'failed';
  }

  const candidate = createNormalizedPaymentCallbackCandidate({
    providerName: input.providerName ?? 'paytr',
    providerMode: input.providerMode,
    callbackRecordId: input.callbackRecordId,
    ...(merchantOid ? { providerEventId: merchantOid, providerReference: merchantOid } : {}),
    ...(merchantOid ? { idempotencyKey: `paytr:${merchantOid}:${paytrStatus}:${input.payload.total_amount}` } : {}),
    callbackType: `paytr.iframe.${paytrStatus}`,
    normalizedStatus,
    ...(input.paymentAttemptId ? { paymentAttemptId: input.paymentAttemptId } : {}),
    ...(input.paymentId ? { paymentId: input.paymentId } : {}),
    ...(input.checkoutId ? { checkoutId: input.checkoutId } : {}),
    ...(amountForMatch !== undefined ? { amount: amountForMatch } : {}),
    ...(currency ? { currency } : {}),
    occurredAt: input.occurredAt ?? new Date(),
    verificationStatus: hashVerified ? 'verified' : 'failed',
    replayStatus: 'first_seen',
    signatureVerified: hashVerified,
    replayDetected: false,
    riskFlags,
  });

  return {
    candidate: !input.paymentAttemptId && candidate.rejectionReason === 'payment_attempt_missing'
      ? { ...candidate, rejectionReason: 'PAYMENT_ATTEMPT_REQUIRED' }
      : candidate,
    hashVerified,
    paytrStatus,
  };
}

// =====================================================================================
// HARDENING-10C10-01: PayTR Status Inquiry Contracts & Helpers
// =====================================================================================

export interface PaytrStatusInquiryRequest {
  readonly merchant_id: string;
  readonly merchant_oid: string;
  readonly paytr_token: string;
}

export interface PaytrStatusInquirySuccessResponse {
  readonly status: 'success';
  readonly merchant_oid?: string;
  readonly payment_amount: string | number;
  readonly payment_total: string | number;
  readonly returns: unknown;
  readonly currency: 'TL' | 'USD' | 'EUR' | 'GBP' | 'RUB' | string;
  readonly test_mode?: '1' | '0';
  readonly [key: string]: unknown;
}

export interface PaytrStatusInquiryErrorResponse {
  readonly status: 'error';
  readonly err_no: string;
  readonly err_msg: string;
  readonly [key: string]: unknown;
}

export type PaytrStatusInquiryResponse =
  | PaytrStatusInquirySuccessResponse
  | PaytrStatusInquiryErrorResponse;

export type NormalizedPaytrStatusInquiryStatus =
  | 'succeeded_candidate'
  | 'status_query_inconclusive'
  | 'status_query_failed'
  | 'rejected_amount_mismatch'
  | 'rejected_currency_mismatch'
  | 'rejected_unexpected_format';

export interface NormalizedPaytrStatusInquiryCandidate {
  readonly providerDomain: 'payment';
  readonly providerName: 'paytr';
  readonly inquiryRef: string;
  readonly merchantOid: string;
  readonly normalizedStatus: NormalizedPaytrStatusInquiryStatus;
  readonly shouldProcess: boolean;
  readonly shouldReconcile: boolean;
  readonly shouldReject: boolean;
  readonly rejectionReason?: string;
  readonly providerResponse: PaytrStatusInquiryResponse;
  readonly occurredAt: Date;
  readonly amountMinor?: number;
  readonly currency?: string;
  readonly boundary: ProviderBoundaryFlags;
}

// =====================================================================================
// HARDENING-10C10-03: Payment Reconciliation Decision Contracts & Helpers
// =====================================================================================

export type ReconciliationStatus =
  | 'reconciliation_required'
  | 'status_query_pending'
  | 'status_query_succeeded'
  | 'status_query_failed'
  | 'status_query_inconclusive'
  | 'manual_review_required'
  | 'reconciled'
  | 'reconciliation_rejected';

export type PaymentReconciliationTriggerReason =
  | 'payment_pending'
  | 'payment_unknown_result'
  | 'callback_requires_reconciliation'
  | 'payment_attempt_missing'
  | 'provider_reference_unresolved'
  | 'status_query_inconclusive'
  | 'status_query_failed'
  | 'terminal_conflict'
  | 'amount_mismatch'
  | 'currency_mismatch'
  | 'manual_review';

export interface PaymentReconciliationTaskCandidate {
  readonly taskId?: string;
  readonly reconciliationRef?: string;
  readonly paymentId?: string;
  readonly paymentAttemptId?: string;
  readonly checkoutId?: string;
  readonly providerName: string;
  readonly providerReference?: string;
  readonly merchantOid?: string;
  readonly triggerReason: PaymentReconciliationTriggerReason;
  readonly status: ReconciliationStatus;
  readonly attemptCount: number;
  readonly maxAttempts: number;
  readonly nextAttemptAt?: Date;
  readonly lastInquiryRef?: string;
  readonly lastCandidate?: NormalizedPaytrStatusInquiryCandidate;
  readonly manualReviewRequired: boolean;
  readonly createdAt: Date;
  readonly updatedAt?: Date;
  readonly boundary: ProviderBoundaryFlags;
}

export type PaymentReconciliationDecisionType =
  | 'no_action'
  | 'schedule_status_query'
  | 'retry_status_query'
  | 'mark_reconciled_candidate'
  | 'reject_reconciliation'
  | 'require_manual_review';

export interface PaymentReconciliationDecision {
  readonly status: ReconciliationStatus;
  readonly decisionType: PaymentReconciliationDecisionType;
  readonly shouldScheduleStatusQuery: boolean;
  readonly shouldRetry: boolean;
  readonly shouldProcessPaymentMutation: false;
  readonly shouldRequireManualReview: boolean;
  readonly reason: PaymentReconciliationTriggerReason | NormalizedPaytrStatusInquiryStatus;
  readonly normalizedStatus?: NormalizedPaytrStatusInquiryStatus;
  readonly boundary: ProviderBoundaryFlags;
}

export interface PaymentReconciliationDecisionInput {
  readonly currentStatus: PaymentState | ReconciliationStatus;
  readonly triggerReason: PaymentReconciliationTriggerReason;
  readonly statusInquiryCandidate?: NormalizedPaytrStatusInquiryCandidate;
  readonly attemptCount: number;
  readonly maxAttempts: number;
  readonly now: Date;
  readonly nextAttemptAt?: Date;
}

export function createPaymentReconciliationTaskCandidate(
  init: Omit<PaymentReconciliationTaskCandidate, 'boundary'>,
): PaymentReconciliationTaskCandidate {
  return {
    ...init,
    boundary: createProviderBoundaryFlags(),
  };
}

export function decidePaymentReconciliationAction(
  input: PaymentReconciliationDecisionInput,
): PaymentReconciliationDecision {
  const boundary = createProviderBoundaryFlags();
  const candidateStatus = input.statusInquiryCandidate?.normalizedStatus;
  const reason = candidateStatus ?? input.triggerReason;
  const canRetry = input.attemptCount < input.maxAttempts;

  const base = {
    shouldProcessPaymentMutation: false as const,
    boundary,
    reason,
    ...(candidateStatus ? { normalizedStatus: candidateStatus } : {}),
  };

  if (input.triggerReason === 'terminal_conflict') {
    return {
      ...base,
      status: 'manual_review_required',
      decisionType: 'require_manual_review',
      shouldScheduleStatusQuery: false,
      shouldRetry: false,
      shouldRequireManualReview: true,
    };
  }

  if (
    candidateStatus === 'rejected_amount_mismatch' ||
    candidateStatus === 'rejected_currency_mismatch' ||
    input.triggerReason === 'amount_mismatch' ||
    input.triggerReason === 'currency_mismatch'
  ) {
    return {
      ...base,
      status: 'manual_review_required',
      decisionType: 'require_manual_review',
      shouldScheduleStatusQuery: false,
      shouldRetry: false,
      shouldRequireManualReview: true,
    };
  }

  if (candidateStatus === 'succeeded_candidate') {
    return {
      ...base,
      status: 'status_query_succeeded',
      decisionType: 'mark_reconciled_candidate',
      shouldScheduleStatusQuery: false,
      shouldRetry: false,
      shouldRequireManualReview: false,
    };
  }

  if (
    candidateStatus === 'status_query_inconclusive' ||
    input.triggerReason === 'status_query_inconclusive'
  ) {
    if (canRetry) {
      return {
        ...base,
        status: 'status_query_inconclusive',
        decisionType: 'retry_status_query',
        shouldScheduleStatusQuery: true,
        shouldRetry: true,
        shouldRequireManualReview: false,
      };
    }

    return {
      ...base,
      status: 'manual_review_required',
      decisionType: 'require_manual_review',
      shouldScheduleStatusQuery: false,
      shouldRetry: false,
      shouldRequireManualReview: true,
    };
  }

  if (
    candidateStatus === 'status_query_failed' ||
    input.triggerReason === 'status_query_failed'
  ) {
    if (canRetry) {
      return {
        ...base,
        status: 'status_query_failed',
        decisionType: 'retry_status_query',
        shouldScheduleStatusQuery: true,
        shouldRetry: true,
        shouldRequireManualReview: false,
      };
    }

    return {
      ...base,
      status: 'manual_review_required',
      decisionType: 'require_manual_review',
      shouldScheduleStatusQuery: false,
      shouldRetry: false,
      shouldRequireManualReview: true,
    };
  }

  if (
    input.currentStatus === 'PENDING' ||
    input.currentStatus === 'UNKNOWN_RESULT' ||
    input.triggerReason === 'payment_pending' ||
    input.triggerReason === 'payment_unknown_result' ||
    input.triggerReason === 'callback_requires_reconciliation' ||
    input.triggerReason === 'payment_attempt_missing' ||
    input.triggerReason === 'provider_reference_unresolved'
  ) {
    return {
      ...base,
      status: 'status_query_pending',
      decisionType: 'schedule_status_query',
      shouldScheduleStatusQuery: true,
      shouldRetry: false,
      shouldRequireManualReview: false,
    };
  }

  if (input.triggerReason === 'manual_review') {
    return {
      ...base,
      status: 'manual_review_required',
      decisionType: 'require_manual_review',
      shouldScheduleStatusQuery: false,
      shouldRetry: false,
      shouldRequireManualReview: true,
    };
  }

  return {
    ...base,
    status: 'reconciliation_required',
    decisionType: 'no_action',
    shouldScheduleStatusQuery: false,
    shouldRetry: false,
    shouldRequireManualReview: false,
  };
}

export type PaymentReconciliationOwnerCommandEligibilityStatus =
  | 'command_ready'
  | 'not_eligible'
  | 'requires_manual_review'
  | 'requires_retry'
  | 'rejected';

export interface PaymentReconciliationOwnerCommandEligibility {
  readonly status: PaymentReconciliationOwnerCommandEligibilityStatus;
  readonly commandType?: PaymentCallbackOwnerCommandType;
  readonly paymentAttemptId?: string;
  readonly paymentId?: string;
  readonly checkoutId?: string;
  readonly providerName: string;
  readonly providerReference?: string;
  readonly callbackRecordId?: string;
  readonly reconciliationRef?: string;
  readonly normalizedStatus?: NormalizedPaytrStatusInquiryStatus;
  readonly shouldProcessPaymentMutation: boolean;
  readonly reason: string;
  readonly boundary: ProviderBoundaryFlags;
}

export function decidePaymentReconciliationOwnerCommandEligibility(input: {
  readonly decision: PaymentReconciliationDecision;
  readonly task: PaymentReconciliationTaskCandidate;
  readonly candidate?: NormalizedPaytrStatusInquiryCandidate;
  readonly paymentAttemptId?: string;
  readonly paymentId?: string;
  readonly checkoutId?: string;
  readonly callbackRecordId?: string;
  readonly reconciliationRef?: string;
}): PaymentReconciliationOwnerCommandEligibility {
  const boundary = createProviderBoundaryFlags();
  const paymentAttemptId = input.paymentAttemptId ?? input.task.paymentAttemptId;
  const paymentId = input.paymentId ?? input.task.paymentId;
  const checkoutId = input.checkoutId ?? input.task.checkoutId;
  const providerReference =
    input.task.providerReference ?? input.candidate?.merchantOid ?? input.task.merchantOid;
  const reconciliationRef = input.reconciliationRef ?? input.task.reconciliationRef;
  const normalizedStatus = input.candidate?.normalizedStatus ?? input.decision.normalizedStatus;
  const base = {
    ...(paymentAttemptId ? { paymentAttemptId } : {}),
    ...(paymentId ? { paymentId } : {}),
    ...(checkoutId ? { checkoutId } : {}),
    providerName: input.task.providerName,
    ...(providerReference ? { providerReference } : {}),
    ...(input.callbackRecordId ? { callbackRecordId: input.callbackRecordId } : {}),
    ...(reconciliationRef ? { reconciliationRef } : {}),
    ...(normalizedStatus ? { normalizedStatus } : {}),
    boundary,
  };

  if (
    input.decision.decisionType === 'mark_reconciled_candidate' &&
    normalizedStatus === 'succeeded_candidate'
  ) {
    if (!paymentAttemptId) {
      return {
        ...base,
        status: 'not_eligible',
        shouldProcessPaymentMutation: false,
        reason: 'payment_attempt_missing',
      };
    }

    return {
      ...base,
      status: 'command_ready',
      commandType: 'MARK_PAYMENT_SUCCEEDED',
      shouldProcessPaymentMutation: true,
      reason: 'succeeded_candidate_guarded_command_ready',
    };
  }

  if (
    normalizedStatus === 'rejected_amount_mismatch' ||
    input.decision.reason === 'amount_mismatch'
  ) {
    return {
      ...base,
      status: 'requires_manual_review',
      shouldProcessPaymentMutation: false,
      reason: 'amount_mismatch',
    };
  }

  if (
    normalizedStatus === 'rejected_currency_mismatch' ||
    input.decision.reason === 'currency_mismatch'
  ) {
    return {
      ...base,
      status: 'requires_manual_review',
      shouldProcessPaymentMutation: false,
      reason: 'currency_mismatch',
    };
  }

  if (input.decision.status === 'manual_review_required') {
    return {
      ...base,
      status: 'requires_manual_review',
      shouldProcessPaymentMutation: false,
      reason: String(input.decision.reason),
    };
  }

  if (
    input.decision.decisionType === 'retry_status_query' ||
    normalizedStatus === 'status_query_inconclusive' ||
    normalizedStatus === 'status_query_failed'
  ) {
    return {
      ...base,
      status: 'requires_retry',
      shouldProcessPaymentMutation: false,
      reason: String(normalizedStatus ?? input.decision.reason),
    };
  }

  if (input.decision.decisionType === 'reject_reconciliation') {
    return {
      ...base,
      status: 'rejected',
      shouldProcessPaymentMutation: false,
      reason: String(input.decision.reason),
    };
  }

  return {
    ...base,
    status: 'not_eligible',
    shouldProcessPaymentMutation: false,
    reason: input.decision.decisionType,
  };
}

export function createPaymentReconciliationOwnerCommand(input: {
  readonly eligibility: PaymentReconciliationOwnerCommandEligibility;
  readonly occurredAt?: Date;
}): PaymentCallbackOwnerCommand | undefined {
  const eligibility = input.eligibility;

  if (
    eligibility.status !== 'command_ready' ||
    eligibility.commandType !== 'MARK_PAYMENT_SUCCEEDED' ||
    !eligibility.paymentAttemptId
  ) {
    return undefined;
  }

  const reconciliationIdentity =
    eligibility.reconciliationRef ?? eligibility.providerReference ?? 'unresolved';
  const idempotencyKey =
    `payment-reconciliation:${eligibility.providerName}:${reconciliationIdentity}:${eligibility.paymentAttemptId}:${eligibility.commandType}`;

  return {
    commandType: 'MARK_PAYMENT_SUCCEEDED',
    providerName: eligibility.providerName,
    ...(eligibility.providerReference ? { providerReference: eligibility.providerReference } : {}),
    callbackRecordId:
      eligibility.callbackRecordId ?? `reconciliation:${reconciliationIdentity}`,
    paymentAttemptId: eligibility.paymentAttemptId,
    ...(eligibility.paymentId ? { paymentId: eligibility.paymentId } : {}),
    ...(eligibility.checkoutId ? { checkoutId: eligibility.checkoutId } : {}),
    normalizedStatus: 'succeeded',
    idempotencyKey,
    occurredAt: input.occurredAt ?? new Date(),
    source: 'reconciliation_worker',
    boundary: eligibility.boundary,
  };
}

export function createPaytrStatusInquiryToken(input: {
  readonly merchantId: string;
  readonly merchantOid: string;
  readonly merchantSalt: string;
  readonly merchantKey: string;
}): string {
  const payload = `${input.merchantId}${input.merchantOid}${input.merchantSalt}`;
  return createHmac('sha256', input.merchantKey).update(payload).digest('base64');
}

export function parsePaytrAmountToMinorUnit(
  amount: number | string | undefined | null,
): number | { error: string } {
  if (amount === undefined || amount === null || amount === '') {
    return { error: 'invalid_input_empty' };
  }
  const strAmount = String(amount).trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(strAmount)) {
    return { error: 'invalid_format' };
  }
  const parts = strAmount.split('.');
  const integerPart = parseInt(parts[0], 10);
  const decimalPart = parts[1] ? parseInt(parts[1].padEnd(2, '0'), 10) : 0;
  if (isNaN(integerPart) || isNaN(decimalPart)) {
    return { error: 'numeric_conversion_failed' };
  }
  return integerPart * 100 + decimalPart;
}

export function mapPaytrStatusInquiryToReconciliationCandidate(input: {
  readonly merchantOid: string;
  readonly expectedAmountMinor: number;
  readonly expectedCurrency: string;
  readonly response: PaytrStatusInquiryResponse;
  readonly occurredAt: Date;
  readonly inquiryRef: string;
}): NormalizedPaytrStatusInquiryCandidate {
  const boundary = createProviderBoundaryFlags();
  const { response } = input;

  if (response.status === 'error') {
    const isInconclusive =
      response.err_msg.includes('merchant_oid ile basarili odeme bulunamadi');
    return {
      providerDomain: 'payment',
      providerName: 'paytr',
      inquiryRef: input.inquiryRef,
      merchantOid: input.merchantOid,
      normalizedStatus: isInconclusive
        ? 'status_query_inconclusive'
        : 'status_query_failed',
      shouldProcess: false,
      shouldReconcile: true,
      shouldReject: false,
      rejectionReason: isInconclusive ? response.err_msg : `PayTR Error: ${response.err_msg} (No: ${response.err_no})`,
      providerResponse: response,
      occurredAt: input.occurredAt,
      boundary,
    };
  }

  const currency = normalizePaytrCurrency(response.currency);
  const paymentAmountMinor = parsePaytrAmountToMinorUnit(response.payment_amount);
  const totalAmountMinor = parsePaytrAmountToMinorUnit(response.payment_total);

  if (typeof paymentAmountMinor === 'object' && typeof totalAmountMinor === 'object') {
    return {
      providerDomain: 'payment',
      providerName: 'paytr',
      inquiryRef: input.inquiryRef,
      merchantOid: input.merchantOid,
      normalizedStatus: 'rejected_unexpected_format',
      shouldProcess: false,
      shouldReconcile: true,
      shouldReject: true,
      rejectionReason: `amount_parse_failed: payment_amount=${paymentAmountMinor.error}, payment_total=${totalAmountMinor.error}`,
      providerResponse: response,
      occurredAt: input.occurredAt,
      currency,
      boundary,
    };
  }

  if (typeof paymentAmountMinor === 'object') {
    return {
      providerDomain: 'payment',
      providerName: 'paytr',
      inquiryRef: input.inquiryRef,
      merchantOid: input.merchantOid,
      normalizedStatus: 'rejected_unexpected_format',
      shouldProcess: false,
      shouldReconcile: true,
      shouldReject: true,
      rejectionReason: `payment_amount_parse_failed: ${paymentAmountMinor.error}`,
      providerResponse: response,
      occurredAt: input.occurredAt,
      currency,
      boundary,
    };
  }

  if (typeof totalAmountMinor === 'object') {
    return {
      providerDomain: 'payment',
      providerName: 'paytr',
      inquiryRef: input.inquiryRef,
      merchantOid: input.merchantOid,
      normalizedStatus: 'rejected_unexpected_format',
      shouldProcess: false,
      shouldReconcile: true,
      shouldReject: true,
      rejectionReason: `payment_total_parse_failed: ${totalAmountMinor.error}`,
      providerResponse: response,
      occurredAt: input.occurredAt,
      currency,
      boundary,
    };
  }

  if (paymentAmountMinor !== totalAmountMinor) {
    return {
      providerDomain: 'payment',
      providerName: 'paytr',
      inquiryRef: input.inquiryRef,
      merchantOid: input.merchantOid,
      normalizedStatus: 'rejected_amount_mismatch',
      shouldProcess: false,
      shouldReconcile: true,
      shouldReject: true,
      rejectionReason: `amount_ambiguity: payment_amount (${paymentAmountMinor}) and payment_total (${totalAmountMinor}) mismatch`,
      providerResponse: response,
      occurredAt: input.occurredAt,
      amountMinor: paymentAmountMinor,
      currency,
      boundary,
    };
  }

  const amountMinor = paymentAmountMinor;

  const currencyMismatch =
    currency === undefined ||
    normalizePaytrCurrency(input.expectedCurrency) !== currency;
  if (currencyMismatch) {
    return {
      providerDomain: 'payment',
      providerName: 'paytr',
      inquiryRef: input.inquiryRef,
      merchantOid: input.merchantOid,
      normalizedStatus: 'rejected_currency_mismatch',
      shouldProcess: false,
      shouldReconcile: true,
      shouldReject: true,
      rejectionReason: `Expected currency ${input.expectedCurrency}, but got ${response.currency}`,
      providerResponse: response,
      occurredAt: input.occurredAt,
      amountMinor,
      currency,
      boundary,
    };
  }

  const amountMismatch = amountMinor !== input.expectedAmountMinor;
  if (amountMismatch) {
    return {
      providerDomain: 'payment',
      providerName: 'paytr',
      inquiryRef: input.inquiryRef,
      merchantOid: input.merchantOid,
      normalizedStatus: 'rejected_amount_mismatch',
      shouldProcess: false,
      shouldReconcile: true,
      shouldReject: true,
      rejectionReason: `Expected amount ${input.expectedAmountMinor}, but got ${amountMinor}`,
      providerResponse: response,
      occurredAt: input.occurredAt,
      amountMinor,
      currency,
      boundary,
    };
  }

  return {
    providerDomain: 'payment',
    providerName: 'paytr',
    inquiryRef: input.inquiryRef,
    merchantOid: input.merchantOid,
    normalizedStatus: 'succeeded_candidate',
    shouldProcess: true, // Let the caller decide to upgrade to a command
    shouldReconcile: false,
    shouldReject: false,
    providerResponse: response,
    occurredAt: input.occurredAt,
    amountMinor,
    currency,
    boundary,
  };
}
