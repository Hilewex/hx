import { OrderResponse } from '@hx/contracts';
import { IOrderRepository } from './interface';

export class InMemoryOrderRepository implements IOrderRepository {
  private orders: Map<string, OrderResponse> = new Map();
  private idempotency: Map<string, OrderResponse> = new Map();

  async save(order: OrderResponse): Promise<void> {
    this.orders.set(order.orderId, order);
  }

  async getById(orderId: string): Promise<OrderResponse | undefined> {
    return this.orders.get(orderId);
  }

  async getByPaymentAttemptId(paymentAttemptId: string): Promise<OrderResponse | undefined> {
    return Array.from(this.orders.values()).find(o => o.paymentAttemptId === paymentAttemptId);
  }

  async getByIdempotencyKey(namespace: string, key: string): Promise<OrderResponse | undefined> {
    return this.idempotency.get(`${namespace}:${key}`);
  }

  async saveWithIdempotency(namespace: string, key: string, order: OrderResponse): Promise<void> {
    await this.save(order);
    this.idempotency.set(`${namespace}:${key}`, order);
  }
}
