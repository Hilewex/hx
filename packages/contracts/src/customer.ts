
export enum CustomerAccountStatus {
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    CLOSED = "CLOSED",
}

export enum CustomerProfileVisibility {
    PRIVATE = "PRIVATE",
    LIMITED = "LIMITED",
}

export enum CustomerAccountType {
    REGISTERED_CUSTOMER = "REGISTERED_CUSTOMER",
    GUEST_CONTEXT = "GUEST_CONTEXT",
}

export interface CustomerProfile {
    id: string;
    actorId: string;
    accountType: CustomerAccountType;
    status: CustomerAccountStatus;
    visibility: CustomerProfileVisibility;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    createdAt: Date;
    updatedAt: Date;
    version: number;
}

export interface CreateCustomerProfileCommand {
    actorId: string;
    accountType: CustomerAccountType;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

export interface UpdateCustomerProfileCommand {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    visibility: CustomerProfileVisibility;
}

export interface SuspendCustomerProfileCommand {
    reason: string;
}

export interface ReactivateCustomerProfileCommand {
    reason: string;
}

export interface CloseCustomerProfileCommand {
    reason: string;
}

export type CreateCustomerProfileResult = { id: string; version: number; };
export type UpdateCustomerProfileResult = { version: number; };
export type SuspendCustomerProfileResult = { version: number; };
export type ReactivateCustomerProfileResult = { version: number; };
export type CloseCustomerProfileResult = { version: number; };

export enum CustomerCapability {
    BROWSE_PUBLIC_CATALOG = "BROWSE_PUBLIC_CATALOG",
    ADD_TO_CART = "ADD_TO_CART",
    START_CHECKOUT = "START_CHECKOUT",
    VIEW_ORDER_HISTORY = "VIEW_ORDER_HISTORY",
    ASK_PRODUCT_QUESTION = "ASK_PRODUCT_QUESTION",
    WRITE_REVIEW = "WRITE_REVIEW",
    CREATE_USER_PRODUCT_STORY = "CREATE_USER_PRODUCT_STORY",
    FOLLOW_STORE = "FOLLOW_STORE",
    SEND_STORE_MESSAGE = "SEND_STORE_MESSAGE",
    EARN_REWARD_POINTS = "EARN_REWARD_POINTS",
    OPEN_SUPPORT_TICKET = "OPEN_SUPPORT_TICKET",
}

export interface CustomerCapabilityCheckContext {
    actorId: string;
    actorType: CustomerAccountType | string;
}

export interface CheckCustomerCapabilityCommand {
    capability: CustomerCapability;
    context: CustomerCapabilityCheckContext;
}

export interface CustomerCapabilityCheckResult {
    allowed: boolean;
    reason?: string;
}

export enum CustomerErrorCode {
    CUSTOMER_NOT_FOUND = "CUSTOMER_NOT_FOUND",
    CUSTOMER_SUSPENDED = "CUSTOMER_SUSPENDED",
    CUSTOMER_CLOSED = "CUSTOMER_CLOSED",
    GUEST_CANNOT_CREATE_PERSISTENT_PROFILE = "GUEST_CANNOT_CREATE_PERSISTENT_PROFILE",
    PERMISSION_DENIED = "PERMISSION_DENIED",
    INVALID_REASON = "INVALID_REASON",
    CUSTOMER_CAPABILITY_DENIED = "CUSTOMER_CAPABILITY_DENIED",
    CUSTOMER_GUEST_NOT_ALLOWED = "CUSTOMER_GUEST_NOT_ALLOWED",
    CUSTOMER_PROFILE_REQUIRED = "CUSTOMER_PROFILE_REQUIRED",
}
