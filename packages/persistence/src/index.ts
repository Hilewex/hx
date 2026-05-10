import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { z } from 'zod';
import { createServiceConfig, parseConfig } from '@hx/config';

export const dbConfigSchema = {
  PERSISTENCE_MODE: z.enum(['postgres', 'memory']).default('postgres'),
  DATABASE_URL: z.string().url().optional(),
  DB_MIN_POOL: z.coerce.number().default(2),
  DB_MAX_POOL: z.coerce.number().default(10),
};

export const persistenceConfigSchema = createServiceConfig(dbConfigSchema)
  .refine(data => data.PERSISTENCE_MODE !== 'postgres' || !!data.DATABASE_URL, {
    message: "DATABASE_URL is required when PERSISTENCE_MODE is 'postgres'",
    path: ["DATABASE_URL"],
  });

export type PersistenceConfig = z.infer<typeof persistenceConfigSchema>;

let pool: Pool | null = null;

export function getDbPool(config?: PersistenceConfig): Pool {
  if (pool) return pool;

  const conf = config || parseConfig(persistenceConfigSchema, process.env);
  
  const poolConfig: PoolConfig = {
    connectionString: conf.DATABASE_URL,
    min: conf.DB_MIN_POOL,
    max: conf.DB_MAX_POOL,
  };

  pool = new Pool(poolConfig);

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });

  return pool;
}

export async function query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await getDbPool().query(text, params);
  const duration = Date.now() - start;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[DB Query]', { text, duration, rows: res.rowCount });
  }
  
  return res;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export * from './audit-event';
export * from './provider-callback';
export * from './payment-reconciliation-task';
export * from './finance-ledger';

