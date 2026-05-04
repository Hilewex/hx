import { IPaymentRepository } from './interface';
import { InMemoryPaymentRepository } from './in-memory';
import { PostgresPaymentRepository } from './postgres';

let repository: IPaymentRepository;

export function getPaymentRepository(): IPaymentRepository {
  if (repository) return repository;

  const mode = process.env.PERSISTENCE_MODE || 'memory';

  if (mode === 'postgres') {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for postgres persistence mode');
    }
    repository = new PostgresPaymentRepository();
  } else {
    repository = new InMemoryPaymentRepository();
  }

  return repository;
}

export function resetPaymentRepository(): void {
  repository = undefined as unknown as IPaymentRepository;
}
