import { RiskSignal, RiskCase } from '@hx/contracts';
import { IRiskRepository } from './interface';

export class InMemoryRiskRepository implements IRiskRepository {
  private signals: Map<string, RiskSignal> = new Map();
  private cases: Map<string, RiskCase> = new Map();
  private idempotency: Map<string, string> = new Map();

  async createSignal(signal: RiskSignal): Promise<void> {
    this.signals.set(signal.signalId, signal);
  }

  async createCase(riskCase: RiskCase): Promise<void> {
    this.cases.set(riskCase.caseId, riskCase);
  }

  async updateCase(caseId: string, updates: Partial<RiskCase>): Promise<void> {
    const existing = this.cases.get(caseId);
    if (existing) {
      this.cases.set(caseId, { ...existing, ...updates });
    }
  }

  async getCase(caseId: string): Promise<RiskCase | null> {
    return this.cases.get(caseId) || null;
  }

  async listCases(query: any): Promise<{ cases: RiskCase[]; total: number }> {
    let result = Array.from(this.cases.values());

    if (query.targetId) result = result.filter(c => c.target.targetId === query.targetId);
    if (query.targetType) result = result.filter(c => c.target.targetType === query.targetType);
    if (query.status) result = result.filter(c => c.status === query.status);
    if (query.level) result = result.filter(c => c.level === query.level);

    const total = result.length;
    const offset = query.offset || 0;
    const limit = query.limit || 50;

    return {
      cases: result.slice(offset, offset + limit),
      total,
    };
  }

  async listSignals(query: any): Promise<{ signals: RiskSignal[]; total: number }> {
    let result = Array.from(this.signals.values());

    if (query.targetId) result = result.filter(s => s.target.targetId === query.targetId);
    if (query.targetType) result = result.filter(s => s.target.targetType === query.targetType);

    const total = result.length;
    const offset = query.offset || 0;
    const limit = query.limit || 50;

    return {
      signals: result.slice(offset, offset + limit),
      total,
    };
  }

  async checkIdempotency(key: string): Promise<string | null> {
    return this.idempotency.get(key) || null;
  }

  async saveIdempotency(key: string, result: string): Promise<void> {
    this.idempotency.set(key, result);
  }
}
