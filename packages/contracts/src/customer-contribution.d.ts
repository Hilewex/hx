export declare enum CustomerContributionType {
    PRODUCT_QUESTION = "PRODUCT_QUESTION",
    PRODUCT_REVIEW = "PRODUCT_REVIEW",
    USER_PRODUCT_STORY = "USER_PRODUCT_STORY"
}
export interface CustomerContributionEligibilityContext {
    actorId: string;
    actorType: 'GUEST' | 'REGISTERED_CUSTOMER' | 'ANONYMOUS';
    customerProfileId?: string;
    productId?: string;
    orderId?: string;
    delivered?: boolean;
    verifiedPurchase?: boolean;
    moderationBlocked?: boolean;
    riskBlocked?: boolean;
    customerStatus?: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
}
export interface CustomerContributionEligibilityResult {
    allowed: boolean;
    contributionType: CustomerContributionType;
    reasonCode?: string;
    reason: string;
}
export interface CheckCustomerContributionEligibilityCommand {
    context: CustomerContributionEligibilityContext;
    contributionType: CustomerContributionType;
}
export declare enum CustomerContributionEligibilityErrorCode {
    GUEST_DENIED = "GUEST_DENIED",
    SUSPENDED_CUSTOMER_DENIED = "SUSPENDED_CUSTOMER_DENIED",
    CLOSED_CUSTOMER_DENIED = "CLOSED_CUSTOMER_DENIED",
    MODERATION_BLOCKED = "MODERATION_BLOCKED",
    RISK_BLOCKED = "RISK_BLOCKED",
    MISSING_PRODUCT_ID = "MISSING_PRODUCT_ID",
    DELIVERY_REQUIRED = "DELIVERY_REQUIRED",
    VERIFIED_PURCHASE_REQUIRED = "VERIFIED_PURCHASE_REQUIRED"
}
//# sourceMappingURL=customer-contribution.d.ts.map