export type CancelRequestState =
  | 'CREATED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'OPERATIONALLY_BLOCKED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'CLOSED';

export type ReturnRequestState =
  | 'CREATED'
  | 'UNDER_REVIEW'
  | 'AWAITING_RETURN_SHIPMENT'
  | 'RETURN_IN_TRANSIT'
  | 'RECEIVED_BACK'
  | 'APPROVED'
  | 'PARTIALLY_APPROVED'
  | 'REJECTED'
  | 'REFUND_PENDING'
  | 'REFUNDED_PARTIALLY'
  | 'REFUNDED_FULLY'
  | 'CLOSED';

export type CancelReturnRequestType = 'CANCEL' | 'RETURN';

export interface CancelReturnLine {
  requestLineId: string;
  orderLineId: string;
  productId: string;
  variantId?: string;
  storefrontId: string;
  quantity: number;
  reasonCode?: string;
  state: string; // state follows the request state for simplification in foundation
}

export interface CreateCancelRequestCommand {
  orderId: string;
  orderLineIds: string[];
  reasonCode?: string;
  reasonNote?: string;
  idempotencyKey?: string;
}

export interface CreateReturnRequestCommand {
  orderId: string;
  orderLineIds: string[];
  reasonCode?: string;
  reasonNote?: string;
  idempotencyKey?: string;
}

export interface RefundImpactSummary {
  refundRequired: boolean;
  refundState: 'NOT_REQUIRED' | 'NOT_STARTED' | 'PENDING';
  actualRefundExecutionPerformed: false;
}

export interface PostDeliveryEntitlementImpactSummary {
  reviewImpactPending: boolean;
  storyImpactPending: boolean;
  verifiedPurchaseImpactPending: boolean;
  actualEntitlementMutationPerformed: false;
}

export interface CancelReturnResponse {
  requestId: string;
  type: CancelReturnRequestType;
  orderId: string;
  state: string;
  lines: CancelReturnLine[];
  refundImpactSummary: RefundImpactSummary;
  postDeliveryEntitlementImpactSummary: PostDeliveryEntitlementImpactSummary;
  errors: string[];
  warnings: string[];
}

export interface CancelRequestResponse extends CancelReturnResponse {}
export interface ReturnRequestResponse extends CancelReturnResponse {}
export interface CancelReturnRequestDetailResponse extends CancelReturnResponse {}

export interface CancelReturnTransitionCommand {
  requestId: string;
  targetState: string;
  note?: string;
}

export interface CancelReturnTransitionResult {
  success: boolean;
  request?: CancelReturnResponse;
  error?: string;
}

export type ReturnSurfaceStatus =
  | 'empty'
  | 'return_requested'
  | 'review_pending'
  | 'approved_projection'
  | 'rejected_projection'
  | 'refund_pending'
  | 'refund_processing'
  | 'refund_completed_projection'
  | 'support_escalation'
  | 'degraded'
  | 'unavailable'
  | 'timeout'
  | 'error';

export type RefundProjectionStatus =
  | 'not_started'
  | 'pending'
  | 'processing'
  | 'completed_projection'
  | 'settlement_pending'
  | 'degraded'
  | 'unavailable';

export type ReturnTimelineStepStatus = 'complete_projection' | 'current_projection' | 'pending_projection' | 'degraded_projection';

export interface ReturnReferenceProjection {
  returnId?: string;
  orderId?: string;
  orderNumber?: string;
  label: string;
  helperText: string;
  returnApprovedTruth: false;
  logisticsTruth: false;
  warnings?: string[];
}

export interface RefundProjectionSummary {
  refundId?: string;
  status: RefundProjectionStatus;
  label: string;
  helperText: string;
  refundCompletedTruth: false;
  settlementTruth: false;
  payoutTruth: false;
  rawProviderPayloadExposed: false;
  warnings?: string[];
}

export interface ReturnSupportGuidanceProjection {
  href: '/support';
  label: string;
  referenceText: string;
  refundReferenceText: string;
  helperText: string;
  escalationText: string;
  ticketCreationTruth: false;
  issueResolvedTruth: false;
}

export interface ReturnTimelineStepProjection {
  stepId: string;
  title: string;
  description: string;
  status: ReturnTimelineStepStatus;
  ariaText: string;
  returnApprovalTruth: false;
  refundTruth: false;
  settlementTruth: false;
  logisticsTruth: false;
}

export interface ReturnItemPreviewProjection {
  lineId: string;
  productId?: string;
  title: string;
  quantityText: string;
  reasonText: string;
  summaryText: string;
  refundTruth: false;
  settlementTruth: false;
  warnings?: string[];
}

export interface ReturnEscalationProjection {
  status: 'none' | 'recommended' | 'required' | 'degraded';
  label: string;
  helperText: string;
  escalationDecisionTruth: false;
  moderationTruth: false;
  fraudTruth: false;
}

export interface ReturnSurfaceProjection {
  status: ReturnSurfaceStatus;
  reference: ReturnReferenceProjection;
  refund: RefundProjectionSummary;
  supportGuidance: ReturnSupportGuidanceProjection;
  escalation: ReturnEscalationProjection;
  timeline: ReturnTimelineStepProjection[];
  items: ReturnItemPreviewProjection[];
  navigation: {
    goToReturns: {
      href: '/returns';
      label: string;
    };
    contactSupport: {
      href: '/support';
      label: string;
    };
  };
  boundaryFlags: {
    projectionTruth: false;
    queryCacheTruth: false;
    returnApprovalTruth: false;
    refundCompletedTruth: false;
    settlementTruth: false;
    payoutTruth: false;
    logisticsTruth: false;
    supportResolutionTruth: false;
    moderationTruth: false;
    fraudTruth: false;
    rawFinancePayloadExposed: false;
    rawProviderPayloadExposed: false;
  };
  warnings?: string[];
}
