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
exports.persistenceConfigSchema = exports.dbConfigSchema = void 0;
exports.getDbPool = getDbPool;
exports.query = query;
exports.closePool = closePool;
const pg_1 = require("pg");
const zod_1 = require("zod");
const config_1 = require("@hx/config");
exports.dbConfigSchema = {
    PERSISTENCE_MODE: zod_1.z.enum(['postgres', 'memory']).default('postgres'),
    DATABASE_URL: zod_1.z.string().url().optional(),
    DB_MIN_POOL: zod_1.z.coerce.number().default(2),
    DB_MAX_POOL: zod_1.z.coerce.number().default(10),
};
exports.persistenceConfigSchema = (0, config_1.createServiceConfig)(exports.dbConfigSchema)
    .refine(data => data.PERSISTENCE_MODE !== 'postgres' || !!data.DATABASE_URL, {
    message: "DATABASE_URL is required when PERSISTENCE_MODE is 'postgres'",
    path: ["DATABASE_URL"],
});
let pool = null;
function getDbPool(config) {
    if (pool)
        return pool;
    const conf = config || (0, config_1.parseConfig)(exports.persistenceConfigSchema, process.env);
    const poolConfig = {
        connectionString: conf.DATABASE_URL,
        min: conf.DB_MIN_POOL,
        max: conf.DB_MAX_POOL,
    };
    pool = new pg_1.Pool(poolConfig);
    pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
        process.exit(-1);
    });
    return pool;
}
async function query(text, params) {
    const start = Date.now();
    const res = await getDbPool().query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
        console.log('[DB Query]', { text, duration, rows: res.rowCount });
    }
    return res;
}
async function closePool() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}
__exportStar(require("./audit-event"), exports);
__exportStar(require("./provider-callback"), exports);
__exportStar(require("./payment-reconciliation-task"), exports);
__exportStar(require("./finance-ledger"), exports);
