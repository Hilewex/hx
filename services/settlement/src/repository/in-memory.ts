import { SettlementLine, ListSettlementLinesQuery, SettlementLineListResponse } from '@hx/contracts';
import { ISettlementRepository } from './interface';

export class InMemorySettlementRepository implements ISettlementRepository {
  private lines: Map<string, SettlementLine> = new Map();
  private idempotencyMap: Map<string, string[]> = new Map();

  async createMany(lines: SettlementLine[]): Promise<void> {
    for (const line of lines) {
      this.lines.set(line.settlementLineId, { ...line });
    }
  }

  async update(settlementLineId: string, updates: Partial<SettlementLine>): Promise<void> {
    const existing = this.lines.get(settlementLineId);
    if (existing) {
      this.lines.set(settlementLineId, { ...existing, ...updates });
    }
  }

  async getById(settlementLineId: string): Promise<SettlementLine | null> {
    const line = this.lines.get(settlementLineId);
    return line ? { ...line } : null;
  }

  async list(query: ListSettlementLinesQuery): Promise<SettlementLineListResponse> {
    let result = Array.from(this.lines.values());

    if (query.orderId) {
      result = result.filter(r => r.orderId === query.orderId);
    }
    if (query.orderLineId) {
      result = result.filter(r => r.orderLineId === query.orderLineId);
    }
    if (query.storefrontId) {
      result = result.filter(r => r.storefrontId === query.storefrontId);
    }
    if (query.partyType) {
      result = result.filter(r => r.partyType === query.partyType);
    }
    if (query.status) {
      result = result.filter(r => r.status === query.status);
    }
    if (query.reasonCode) {
      result = result.filter(r => r.reasonCode === query.reasonCode);
    }

    const total = result.length;
    const limit = query.limit || 50;
    const offset = query.offset || 0;

    result = result.slice(offset, offset + limit);

    return {
      settlementLines: result.map(l => ({ ...l })),
      total,
    };
  }

  async getByIdempotencyKey(idempotencyKey: string): Promise<string[] | null> {
    const ids = this.idempotencyMap.get(idempotencyKey);
    return ids ? [...ids] : null;
  }

  async saveIdempotencyKey(idempotencyKey: string, settlementLineIds: string[]): Promise<void> {
    this.idempotencyMap.set(idempotencyKey, [...settlementLineIds]);
  }
}
