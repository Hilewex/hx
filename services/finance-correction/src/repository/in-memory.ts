import { 
  FinanceCorrectionRecord, 
  ListFinanceCorrectionsQuery 
} from '@hx/contracts';
import { IFinanceCorrectionRepository } from './interface';

export class InMemoryFinanceCorrectionRepository implements IFinanceCorrectionRepository {
  private corrections = new Map<string, FinanceCorrectionRecord>();
  private idempotencyKeys = new Map<string, string>();

  async create(record: FinanceCorrectionRecord): Promise<void> {
    this.corrections.set(record.correctionId, { ...record });
  }

  async update(correctionId: string, updates: Partial<FinanceCorrectionRecord>): Promise<void> {
    const existing = this.corrections.get(correctionId);
    if (existing) {
      this.corrections.set(correctionId, { ...existing, ...updates });
    }
  }

  async getById(correctionId: string): Promise<FinanceCorrectionRecord | undefined> {
    const record = this.corrections.get(correctionId);
    return record ? { ...record } : undefined;
  }

  async list(query: ListFinanceCorrectionsQuery): Promise<{ corrections: FinanceCorrectionRecord[]; total: number }> {
    let results = Array.from(this.corrections.values());

    if (query.targetType) {
      results = results.filter(r => r.target.targetType === query.targetType);
    }
    if (query.targetId) {
      results = results.filter(r => r.target.targetId === query.targetId);
    }
    if (query.status) {
      results = results.filter(r => r.status === query.status);
    }
    if (query.reasonCode) {
      results = results.filter(r => r.reasonCode === query.reasonCode);
    }
    if (query.severity) {
      results = results.filter(r => r.severity === query.severity);
    }

    const total = results.length;
    
    if (query.offset !== undefined) {
      results = results.slice(query.offset);
    }
    if (query.limit !== undefined) {
      results = results.slice(0, query.limit);
    }

    return { corrections: results.map(r => ({ ...r })), total };
  }

  async getByIdempotencyKey(idempotencyKey: string): Promise<string | undefined> {
    return this.idempotencyKeys.get(idempotencyKey);
  }

  async saveIdempotencyKey(idempotencyKey: string, correctionId: string): Promise<void> {
    this.idempotencyKeys.set(idempotencyKey, correctionId);
  }
}
