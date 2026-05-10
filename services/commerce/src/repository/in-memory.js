"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryCheckoutRepository = exports.InMemoryCartRepository = void 0;
class InMemoryCartRepository {
    store = new Map();
    getCartKey(context) {
        return `${context.actorType}:${context.actorId}`;
    }
    async getLines(context) {
        return this.store.get(this.getCartKey(context)) || [];
    }
    async saveLines(context, lines) {
        this.store.set(this.getCartKey(context), lines);
    }
    async clear(context) {
        this.store.delete(this.getCartKey(context));
    }
}
exports.InMemoryCartRepository = InMemoryCartRepository;
class InMemoryCheckoutRepository {
    store = new Map();
    async save(checkout) {
        this.store.set(checkout.checkoutId, checkout);
    }
    async getById(checkoutId) {
        return this.store.get(checkoutId);
    }
}
exports.InMemoryCheckoutRepository = InMemoryCheckoutRepository;
