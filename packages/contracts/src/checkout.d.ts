import type { CheckoutDiscountInput, CheckoutDiscountSnapshot } from './coupon';
export type CheckoutState = 'STARTED' | 'VALIDATING' | 'REVIEW_READY' | 'BLOCKED' | 'ABANDONED';
export type CheckoutValidationState = 'PENDING' | 'VALID' | 'PRICE_MISMATCH' | 'STOCK_MISMATCH' | 'BLOCKED';
export interface CheckoutLineValidation {
    lineId: string;
    productId: string;
    variantId?: string;
    storefrontId: string;
    quantity: number;
    unitPrice?: number;
    lineTotal?: number;
    stockStatus?: string;
    validationState: CheckoutValidationState;
    warnings: string[];
    errors: string[];
}
export interface CheckoutSummary {
    totalQuantity: number;
    subTotal: number;
    shippingTotal?: number;
    discountTotal?: number;
    grandTotal: number;
    currency: string;
}
export interface CheckoutAddressSnapshot {
    kind: 'REGISTERED_ADDRESS' | 'GUEST_ADDRESS';
    addressId?: string;
    recipientName?: string;
    phone?: string;
    city?: string;
    district?: string;
    addressLine?: string;
    country?: string;
    postalCode?: string;
}
export interface StartCheckoutCommand {
    cartContext: {
        actorType: 'GUEST' | 'CUSTOMER';
        actorId: string;
    };
    addressSnapshot?: CheckoutAddressSnapshot;
    couponCode?: string;
    campaignId?: string;
    discountInputs?: CheckoutDiscountInput[];
}
export interface CheckoutReviewResponse {
    checkoutId: string;
    cartContext: {
        actorType: 'GUEST' | 'CUSTOMER';
        actorId: string;
    };
    state: CheckoutState;
    validationState: CheckoutValidationState;
    lines: CheckoutLineValidation[];
    summary: CheckoutSummary;
    errors: string[];
    warnings: string[];
    addressSnapshot?: CheckoutAddressSnapshot;
    discountSnapshots?: CheckoutDiscountSnapshot[];
}
//# sourceMappingURL=checkout.d.ts.map