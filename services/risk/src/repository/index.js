"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRepository = getRepository;
const pg_1 = require("pg");
const in_memory_1 = require("./in-memory");
const postgres_1 = require("./postgres");
let repositoryInstance = null;
function getRepository() {
    if (repositoryInstance)
        return repositoryInstance;
    const mode = process.env.PERSISTENCE_MODE || 'memory';
    if (mode === 'postgres') {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL is required when PERSISTENCE_MODE is postgres');
        }
        const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
        repositoryInstance = new postgres_1.PostgresRiskRepository(pool);
    }
    else {
        repositoryInstance = new in_memory_1.InMemoryRiskRepository();
    }
    return repositoryInstance;
}
