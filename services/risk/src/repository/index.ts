import { Pool } from 'pg';
import { IRiskRepository } from './interface';
import { InMemoryRiskRepository } from './in-memory';
import { PostgresRiskRepository } from './postgres';

export { IRiskRepository };

let repositoryInstance: IRiskRepository | null = null;

export function getRepository(): IRiskRepository {
  if (repositoryInstance) return repositoryInstance;

  const mode = process.env.PERSISTENCE_MODE || 'memory';

  if (mode === 'postgres') {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required when PERSISTENCE_MODE is postgres');
    }
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    repositoryInstance = new PostgresRiskRepository(pool);
  } else {
    repositoryInstance = new InMemoryRiskRepository();
  }

  return repositoryInstance;
}
