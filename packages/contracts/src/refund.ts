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
  idempotencyKey: string;
  reasonCode?: string;
  evidenceRefs?: string[];
  forcedTransition?: boolean;
  manualOverride?: boolean;
  note?: string;
}

export interface RefundTransitionResult {
  success: boolean;
  refund?: RefundResponse;
  error?: string;
}

export interface RefundProcessCommand {
  refundId: string;
  idempotencyKey: string;
  reasonCode?: string;
  evidenceRefs: string[];
  note?: string;
}

export interface RefundReviewCommand {
  refundId: string;
  idempotencyKey: string;
  makerActorId: string;
  checkerActorId?: string;
  reasonCode: string;
  evidenceRefs: string[];
  decision?: 'APPROVE_FOR_OWNER_REVIEW' | 'REJECT' | 'ESCALATE' | 'MANUAL_OVERRIDE';
  note?: string;
}

export interface ManualRefundEscalationCommand {
  refundId: string;
  idempotencyKey: string;
  makerActorId: string;
  checkerActorId?: string;
  reasonCode: string;
  evidenceRefs: string[];
  escalationTarget?: 'FINANCE' | 'RISK' | 'SUPPORT' | 'OPERATIONS';
  note?: string;
}

export interface RefundOperationalBoundaryFlags {
  refundExecutionTruth: false;
  settlementTruth: false;
  payoutTruth: false;
  providerRefundTruth: false;
  auditMutationTruth: false;
}

export interface RefundAuditEvidenceProjection {
  requiredEvidenceRefs: string[];
  providedEvidenceRefs: string[];
  reasonCodeProjectionText: string;
  auditIntentPreview: string[];
  missingEvidenceWarnings: string[];
  auditIntentRecordedProjection: boolean;
  auditIntentPersistedProjection: boolean;
  latestAuditIntentText?: string;
  auditMutationTruth: false;
}

export interface RefundEscalationProjection {
  escalationStateProjection: 'none' | 'recommended' | 'required' | 'manual_escalation_visible' | 'degraded';
  escalationTargetProjection?: 'FINANCE' | 'RISK' | 'SUPPORT' | 'OPERATIONS';
  visibilityText: string;
  escalationDecisionTruth: false;
}

export interface RefundMakerCheckerProjection {
  makerActorProjectionText: string;
  checkerActorProjectionText: string;
  reviewWorkflowStateProjection: RefundReviewWorkflowState;
  sameActorApprovalBlockedProjection: true;
  latestDecisionProjectionText: string;
  dualApprovalRequiredProjection: boolean;
  ownerStateMachineReady: true;
  makerCheckerTruth: false;
}

export type RefundReviewWorkflowState =
  | 'prepared'
  | 'checker_required'
  | 'checked'
  | 'rejected'
  | 'escalated'
  | 'owner_handoff_pending'
  | 'owner_handoff_ready';

export interface RefundReviewQueueItemProjection {
  refundId: string;
  cancelReturnRequestId: string;
  sourceTypeProjection: RefundSourceType | 'UNKNOWN';
  statusProjection: RefundState | 'UNAVAILABLE';
  amountProjectionText: string;
  reasonPreviewText: string;
  evidencePreviewText: string;
  riskContextProjectionText: string;
  supportContextProjectionText: string;
  orderContextProjectionText: string;
  escalation: RefundEscalationProjection;
  auditEvidence: RefundAuditEvidenceProjection;
  makerChecker: RefundMakerCheckerProjection;
  detailHref: string;
  boundaryFlags: RefundOperationalBoundaryFlags;
  warnings?: string[];
}

export interface RefundReviewQueueProjection {
  items: RefundReviewQueueItemProjection[];
  totalProjection: number;
  emptyState?: boolean;
  degradedStateText?: string;
  boundaryFlags: RefundOperationalBoundaryFlags;
  warnings?: string[];
}

export interface RefundReviewDetailProjection extends RefundReviewQueueItemProjection {
  lines: Array<{
    refundLineId: string;
    orderLineId: string;
    productId: string;
    quantityProjectionText: string;
    amountProjectionText: string;
    refundLineTruth: false;
  }>;
  paymentContextProjectionText: string;
  settlementContextProjectionText: string;
  payoutContextProjectionText: string;
  providerContextProjectionText: string;
  actionIntent: {
    reviewIntentAllowed: true;
    manualEscalationIntentAllowed: true;
    evidenceRequiredIntentAllowed: true;
    ownerCommandRequired: true;
    directExecutionAllowed: false;
    uiMutationTruth: false;
  };
}

export type RefundCommandIntentStatus =
  | 'accepted_for_owner_handoff'
  | 'maker_submitted'
  | 'checker_required'
  | 'checked_for_owner_handoff'
  | 'rejected_by_checker'
  | 'escalated'
  | 'validation_failed'
  | 'permission_denied'
  | 'evidence_required'
  | 'owner_unavailable';

export interface RefundCommandIntentResultProjection {
  status: RefundCommandIntentStatus;
  message: string;
  idempotencyKey?: string;
  reviewWorkflowState?: RefundReviewWorkflowState;
  auditIntentPersisted: boolean;
  boundaryFlags: RefundOperationalBoundaryFlags;
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
