import { INotificationRepository } from './interface';
import { InMemoryNotificationRepository } from './in-memory';
import { PostgresNotificationRepository } from './postgres';
// @ts-ignore
import { Pool } from 'pg';

export * from './interface';
export * from './in-memory';
export * from './postgres';

let repository: INotificationRepository | null = null;

export function getNotificationRepository(): INotificationRepository {
  if (repository) return repository;

  const mode = process.env.PERSISTENCE_MODE || 'memory';
  
  if (mode === 'postgres') {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for postgres persistence mode');
    }
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    repository = new PostgresNotificationRepository(pool);
  } else if (mode === 'memory') {
    repository = new InMemoryNotificationRepository();
  } else {
    throw new Error(`INVALID_PERSISTENCE_MODE: ${mode}. Expected 'memory' or 'postgres'.`);
  }

  return repository;
}

export function setNotificationRepository(repo: INotificationRepository) {
  repository = repo;
}
