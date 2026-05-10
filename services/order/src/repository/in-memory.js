"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryOrderRepository = void 0;
class InMemoryOrderRepository {
    orders = new Map();
    idempotency = new Map();
    async save(order) {
        this.orders.set(order.orderId, order);
    }
    async getById(orderId) {
        return this.orders.get(orderId);
    }
    async getByPaymentAttemptId(paymentAttemptId) {
        return Array.from(this.orders.values()).find(o => o.paymentAttemptId === paymentAttemptId);
    }
    async getByIdempotencyKey(namespace, key) {
        return this.idempotency.get(`${namespace}:${key}`);
    }
    async saveWithIdempotency(namespace, key, order) {
        await this.save(order);
        this.idempotency.set(`${namespace}:${key}`, order);
    }
}
exports.InMemoryOrderRepository = InMemoryOrderRepository;
