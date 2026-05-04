import { Pool } from 'pg';
import { IAnalyticsRepository } from './interface';
import { InMemoryAnalyticsRepository } from './in-memory';
import { PostgresAnalyticsRepository } from './postgres';

export * from './interface';
export * from './in-memory';
export * from './postgres';

let repositoryInstance: IAnalyticsRepository | null = null;

export function getAnalyticsRepository(): IAnalyticsRepository {
  if (repositoryInstance) return repositoryInstance;

  const mode = process.env.PERSISTENCE_MODE || 'memory';
  
  if (mode === 'postgres') {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required for postgres persistence mode');
    }
    const pool = new Pool({ connectionString: databaseUrl });
    repositoryInstance = new PostgresAnalyticsRepository(pool);
    return repositoryInstance;
  }
  
  if (mode === 'memory') {
    repositoryInstance = new InMemoryAnalyticsRepository();
    return repositoryInstance;
  }

  throw new Error('INVALID_PERSISTENCE_MODE');
}

export function resetAnalyticsRepository(): void {
  repositoryInstance = null;
}
