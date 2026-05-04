import { IRefundRepository } from './interface';
import { InMemoryRefundRepository } from './in-memory';
import { PostgresRefundRepository } from './postgres';

let repository: IRefundRepository | undefined;

export function getRefundRepository(): IRefundRepository {
  if (repository) return repository;

  const mode = process.env.PERSISTENCE_MODE || 'memory';

  if (mode === 'postgres') {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for postgres persistence mode');
    }
    repository = new PostgresRefundRepository();
  } else {
    repository = new InMemoryRefundRepository();
  }

  return repository;
}

export function resetRefundRepository(mockRepo?: IRefundRepository) {
  repository = mockRepo;
}
