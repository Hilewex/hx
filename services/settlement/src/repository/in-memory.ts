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
import { ISettlementRepository } from './interface';

export class InMemorySettlementRepository implements ISettlementRepository {
  private lines: Map<string, SettlementLine> = new Map();
  private supplierPayables: Map<string, SettlementSupplierPayable> = new Map();
  private creatorEarnings: Map<string, SettlementCreatorEarning> = new Map();
  private idempotencyMap: Map<string, string[]> = new Map();

  async createMany(lines: SettlementLine[]): Promise<void> {
    for (const line of lines) {
      this.lines.set(line.settlementLineId, { ...line });
    }
  }

  async createSupplierPayables(payables: SettlementSupplierPayable[]): Promise<void> {
    for (const payable of payables) {
      this.supplierPayables.set(payable.payableId, { ...payable, sourceRefs: payable.sourceRefs.map(ref => ({ ...ref })) });
    }
  }

  async createCreatorEarnings(earnings: SettlementCreatorEarning[]): Promise<void> {
    for (const earning of earnings) {
      this.creatorEarnings.set(earning.earningId, { ...earning, sourceRefs: earning.sourceRefs.map(ref => ({ ...ref })) });
    }
  }

  async getSupplierPayableById(payableId: string): Promise<SettlementSupplierPayable | null> {
    const payable = this.supplierPayables.get(payableId);
    return payable ? { ...payable, sourceRefs: payable.sourceRefs.map(ref => ({ ...ref })) } : null;
  }

  async getCreatorEarningById(earningId: string): Promise<SettlementCreatorEarning | null> {
    const earning = this.creatorEarnings.get(earningId);
    return earning ? { ...earning, sourceRefs: earning.sourceRefs.map(ref => ({ ...ref })) } : null;
  }

  async reverseSupplierPayable(
    payableId: string,
    updates: Partial<SettlementSupplierPayable>,
  ): Promise<SettlementSupplierPayable | null> {
    const existing = this.supplierPayables.get(payableId);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      sourceRefs: updates.sourceRefs ?? existing.sourceRefs,
    };
    this.supplierPayables.set(payableId, { ...updated, sourceRefs: updated.sourceRefs.map(ref => ({ ...ref })) });
    return this.getSupplierPayableById(payableId);
  }

  async reverseCreatorEarning(
    earningId: string,
    updates: Partial<SettlementCreatorEarning>,
  ): Promise<SettlementCreatorEarning | null> {
    const existing = this.creatorEarnings.get(earningId);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      sourceRefs: updates.sourceRefs ?? existing.sourceRefs,
    };
    this.creatorEarnings.set(earningId, { ...updated, sourceRefs: updated.sourceRefs.map(ref => ({ ...ref })) });
    return this.getCreatorEarningById(earningId);
  }

  async markSupplierPayableReleaseEligible(
    payableId: string,
    updatedAt: string,
  ): Promise<SettlementSupplierPayable | null> {
    const existing = this.supplierPayables.get(payableId);
    if (!existing) return null;

    const updated = {
      ...existing,
      status: 'RELEASE_ELIGIBLE' as const,
      updatedAt,
    };
    this.supplierPayables.set(payableId, { ...updated, sourceRefs: updated.sourceRefs.map(ref => ({ ...ref })) });
    return this.getSupplierPayableById(payableId);
  }

  async markCreatorEarningReleaseEligible(
    earningId: string,
    updatedAt: string,
  ): Promise<SettlementCreatorEarning | null> {
    const existing = this.creatorEarnings.get(earningId);
    if (!existing) return null;

    const updated = {
      ...existing,
      status: 'RELEASE_ELIGIBLE' as const,
      updatedAt,
    };
    this.creatorEarnings.set(earningId, { ...updated, sourceRefs: updated.sourceRefs.map(ref => ({ ...ref })) });
    return this.getCreatorEarningById(earningId);
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

  async listSupplierPayables(
    query: ListSettlementPayableEarningsQuery,
  ): Promise<SettlementSupplierPayableListResponse> {
    let result = Array.from(this.supplierPayables.values());

    if (query.settlementLineId) result = result.filter(r => r.settlementLineId === query.settlementLineId);
    if (query.orderId) result = result.filter(r => r.orderId === query.orderId);
    if (query.orderLineId) result = result.filter(r => r.orderLineId === query.orderLineId);
    if (query.partyId) result = result.filter(r => r.partyId === query.partyId);
    if (query.status) result = result.filter(r => r.status === query.status);

    const total = result.length;
    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return {
      supplierPayables: result.slice(offset, offset + limit).map(p => ({ ...p, sourceRefs: p.sourceRefs.map(ref => ({ ...ref })) })),
      total,
    };
  }

  async listCreatorEarnings(
    query: ListSettlementPayableEarningsQuery,
  ): Promise<SettlementCreatorEarningListResponse> {
    let result = Array.from(this.creatorEarnings.values());

    if (query.settlementLineId) result = result.filter(r => r.settlementLineId === query.settlementLineId);
    if (query.orderId) result = result.filter(r => r.orderId === query.orderId);
    if (query.orderLineId) result = result.filter(r => r.orderLineId === query.orderLineId);
    if (query.partyId) result = result.filter(r => r.partyId === query.partyId);
    if (query.status) result = result.filter(r => r.status === query.status);

    const total = result.length;
    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return {
      creatorEarnings: result.slice(offset, offset + limit).map(e => ({ ...e, sourceRefs: e.sourceRefs.map(ref => ({ ...ref })) })),
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
