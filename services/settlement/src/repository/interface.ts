import { SettlementLine, ListSettlementLinesQuery, SettlementLineListResponse } from '@hx/contracts';

export interface ISettlementRepository {
  createMany(lines: SettlementLine[]): Promise<void>;
  update(settlementLineId: string, updates: Partial<SettlementLine>): Promise<void>;
  getById(settlementLineId: string): Promise<SettlementLine | null>;
  list(query: ListSettlementLinesQuery): Promise<SettlementLineListResponse>;
  getByIdempotencyKey(idempotencyKey: string): Promise<string[] | null>;
  saveIdempotencyKey(idempotencyKey: string, settlementLineIds: string[]): Promise<void>;
}
