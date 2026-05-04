import { Pool } from 'pg';
import { IFinanceCorrectionRepository } from './interface';
import { InMemoryFinanceCorrectionRepository } from './in-memory';
import { PostgresFinanceCorrectionRepository } from './postgres';

let repository: IFinanceCorrectionRepository;

export function getFinanceCorrectionRepository(): IFinanceCorrectionRepository {
  if (!repository) {
    const mode = process.env.PERSISTENCE_MODE || 'in-memory';

    if (mode === 'postgres') {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL is required when PERSISTENCE_MODE is postgres');
      }
      const pool = new Pool({ connectionString: dbUrl });
      repository = new PostgresFinanceCorrectionRepository(pool);
    } else {
      repository = new InMemoryFinanceCorrectionRepository();
    }
  }
  return repository;
}
