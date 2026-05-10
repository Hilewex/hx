import { OrderResponse } from '@hx/contracts';
import { IOrderRepository } from './interface';
export declare class InMemoryOrderRepository implements IOrderRepository {
    private orders;
    private idempotency;
    save(order: OrderResponse): Promise<void>;
    getById(orderId: string): Promise<OrderResponse | undefined>;
    getByPaymentAttemptId(paymentAttemptId: string): Promise<OrderResponse | undefined>;
    getByIdempotencyKey(namespace: string, key: string): Promise<OrderResponse | undefined>;
    saveWithIdempotency(namespace: string, key: string, order: OrderResponse): Promise<void>;
}
//# sourceMappingURL=in-memory.d.ts.map