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

export type RefundCouponSponsorReversalStatus =
  | 'CALCULATED'
  | 'BLOCKED'
  | 'CONFLICT';

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

export interface RefundCouponSponsorReversal {
  reversalId: string;
  refundId: string;
  refundLineId?: string;
  lineId?: string;
  cartLineId?: string;
  orderLineId?: string;
  discountSnapshotId?: string;
  allocationId?: string;
  discountKind: 'COUPON' | 'CAMPAIGN';
  sponsorType: 'PLATFORM' | 'CREATOR';
  sponsorId?: string;
  reversedAmount: number;
  currency: string;
  reversalReason: string;
  idempotencyKey: string;
  createdAt: string;
}

export interface RefundCouponSponsorReversalSummary {
  platformReversalAmount: number;
  creatorReversalAmount: number;
  supplierReversalAmount: 0;
  brandReversalAmount: 0;
  totalReversalAmount: number;
  settlementAdjustedCreated: false;
  payoutReversalCreated: false;
  ledgerEntryCreated: false;
  orderStateMutated: false;
  paymentStateMutated: false;
  refundStateMutated: false;
}

export interface RefundCouponSponsorReversalCommand {
  refundId: string;
  refundLines: Array<{
    refundLineId?: string;
    lineId?: string;
    cartLineId?: string;
    orderLineId?: string;
    refundAmount?: number;
    originalLineAmount?: number;
    currency: string;
  }>;
  discountLineAllocations: Array<{
    allocationId: string;
    discountSnapshotId: string;
    discountKind: 'COUPON' | 'CAMPAIGN';
    sponsorType?: 'PLATFORM' | 'SUPPLIER' | 'CREATOR' | 'BRAND' | 'MIXED';
    sponsorId?: string;
    lineId: string;
    cartLineId?: string;
    orderLineId?: string;
    allocatedAmount: number;
    currency: string;
  }>;
  idempotencyKey: string;
  reversalReason?: string;
}

export interface RefundCouponSponsorReversalResult {
  status: RefundCouponSponsorReversalStatus;
  reversals: RefundCouponSponsorReversal[];
  summary: RefundCouponSponsorReversalSummary;
  errors: string[];
  idempotencyKey: string;
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
