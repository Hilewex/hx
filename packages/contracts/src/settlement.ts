export type SettlementSourceType =
  | 'ORDER'
  | 'ORDER_LINE'
  | 'REFUND'
  | 'CANCEL_RETURN'
  | 'FINANCE_CORRECTION'
  | 'RISK'
  | 'MANUAL_FOUNDATION';

export type SettlementPartyType =
  | 'PLATFORM'
  | 'CREATOR'
  | 'SUPPLIER'
  | 'UNKNOWN';

export type SettlementLineStatus =
  | 'PENDING'
  | 'CONDITIONALLY_EARNED'
  | 'BLOCKED'
  | 'SETTLED'
  | 'REVERSED'
  | 'CANCELLED'
  | 'CLOSED';

export type SettlementReasonCode =
  | 'ORDER_CREATED_FOUNDATION'
  | 'DELIVERY_PENDING'
  | 'DELIVERY_CONFIRMED'
  | 'CANCEL_RETURN_ACTIVE'
  | 'REFUND_ACTIVE'
  | 'REFUND_SUCCEEDED'
  | 'FINANCE_CORRECTION_REQUIRED'
  | 'RISK_HOLD_RECOMMENDED'
  | 'SETTLEMENT_RULE_SOURCE_NOT_AVAILABLE'
  | 'MANUAL_REVIEW'
  | 'UNKNOWN';

export type SettlementActionType =
  | 'MARK_CONDITIONALLY_EARNED'
  | 'MARK_BLOCKED'
  | 'MARK_SETTLED'
  | 'MARK_REVERSED'
  | 'MARK_CANCELLED'
  | 'CLOSE';

export interface SettlementAmountSummary {
  currency: string;
  grossAmount: number;
  discountAmount?: number;
  netAmount: number;
  platformShareAmount?: number;
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
