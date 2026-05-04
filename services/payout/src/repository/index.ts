import { Pool } from 'pg';
import { IPayoutRepository } from './interface';
import { InMemoryPayoutRepository } from './in-memory';
import { PostgresPayoutRepository } from './postgres';

export * from './interface';

let repository: IPayoutRepository;

export function getPayoutRepository(): IPayoutRepository {
  if (repository) {
    return repository;
  }

  const mode = process.env.PERSISTENCE_MODE || 'memory';

  if (mode === 'postgres') {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for postgres persistence mode');
    }
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    repository = new PostgresPayoutRepository(pool);
  } else {
    repository = new InMemoryPayoutRepository();
  }

  return repository;
}
