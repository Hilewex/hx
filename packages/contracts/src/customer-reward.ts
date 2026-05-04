export enum CustomerRewardEventType {
  PURCHASE_DELIVERED = 'PURCHASE_DELIVERED',
  REVIEW_APPROVED = 'REVIEW_APPROVED',
  USER_STORY_APPROVED = 'USER_STORY_APPROVED',
  CAMPAIGN_ACTION = 'CAMPAIGN_ACTION',
  RETURN_OR_REFUND = 'RETURN_OR_REFUND',
  REVIEW_DELETED = 'REVIEW_DELETED',
  USER_STORY_REMOVED = 'USER_STORY_REMOVED',
  MODERATION_REJECTED = 'MODERATION_REJECTED',
}

export enum CustomerRewardEligibilityAction {
  EARN_POINTS = 'EARN_POINTS',
  REVOKE_POINTS = 'REVOKE_POINTS',
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

export enum CustomerRewardEligibilityErrorCode {
  GUEST_NOT_ELIGIBLE = 'GUEST_NOT_ELIGIBLE',
  CUSTOMER_NOT_ACTIVE = 'CUSTOMER_NOT_ACTIVE',
  BLOCKED_BY_MODERATION_OR_RISK = 'BLOCKED_BY_MODERATION_OR_RISK',
  CONTEXT_REQUIREMENTS_NOT_MET = 'CONTEXT_REQUIREMENTS_NOT_MET',
  INVALID_ACTOR = 'INVALID_ACTOR',
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
