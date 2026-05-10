"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCartRepository = getCartRepository;
exports.getCheckoutRepository = getCheckoutRepository;
const in_memory_1 = require("./in-memory");
const postgres_1 = require("./postgres");
let cartRepo;
let checkoutRepo;
function getCartRepository() {
    if (cartRepo)
        return cartRepo;
    const mode = process.env.PERSISTENCE_MODE || 'memory';
    if (mode === 'postgres') {
        cartRepo = new postgres_1.PostgresCartRepository();
    }
    else {
        cartRepo = new in_memory_1.InMemoryCartRepository();
    }
    return cartRepo;
}
function getCheckoutRepository() {
    if (checkoutRepo)
        return checkoutRepo;
    const mode = process.env.PERSISTENCE_MODE || 'memory';
    if (mode === 'postgres') {
        checkoutRepo = new postgres_1.PostgresCheckoutRepository();
    }
    else {
        checkoutRepo = new in_memory_1.InMemoryCheckoutRepository();
    }
    return checkoutRepo;
}
