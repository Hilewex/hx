import {
  PayoutItem,
  PayoutBatch,
  ListPayoutItemsQuery,
  ListPayoutBatchesQuery,
  PayoutItemListResponse,
  PayoutBatchListResponse,
  PayoutCandidate,
  PayoutCandidateListResponse
} from '@hx/contracts';

export interface IPayoutRepository {
  createItems(items: PayoutItem[]): Promise<void>;
  updateItem(payoutItemId: string, updates: Partial<PayoutItem>): Promise<void>;
  getItemById(payoutItemId: string): Promise<PayoutItem | null>;
  listItems(query: ListPayoutItemsQuery): Promise<PayoutItemListResponse>;
  
  createBatch(batch: PayoutBatch): Promise<void>;
  updateBatch(batchId: string, updates: Partial<PayoutBatch>): Promise<void>;
  getBatchById(batchId: string): Promise<PayoutBatch | null>;
  listBatches(query: ListPayoutBatchesQuery): Promise<PayoutBatchListResponse>;

  getItemIdsByIdempotencyKey(idempotencyKey: string): Promise<string[] | null>;
  getBatchIdByIdempotencyKey(idempotencyKey: string): Promise<string | null>;
  saveItemIdempotencyKey(idempotencyKey: string, payoutItemIds: string[]): Promise<void>;
  saveBatchIdempotencyKey(idempotencyKey: string, batchId: string): Promise<void>;

  createPayoutCandidate(candidate: PayoutCandidate): Promise<void>;
  updatePayoutCandidate(payoutCandidateId: string, updates: Partial<PayoutCandidate>): Promise<void>;
  getPayoutCandidateById(payoutCandidateId: string): Promise<PayoutCandidate | null>;
  getPayoutCandidateBySourceFingerprint(sourceFingerprint: string): Promise<PayoutCandidate | null>;
  savePayoutCandidateSourceFingerprint(sourceFingerprint: string, payoutCandidateId: string): Promise<void>;
  listPayoutCandidates(): Promise<PayoutCandidateListResponse>;
}
