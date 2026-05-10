export declare enum CustomerAddressType {
    SHIPPING = "SHIPPING",
    BILLING = "BILLING"
}
export declare enum CustomerAddressStatus {
    ACTIVE = "ACTIVE",
    ARCHIVED = "ARCHIVED"
}
export interface CustomerAddress {
    id: string;
    customerId: string;
    type: CustomerAddressType;
    status: CustomerAddressStatus;
    isDefault: boolean;
    firstName: string;
    lastName: string;
    phone: string;
    city: string;
    district: string;
    neighborhood: string;
    fullAddress: string;
    createdAt: string;
    updatedAt: string;
}
export interface CreateCustomerAddressCommand {
    type: CustomerAddressType;
    firstName: string;
    lastName: string;
    phone: string;
    city: string;
    district: string;
    neighborhood: string;
    fullAddress: string;
}
export interface UpdateCustomerAddressCommand {
    firstName?: string;
    lastName?: string;
    phone?: string;
    city?: string;
    district?: string;
    neighborhood?: string;
    fullAddress?: string;
}
export interface ArchiveCustomerAddressCommand {
}
export interface SetDefaultCustomerAddressCommand {
}
export interface CheckCheckoutEligibilityCommand {
}
export interface CheckoutEligibilityResult {
    eligible: boolean;
    reason?: string;
}
export declare enum CustomerAddressErrorCode {
    ADDRESS_NOT_FOUND = "ADDRESS_NOT_FOUND",
    CUSTOMER_NOT_FOUND = "CUSTOMER_NOT_FOUND",
    UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
    GUEST_CANNOT_CREATE_ADDRESS = "GUEST_CANNOT_CREATE_ADDRESS",
    SUSPENDED_CUSTOMER_CANNOT_CREATE_ADDRESS = "SUSPENDED_CUSTOMER_CANNOT_CREATE_ADDRESS",
    CLOSED_CUSTOMER_CANNOT_CREATE_ADDRESS = "CLOSED_CUSTOMER_CANNOT_CREATE_ADDRESS",
    ARCHIVED_ADDRESS_CANNOT_BE_DEFAULT = "ARCHIVED_ADDRESS_CANNOT_BE_DEFAULT",
    CLOSED_CUSTOMER_CANNOT_CHECKOUT = "CLOSED_CUSTOMER_CANNOT_CHECKOUT",
    INVALID_DATA = "INVALID_DATA"
}
//# sourceMappingURL=customer-address.d.ts.map