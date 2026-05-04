import { ISettlementRepository } from './interface';
import { InMemorySettlementRepository } from './in-memory';
import { PostgresSettlementRepository } from './postgres';

let repositoryInstance: ISettlementRepository | null = null;

export function getRepository(): ISettlementRepository {
  if (repositoryInstance) return repositoryInstance;

  const mode = process.env.PERSISTENCE_MODE || 'memory';

  if (mode === 'postgres') {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL is required when PERSISTENCE_MODE is postgres');
    }
    repositoryInstance = new PostgresSettlementRepository(dbUrl);
  } else if (mode === 'memory') {
    repositoryInstance = new InMemorySettlementRepository();
  } else {
    throw new Error(`Unsupported PERSISTENCE_MODE: ${mode}`);
  }

  return repositoryInstance;
}

export function resetRepositoryForTesting(): void {
  repositoryInstance = null;
}
