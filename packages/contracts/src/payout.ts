import { ProviderResultEnvelope } from './provider';

export type PayoutBeneficiaryType = 'CREATOR' | 'SUPPLIER' | 'PLATFORM' | 'UNKNOWN';

export type PayoutBatchType = 'DAILY' | 'WEEKLY' | 'MANUAL' | 'CREATOR' | 'SUPPLIER' | 'FOUNDATION_SIMULATION';

export type PayableStatus = 'ELIGIBLE' | 'ON_HOLD' | 'BLOCKED' | 'RELEASED' | 'SUPERSEDED';

export type PayoutStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'UNKNOWN_RESULT';

export type PayoutSourceType =
  | 'SETTLEMENT'
  | 'SETTLEMENT_LINE'
  | 'PAYABLE'
  | 'MANUAL_ADJUSTMENT';

export type PayoutProviderMode = 'SIMULATION' | 'SANDBOX' | 'PRODUCTION';

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
  ledgerTruthMutated?: false;
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
  sourceType: 'SETTLEMENT' | 'SETTLEMENT_LINE' | 'PAYABLE' | 'MANUAL_ADJUSTMENT' | 'RISK' | 'FINANCE_CORRECTION' | 'MANUAL_FOUNDATION';
  sourceId: string;
  sourceState?: string;
  metadata?: Record<string, any>;
}

export type PayoutBoundaryLimitationFlag =
  | 'PROVIDER_PAYOUT_EXECUTION_NOT_PERFORMED'
  | 'PAYABLE_LIFECYCLE_FOUNDATION_ONLY'
  | 'SETTLEMENT_TRUTH_NOT_MUTATED'
  | 'LEDGER_TRUTH_NOT_MUTATED'
  | 'APPROVAL_WORKFLOW_NOT_IMPLEMENTED'
  | 'AUDIT_WORKFLOW_NOT_ENFORCED'
  | 'DUPLICATE_IDEMPOTENCY_KEY_CONFLICT'
  | 'DUPLICATE_PAYOUT_SOURCE_CONFLICT';

export interface PayoutBoundarySummary {
  payableCreated: boolean;
  payoutRequested: boolean;
  duplicatePayout: boolean;
  actualProviderPayoutPerformed: false;
  settlementTruthMutated: false;
  ledgerTruthMutated: false;
  paymentTruthMutated: false;
  refundTruthMutated: false;
  orderTruthMutated: false;
}

export interface PayoutItem {
  payoutItemId: string;
  sourceType?: PayoutSourceType;
  sourceId?: string;
  settlementId?: string;
  counterpartyType?: PayoutBeneficiaryType | string;
  counterpartyId?: string;
  amount?: number;
  currency?: string;
  payableStatus?: PayableStatus;
  payoutStatus?: PayoutStatus;
  riskHold?: boolean;
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
  payoutBatchId?: string;
  batchType: PayoutBatchType;
  status: PayoutBatchStatus;
  beneficiaryType?: PayoutBeneficiaryType;
  itemIds: string[];
  items?: PayoutItem[];
  totalAmount: number;
  currency: string;
  providerMode?: PayoutProviderMode;
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

export interface CreatePayoutItemFromSourceCommand {
  sourceType: PayoutSourceType;
  sourceId: string;
  settlementId?: string;
  settlementLineId?: string;
  counterpartyType: PayoutBeneficiaryType | string;
  counterpartyId: string;
  amount: number;
  currency: string;
  holdReason?: PayoutHoldReasonCode;
  riskHold?: boolean;
  idempotencyKey: string;
  correlationId?: string;
  metadata?: Record<string, any>;
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
  status?: 'CREATED' | 'DUPLICATE' | 'REJECTED';
  payoutItemId?: string;
  batchId?: string;
  payoutItem?: PayoutItem;
  payoutItems?: PayoutItem[];
  batch?: PayoutBatch;
  duplicateOfPayoutItemId?: string;
  summary?: PayoutBoundarySummary;
  limitationFlags?: PayoutBoundaryLimitationFlag[];
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
