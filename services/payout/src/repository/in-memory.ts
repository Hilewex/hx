import {
  PayoutItem,
  PayoutBatch,
  ListPayoutItemsQuery,
  ListPayoutBatchesQuery,
  PayoutItemListResponse,
  PayoutBatchListResponse
} from '@hx/contracts';
import { IPayoutRepository } from './interface';

export class InMemoryPayoutRepository implements IPayoutRepository {
  private items = new Map<string, PayoutItem>();
  private batches = new Map<string, PayoutBatch>();
  private itemKeys = new Map<string, string[]>();
  private batchKeys = new Map<string, string>();

  async createItems(items: PayoutItem[]): Promise<void> {
    for (const item of items) {
      this.items.set(item.payoutItemId, item);
    }
  }

  async updateItem(payoutItemId: string, updates: Partial<PayoutItem>): Promise<void> {
    const item = this.items.get(payoutItemId);
    if (item) {
      this.items.set(payoutItemId, { ...item, ...updates, updatedAt: new Date().toISOString() });
    }
  }

  async getItemById(payoutItemId: string): Promise<PayoutItem | null> {
    return this.items.get(payoutItemId) || null;
  }

  async listItems(query: ListPayoutItemsQuery): Promise<PayoutItemListResponse> {
    let result = Array.from(this.items.values());

    if (query.beneficiaryType) result = result.filter(i => i.beneficiaryType === query.beneficiaryType);
    if (query.beneficiaryId) result = result.filter(i => i.beneficiaryId === query.beneficiaryId);
    if (query.settlementLineId) result = result.filter(i => i.settlementLineId === query.settlementLineId);
    if (query.batchId) result = result.filter(i => i.batchId === query.batchId);
    if (query.status) result = result.filter(i => i.status === query.status);

    const total = result.length;
    if (query.offset !== undefined) result = result.slice(query.offset);
    if (query.limit !== undefined) result = result.slice(0, query.limit);

    return { payoutItems: result, total };
  }

  async createBatch(batch: PayoutBatch): Promise<void> {
    this.batches.set(batch.batchId, batch);
  }

  async updateBatch(batchId: string, updates: Partial<PayoutBatch>): Promise<void> {
    const batch = this.batches.get(batchId);
    if (batch) {
      this.batches.set(batchId, { ...batch, ...updates, updatedAt: new Date().toISOString() });
    }
  }

  async getBatchById(batchId: string): Promise<PayoutBatch | null> {
    return this.batches.get(batchId) || null;
  }

  async listBatches(query: ListPayoutBatchesQuery): Promise<PayoutBatchListResponse> {
    let result = Array.from(this.batches.values());

    if (query.batchType) result = result.filter(b => b.batchType === query.batchType);
    if (query.status) result = result.filter(b => b.status === query.status);
    if (query.beneficiaryType) result = result.filter(b => b.beneficiaryType === query.beneficiaryType);

    const total = result.length;
    if (query.offset !== undefined) result = result.slice(query.offset);
    if (query.limit !== undefined) result = result.slice(0, query.limit);

    return { batches: result, total };
  }

  async getItemIdsByIdempotencyKey(idempotencyKey: string): Promise<string[] | null> {
    return this.itemKeys.get(idempotencyKey) || null;
  }

  async getBatchIdByIdempotencyKey(idempotencyKey: string): Promise<string | null> {
    return this.batchKeys.get(idempotencyKey) || null;
  }

  async saveItemIdempotencyKey(idempotencyKey: string, payoutItemIds: string[]): Promise<void> {
    this.itemKeys.set(idempotencyKey, payoutItemIds);
  }

  async saveBatchIdempotencyKey(idempotencyKey: string, batchId: string): Promise<void> {
    this.batchKeys.set(idempotencyKey, batchId);
  }
}
