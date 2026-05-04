export type RefundState =
  | 'CREATED'
  | 'VALIDATED'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'UNKNOWN_RESULT'
  | 'RECONCILIATION_REQUIRED'
  | 'CLOSED';

export type RefundSourceType = 'CANCEL' | 'RETURN';

export type RefundReasonType =
  | 'CUSTOMER_CANCEL'
  | 'RETURN_APPROVED'
  | 'OPERATIONAL_ADJUSTMENT'
  | 'MANUAL_REVIEW';

export interface CreateRefundFromCancelReturnCommand {
  cancelReturnRequestId: string;
  idempotencyKey?: string;
  reasonCode?: string;
  note?: string;
}

export interface RefundLine {
  refundLineId: string;
  requestLineId: string;
  orderLineId: string;
  productId: string;
  variantId?: string;
  storefrontId: string;
  quantity: number;
  amount: number;
  currency: string;
}

export interface RefundAmountSummary {
  requestedAmount: number;
  approvedAmount: number;
  refundedAmount: number;
  currency: string;
}

export interface RefundPaymentSummary {
  originalPaymentId?: string;
  originalPaymentAttemptId?: string;
  providerRefundReference?: string;
  simulationOnly: boolean;
  actualProviderRefundPerformed: boolean;
}

export interface RefundSettlementImpactSummary {
  settlementAdjustmentRequired: boolean;
  actualSettlementMutationPerformed: boolean;
}

export interface RefundPayoutImpactSummary {
  payoutAdjustmentRequired: boolean;
  actualPayoutMutationPerformed: boolean;
}

export interface RefundResponse {
  refundId: string;
  cancelReturnRequestId: string;
  sourceType: RefundSourceType;
  state: RefundState;
  lines: RefundLine[];
  amountSummary: RefundAmountSummary;
  paymentSummary: RefundPaymentSummary;
  settlementImpactSummary: RefundSettlementImpactSummary;
  payoutImpactSummary: RefundPayoutImpactSummary;
  errors: string[];
  warnings: string[];
}

export interface RefundDetailResponse extends RefundResponse {}

export interface RefundTransitionCommand {
  refundId: string;
  targetState: RefundState;
  note?: string;
}

export interface RefundTransitionResult {
  success: boolean;
  refund?: RefundResponse;
  error?: string;
}

export interface ProviderRefundSimulationInput {
  paymentId: string;
  amount: number;
  currency: string;
  refundId: string;
}

export interface ProviderRefundSimulationResult {
  success: boolean;
  providerRefundReference?: string;
  error?: string;
  simulationOnly: boolean;
  actualProviderRefundPerformed: boolean;
}
