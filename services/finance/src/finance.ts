import { 
  AppendLedgerEntryCommand, 
  AppendLedgerEntryResult, 
  GetLedgerQuery, 
  LedgerEntry,
  RefundFinancialImpactCommand,
  RefundFinancialImpactResult,
  RefundFinancialImpactType,
} from '@hx/contracts';
import { appendLedgerEntry as appendToDb, getLedgerEntries as getFromDb } from '@hx/persistence';

export async function appendLedgerEntry(command: AppendLedgerEntryCommand): Promise<AppendLedgerEntryResult> {
  try {
    if (!command.idempotencyKey) {
      return { success: false, errors: ['IDEMPOTENCY_KEY_REQUIRED'] };
    }
    if (!command.amount || command.amount <= 0) {
      return { success: false, errors: ['AMOUNT_MUST_BE_POSITIVE'] };
    }
    if (!command.currency) {
      return { success: false, errors: ['CURRENCY_REQUIRED'] };
    }
    if (!command.sourceType || !command.sourceId) {
      return { success: false, errors: ['SOURCE_REFERENCE_REQUIRED'] };
    }
    
    const entry = appendToDb(command);
    return {
      success: true,
      ledgerEntryId: entry.ledgerEntryId,
      entry
    };
  } catch (err: any) {
    if (err.message === 'DUPLICATE_IDEMPOTENCY_KEY') {
      return { success: false, errors: ['DUPLICATE_IDEMPOTENCY_KEY'] };
    }
    return { success: false, errors: ['LEDGER_APPEND_FAILED'] };
  }
}

export async function getLedgerEntries(query: GetLedgerQuery): Promise<LedgerEntry[]> {
  return getFromDb(query);
}

function stableValue(value: any): any {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, any>>((acc, key) => {
        acc[key] = stableValue(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function createRefundImpactFingerprint(command: RefundFinancialImpactCommand): string {
  return JSON.stringify(stableValue({
    refundId: command.refundId,
    orderId: command.orderId,
    orderLineId: command.orderLineId,
    paymentId: command.paymentId,
    amount: command.amount,
    currency: command.currency,
    impactType: command.impactType ?? 'REFUND',
    originalRefundLedgerEntryId: command.originalRefundLedgerEntryId,
    metadata: command.metadata ?? {},
  }));
}

function createRefundImpactSummary(
  impactType: RefundFinancialImpactType,
  ledgerEntryCreated: boolean,
  duplicateImpact: boolean
): RefundFinancialImpactResult['summary'] {
  return {
    ledgerEntryCreated,
    duplicateImpact,
    refundImpactType: impactType,
    partialRefundSupported: true,
    settlementAdjustedCreated: false,
    payoutReversalCreated: false,
    orderStateMutated: false,
    paymentStateMutated: false,
    refundStateMutated: false,
  };
}

export async function recordRefundFinancialImpact(
  command: RefundFinancialImpactCommand
): Promise<RefundFinancialImpactResult> {
  const impactType = command.impactType ?? 'REFUND';
  const limitationFlags: RefundFinancialImpactResult['limitationFlags'] = [
    'PARTIAL_REFUND_SUPPORTED_AMOUNT_BASED',
    'SETTLEMENT_ADJUSTMENT_NOT_PERFORMED',
    'PAYOUT_REVERSAL_NOT_PERFORMED',
    'PROVIDER_REFUND_EXECUTION_NOT_PERFORMED',
  ];
  const rejectedSummary = createRefundImpactSummary(impactType, false, false);
  const errors: string[] = [];

  if (!command.refundId) errors.push('REFUND_ID_REQUIRED');
  if (!command.idempotencyKey) errors.push('IDEMPOTENCY_KEY_REQUIRED');
  if (!command.amount && command.amount !== 0) errors.push('AMOUNT_REQUIRED');
  if (!command.currency) errors.push('CURRENCY_REQUIRED');
  if (command.amount !== undefined && (!Number.isFinite(command.amount) || command.amount <= 0)) {
    errors.push('AMOUNT_MUST_BE_POSITIVE');
  }

  if (errors.length > 0) {
    return {
      success: false,
      status: 'REJECTED',
      summary: rejectedSummary,
      limitationFlags,
      errors,
    };
  }

  const fingerprint = createRefundImpactFingerprint(command);
  const existing = getFromDb({}).find((entry) => entry.idempotencyKey === command.idempotencyKey);

  if (existing) {
    if (existing.metadata?.refundFinancialImpactFingerprint !== fingerprint) {
      return {
        success: false,
        status: 'REJECTED',
        duplicateOfLedgerEntryId: existing.ledgerEntryId,
        summary: createRefundImpactSummary(impactType, false, true),
        limitationFlags,
        errors: ['DUPLICATE_IDEMPOTENCY_KEY_CONFLICT'],
      };
    }

    return {
      success: true,
      status: 'DUPLICATE',
      ledgerEntryId: existing.ledgerEntryId,
      entry: existing,
      duplicateOfLedgerEntryId: existing.ledgerEntryId,
      summary: createRefundImpactSummary(impactType, false, true),
      limitationFlags,
    };
  }

  const appendResult = await appendLedgerEntry({
    idempotencyKey: command.idempotencyKey,
    sourceType: 'REFUND',
    sourceId: command.refundId,
    sourceEventId: command.originalRefundLedgerEntryId,
    direction: impactType === 'REFUND_REVERSAL' ? 'CREDIT' : 'DEBIT',
    entryType: impactType,
    amount: command.amount,
    currency: command.currency,
    accountType: 'REFUND_IMPACT',
    accountKey: command.refundId,
    counterpartyType: command.paymentId ? 'PAYMENT' : undefined,
    counterpartyId: command.paymentId,
    metadata: {
      ...(command.metadata ?? {}),
      refundId: command.refundId,
      orderId: command.orderId,
      orderLineId: command.orderLineId,
      paymentId: command.paymentId,
      originalRefundLedgerEntryId: command.originalRefundLedgerEntryId,
      refundFinancialImpactFingerprint: fingerprint,
      settlementAdjustedCreated: false,
      payoutReversalCreated: false,
      orderStateMutated: false,
      paymentStateMutated: false,
      refundStateMutated: false,
    },
  });

  if (!appendResult.success || !appendResult.entry) {
    return {
      success: false,
      status: 'REJECTED',
      summary: rejectedSummary,
      limitationFlags,
      errors: appendResult.errors ?? ['REFUND_FINANCIAL_IMPACT_LEDGER_APPEND_FAILED'],
    };
  }

  return {
    success: true,
    status: 'RECORDED',
    ledgerEntryId: appendResult.ledgerEntryId,
    entry: appendResult.entry,
    summary: createRefundImpactSummary(impactType, true, false),
    limitationFlags,
  };
}
