import { IOrderRepository } from './interface';
import { InMemoryOrderRepository } from './in-memory';
import { PostgresOrderRepository } from './postgres';

let repository: IOrderRepository;

export function getOrderRepository(): IOrderRepository {
  if (repository) return repository;

  const mode = process.env.PERSISTENCE_MODE || 'memory';

  if (mode === 'postgres') {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for postgres persistence mode');
    }
    repository = new PostgresOrderRepository();
  } else {
    repository = new InMemoryOrderRepository();
  }

  return repository;
}

export function resetOrderRepository(): void {
  repository = undefined as unknown as IOrderRepository;
}
