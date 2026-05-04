import { 
  FinanceCorrectionRecord, 
  ListFinanceCorrectionsQuery 
} from '@hx/contracts';

export interface IFinanceCorrectionRepository {
  create(record: FinanceCorrectionRecord): Promise<void>;
  update(correctionId: string, updates: Partial<FinanceCorrectionRecord>): Promise<void>;
  getById(correctionId: string): Promise<FinanceCorrectionRecord | undefined>;
  list(query: ListFinanceCorrectionsQuery): Promise<{ corrections: FinanceCorrectionRecord[]; total: number }>;
  getByIdempotencyKey(idempotencyKey: string): Promise<string | undefined>;
  saveIdempotencyKey(idempotencyKey: string, correctionId: string): Promise<void>;
}
