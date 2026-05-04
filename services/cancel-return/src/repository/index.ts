import { ICancelReturnRepository } from './interface';
import { InMemoryCancelReturnRepository } from './in-memory';
import { PostgresCancelReturnRepository } from './postgres';

let repository: ICancelReturnRepository | undefined;

export function getCancelReturnRepository(): ICancelReturnRepository {
  if (repository) return repository;

  const mode = process.env.PERSISTENCE_MODE || 'memory';

  if (mode === 'postgres') {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for postgres persistence mode');
    }
    repository = new PostgresCancelReturnRepository();
  } else {
    repository = new InMemoryCancelReturnRepository();
  }

  return repository;
}

export function resetCancelReturnRepository(mockRepo?: ICancelReturnRepository) {
  repository = mockRepo;
}
