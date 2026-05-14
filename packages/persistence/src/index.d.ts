import { Pool, QueryResult, QueryResultRow } from 'pg';
import { z } from 'zod';
export declare const dbConfigSchema: {
    PERSISTENCE_MODE: z.ZodDefault<z.ZodEnum<["postgres", "memory"]>>;
    DATABASE_URL: z.ZodOptional<z.ZodString>;
    DB_MIN_POOL: z.ZodDefault<z.ZodNumber>;
    DB_MAX_POOL: z.ZodDefault<z.ZodNumber>;
};
export declare const persistenceConfigSchema: z.ZodEffects<z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    PORT: z.ZodDefault<z.ZodNumber>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
} & {
    PERSISTENCE_MODE: z.ZodDefault<z.ZodEnum<["postgres", "memory"]>>;
    DATABASE_URL: z.ZodOptional<z.ZodString>;
    DB_MIN_POOL: z.ZodDefault<z.ZodNumber>;
    DB_MAX_POOL: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    PERSISTENCE_MODE: "memory" | "postgres";
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    LOG_LEVEL: "debug" | "info" | "warn" | "error";
    DB_MIN_POOL: number;
    DB_MAX_POOL: number;
    DATABASE_URL?: string | undefined;
}, {
    PERSISTENCE_MODE?: "memory" | "postgres" | undefined;
    DATABASE_URL?: string | undefined;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    PORT?: number | undefined;
    LOG_LEVEL?: "debug" | "info" | "warn" | "error" | undefined;
    DB_MIN_POOL?: number | undefined;
    DB_MAX_POOL?: number | undefined;
}>, {
    PERSISTENCE_MODE: "memory" | "postgres";
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    LOG_LEVEL: "debug" | "info" | "warn" | "error";
    DB_MIN_POOL: number;
    DB_MAX_POOL: number;
    DATABASE_URL?: string | undefined;
}, {
    PERSISTENCE_MODE?: "memory" | "postgres" | undefined;
    DATABASE_URL?: string | undefined;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    PORT?: number | undefined;
    LOG_LEVEL?: "debug" | "info" | "warn" | "error" | undefined;
    DB_MIN_POOL?: number | undefined;
    DB_MAX_POOL?: number | undefined;
}>;
export type PersistenceConfig = z.infer<typeof persistenceConfigSchema>;
export declare function getDbPool(config?: PersistenceConfig): Pool;
export declare function query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
export declare function closePool(): Promise<void>;
export * from './audit-event';
export * from './operational-intent';
export * from './provider-callback';
export * from './payment-reconciliation-task';
export * from './finance-ledger';
export * from './migrator';
//# sourceMappingURL=index.d.ts.map
