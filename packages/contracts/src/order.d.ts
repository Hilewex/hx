import { CheckoutSummary } from './checkout';
export type OrderState = 'CREATED' | 'CONFIRMED' | 'CREATE_FAILED';
export type OrderFulfillmentState = 'NOT_STARTED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
export type OrderPaymentState = 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
export interface OrderLine {
    orderLineId: string;
    productId: string;
    variantId?: string;
    storefrontId: string;
    quantity: number;
    productNameSnapshot: string;
    unitPriceSnapshot: number;
    lineTotalSnapshot: number;
}
export interface OrderSummary extends CheckoutSummary {
}
export interface CreateOrderCommand {
    customerId?: string;
    paymentId: string;
    paymentAttemptId: string;
    checkoutId: string;
    idempotencyKey?: string;
}
export interface OrderResponse {
    orderId: string;
    orderNumber: string;
    customerId?: string;
    checkoutId: string;
    paymentId: string;
    paymentAttemptId: string;
    state: OrderState;
    lines: OrderLine[];
    summary: OrderSummary;
    errors: string[];
    warnings: string[];
}
export interface OrderDetailResponse extends OrderResponse {
    paymentSummary: {
        state: OrderPaymentState;
        method: string;
    };
    fulfillmentStateSummary: OrderFulfillmentState;
    shipmentStateSummary: 'NOT_AVAILABLE';
    actions: {
        canCancel: boolean;
        canReturn: boolean;
    };
}
//# sourceMappingURL=order.d.ts.map