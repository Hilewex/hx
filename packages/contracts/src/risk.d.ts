export type RiskTargetType = 'ACCOUNT' | 'CHECKOUT' | 'PAYMENT' | 'ORDER' | 'REFUND' | 'COUPON' | 'POINT' | 'INTERACTION' | 'REVIEW' | 'STORY' | 'STORE' | 'SUPPLIER' | 'CREATOR';
export type RiskSignalType = 'ACCOUNT_VELOCITY' | 'COUPON_ABUSE' | 'POINT_ABUSE' | 'INTERACTION_ABUSE' | 'PAYMENT_ANOMALY' | 'REFUND_ABUSE' | 'MULTI_ACCOUNT_PATTERN' | 'STORE_MANIPULATION' | 'SUPPLIER_ANOMALY' | 'CREATOR_ABUSE' | 'MANUAL_REPORT';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskCaseStatus = 'OPEN' | 'UNDER_REVIEW' | 'ADVISORY_HOLD_RECOMMENDED' | 'REVIEW_REQUIRED' | 'NO_ACTION' | 'ESCALATED' | 'CLOSED';
export type RiskDecision = 'NO_ACTION' | 'MARK_REVIEW_REQUIRED' | 'RECOMMEND_HOLD' | 'RELEASE_RECOMMENDATION' | 'ESCALATE' | 'CLOSE';
export type RiskSource = 'SYSTEM_RULE' | 'SUPPORT_ESCALATION' | 'MODERATION_ESCALATION' | 'PAYMENT_SIGNAL' | 'ORDER_SIGNAL' | 'REFUND_SIGNAL' | 'ADMIN_REVIEW' | 'FOUNDATION_SIMULATION';
export type RiskReasonCode = 'SUSPICIOUS_VELOCITY' | 'COUPON_ABUSE' | 'POINT_ABUSE' | 'MULTI_ACCOUNT' | 'PAYMENT_ANOMALY' | 'REFUND_ABUSE' | 'BOT_LIKE_BEHAVIOR' | 'INTERACTION_MANIPULATION' | 'SUPPLIER_ANOMALY' | 'CREATOR_ABUSE' | 'UNKNOWN';
export interface RiskTargetRef {
    targetId: string;
    targetType: RiskTargetType;
}
export interface RiskSignal {
    signalId: string;
    target: RiskTargetRef;
    type: RiskSignalType;
    level: RiskLevel;
    source: RiskSource;
    reasonCode: RiskReasonCode;
    metadata?: Record<string, any>;
    idempotencyKey?: string;
    createdAt: string;
    riskTruthMutated: boolean;
    targetTruthMutated: boolean;
    paymentTruthMutated: boolean;
    orderTruthMutated: boolean;
    refundTruthMutated: boolean;
    financeTruthMutated: boolean;
    moderationTruthMutated: boolean;
}
export interface RiskCase {
    caseId: string;
    target: RiskTargetRef;
    status: RiskCaseStatus;
    level: RiskLevel;
    source: RiskSource;
    decision?: RiskDecision;
    reasonCode: RiskReasonCode;
    notes?: string;
    signals: string[];
    idempotencyKey?: string;
    createdAt: string;
    updatedAt: string;
    riskTruthMutated: boolean;
    targetTruthMutated: boolean;
    paymentTruthMutated: boolean;
    orderTruthMutated: boolean;
    refundTruthMutated: boolean;
    financeTruthMutated: boolean;
    moderationTruthMutated: boolean;
}
export interface CreateRiskSignalCommand {
    target: RiskTargetRef;
    type: RiskSignalType;
    level: RiskLevel;
    source: RiskSource;
    reasonCode: RiskReasonCode;
    metadata?: Record<string, any>;
    idempotencyKey?: string;
    correlationId?: string;
}
export interface CreateRiskCaseCommand {
    target: RiskTargetRef;
    level: RiskLevel;
    source: RiskSource;
    reasonCode: RiskReasonCode;
    signals?: string[];
    notes?: string;
    idempotencyKey?: string;
    correlationId?: string;
}
export interface ReviewRiskCaseCommand {
    caseId: string;
    decision: RiskDecision;
    notes?: string;
    reviewerId: string;
    correlationId?: string;
}
export interface GetRiskCaseQuery {
    caseId: string;
}
export interface ListRiskCasesQuery {
    targetId?: string;
    targetType?: RiskTargetType;
    status?: RiskCaseStatus;
    level?: RiskLevel;
    limit?: number;
    offset?: number;
}
export interface RiskMutationResult {
    success: boolean;
    caseId?: string;
    signalId?: string;
    warnings?: string[];
}
export interface RiskCaseResponse {
    case: RiskCase;
}
export interface RiskCaseListResponse {
    cases: RiskCase[];
    total: number;
}
export interface RiskSignalResponse {
    signal: RiskSignal;
}
//# sourceMappingURL=risk.d.ts.map