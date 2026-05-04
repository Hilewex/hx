import { 
  ModerationCase, 
  ListModerationCasesQuery
} from '@hx/contracts';
import { IModerationRepository } from './interface';

export class InMemoryModerationRepository implements IModerationRepository {
  private store = new Map<string, ModerationCase>();
  private idempotency = new Map<string, string>();

  async create(mCase: ModerationCase): Promise<void> {
    this.store.set(mCase.caseId, mCase);
  }

  async update(mCase: ModerationCase): Promise<void> {
    this.store.set(mCase.caseId, mCase);
  }

  async getById(caseId: string): Promise<ModerationCase | null> {
    return this.store.get(caseId) || null;
  }

  async list(q: ListModerationCasesQuery): Promise<ModerationCase[]> {
    let cases = Array.from(this.store.values());
    if (q.targetType) cases = cases.filter(c => c.target.targetType === q.targetType);
    if (q.status) cases = cases.filter(c => c.status === q.status);
    if (q.riskLevel) cases = cases.filter(c => c.riskLevel === q.riskLevel);
    if (q.source) cases = cases.filter(c => c.source === q.source);
    return cases.slice(0, q.limit || 10);
  }

  async findByIdempotencyKey(key: string): Promise<string | null> {
    return this.idempotency.get(key) || null;
  }

  async saveIdempotencyKey(key: string, caseId: string): Promise<void> {
    this.idempotency.set(key, caseId);
  }
}
