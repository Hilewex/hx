import { IShipmentRepository } from './interface';
import { InMemoryShipmentRepository } from './in-memory';
import { PostgresShipmentRepository } from './postgres';

let repository: IShipmentRepository | undefined;

export function getShipmentRepository(): IShipmentRepository {
  if (repository) return repository;

  const mode = process.env.PERSISTENCE_MODE || 'memory';

  if (mode === 'postgres') {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for postgres persistence mode');
    }
    repository = new PostgresShipmentRepository();
  } else {
    repository = new InMemoryShipmentRepository();
  }

  return repository;
}

export function resetShipmentRepository(mockRepo?: IShipmentRepository) {
  repository = mockRepo;
}
