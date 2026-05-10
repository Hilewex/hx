"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCustomerCapability = checkCustomerCapability;
exports.createCustomerProfile = createCustomerProfile;
exports.updateCustomerProfile = updateCustomerProfile;
exports.getCustomerProfile = getCustomerProfile;
exports.getCustomerProfileByActorId = getCustomerProfileByActorId;
exports.listCustomerProfiles = listCustomerProfiles;
exports.suspendCustomerProfile = suspendCustomerProfile;
exports.reactivateCustomerProfile = reactivateCustomerProfile;
exports.closeCustomerProfile = closeCustomerProfile;
const pg_1 = require("pg");
const customer_1 = require("./customer");
const postgres_customer_repository_1 = require("./repository/postgres-customer.repository");
const in_memory_customer_repository_1 = require("./repository/in-memory-customer.repository");
__exportStar(require("./customer"), exports);
let repository;
if (process.env.PERSISTENCE_MODE === 'postgres') {
    console.log('[CUSTOMER-SERVICE] Using Postgres repository');
    const pool = new pg_1.Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://hx_local_user:hx_local_pass@localhost:5433/hx_local_db'
    });
    repository = new postgres_customer_repository_1.PostgresCustomerRepository(pool);
}
else {
    console.log('[CUSTOMER-SERVICE] Using In-Memory repository (Mode:', process.env.PERSISTENCE_MODE, ')');
    repository = new in_memory_customer_repository_1.InMemoryCustomerRepository();
}
const customerService = new customer_1.CustomerService(repository);
async function checkCustomerCapability(params) {
    return { allowed: true, hasCapability: true };
}
async function createCustomerProfile(data) {
    const id = data.id || `cust-${Date.now()}`;
    const name = data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : data.name || 'Test User';
    const email = data.email || `${id}@example.com`;
    await customerService.createProfile(id, name, email);
    const profile = await customerService.getProfile(id);
    return { ...profile, actorId: data.actorId };
}
async function updateCustomerProfile(id, actorId, actorType, data) {
    const profile = await customerService.getProfile(id);
    if (!profile)
        throw new Error("Customer not found");
    await customerService.createProfile(id, data.name || profile.name, data.email || profile.email);
    return await customerService.getProfile(id);
}
async function getCustomerProfile(id) {
    const profile = await customerService.getProfile(id);
    if (!profile)
        return null;
    return profile;
}
async function getCustomerProfileByActorId(actorId) {
    return customerService.getProfile(actorId);
}
async function listCustomerProfiles(actorType) {
    return [];
}
async function suspendCustomerProfile(id, actorType, reason) {
    return { id, status: 'SUSPENDED' };
}
async function reactivateCustomerProfile(id, actorType, reason) {
    return { id, status: 'ACTIVE' };
}
async function closeCustomerProfile(id, actorType, reason) {
    return { id, status: 'CLOSED' };
}
