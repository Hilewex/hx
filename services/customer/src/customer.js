"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
class CustomerService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async getProfile(id) {
        return this.repository.findById(id);
    }
    async createProfile(id, name, email) {
        await this.repository.save({ id, name, email, createdAt: new Date(), updatedAt: new Date() });
    }
}
exports.CustomerService = CustomerService;
