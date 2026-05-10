"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderRepository = getOrderRepository;
exports.resetOrderRepository = resetOrderRepository;
const in_memory_1 = require("./in-memory");
const postgres_1 = require("./postgres");
let repository;
function getOrderRepository() {
    if (repository)
        return repository;
    const mode = process.env.PERSISTENCE_MODE || 'memory';
    if (mode === 'postgres') {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL is required for postgres persistence mode');
        }
        repository = new postgres_1.PostgresOrderRepository();
    }
    else {
        repository = new in_memory_1.InMemoryOrderRepository();
    }
    return repository;
}
function resetOrderRepository() {
    repository = undefined;
}
