export declare enum CustomerSocialAction {
    FOLLOW_STOREFRONT = "FOLLOW_STOREFRONT",
    SEND_STORE_MESSAGE = "SEND_STORE_MESSAGE"
}
export interface CustomerSocialEligibilityContext {
    actorId: string;
    actorType: 'GUEST' | 'REGISTERED_CUSTOMER';
    customerProfileId?: string;
    customerStatus?: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
    storefrontId: string;
    storefrontStatus?: 'ACTIVE' | 'SUSPENDED';
    storefrontVisibility?: 'PUBLIC' | 'HIDDEN';
    alreadyFollowing?: boolean;
    messageAllowedByStorefront?: boolean;
}
export declare enum CustomerSocialEligibilityErrorCode {
    GUEST_NOT_ALLOWED = "GUEST_NOT_ALLOWED",
    CUSTOMER_SUSPENDED = "CUSTOMER_SUSPENDED",
    CUSTOMER_CLOSED = "CUSTOMER_CLOSED",
    MISSING_STOREFRONT_ID = "MISSING_STOREFRONT_ID",
    STOREFRONT_SUSPENDED = "STOREFRONT_SUSPENDED",
    STOREFRONT_HIDDEN = "STOREFRONT_HIDDEN",
    ALREADY_FOLLOWING = "ALREADY_FOLLOWING",
    MESSAGES_NOT_ALLOWED = "MESSAGES_NOT_ALLOWED",
    UNKNOWN_ACTION = "UNKNOWN_ACTION"
}
export interface CustomerSocialEligibilityResult {
    allowed: boolean;
    action: CustomerSocialAction;
    reasonCode?: string;
    reason: string;
}
export interface CheckCustomerSocialEligibilityCommand {
    action: CustomerSocialAction;
    context: CustomerSocialEligibilityContext;
}
//# sourceMappingURL=customer-social.d.ts.map