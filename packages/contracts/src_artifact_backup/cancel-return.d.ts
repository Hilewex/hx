export type CancelRequestState = 'CREATED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'OPERATIONALLY_BLOCKED' | 'REFUND_PENDING' | 'REFUNDED' | 'CLOSED';
export type ReturnRequestState = 'CREATED' | 'UNDER_REVIEW' | 'AWAITING_RETURN_SHIPMENT' | 'RETURN_IN_TRANSIT' | 'RECEIVED_BACK' | 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED' | 'REFUND_PENDING' | 'REFUNDED_PARTIALLY' | 'REFUNDED_FULLY' | 'CLOSED';
export type CancelReturnRequestType = 'CANCEL' | 'RETURN';
export interface CancelReturnLine {
    requestLineId: string;
    orderLineId: string;
    productId: string;
    variantId?: string;
    storefrontId: string;
    quantity: number;
    reasonCode?: string;
    state: string;
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
export interface CancelRequestResponse extends CancelReturnResponse {
}
export interface ReturnRequestResponse extends CancelReturnResponse {
}
export interface CancelReturnRequestDetailResponse extends CancelReturnResponse {
}
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
//# sourceMappingURL=cancel-return.d.ts.map