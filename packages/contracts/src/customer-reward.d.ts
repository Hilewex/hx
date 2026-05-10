export declare enum CustomerRewardEventType {
    PURCHASE_DELIVERED = "PURCHASE_DELIVERED",
    REVIEW_APPROVED = "REVIEW_APPROVED",
    USER_STORY_APPROVED = "USER_STORY_APPROVED",
    CAMPAIGN_ACTION = "CAMPAIGN_ACTION",
    RETURN_OR_REFUND = "RETURN_OR_REFUND",
    REVIEW_DELETED = "REVIEW_DELETED",
    USER_STORY_REMOVED = "USER_STORY_REMOVED",
    MODERATION_REJECTED = "MODERATION_REJECTED"
}
export declare enum CustomerRewardEligibilityAction {
    EARN_POINTS = "EARN_POINTS",
    REVOKE_POINTS = "REVOKE_POINTS"
}
export interface CustomerRewardEligibilityContext {
    actorId: string;
    actorType: 'USER' | 'GUEST' | 'SYSTEM' | 'ADMIN';
    customerProfileId?: string;
    customerStatus?: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
    eventType: CustomerRewardEventType;
    action: CustomerRewardEligibilityAction;
    delivered?: boolean;
    notReturned?: boolean;
    reviewApproved?: boolean;
    storyApproved?: boolean;
    campaignEligible?: boolean;
    returnOrRefund?: boolean;
    reviewDeleted?: boolean;
    storyRemoved?: boolean;
    moderationBlocked?: boolean;
    riskBlocked?: boolean;
}
export declare enum CustomerRewardEligibilityErrorCode {
    GUEST_NOT_ELIGIBLE = "GUEST_NOT_ELIGIBLE",
    CUSTOMER_NOT_ACTIVE = "CUSTOMER_NOT_ACTIVE",
    BLOCKED_BY_MODERATION_OR_RISK = "BLOCKED_BY_MODERATION_OR_RISK",
    CONTEXT_REQUIREMENTS_NOT_MET = "CONTEXT_REQUIREMENTS_NOT_MET",
    INVALID_ACTOR = "INVALID_ACTOR"
}
export interface CustomerRewardEligibilityResult {
    allowed: boolean;
    action: CustomerRewardEligibilityAction;
    eventType: CustomerRewardEventType;
    reasonCode?: CustomerRewardEligibilityErrorCode | string;
    reason?: string;
}
export interface CheckCustomerRewardEligibilityCommand {
    context: CustomerRewardEligibilityContext;
}
export declare enum RewardPointState {
    PENDING = "PENDING",
    SPENDABLE = "SPENDABLE",
    REDEEMED = "REDEEMED",
    REVERSED = "REVERSED",
    EXPIRED = "EXPIRED",
    BLOCKED = "BLOCKED"
}
export declare enum RewardPointEventType {
    EARN_PENDING = "EARN_PENDING",
    PROMOTE_TO_SPENDABLE = "PROMOTE_TO_SPENDABLE",
    REDEEM = "REDEEM",
    REVERSE_PENDING = "REVERSE_PENDING",
    REVERSE_SPENDABLE = "REVERSE_SPENDABLE",
    EXPIRE = "EXPIRE",
    BLOCK = "BLOCK"
}
export declare enum RewardPointSourceType {
    ORDER_DELIVERY = "ORDER_DELIVERY",
    REVIEW = "REVIEW",
    STORY = "STORY",
    CAMPAIGN = "CAMPAIGN",
    REFUND = "REFUND",
    MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT"
}
export interface RewardPointEntry {
    rewardPointEntryId: string;
    customerId: string;
    sourceType: RewardPointSourceType;
    sourceId: string;
    orderId?: string;
    orderLineId?: string;
    pointAmount: number;
    state: RewardPointState;
    idempotencyKey: string;
    createdAt: string;
    availableAt?: string;
    metadata?: Record<string, unknown>;
    cashEquivalent: false;
    payoutEligible: false;
}
export interface RewardPointSummary {
    customerId: string;
    pendingPoints: number;
    spendablePoints: number;
    redeemedPoints: number;
    reversedPoints: number;
    cashEquivalent: false;
    payoutEligible: false;
    payoutCreated: false;
    payableCreated: false;
    paidOutCreated: false;
    ledgerCashEntryCreated: false;
    orderStateMutated: false;
    paymentStateMutated: false;
    refundStateMutated: false;
    reversalRequired?: boolean;
}
export interface GrantPendingRewardPointsCommand {
    customerId: string;
    sourceType: RewardPointSourceType;
    sourceId: string;
    orderId?: string;
    orderLineId?: string;
    pointAmount: number;
    idempotencyKey: string;
    availableAt?: string;
    metadata?: Record<string, unknown>;
    delivered?: boolean;
    notReturned?: boolean;
}
export interface PromotePendingRewardPointsCommand {
    customerId: string;
    rewardPointEntryId: string;
    idempotencyKey: string;
    availableAt?: string;
}
export interface RedeemSpendableRewardPointsCommand {
    customerId: string;
    rewardPointEntryId: string;
    idempotencyKey: string;
    metadata?: Record<string, unknown>;
}
export interface ReverseRewardPointsForRefundCommand {
    customerId: string;
    refundId: string;
    idempotencyKey: string;
    orderId?: string;
    orderLineId?: string;
    rewardPointEntryId?: string;
    metadata?: Record<string, unknown>;
}
export type RewardPointLifecycleStatus = 'RECORDED' | 'REJECTED' | 'CONFLICT' | 'REVERSAL_REQUIRED';
export interface RewardPointLifecycleResult {
    status: RewardPointLifecycleStatus;
    eventType?: RewardPointEventType;
    entry?: RewardPointEntry;
    entries: RewardPointEntry[];
    summary: RewardPointSummary;
    errors: string[];
}
//# sourceMappingURL=customer-reward.d.ts.map