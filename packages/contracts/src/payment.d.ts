import { CartContext } from './cart';
import { ProviderBoundaryFlags, ProviderCallbackReplayStatus, ProviderCallbackVerificationStatus, ProviderMode, ProviderResultEnvelope } from './provider';
export type PaymentState = 'CREATED' | 'INITIATED' | 'PENDING' | 'UNKNOWN_RESULT' | 'FAILED' | 'CANCELLED' | 'SUCCEEDED';
export type PaymentAttemptState = 'CREATED' | 'PROVIDER_REDIRECT_READY' | 'INITIATION_FAILED' | 'PENDING' | 'FAILED' | 'CANCELLED' | 'EXPIRED' | 'UNKNOWN_RESULT' | 'SUCCEEDED';
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
    simulationScenario?: 'succeeded' | 'pending' | 'unknown_result';
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
export type NormalizedPaymentCallbackStatus = 'succeeded' | 'failed' | 'pending' | 'cancelled' | 'expired' | 'unknown_result' | 'duplicate' | 'signature_failed' | 'unsupported' | 'rejected_amount_mismatch' | 'rejected_currency_mismatch' | 'rejected_reference_missing' | 'payment_attempt_not_found' | 'rejected_identity_conflict' | 'rejected_replay' | 'rejected_freshness' | 'ignored';
export type PaymentCallbackOwnerCommandCandidate = 'MARK_PAYMENT_SUCCEEDED' | 'MARK_PAYMENT_FAILED' | 'MARK_PAYMENT_PENDING' | 'MARK_PAYMENT_CANCELLED' | 'MARK_PAYMENT_EXPIRED' | 'NONE';
export type PaymentCallbackOwnerCommandType = 'MARK_PAYMENT_SUCCEEDED' | 'MARK_PAYMENT_FAILED' | 'MARK_PAYMENT_PENDING' | 'MARK_PAYMENT_CANCELLED' | 'MARK_PAYMENT_EXPIRED' | 'MARK_PAYMENT_UNKNOWN_RESULT';
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
export type PaymentCallbackOwnerCommandDecisionStatus = 'command_ready' | 'missing_payment_attempt' | 'candidate_rejected' | 'candidate_requires_reconciliation' | 'candidate_not_processable';
export interface PaymentCallbackOwnerCommandDecision {
    readonly status: PaymentCallbackOwnerCommandDecisionStatus;
    readonly command?: PaymentCallbackOwnerCommand;
    readonly shouldProcess: boolean;
    readonly shouldReject: boolean;
    readonly shouldReconcile: boolean;
    readonly reason?: string;
    readonly boundary: ProviderBoundaryFlags;
}
export type PaymentCallbackLookupStrategy = 'payment_attempt_id' | 'payment_id' | 'provider_reference' | 'idempotency_key' | 'manual_reconciliation';
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
export declare function createPaymentCallbackOwnerCommandIdempotencyKey(input: {
    readonly providerDomain?: 'payment';
    readonly providerName: string;
    readonly providerEventId?: string;
    readonly callbackRecordId: string;
    readonly paymentAttemptId: string;
    readonly commandType: PaymentCallbackOwnerCommandType;
}): string;
export declare function mapPaymentCallbackOwnerCommandCandidateToCommandType(candidate: PaymentCallbackOwnerCommandCandidate): PaymentCallbackOwnerCommandType | undefined;
export declare function decidePaymentCallbackOwnerCommand(input: {
    readonly candidate: NormalizedPaymentCallbackCandidate;
    readonly callbackRecordId: string;
    readonly resolvedPaymentAttemptId?: string;
    readonly resolvedPaymentId?: string;
    readonly resolvedCheckoutId?: string;
}): PaymentCallbackOwnerCommandDecision;
export declare function createPaytrPaymentCallbackLookupPlan(): PaymentCallbackLookupPlan;
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
export declare function decidePaymentCallbackCandidate(input: PaymentCallbackCandidateDecisionInput): PaymentCallbackCandidateDecision;
export declare function createNormalizedPaymentCallbackCandidate(init: Omit<NormalizedPaymentCallbackCandidate, 'providerDomain' | 'ownerCommandCandidate' | 'shouldProcess' | 'shouldReconcile' | 'shouldReject' | 'rejectionReason' | 'boundary'> & {
    readonly providerDomain?: 'payment';
}): NormalizedPaymentCallbackCandidate;
export declare function createPaytrCallbackHash(input: {
    readonly merchantOid: string;
    readonly merchantSalt: string;
    readonly status: string;
    readonly totalAmount: string | number;
    readonly merchantKey: string;
}): string;
export declare function verifyPaytrCallbackHash(input: {
    readonly payload: PaytrIframeCallbackPayload;
    readonly merchantSalt: string;
    readonly merchantKey: string;
}): boolean;
export declare function normalizePaytrCurrency(currency: string | undefined): string | undefined;
export declare function mapPaytrIframeCallbackToPaymentCandidate(input: {
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
}): PaytrCallbackMappingResult;
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
export type PaytrStatusInquiryResponse = PaytrStatusInquirySuccessResponse | PaytrStatusInquiryErrorResponse;
export type NormalizedPaytrStatusInquiryStatus = 'succeeded_candidate' | 'status_query_inconclusive' | 'status_query_failed' | 'rejected_amount_mismatch' | 'rejected_currency_mismatch' | 'rejected_unexpected_format';
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
export type ReconciliationStatus = 'reconciliation_required' | 'status_query_pending' | 'status_query_succeeded' | 'status_query_failed' | 'status_query_inconclusive' | 'manual_review_required' | 'reconciled' | 'reconciliation_rejected';
export type PaymentReconciliationTriggerReason = 'payment_pending' | 'payment_unknown_result' | 'callback_requires_reconciliation' | 'payment_attempt_missing' | 'provider_reference_unresolved' | 'status_query_inconclusive' | 'status_query_failed' | 'terminal_conflict' | 'amount_mismatch' | 'currency_mismatch' | 'manual_review';
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
export type PaymentReconciliationDecisionType = 'no_action' | 'schedule_status_query' | 'retry_status_query' | 'mark_reconciled_candidate' | 'reject_reconciliation' | 'require_manual_review';
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
export declare function createPaymentReconciliationTaskCandidate(init: Omit<PaymentReconciliationTaskCandidate, 'boundary'>): PaymentReconciliationTaskCandidate;
export declare function decidePaymentReconciliationAction(input: PaymentReconciliationDecisionInput): PaymentReconciliationDecision;
export type PaymentReconciliationOwnerCommandEligibilityStatus = 'command_ready' | 'not_eligible' | 'requires_manual_review' | 'requires_retry' | 'rejected';
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
export declare function decidePaymentReconciliationOwnerCommandEligibility(input: {
    readonly decision: PaymentReconciliationDecision;
    readonly task: PaymentReconciliationTaskCandidate;
    readonly candidate?: NormalizedPaytrStatusInquiryCandidate;
    readonly paymentAttemptId?: string;
    readonly paymentId?: string;
    readonly checkoutId?: string;
    readonly callbackRecordId?: string;
    readonly reconciliationRef?: string;
}): PaymentReconciliationOwnerCommandEligibility;
export declare function createPaymentReconciliationOwnerCommand(input: {
    readonly eligibility: PaymentReconciliationOwnerCommandEligibility;
    readonly occurredAt?: Date;
}): PaymentCallbackOwnerCommand | undefined;
export declare function createPaytrStatusInquiryToken(input: {
    readonly merchantId: string;
    readonly merchantOid: string;
    readonly merchantSalt: string;
    readonly merchantKey: string;
}): string;
export declare function parsePaytrAmountToMinorUnit(amount: number | string | undefined | null): number | {
    error: string;
};
export declare function mapPaytrStatusInquiryToReconciliationCandidate(input: {
    readonly merchantOid: string;
    readonly expectedAmountMinor: number;
    readonly expectedCurrency: string;
    readonly response: PaytrStatusInquiryResponse;
    readonly occurredAt: Date;
    readonly inquiryRef: string;
}): NormalizedPaytrStatusInquiryCandidate;
//# sourceMappingURL=payment.d.ts.map