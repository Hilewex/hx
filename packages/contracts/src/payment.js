"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentCallbackOwnerCommandIdempotencyKey = createPaymentCallbackOwnerCommandIdempotencyKey;
exports.mapPaymentCallbackOwnerCommandCandidateToCommandType = mapPaymentCallbackOwnerCommandCandidateToCommandType;
exports.decidePaymentCallbackOwnerCommand = decidePaymentCallbackOwnerCommand;
exports.createPaytrPaymentCallbackLookupPlan = createPaytrPaymentCallbackLookupPlan;
exports.decidePaymentCallbackCandidate = decidePaymentCallbackCandidate;
exports.createNormalizedPaymentCallbackCandidate = createNormalizedPaymentCallbackCandidate;
exports.createPaytrCallbackHash = createPaytrCallbackHash;
exports.verifyPaytrCallbackHash = verifyPaytrCallbackHash;
exports.normalizePaytrCurrency = normalizePaytrCurrency;
exports.mapPaytrIframeCallbackToPaymentCandidate = mapPaytrIframeCallbackToPaymentCandidate;
exports.createPaymentReconciliationTaskCandidate = createPaymentReconciliationTaskCandidate;
exports.decidePaymentReconciliationAction = decidePaymentReconciliationAction;
exports.decidePaymentReconciliationOwnerCommandEligibility = decidePaymentReconciliationOwnerCommandEligibility;
exports.createPaymentReconciliationOwnerCommand = createPaymentReconciliationOwnerCommand;
exports.createPaytrStatusInquiryToken = createPaytrStatusInquiryToken;
exports.parsePaytrAmountToMinorUnit = parsePaytrAmountToMinorUnit;
exports.mapPaytrStatusInquiryToReconciliationCandidate = mapPaytrStatusInquiryToReconciliationCandidate;
const node_crypto_1 = require("node:crypto");
const provider_1 = require("./provider");
function createPaymentCallbackOwnerCommandIdempotencyKey(input) {
    const providerDomain = input.providerDomain ?? 'payment';
    if (input.providerEventId) {
        return `payment-callback:${providerDomain}:${input.providerName}:${input.providerEventId}:${input.paymentAttemptId}:${input.commandType}`;
    }
    return `payment-callback:${providerDomain}:${input.providerName}:record:${input.callbackRecordId}:${input.paymentAttemptId}:${input.commandType}`;
}
function mapPaymentCallbackOwnerCommandCandidateToCommandType(candidate) {
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
function decidePaymentCallbackOwnerCommand(input) {
    const boundary = (0, provider_1.createProviderBoundaryFlags)();
    const candidate = input.candidate;
    const paymentAttemptId = input.resolvedPaymentAttemptId ?? candidate.paymentAttemptId;
    if (candidate.shouldReject ||
        !candidate.signatureVerified ||
        candidate.replayDetected ||
        (candidate.normalizedStatus === 'succeeded' && candidate.verificationStatus !== 'verified')) {
        return {
            status: 'candidate_rejected',
            shouldProcess: false,
            shouldReject: true,
            shouldReconcile: candidate.shouldReconcile,
            reason: candidate.rejectionReason ??
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
    const commandType = mapPaymentCallbackOwnerCommandCandidateToCommandType(candidate.ownerCommandCandidate);
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
function createPaytrPaymentCallbackLookupPlan() {
    return {
        primary: 'provider_reference',
        fallbacks: ['payment_attempt_id', 'idempotency_key', 'manual_reconciliation'],
        providerReferenceStrategy: 'paytr_merchant_oid_as_provider_reference',
        requiresInitiateContract: true,
        boundary: (0, provider_1.createProviderBoundaryFlags)(),
    };
}
const OWNER_COMMAND_BY_STATUS = {
    succeeded: 'MARK_PAYMENT_SUCCEEDED',
    failed: 'MARK_PAYMENT_FAILED',
    pending: 'MARK_PAYMENT_PENDING',
    cancelled: 'MARK_PAYMENT_CANCELLED',
    expired: 'MARK_PAYMENT_EXPIRED',
};
const RECONCILIATION_STATUSES = new Set([
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
const REJECT_REASONS = {
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
function decidePaymentCallbackCandidate(input) {
    const verificationFailed = input.verificationStatus === 'failed' ||
        input.verificationStatus === 'unsupported' ||
        input.normalizedStatus === 'signature_failed' ||
        (input.verificationStatus === 'verified' && !input.signatureVerified);
    const replayRejected = input.replayDetected ||
        input.replayStatus === 'replay_detected' ||
        input.normalizedStatus === 'rejected_replay';
    const missingPaymentAttempt = !input.paymentAttemptId && input.normalizedStatus !== 'ignored';
    const statusRejectReason = REJECT_REASONS[input.normalizedStatus];
    const shouldReject = Boolean(statusRejectReason || verificationFailed || replayRejected || missingPaymentAttempt);
    const shouldReconcile = RECONCILIATION_STATUSES.has(input.normalizedStatus) ||
        (missingPaymentAttempt && input.normalizedStatus !== 'duplicate') ||
        input.normalizedStatus === 'unknown_result';
    const ownerCommandCandidate = shouldReject || missingPaymentAttempt
        ? 'NONE'
        : OWNER_COMMAND_BY_STATUS[input.normalizedStatus] ?? 'NONE';
    const shouldProcess = ownerCommandCandidate !== 'NONE' && !shouldReject;
    const rejectionReason = statusRejectReason ??
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
function createNormalizedPaymentCallbackCandidate(init) {
    const decision = decidePaymentCallbackCandidate(init);
    return {
        ...init,
        providerDomain: 'payment',
        ownerCommandCandidate: decision.ownerCommandCandidate,
        shouldProcess: decision.shouldProcess,
        shouldReconcile: decision.shouldReconcile,
        shouldReject: decision.shouldReject,
        ...(decision.rejectionReason ? { rejectionReason: decision.rejectionReason } : {}),
        boundary: (0, provider_1.createProviderBoundaryFlags)(),
    };
}
function createPaytrCallbackHash(input) {
    const payload = `${input.merchantOid}${input.merchantSalt}${input.status}${input.totalAmount}`;
    return (0, node_crypto_1.createHmac)('sha256', input.merchantKey)
        .update(payload)
        .digest('base64');
}
function verifyPaytrCallbackHash(input) {
    const merchantOid = input.payload.merchant_oid;
    const status = input.payload.status;
    const totalAmount = input.payload.total_amount;
    const hash = input.payload.hash;
    if (!merchantOid ||
        !status ||
        totalAmount === undefined ||
        totalAmount === null ||
        !hash ||
        !input.merchantSalt ||
        !input.merchantKey) {
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
    return expected.length === actual.length && (0, node_crypto_1.timingSafeEqual)(expected, actual);
}
function normalizePaytrCurrency(currency) {
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
function normalizePaytrAmount(amount) {
    if (amount === undefined || amount === null || amount === '') {
        return undefined;
    }
    const normalized = typeof amount === 'number' ? amount : Number(amount);
    return Number.isInteger(normalized) ? normalized : undefined;
}
function mapPaytrIframeCallbackToPaymentCandidate(input) {
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
    const riskFlags = [];
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
    const amountMismatch = input.expectedAmount !== undefined &&
        amountForMatch !== undefined &&
        input.expectedAmount !== amountForMatch;
    if (amountMismatch) {
        riskFlags.push('PAYTR_AMOUNT_MISMATCH');
    }
    const currencyMismatch = expectedCurrency !== undefined &&
        (currency === undefined || expectedCurrency !== currency);
    if (currencyMismatch) {
        riskFlags.push('PAYTR_CURRENCY_MISMATCH');
    }
    if (paytrStatus === 'failed' && input.payload.failed_reason_code) {
        riskFlags.push(`PAYTR_FAILED_REASON_${input.payload.failed_reason_code}`);
    }
    let normalizedStatus;
    if (!merchantOid) {
        normalizedStatus = 'rejected_reference_missing';
    }
    else if (!hashVerified) {
        normalizedStatus = 'signature_failed';
    }
    else if (unsupportedStatus) {
        normalizedStatus = 'unsupported';
    }
    else if (amountMismatch) {
        normalizedStatus = 'rejected_amount_mismatch';
    }
    else if (currencyMismatch) {
        normalizedStatus = 'rejected_currency_mismatch';
    }
    else {
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
function createPaymentReconciliationTaskCandidate(init) {
    return {
        ...init,
        boundary: (0, provider_1.createProviderBoundaryFlags)(),
    };
}
function decidePaymentReconciliationAction(input) {
    const boundary = (0, provider_1.createProviderBoundaryFlags)();
    const candidateStatus = input.statusInquiryCandidate?.normalizedStatus;
    const reason = candidateStatus ?? input.triggerReason;
    const canRetry = input.attemptCount < input.maxAttempts;
    const base = {
        shouldProcessPaymentMutation: false,
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
    if (candidateStatus === 'rejected_amount_mismatch' ||
        candidateStatus === 'rejected_currency_mismatch' ||
        input.triggerReason === 'amount_mismatch' ||
        input.triggerReason === 'currency_mismatch') {
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
    if (candidateStatus === 'status_query_inconclusive' ||
        input.triggerReason === 'status_query_inconclusive') {
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
    if (candidateStatus === 'status_query_failed' ||
        input.triggerReason === 'status_query_failed') {
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
    if (input.currentStatus === 'PENDING' ||
        input.currentStatus === 'UNKNOWN_RESULT' ||
        input.triggerReason === 'payment_pending' ||
        input.triggerReason === 'payment_unknown_result' ||
        input.triggerReason === 'callback_requires_reconciliation' ||
        input.triggerReason === 'payment_attempt_missing' ||
        input.triggerReason === 'provider_reference_unresolved') {
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
function decidePaymentReconciliationOwnerCommandEligibility(input) {
    const boundary = (0, provider_1.createProviderBoundaryFlags)();
    const paymentAttemptId = input.paymentAttemptId ?? input.task.paymentAttemptId;
    const paymentId = input.paymentId ?? input.task.paymentId;
    const checkoutId = input.checkoutId ?? input.task.checkoutId;
    const providerReference = input.task.providerReference ?? input.candidate?.merchantOid ?? input.task.merchantOid;
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
    if (input.decision.decisionType === 'mark_reconciled_candidate' &&
        normalizedStatus === 'succeeded_candidate') {
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
    if (normalizedStatus === 'rejected_amount_mismatch' ||
        input.decision.reason === 'amount_mismatch') {
        return {
            ...base,
            status: 'requires_manual_review',
            shouldProcessPaymentMutation: false,
            reason: 'amount_mismatch',
        };
    }
    if (normalizedStatus === 'rejected_currency_mismatch' ||
        input.decision.reason === 'currency_mismatch') {
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
    if (input.decision.decisionType === 'retry_status_query' ||
        normalizedStatus === 'status_query_inconclusive' ||
        normalizedStatus === 'status_query_failed') {
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
function createPaymentReconciliationOwnerCommand(input) {
    const eligibility = input.eligibility;
    if (eligibility.status !== 'command_ready' ||
        eligibility.commandType !== 'MARK_PAYMENT_SUCCEEDED' ||
        !eligibility.paymentAttemptId) {
        return undefined;
    }
    const reconciliationIdentity = eligibility.reconciliationRef ?? eligibility.providerReference ?? 'unresolved';
    const idempotencyKey = `payment-reconciliation:${eligibility.providerName}:${reconciliationIdentity}:${eligibility.paymentAttemptId}:${eligibility.commandType}`;
    return {
        commandType: 'MARK_PAYMENT_SUCCEEDED',
        providerName: eligibility.providerName,
        ...(eligibility.providerReference ? { providerReference: eligibility.providerReference } : {}),
        callbackRecordId: eligibility.callbackRecordId ?? `reconciliation:${reconciliationIdentity}`,
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
function createPaytrStatusInquiryToken(input) {
    const payload = `${input.merchantId}${input.merchantOid}${input.merchantSalt}`;
    return (0, node_crypto_1.createHmac)('sha256', input.merchantKey).update(payload).digest('base64');
}
function parsePaytrAmountToMinorUnit(amount) {
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
function mapPaytrStatusInquiryToReconciliationCandidate(input) {
    const boundary = (0, provider_1.createProviderBoundaryFlags)();
    const { response } = input;
    if (response.status === 'error') {
        const isInconclusive = response.err_msg.includes('merchant_oid ile basarili odeme bulunamadi');
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
    const currencyMismatch = currency === undefined ||
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
