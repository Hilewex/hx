import {
  ListSettlementLinesQuery,
  ListSettlementPayableEarningsQuery,
  SettlementCreatorEarning,
  SettlementCreatorEarningListResponse,
  SettlementLine,
  SettlementLineListResponse,
  SettlementSupplierPayable,
  SettlementSupplierPayableListResponse,
} from '@hx/contracts';

export interface ISettlementRepository {
  createMany(lines: SettlementLine[]): Promise<void>;
  createSupplierPayables(payables: SettlementSupplierPayable[]): Promise<void>;
  createCreatorEarnings(earnings: SettlementCreatorEarning[]): Promise<void>;
  getSupplierPayableById(payableId: string): Promise<SettlementSupplierPayable | null>;
  getCreatorEarningById(earningId: string): Promise<SettlementCreatorEarning | null>;
  reverseSupplierPayable(payableId: string, updates: Partial<SettlementSupplierPayable>): Promise<SettlementSupplierPayable | null>;
  reverseCreatorEarning(earningId: string, updates: Partial<SettlementCreatorEarning>): Promise<SettlementCreatorEarning | null>;
  markSupplierPayableReleaseEligible(payableId: string, updatedAt: string): Promise<SettlementSupplierPayable | null>;
  markCreatorEarningReleaseEligible(earningId: string, updatedAt: string): Promise<SettlementCreatorEarning | null>;
  update(settlementLineId: string, updates: Partial<SettlementLine>): Promise<void>;
  getById(settlementLineId: string): Promise<SettlementLine | null>;
  list(query: ListSettlementLinesQuery): Promise<SettlementLineListResponse>;
  listSupplierPayables(query: ListSettlementPayableEarningsQuery): Promise<SettlementSupplierPayableListResponse>;
  listCreatorEarnings(query: ListSettlementPayableEarningsQuery): Promise<SettlementCreatorEarningListResponse>;
  getByIdempotencyKey(idempotencyKey: string): Promise<string[] | null>;
  saveIdempotencyKey(idempotencyKey: string, settlementLineIds: string[]): Promise<void>;
}
