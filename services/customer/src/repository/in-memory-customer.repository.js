"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryCustomerRepository = void 0;
class InMemoryCustomerRepository {
    customers = new Map();
    async findById(id) {
        return this.customers.get(id) || null;
    }
    async save(profile) {
        this.customers.set(profile.id, { ...profile, updatedAt: new Date() });
    }
}
exports.InMemoryCustomerRepository = InMemoryCustomerRepository;
