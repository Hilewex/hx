import type { CheckoutDiscountLineAllocation } from './coupon';
export type SettlementSourceType = 'ORDER' | 'ORDER_LINE' | 'LEDGER_ENTRY' | 'REFUND' | 'MANUAL_ADJUSTMENT' | 'CANCEL_RETURN' | 'FINANCE_CORRECTION' | 'RISK' | 'MANUAL_FOUNDATION';
export type SettlementCalculationLineType = 'GROSS_SALE' | 'PLATFORM_COMMISSION' | 'SUPPLIER_NET' | 'CREATOR_MARGIN' | 'CREATOR_SHARE' | 'BRAND_SHARE' | 'COUPON_SPONSOR_IMPACT' | 'CAMPAIGN_SPONSOR_IMPACT' | 'PLATFORM_DISCOUNT_COST' | 'CREATOR_DISCOUNT_COST' | 'REFUND_ADJUSTMENT' | 'COUPON_SPONSOR_ADJUSTMENT' | 'MANUAL_ADJUSTMENT';
export type SettlementStatus = 'CALCULATED' | 'BLOCKED' | 'SUPERSEDED';
export type SettlementLimitationFlag = 'CREATOR_SHARE_NOT_CALCULATED' | 'BRAND_SHARE_NOT_CALCULATED' | 'COUPON_SPONSOR_IMPACT_NOT_CALCULATED' | 'REFUND_SETTLEMENT_IMPACT_NOT_CALCULATED' | 'RULE_SOURCE_NOT_AVAILABLE' | 'DUPLICATE_IDEMPOTENCY_KEY_CONFLICT';
export type SettlementPartyType = 'PLATFORM' | 'CREATOR' | 'SUPPLIER' | 'BRAND' | 'UNKNOWN';
export type SettlementLineStatus = 'PENDING' | 'CONDITIONALLY_EARNED' | 'BLOCKED' | 'SETTLED' | 'REVERSED' | 'CANCELLED' | 'CLOSED';
export type SettlementReasonCode = 'ORDER_CREATED_FOUNDATION' | 'DELIVERY_PENDING' | 'DELIVERY_CONFIRMED' | 'CANCEL_RETURN_ACTIVE' | 'REFUND_ACTIVE' | 'REFUND_SUCCEEDED' | 'FINANCE_CORRECTION_REQUIRED' | 'RISK_HOLD_RECOMMENDED' | 'SETTLEMENT_RULE_SOURCE_NOT_AVAILABLE' | 'MANUAL_REVIEW' | 'UNKNOWN';
export type SettlementActionType = 'MARK_CONDITIONALLY_EARNED' | 'MARK_BLOCKED' | 'MARK_SETTLED' | 'MARK_REVERSED' | 'MARK_CANCELLED' | 'CLOSE';
export interface SettlementAmountSummary {
    currency: string;
    grossAmount: number;
    discountAmount?: number;
    netAmount: number;
    platformShareAmount?: number;
    creatorMarginAmount?: number;
    creatorShareAmount?: number;
    supplierShareAmount?: number;
    ruleSourceAvailable: boolean;
    calculationFinalized: boolean;
}
export interface SettlementImpactSummary {
    payoutEligible: boolean;
    payoutBlocked: boolean;
    refundImpactPending: boolean;
    financeCorrectionPending: boolean;
    riskHoldActive: boolean;
    actualPayoutMutationPerformed: false;
    actualPaymentMutationPerformed: false;
    actualRefundMutationPerformed: false;
    actualOrderMutationPerformed: false;
    actualCancelReturnMutationPerformed: false;
    actualFinanceCorrectionMutationPerformed: false;
    actualRiskMutationPerformed: false;
}
export interface SettlementSourceRef {
    sourceType: SettlementSourceType;
    sourceId: string;
    sourceState?: string;
    metadata?: Record<string, any>;
}
export interface SettlementCalculationInput {
    idempotencyKey: string;
    sourceType: SettlementSourceType;
    sourceId: string;
    currency: string;
    grossAmount: number;
    platformCommissionRate?: number;
    selectedSalePrice?: number;
    poolBasePriceAmount?: number;
    creatorStoreId?: string;
    commercialProductId?: string;
    priceSelectionId?: string;
    poolBasePriceSourceId?: string;
    supplierId?: string;
    creatorId?: string;
    brandId?: string;
    couponSponsorType?: string;
    couponSponsorId?: string;
    discountLineAllocations?: CheckoutDiscountLineAllocation[];
    refundId?: string;
    metadata?: Record<string, any>;
}
export interface SettlementCalculationLine {
    settlementLineId: string;
    type: SettlementCalculationLineType;
    amount: number;
    currency: string;
    counterpartyType?: SettlementPartyType;
    counterpartyId?: string;
    sourceType: SettlementSourceType;
    sourceId: string;
    metadata?: Record<string, any>;
}
export interface SettlementCalculationSummary {
    inputSourceType: SettlementSourceType;
    inputSourceId: string;
    ruleSourceAvailable: boolean;
    calculationFinalized: boolean;
    duplicateCalculation: boolean;
    ledgerEntryCreated: false;
    payoutCreated: false;
    payableCreated: false;
    paidOutCreated: false;
    orderStateMutated: false;
    paymentStateMutated: false;
    refundStateMutated: false;
    discountSponsorImpactAmount?: number;
    platformDiscountCostAmount?: number;
    creatorDiscountCostAmount?: number;
    supplierDiscountCostAmount?: number;
    brandDiscountCostAmount?: number;
    discountSponsorImpactLineCount?: number;
}
export interface SettlementCalculationResult {
    settlementId: string;
    idempotencyKey: string;
    status: SettlementStatus;
    grossAmount: number;
    platformShareAmount: number;
    supplierNetAmount: number;
    creatorMarginAmount?: number;
    creatorShareAmount?: number;
    brandShareAmount?: number;
    lines: SettlementCalculationLine[];
    limitationFlags?: SettlementLimitationFlag[];
    summary: SettlementCalculationSummary;
    duplicateOfSettlementId?: string;
    errors?: string[];
    createdAt: string;
}
export interface SettlementLine {
    settlementLineId: string;
    orderId: string;
    orderLineId: string;
    storefrontId: string;
    productId: string;
    variantId?: string;
    partyType: SettlementPartyType;
    partyId?: string;
    status: SettlementLineStatus;
    reasonCode: SettlementReasonCode;
    amountSummary: SettlementAmountSummary;
    impactSummary: SettlementImpactSummary;
    sourceRefs: SettlementSourceRef[];
    idempotencyKey?: string;
    createdAt: string;
    updatedAt: string;
    errors: string[];
    warnings: string[];
}
export interface CreateSettlementFromOrderCommand {
    orderId: string;
    idempotencyKey?: string;
    correlationId?: string;
}
export interface ApplySettlementActionCommand {
    settlementLineId: string;
    action: SettlementActionType;
    actorId: string;
    note?: string;
    correlationId?: string;
}
export interface GetSettlementLineQuery {
    settlementLineId: string;
}
export interface ListSettlementLinesQuery {
    orderId?: string;
    orderLineId?: string;
    storefrontId?: string;
    partyType?: SettlementPartyType;
    status?: SettlementLineStatus;
    reasonCode?: SettlementReasonCode;
    limit?: number;
    offset?: number;
}
export interface SettlementMutationResult {
    success: boolean;
    settlementLineId?: string;
    settlementLine?: SettlementLine;
    settlementLines?: SettlementLine[];
    errors?: string[];
    warnings?: string[];
}
export interface SettlementLineResponse {
    settlementLine: SettlementLine;
}
export interface SettlementLineListResponse {
    settlementLines: SettlementLine[];
    total: number;
}
//# sourceMappingURL=settlement.d.ts.map