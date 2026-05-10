import { OrderResponse } from '@hx/contracts';
export interface IOrderRepository {
    save(order: OrderResponse): Promise<void>;
    getById(orderId: string): Promise<OrderResponse | undefined>;
    getByPaymentAttemptId(paymentAttemptId: string): Promise<OrderResponse | undefined>;
    getByIdempotencyKey(namespace: string, key: string): Promise<OrderResponse | undefined>;
    saveWithIdempotency(namespace: string, key: string, order: OrderResponse): Promise<void>;
}
//# sourceMappingURL=interface.d.ts.map