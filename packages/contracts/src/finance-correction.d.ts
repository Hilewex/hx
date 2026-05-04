export type FinanceCorrectionSourceType = 'PAYMENT' | 'ORDER' | 'REFUND' | 'CANCEL_RETURN' | 'RISK' | 'MANUAL_FOUNDATION';
export type FinanceCorrectionReasonCode = 'REFUND_SOURCE_PAYMENT_REFERENCE_MISSING' | 'REFUND_AMOUNT_SOURCE_NOT_AVAILABLE' | 'SETTLEMENT_IMPACT_PENDING' | 'PAYOUT_IMPACT_PENDING' | 'PAYMENT_ORDER_RECONCILIATION_REQUIRED' | 'CANCEL_RETURN_REFUND_MISMATCH' | 'RISK_HOLD_ADVISORY' | 'MANUAL_FINANCE_REVIEW' | 'UNKNOWN';
export type FinanceCorrectionStatus = 'CREATED' | 'UNDER_REVIEW' | 'ADVISORY_RECORDED' | 'RESOLVED' | 'REJECTED' | 'CLOSED';
export type FinanceCorrectionSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
export type FinanceCorrectionActionType = 'RECORD_ADVISORY' | 'MARK_REVIEW_REQUIRED' | 'MARK_RESOLVED' | 'REJECT' | 'CLOSE';
export interface FinanceCorrectionTargetRef {
    targetType: FinanceCorrectionSourceType;
    targetId: string;
}
export interface FinanceCorrectionSourceRef {
    sourceType: FinanceCorrectionSourceType;
    sourceId: string;
    sourceState?: string;
    metadata?: Record<string, any>;
}
export interface FinanceCorrectionAmountSummary {
    currency: string;
    expectedAmount?: number;
    actualAmount?: number;
    deltaAmount?: number;
    amountSourceAvailable: boolean;
}
export interface FinanceCorrectionImpactSummary {
    settlementCorrectionRequired: boolean;
    payoutCorrectionRequired: boolean;
    paymentCorrectionRequired: boolean;
    refundCorrectionRequired: boolean;
    advisoryOnly: true;
    actualSettlementMutationPerformed: false;
    actualPayoutMutationPerformed: false;
    actualPaymentMutationPerformed: false;
    actualRefundMutationPerformed: false;
    actualOrderMutationPerformed: false;
    actualCancelReturnMutationPerformed: false;
    actualRiskMutationPerformed: false;
}
export interface FinanceCorrectionRecord {
    correctionId: string;
    target: FinanceCorrectionTargetRef;
    status: FinanceCorrectionStatus;
    severity: FinanceCorrectionSeverity;
    reasonCode: FinanceCorrectionReasonCode;
    sourceRefs: FinanceCorrectionSourceRef[];
    amountSummary: FinanceCorrectionAmountSummary;
    impactSummary: FinanceCorrectionImpactSummary;
    notes?: string;
    idempotencyKey?: string;
    createdAt: string;
    updatedAt: string;
    errors: string[];
    warnings: string[];
}
export interface CreateFinanceCorrectionCommand {
    target: FinanceCorrectionTargetRef;
    reasonCode: FinanceCorrectionReasonCode;
    severity?: FinanceCorrectionSeverity;
    sourceRefs?: FinanceCorrectionSourceRef[];
    amountSummary?: Partial<FinanceCorrectionAmountSummary>;
    notes?: string;
    idempotencyKey?: string;
    correlationId?: string;
}
export interface ReviewFinanceCorrectionCommand {
    correctionId: string;
    action: FinanceCorrectionActionType;
    reviewerId: string;
    note?: string;
    correlationId?: string;
}
export interface GetFinanceCorrectionQuery {
    correctionId: string;
}
export interface ListFinanceCorrectionsQuery {
    targetType?: FinanceCorrectionSourceType;
    targetId?: string;
    status?: FinanceCorrectionStatus;
    reasonCode?: FinanceCorrectionReasonCode;
    severity?: FinanceCorrectionSeverity;
    limit?: number;
    offset?: number;
}
export interface FinanceCorrectionMutationResult {
    success: boolean;
    correctionId?: string;
    correction?: FinanceCorrectionRecord;
    errors?: string[];
    warnings?: string[];
}
export interface FinanceCorrectionResponse {
    correction: FinanceCorrectionRecord;
}
export interface FinanceCorrectionListResponse {
    corrections: FinanceCorrectionRecord[];
    total: number;
}
//# sourceMappingURL=finance-correction.d.ts.map