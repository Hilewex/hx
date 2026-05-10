export type LedgerEntryDirection = 'DEBIT' | 'CREDIT';

export type LedgerEntryType =
  | 'PAYMENT_CAPTURE'
  | 'PLATFORM_COMMISSION'
  | 'SUPPLIER_PAYABLE'
  | 'CREATOR_SHARE'
  | 'COUPON_DISCOUNT'
  | 'REFUND'
  | 'REFUND_REVERSAL'
  | 'CORRECTION'
  | 'PAYOUT'
  | 'PAYOUT_REVERSAL';

export type LedgerSourceType =
  | 'PAYMENT'
  | 'ORDER'
  | 'ORDER_LINE'
  | 'REFUND'
  | 'SETTLEMENT'
  | 'PAYOUT'
  | 'COUPON'
  | 'CAMPAIGN'
  | 'REWARD'
  | 'MANUAL_CORRECTION';

export interface LedgerEntry {
  ledgerEntryId: string;
  idempotencyKey: string;
  sourceType: LedgerSourceType;
  sourceId: string;
  sourceEventId?: string;
  direction: LedgerEntryDirection;
  entryType: LedgerEntryType;
  amount: number;
  currency: string;
  accountType?: string;
  accountKey?: string;
  counterpartyType?: string;
  counterpartyId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  immutable: true;
}

export interface AppendLedgerEntryCommand {
  idempotencyKey: string;
  sourceType: LedgerSourceType;
  sourceId: string;
  sourceEventId?: string;
  direction: LedgerEntryDirection;
  entryType: LedgerEntryType;
  amount: number;
  currency: string;
  accountType?: string;
  accountKey?: string;
  counterpartyType?: string;
  counterpartyId?: string;
  metadata?: Record<string, any>;
}

export interface AppendLedgerEntryResult {
  success: boolean;
  ledgerEntryId?: string;
  entry?: LedgerEntry;
  errors?: string[];
}

export interface GetLedgerQuery {
  sourceType?: LedgerSourceType;
  sourceId?: string;
  entryType?: LedgerEntryType;
  direction?: LedgerEntryDirection;
}

export type RefundFinancialImpactType = 'REFUND' | 'REFUND_REVERSAL';

export type RefundFinancialImpactStatus = 'RECORDED' | 'DUPLICATE' | 'REJECTED';

export type RefundFinancialImpactLimitationFlag =
  | 'PARTIAL_REFUND_SUPPORTED_AMOUNT_BASED'
  | 'SETTLEMENT_ADJUSTMENT_NOT_PERFORMED'
  | 'PAYOUT_REVERSAL_NOT_PERFORMED'
  | 'PROVIDER_REFUND_EXECUTION_NOT_PERFORMED';

export interface RefundFinancialImpactCommand {
  refundId: string;
  orderId?: string;
  orderLineId?: string;
  paymentId?: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
  impactType?: RefundFinancialImpactType;
  originalRefundLedgerEntryId?: string;
  metadata?: Record<string, any>;
}

export interface RefundFinancialImpactSummary {
  ledgerEntryCreated: boolean;
  duplicateImpact: boolean;
  refundImpactType: RefundFinancialImpactType;
  partialRefundSupported: true;
  settlementAdjustedCreated: false;
  payoutReversalCreated: false;
  orderStateMutated: false;
  paymentStateMutated: false;
  refundStateMutated: false;
}

export interface RefundFinancialImpactResult {
  success: boolean;
  status: RefundFinancialImpactStatus;
  ledgerEntryId?: string;
  entry?: LedgerEntry;
  duplicateOfLedgerEntryId?: string;
  summary: RefundFinancialImpactSummary;
  limitationFlags: RefundFinancialImpactLimitationFlag[];
  errors?: string[];
}
