import { ProviderResultEnvelope } from './provider';

export type PayoutBeneficiaryType = 'CREATOR' | 'SUPPLIER' | 'PLATFORM' | 'UNKNOWN';

export type PayoutBatchType = 'DAILY' | 'WEEKLY' | 'MANUAL' | 'CREATOR' | 'SUPPLIER' | 'FOUNDATION_SIMULATION';

export type PayoutItemStatus = 'ELIGIBLE' | 'BELOW_THRESHOLD' | 'ON_HOLD' | 'BATCHED' | 'PENDING_EXECUTION' | 'PROCESSING' | 'PAID' | 'FAILED' | 'RETURNED' | 'CANCELLED' | 'CLOSED';

export type PayoutBatchStatus = 'CREATED' | 'UNDER_REVIEW' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'PARTIALLY_FAILED' | 'FAILED' | 'CANCELLED' | 'CLOSED';

export type PayoutHoldReasonCode = 'RISK_REVIEW_OPEN' | 'FINANCE_CORRECTION_PENDING' | 'BELOW_MINIMUM_THRESHOLD' | 'PAYOUT_ACCOUNT_NOT_VERIFIED' | 'REFUND_OR_RETURN_RISK' | 'MANUAL_HOLD' | 'UNKNOWN';

export type PayoutActionType = 'PLACE_HOLD' | 'RELEASE_HOLD' | 'MARK_ELIGIBLE' | 'ADD_TO_BATCH' | 'MARK_PROCESSING' | 'MARK_PAID' | 'MARK_FAILED' | 'MARK_RETURNED' | 'CANCEL' | 'CLOSE';

export interface PayoutAmountSummary {
  currency: string;
  grossPayableAmount: number;
  heldAmount: number;
  payableAmount: number;
  paidAmount: number;
  minimumThresholdAmount?: number;
  thresholdPassed: boolean;
}

export interface PayoutExecutionSummary {
  providerPayoutReference?: string;
  foundationInstructionOnly: true;
  actualProviderPayoutPerformed: false;
  paymentInstructionCreated: false;
  retryRequired: boolean;
  failureReason?: string;
}

export interface PayoutBoundaryFlags {
  settlementTruthMutated: false;
  paymentTruthMutated: false;
  refundTruthMutated: false;
  orderTruthMutated: false;
  cancelReturnTruthMutated: false;
  financeCorrectionTruthMutated: false;
  riskTruthMutated: false;
  actualProviderPayoutPerformed: false;
  paymentInstructionCreated: false;
}

export interface PayoutSourceRef {
  sourceType: 'SETTLEMENT_LINE' | 'RISK' | 'FINANCE_CORRECTION' | 'MANUAL_FOUNDATION';
  sourceId: string;
  sourceState?: string;
  metadata?: Record<string, any>;
}

export interface PayoutItem {
  payoutItemId: string;
  beneficiaryType: PayoutBeneficiaryType;
  beneficiaryId?: string;
  settlementLineId: string;
  orderId?: string;
  orderLineId?: string;
  storefrontId?: string;
  status: PayoutItemStatus;
  holdReasonCode?: PayoutHoldReasonCode;
  amountSummary: PayoutAmountSummary;
  executionSummary: PayoutExecutionSummary;
  boundaryFlags: PayoutBoundaryFlags;
  sourceRefs: PayoutSourceRef[];
  batchId?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
  errors: string[];
  warnings: string[];
  providerEnvelope?: any; // ProviderResultEnvelope<any, any>;
  providerMode?: string;
  providerName?: string;
  providerReference?: string;
}

export interface PayoutBatch {
  batchId: string;
  batchType: PayoutBatchType;
  status: PayoutBatchStatus;
  beneficiaryType?: PayoutBeneficiaryType;
  itemIds: string[];
  totalAmount: number;
  currency: string;
  scheduledExecutionAt?: string;
  ownerAdminId?: string;
  foundationOnly: true;
  actualProviderPayoutPerformed: false;
  paymentInstructionCreated: false;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
  errors: string[];
  warnings: string[];
}

export interface CreatePayoutItemsFromSettlementCommand {
  settlementLineIds: string[];
  minimumThresholdAmount?: number;
  idempotencyKey?: string;
  correlationId?: string;
}

export interface CreatePayoutBatchCommand {
  payoutItemIds: string[];
  batchType: PayoutBatchType;
  scheduledExecutionAt?: string;
  ownerAdminId?: string;
  idempotencyKey?: string;
  correlationId?: string;
}

export interface ApplyPayoutItemActionCommand {
  payoutItemId: string;
  action: PayoutActionType;
  actorId: string;
  reasonCode?: PayoutHoldReasonCode;
  note?: string;
  correlationId?: string;
}

export interface ApplyPayoutBatchActionCommand {
  batchId: string;
  targetStatus: PayoutBatchStatus;
  actorId: string;
  note?: string;
  correlationId?: string;
}

export interface GetPayoutItemQuery {
  payoutItemId: string;
}

export interface GetPayoutBatchQuery {
  batchId: string;
}

export interface ListPayoutItemsQuery {
  beneficiaryType?: PayoutBeneficiaryType;
  beneficiaryId?: string;
  settlementLineId?: string;
  batchId?: string;
  status?: PayoutItemStatus;
  limit?: number;
  offset?: number;
}

export interface ListPayoutBatchesQuery {
  batchType?: PayoutBatchType;
  status?: PayoutBatchStatus;
  beneficiaryType?: PayoutBeneficiaryType;
  limit?: number;
  offset?: number;
}

export interface PayoutMutationResult {
  success: boolean;
  payoutItemId?: string;
  batchId?: string;
  payoutItem?: PayoutItem;
  payoutItems?: PayoutItem[];
  batch?: PayoutBatch;
  errors?: string[];
  warnings?: string[];
}

export interface PayoutItemResponse {
  payoutItem: PayoutItem;
}

export interface PayoutBatchResponse {
  batch: PayoutBatch;
}

export interface PayoutItemListResponse {
  payoutItems: PayoutItem[];
  total: number;
}

export interface PayoutBatchListResponse {
  batches: PayoutBatch[];
  total: number;
}
