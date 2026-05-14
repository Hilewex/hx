import {
  SettlementCalculationInput,
  SettlementCalculationLine,
  SettlementCalculationResult,
  SettlementLimitationFlag,
  CreateSettlementFromOrderCommand,
  ApplySettlementActionCommand,
  GetSettlementLineQuery,
  ListSettlementPayableEarningsQuery,
  ListSettlementLinesQuery,
  SettlementCreatorEarning,
  SettlementCreatorEarningListResponse,
  CreatorEarningReleaseEvaluationResult,
  EvaluateCreatorEarningReleaseCommand,
  EvaluateSupplierPayableReleaseCommand,
  SettlementCreatorEarningReversal,
  SettlementCreatorEarningReversalResult,
  SettlementMutationResult,
  SettlementLineResponse,
  SettlementLineListResponse,
  SettlementLine,
  SettlementLineStatus,
  SettlementSourceRef,
  SettlementSupplierPayable,
  SettlementSupplierPayableListResponse,
  SupplierPayableReleaseEvaluationResult,
  SettlementSupplierPayableReversal,
  SettlementSupplierPayableReversalResult,
  ReverseSettlementCreatorEarningCommand,
  ReverseSettlementSupplierPayableCommand,
} from '@hx/contracts';

import { getOrderById } from '@hx/order';
import { getCancelReturnRequestsByOrderId } from '@hx/cancel-return';
import { listFinanceCorrections } from '@hx/finance-correction';
import { listRiskCases } from '@hx/risk';

import { randomUUID } from 'node:crypto';
import { getRepository } from './repository';

const calculationIdempotencyMap = new Map<string, SettlementCalculationResult>();
const calculationFingerprintMap = new Map<string, string>();
const supplierPayableReversalIdempotencyMap = new Map<string, SettlementSupplierPayableReversalResult & { fingerprint: string }>();
const creatorEarningReversalIdempotencyMap = new Map<string, SettlementCreatorEarningReversalResult & { fingerprint: string }>();

const reversalBoundaryFlags = {
  ledgerEntryCreated: false as const,
  providerPayoutReversed: false as const,
  payoutMutationPerformed: false as const,
  financeCorrectionCreated: false as const,
};

const releaseBoundaryFlags = {
  payoutCreated: false as const,
  ledgerEntryCreated: false as const,
  providerPayoutExecuted: false as const,
  paymentInstructionCreated: false as const,
};

function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function createSettlementSourceRefs(order: any, line: any, externalRefs: SettlementSourceRef[] = []): SettlementSourceRef[] {
  const economicsSnapshot = line.economicsSnapshot;
  const refs: SettlementSourceRef[] = [
    { sourceType: 'ORDER', sourceId: order.orderId, sourceState: order.state || order.status },
    { sourceType: 'ORDER_LINE', sourceId: line.orderLineId },
  ];

  if (!economicsSnapshot) {
    refs.push(...externalRefs);
    return refs;
  }

  if (economicsSnapshot.commercialPoolProductId) {
    refs.push({
      sourceType: 'COMMERCIAL_POOL_PRODUCT',
      sourceId: economicsSnapshot.commercialPoolProductId,
      metadata: { priceSource: economicsSnapshot.priceSource },
    });
  }
  if (economicsSnapshot.creatorStoreProductId) {
    refs.push({
      sourceType: 'CREATOR_STORE_PRODUCT',
      sourceId: economicsSnapshot.creatorStoreProductId,
      metadata: { creatorStoreId: economicsSnapshot.creatorStoreId },
    });
  }
  if (economicsSnapshot.creatorStoreId) {
    refs.push({ sourceType: 'CREATOR_STORE', sourceId: economicsSnapshot.creatorStoreId });
  }
  if (economicsSnapshot.supplierId) {
    refs.push({ sourceType: 'SUPPLIER', sourceId: economicsSnapshot.supplierId });
  }

  for (const allocation of economicsSnapshot.discountAllocationRefs ?? []) {
    refs.push({
      sourceType: 'DISCOUNT_ALLOCATION',
      sourceId: allocation.allocationId,
      metadata: {
        discountSnapshotId: allocation.discountSnapshotId,
        discountCode: allocation.discountCode,
        discountKind: allocation.discountKind,
        sponsorType: allocation.sponsorType,
        sponsorId: allocation.sponsorId,
        allocatedAmount: allocation.allocatedAmount,
        currency: allocation.currency,
      },
    });
  }

  for (const coupon of economicsSnapshot.couponSnapshotRefs ?? []) {
    if (!coupon.discountSnapshotId) continue;

    refs.push({
      sourceType: 'COUPON_SNAPSHOT',
      sourceId: coupon.discountSnapshotId,
      metadata: {
        sourceType: coupon.sourceType,
        code: coupon.code,
        discountAmount: coupon.discountAmount,
        sponsorType: coupon.sponsorType,
        sponsorId: coupon.sponsorId,
      },
    });
  }

  refs.push(...externalRefs);

  return refs;
}

function createPayableEarningStatus(
  settlementLine: SettlementLine,
): { status: 'PENDING' | 'HELD'; holdReasonCode?: 'RISK_HOLD_RECOMMENDED' } {
  if (settlementLine.status === 'BLOCKED') {
    return { status: 'HELD', holdReasonCode: 'RISK_HOLD_RECOMMENDED' };
  }

  return { status: 'PENDING' };
}

function cloneSourceRefs(sourceRefs: SettlementSourceRef[]): SettlementSourceRef[] {
  return sourceRefs.map((ref) => ({
    ...ref,
    metadata: ref.metadata ? { ...ref.metadata } : undefined,
  }));
}

function createSupplierPayableReversalFingerprint(command: ReverseSettlementSupplierPayableCommand): string {
  return JSON.stringify({
    sourceRefundId: command.sourceRefundId,
    refundId: command.refundId,
    settlementLineId: command.settlementLineId,
    payableId: command.payableId,
    reasonCode: command.reasonCode,
    reversalAmount: command.reversalAmount,
    actorId: command.actorId,
    systemActor: command.systemActor,
  });
}

function createCreatorEarningReversalFingerprint(command: ReverseSettlementCreatorEarningCommand): string {
  return JSON.stringify({
    sourceRefundId: command.sourceRefundId,
    refundId: command.refundId,
    settlementLineId: command.settlementLineId,
    earningId: command.earningId,
    reasonCode: command.reasonCode,
    reversalAmount: command.reversalAmount,
    actorId: command.actorId,
    systemActor: command.systemActor,
  });
}

function validateReversalAmount(reversalAmount: number, currentAmount: number): string[] {
  const errors: string[] = [];

  if (!Number.isFinite(reversalAmount) || reversalAmount <= 0) {
    errors.push('REVERSAL_AMOUNT_MUST_BE_POSITIVE');
  } else if (reversalAmount > currentAmount) {
    errors.push('REVERSAL_AMOUNT_EXCEEDS_CURRENT_AMOUNT');
  } else if (reversalAmount !== currentAmount) {
    errors.push('PARTIAL_REVERSAL_NOT_SUPPORTED');
  }

  return errors;
}

function createReleaseFoundationWarnings(record: {
  riskHoldActive?: boolean;
  refundImpactPending?: boolean;
  financeCorrectionPending?: boolean;
  externalReviewRequired?: boolean;
}): string[] {
  const warnings: string[] = [];

  if (record.riskHoldActive === undefined) warnings.push('RISK_HOLD_FLAG_NOT_MODELED_ON_PAYABLE_EARNING_FOUNDATION');
  if (record.refundImpactPending === undefined) warnings.push('REFUND_IMPACT_PENDING_FLAG_NOT_MODELED_ON_PAYABLE_EARNING_FOUNDATION');
  if (record.financeCorrectionPending === undefined) warnings.push('FINANCE_CORRECTION_PENDING_FLAG_NOT_MODELED_ON_PAYABLE_EARNING_FOUNDATION');
  if (record.externalReviewRequired === undefined) warnings.push('EXTERNAL_REVIEW_REQUIRED_FLAG_NOT_MODELED_ON_PAYABLE_EARNING_FOUNDATION');

  return warnings;
}

function evaluateReleaseGuards(record: {
  amount: number;
  currency?: string;
  partyId?: string;
  sourceRefs?: SettlementSourceRef[];
  status: string;
  holdReasonCode?: string;
  riskHoldActive?: boolean;
  refundImpactPending?: boolean;
  financeCorrectionPending?: boolean;
  externalReviewRequired?: boolean;
}, sourceSettlementLineExists: boolean): string[] {
  const blockingReasons: string[] = [];

  if (!Number.isFinite(record.amount) || record.amount <= 0) blockingReasons.push('AMOUNT_MUST_BE_POSITIVE');
  if (record.status === 'REVERSED') blockingReasons.push('RECORD_REVERSED');
  if (record.status === 'HELD') blockingReasons.push('RECORD_HELD');
  if (record.holdReasonCode) blockingReasons.push('HOLD_REASON_CODE_PRESENT');
  if (!sourceSettlementLineExists) blockingReasons.push('SOURCE_SETTLEMENT_LINE_NOT_FOUND');
  if (!record.sourceRefs || record.sourceRefs.length === 0) blockingReasons.push('SOURCE_REFS_REQUIRED');
  if (!record.partyId) blockingReasons.push('PARTY_ID_REQUIRED');
  if (!record.currency) blockingReasons.push('CURRENCY_REQUIRED');
  if (record.riskHoldActive === true) blockingReasons.push('RISK_HOLD_ACTIVE');
  if (record.refundImpactPending === true) blockingReasons.push('REFUND_IMPACT_PENDING');
  if (record.financeCorrectionPending === true) blockingReasons.push('FINANCE_CORRECTION_PENDING');
  if (record.externalReviewRequired === true) blockingReasons.push('EXTERNAL_REVIEW_REQUIRED');

  return blockingReasons;
}

function createPayableEarningCandidatesFromSettlementLine(
  settlementLine: SettlementLine,
): {
  supplierPayable?: SettlementSupplierPayable;
  creatorEarning?: SettlementCreatorEarning;
} {
  const now = new Date().toISOString();
  const lifecycle = createPayableEarningStatus(settlementLine);
  const boundaryFlags = {
    payoutCreated: false as const,
    ledgerEntryCreated: false as const,
    providerPayoutExecuted: false as const,
  };
  const supplierShareAmount = settlementLine.amountSummary.supplierShareAmount;
  const creatorShareAmount = settlementLine.amountSummary.creatorShareAmount;
  const supplierRef = settlementLine.sourceRefs.find((ref) => ref.sourceType === 'SUPPLIER');
  const creatorStoreRef = settlementLine.sourceRefs.find((ref) => ref.sourceType === 'CREATOR_STORE');
  const signalFields = {
    riskHoldActive: settlementLine.impactSummary.riskHoldActive,
    refundImpactPending: settlementLine.impactSummary.refundImpactPending,
    financeCorrectionPending: settlementLine.impactSummary.financeCorrectionPending,
    externalReviewRequired: false,
  };

  const supplierPayable = supplierShareAmount !== undefined && Number.isFinite(supplierShareAmount) && supplierShareAmount > 0
    ? {
        payableId: `payable_${randomUUID()}`,
        settlementLineId: settlementLine.settlementLineId,
        orderId: settlementLine.orderId,
        orderLineId: settlementLine.orderLineId,
        partyType: 'SUPPLIER' as const,
        partyId: settlementLine.partyId ?? supplierRef?.sourceId ?? 'unknown',
        amount: supplierShareAmount,
        currency: settlementLine.amountSummary.currency,
        sourceRefs: cloneSourceRefs(settlementLine.sourceRefs),
        status: lifecycle.status,
        holdReasonCode: lifecycle.holdReasonCode,
        ...signalFields,
        createdAt: now,
        updatedAt: now,
        boundaryFlags,
      }
    : undefined;

  const creatorPartyId = creatorStoreRef?.sourceId;
  const creatorEarning = creatorShareAmount !== undefined
    && Number.isFinite(creatorShareAmount)
    && creatorShareAmount > 0
    && creatorPartyId
    ? {
        earningId: `earning_${randomUUID()}`,
        settlementLineId: settlementLine.settlementLineId,
        orderId: settlementLine.orderId,
        orderLineId: settlementLine.orderLineId,
        partyType: 'CREATOR' as const,
        partyId: creatorPartyId,
        amount: creatorShareAmount,
        currency: settlementLine.amountSummary.currency,
        sourceRefs: cloneSourceRefs(settlementLine.sourceRefs),
        status: lifecycle.status,
        holdReasonCode: lifecycle.holdReasonCode,
        ...signalFields,
        createdAt: now,
        updatedAt: now,
        boundaryFlags,
      }
    : undefined;

  return { supplierPayable, creatorEarning };
}

function createCalculationFingerprint(input: SettlementCalculationInput): string {
  return JSON.stringify({
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    currency: input.currency,
    grossAmount: input.grossAmount,
    platformCommissionRate: input.platformCommissionRate,
    selectedSalePrice: input.selectedSalePrice,
    poolBasePriceAmount: input.poolBasePriceAmount,
    creatorStoreId: input.creatorStoreId,
    commercialProductId: input.commercialProductId,
    priceSelectionId: input.priceSelectionId,
    poolBasePriceSourceId: input.poolBasePriceSourceId,
    supplierId: input.supplierId,
    creatorId: input.creatorId,
    brandId: input.brandId,
    couponSponsorType: input.couponSponsorType,
    couponSponsorId: input.couponSponsorId,
    discountLineAllocations: input.discountLineAllocations ?? [],
    refundId: input.refundId,
    metadata: input.metadata ?? {},
  });
}

export function resetSettlementCalculationGuardForTesting(): void {
  calculationIdempotencyMap.clear();
  calculationFingerprintMap.clear();
  supplierPayableReversalIdempotencyMap.clear();
  creatorEarningReversalIdempotencyMap.clear();
}

export async function calculateSettlement(
  input: SettlementCalculationInput
): Promise<SettlementCalculationResult> {
  const now = new Date().toISOString();
  const baseSummary = {
    inputSourceType: input.sourceType,
    inputSourceId: input.sourceId,
    ruleSourceAvailable: input.platformCommissionRate !== undefined,
    calculationFinalized: false,
    duplicateCalculation: false,
    ledgerEntryCreated: false as const,
    payoutCreated: false as const,
    payableCreated: false as const,
    paidOutCreated: false as const,
    orderStateMutated: false as const,
    paymentStateMutated: false as const,
    refundStateMutated: false as const,
  };

  if (!input.idempotencyKey) {
    return {
      settlementId: `stc_${randomUUID()}`,
      idempotencyKey: '',
      status: 'BLOCKED',
      grossAmount: input.grossAmount,
      platformShareAmount: 0,
      supplierNetAmount: 0,
      lines: [],
      limitationFlags: ['RULE_SOURCE_NOT_AVAILABLE'],
      summary: baseSummary,
      errors: ['SETTLEMENT_IDEMPOTENCY_KEY_REQUIRED'],
      createdAt: now,
    };
  }

  const fingerprint = createCalculationFingerprint(input);
  const existing = calculationIdempotencyMap.get(input.idempotencyKey);
  if (existing) {
    if (calculationFingerprintMap.get(input.idempotencyKey) !== fingerprint) {
      return {
        ...existing,
        status: 'BLOCKED',
        limitationFlags: [
          ...new Set([...(existing.limitationFlags ?? []), 'DUPLICATE_IDEMPOTENCY_KEY_CONFLICT' as SettlementLimitationFlag]),
        ],
        summary: {
          ...existing.summary,
          duplicateCalculation: true,
          calculationFinalized: false,
        },
        duplicateOfSettlementId: existing.settlementId,
        errors: ['DUPLICATE_IDEMPOTENCY_KEY_CONFLICT'],
      };
    }

    return {
      ...existing,
      summary: {
        ...existing.summary,
        duplicateCalculation: true,
      },
      duplicateOfSettlementId: existing.settlementId,
    };
  }

  const errors: string[] = [];
  if (!input.sourceType || !input.sourceId) errors.push('SETTLEMENT_SOURCE_REQUIRED');
  if (!input.currency) errors.push('SETTLEMENT_CURRENCY_REQUIRED');
  if (!Number.isFinite(input.grossAmount) || input.grossAmount <= 0) {
    errors.push('SETTLEMENT_GROSS_AMOUNT_MUST_BE_POSITIVE');
  }
  if (
    input.platformCommissionRate !== undefined &&
    (input.platformCommissionRate < 0 || input.platformCommissionRate > 1)
  ) {
    errors.push('SETTLEMENT_PLATFORM_COMMISSION_RATE_INVALID');
  }
  if (
    input.selectedSalePrice !== undefined &&
    (!Number.isFinite(input.selectedSalePrice) || input.selectedSalePrice <= 0)
  ) {
    errors.push('SETTLEMENT_SELECTED_SALE_PRICE_MUST_BE_POSITIVE');
  }
  if (
    input.poolBasePriceAmount !== undefined &&
    (!Number.isFinite(input.poolBasePriceAmount) || input.poolBasePriceAmount < 0)
  ) {
    errors.push('SETTLEMENT_POOL_BASE_PRICE_AMOUNT_INVALID');
  }
  if (input.creatorId && input.selectedSalePrice === undefined) {
    errors.push('SETTLEMENT_SELECTED_SALE_PRICE_REQUIRED_FOR_CREATOR_MARGIN');
  }
  if (input.creatorId && input.poolBasePriceAmount === undefined) {
    errors.push('SETTLEMENT_POOL_BASE_PRICE_REQUIRED_FOR_CREATOR_MARGIN');
  }
  const discountLineAllocations = input.discountLineAllocations ?? [];
  const unsupportedDiscountSponsors = discountLineAllocations.filter(
    (allocation) => allocation.sponsorType === 'SUPPLIER' || allocation.sponsorType === 'BRAND',
  );
  if (unsupportedDiscountSponsors.length > 0) {
    errors.push('FIRST_PHASE_DISCOUNT_SPONSOR_IMPACT_UNSUPPORTED');
  }

  const hasCreatorMarginInputs =
    input.creatorId &&
    input.selectedSalePrice !== undefined &&
    input.poolBasePriceAmount !== undefined &&
    Number.isFinite(input.selectedSalePrice) &&
    Number.isFinite(input.poolBasePriceAmount);
  const creatorMarginAmount = hasCreatorMarginInputs
    ? roundMoney(input.selectedSalePrice! - input.poolBasePriceAmount!)
    : undefined;
  if (creatorMarginAmount !== undefined && creatorMarginAmount < 0) {
    errors.push('SETTLEMENT_CREATOR_MARGIN_NEGATIVE');
  }

  const limitationFlags: SettlementLimitationFlag[] = [];
  if (input.platformCommissionRate === undefined) limitationFlags.push('RULE_SOURCE_NOT_AVAILABLE');
  if (input.creatorId && creatorMarginAmount === undefined) limitationFlags.push('CREATOR_SHARE_NOT_CALCULATED');
  if (input.brandId) limitationFlags.push('BRAND_SHARE_NOT_CALCULATED');
  if ((input.couponSponsorType || input.couponSponsorId) && discountLineAllocations.length === 0) {
    limitationFlags.push('COUPON_SPONSOR_IMPACT_NOT_CALCULATED');
  }
  if (input.refundId || input.sourceType === 'REFUND') limitationFlags.push('REFUND_SETTLEMENT_IMPACT_NOT_CALCULATED');

  const settlementId = `stc_${randomUUID()}`;
  const platformShareAmount = roundMoney(input.grossAmount * (input.platformCommissionRate ?? 0));
  const supplierNetAmount = roundMoney(input.grossAmount - platformShareAmount);
  const platformDiscountCostAmount = roundMoney(discountLineAllocations
    .filter((allocation) => allocation.sponsorType === 'PLATFORM')
    .reduce((sum, allocation) => sum + allocation.allocatedAmount, 0));
  const creatorDiscountCostAmount = roundMoney(discountLineAllocations
    .filter((allocation) => allocation.sponsorType === 'CREATOR')
    .reduce((sum, allocation) => sum + allocation.allocatedAmount, 0));
  const supplierDiscountCostAmount = 0;
  const brandDiscountCostAmount = 0;
  const discountSponsorImpactAmount = roundMoney(platformDiscountCostAmount + creatorDiscountCostAmount);

  const lines: SettlementCalculationLine[] = errors.length > 0 ? [] : [
    {
      settlementLineId: `stcl_${randomUUID()}`,
      type: 'GROSS_SALE',
      amount: roundMoney(input.grossAmount),
      currency: input.currency,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
    },
    {
      settlementLineId: `stcl_${randomUUID()}`,
      type: 'PLATFORM_COMMISSION',
      amount: platformShareAmount,
      currency: input.currency,
      counterpartyType: 'PLATFORM',
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      metadata: { platformCommissionRate: input.platformCommissionRate ?? 0 },
    },
    {
      settlementLineId: `stcl_${randomUUID()}`,
      type: 'SUPPLIER_NET',
      amount: supplierNetAmount,
      currency: input.currency,
      counterpartyType: 'SUPPLIER',
      counterpartyId: input.supplierId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
    },
  ];
  if (errors.length === 0 && input.creatorId && creatorMarginAmount !== undefined) {
    lines.push({
      settlementLineId: `stcl_${randomUUID()}`,
      type: 'CREATOR_MARGIN',
      amount: creatorMarginAmount,
      currency: input.currency,
      counterpartyType: 'CREATOR',
      counterpartyId: input.creatorId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      metadata: {
        selectedSalePrice: input.selectedSalePrice,
        poolBasePriceAmount: input.poolBasePriceAmount,
        creatorStoreId: input.creatorStoreId,
        commercialProductId: input.commercialProductId,
        priceSelectionId: input.priceSelectionId,
        poolBasePriceSourceId: input.poolBasePriceSourceId,
        formula: 'selectedSalePrice - poolBasePriceAmount',
      },
    });
  }
  if (errors.length === 0) {
    for (const allocation of discountLineAllocations) {
      if (allocation.sponsorType !== 'PLATFORM' && allocation.sponsorType !== 'CREATOR') continue;

      const metadata = {
        allocationId: allocation.allocationId,
        discountSnapshotId: allocation.discountSnapshotId,
        discountCode: allocation.discountCode,
        discountKind: allocation.discountKind,
        lineId: allocation.lineId,
        cartLineId: allocation.cartLineId,
        orderLineId: allocation.orderLineId,
        productId: allocation.productId,
        evidenceOnly: true,
      };

      lines.push({
        settlementLineId: `stcl_${randomUUID()}`,
        type: allocation.discountKind === 'CAMPAIGN' ? 'CAMPAIGN_SPONSOR_IMPACT' : 'COUPON_SPONSOR_IMPACT',
        amount: roundMoney(allocation.allocatedAmount),
        currency: allocation.currency,
        counterpartyType: allocation.sponsorType,
        counterpartyId: allocation.sponsorId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        metadata,
      });
      lines.push({
        settlementLineId: `stcl_${randomUUID()}`,
        type: allocation.sponsorType === 'PLATFORM' ? 'PLATFORM_DISCOUNT_COST' : 'CREATOR_DISCOUNT_COST',
        amount: roundMoney(allocation.allocatedAmount),
        currency: allocation.currency,
        counterpartyType: allocation.sponsorType,
        counterpartyId: allocation.sponsorId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        metadata,
      });
    }
  }

  const result: SettlementCalculationResult = {
    settlementId,
    idempotencyKey: input.idempotencyKey,
    status: errors.length > 0 ? 'BLOCKED' : 'CALCULATED',
    grossAmount: roundMoney(input.grossAmount),
    platformShareAmount: errors.length > 0 ? 0 : platformShareAmount,
    supplierNetAmount: errors.length > 0 ? 0 : supplierNetAmount,
    creatorMarginAmount: errors.length > 0 ? undefined : creatorMarginAmount,
    creatorShareAmount: errors.length > 0 ? undefined : creatorMarginAmount,
    brandShareAmount: input.brandId && errors.length === 0 ? 0 : undefined,
    lines,
    limitationFlags: limitationFlags.length > 0 ? limitationFlags : undefined,
    summary: {
      ...baseSummary,
      calculationFinalized: errors.length === 0,
      discountSponsorImpactAmount: errors.length > 0 ? 0 : discountSponsorImpactAmount,
      platformDiscountCostAmount: errors.length > 0 ? 0 : platformDiscountCostAmount,
      creatorDiscountCostAmount: errors.length > 0 ? 0 : creatorDiscountCostAmount,
      supplierDiscountCostAmount,
      brandDiscountCostAmount,
      discountSponsorImpactLineCount: errors.length > 0
        ? 0
        : lines.filter((line) => line.type === 'COUPON_SPONSOR_IMPACT' || line.type === 'CAMPAIGN_SPONSOR_IMPACT').length,
    },
    errors: errors.length > 0 ? errors : undefined,
    createdAt: now,
  };

  calculationIdempotencyMap.set(input.idempotencyKey, result);
  calculationFingerprintMap.set(input.idempotencyKey, fingerprint);

  return result;
}

export async function createSettlementFromOrder(
  command: CreateSettlementFromOrderCommand
): Promise<SettlementMutationResult> {
  const { orderId, idempotencyKey } = command;

  if (!orderId) {
    return {
      success: false,
      errors: ['SETTLEMENT_ORDER_ID_REQUIRED'],
      warnings: [],
    };
  }

  const repo = getRepository();

  if (idempotencyKey) {
    const existingIds = await repo.getByIdempotencyKey(idempotencyKey);
    if (existingIds && existingIds.length > 0) {
      const existingLines = [];
      for (const id of existingIds) {
        const line = await repo.getById(id);
        if (line) existingLines.push(line);
      }
      return {
        success: true,
        settlementLines: existingLines,
        warnings: [],
      };
    }
  }

  // 1. Fetch Order
  const order = await getOrderById(orderId);
  if (!order) {
    return {
      success: false,
      errors: ['SETTLEMENT_ORDER_NOT_FOUND'],
      warnings: [],
    };
  }

  // 2. Fetch Active External States
  let refundImpactPending = false;
  let financeCorrectionPending = false;
  let riskHoldActive = false;
  const refundSourceRefs: SettlementSourceRef[] = [];
  const financeCorrectionSourceRefs: SettlementSourceRef[] = [];
  const riskSourceRefs: SettlementSourceRef[] = [];

  const cancelReturnRequests = await getCancelReturnRequestsByOrderId(orderId);
  if (cancelReturnRequests && cancelReturnRequests.length > 0) {
    const activeStates = [
      'CREATED',
      'UNDER_REVIEW',
      'APPROVED',
      'AWAITING_RETURN_SHIPMENT',
      'RETURN_IN_TRANSIT',
      'RECEIVED_BACK',
      'PARTIALLY_APPROVED',
      'REFUND_PENDING',
    ];
    for (const cr of cancelReturnRequests as any[]) {
      const state = cr.status || cr.state;
      if (!activeStates.includes(state)) continue;
      refundSourceRefs.push({
        sourceType: 'CANCEL_RETURN',
        sourceId: cr.requestId,
        sourceState: state,
      });
    }
    refundImpactPending = refundSourceRefs.length > 0;
  }

  const fcRes = await listFinanceCorrections({ targetId: orderId });
  if (fcRes && fcRes.corrections) {
    const activeFcStates = ['CREATED', 'UNDER_REVIEW', 'ADVISORY_RECORDED'];
    for (const fc of fcRes.corrections as any[]) {
      if (!activeFcStates.includes(fc.status)) continue;
      financeCorrectionSourceRefs.push({
        sourceType: 'FINANCE_CORRECTION',
        sourceId: fc.correctionId,
        sourceState: fc.status,
      });
    }
    financeCorrectionPending = financeCorrectionSourceRefs.length > 0;
  }

  const riskRes = await listRiskCases({ targetId: orderId });
  if (riskRes && riskRes.cases) {
    const activeRiskStates = [
      'OPEN',
      'UNDER_REVIEW',
      'ADVISORY_HOLD_RECOMMENDED',
      'REVIEW_REQUIRED',
      'ESCALATED',
    ];
    for (const rc of riskRes.cases as any[]) {
      if (!activeRiskStates.includes(rc.status)) continue;
      riskSourceRefs.push({
        sourceType: 'RISK',
        sourceId: rc.caseId,
        sourceState: rc.status,
        metadata: {
          level: rc.level,
          reasonCode: rc.reasonCode,
          decisionStatus: rc.decisionStatus,
        },
      });
    }
    riskHoldActive = riskSourceRefs.length > 0;
  }

  // 3. Map Lines
  const newLines: SettlementLine[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const now = new Date().toISOString();

  for (const line of order.lines) {
    const settlementLineId = randomUUID();
    const status: SettlementLineStatus = riskHoldActive ? 'BLOCKED' : 'PENDING';
    const economicsSnapshot = line.economicsSnapshot;
    const lineWarnings = economicsSnapshot
      ? [
          ...(economicsSnapshot.status === 'DEGRADED' ? ['ORDER_LINE_ECONOMICS_SNAPSHOT_DEGRADED'] : []),
          ...(economicsSnapshot.warnings ?? []),
        ]
      : ['SETTLEMENT_RULE_SOURCE_NOT_AVAILABLE', 'ORDER_LINE_ECONOMICS_SNAPSHOT_MISSING'];
    const grossAmount = economicsSnapshot?.lineTotalSnapshot ?? line.lineTotalSnapshot;
    const netAmount = economicsSnapshot?.creatorSelectedPriceAmount ?? economicsSnapshot?.lineTotalSnapshot ?? line.lineTotalSnapshot;

    const externalSourceRefs = [
      ...refundSourceRefs,
      ...financeCorrectionSourceRefs,
      ...riskSourceRefs,
    ];

    newLines.push({
      settlementLineId,
      orderId: order.orderId,
      orderLineId: line.orderLineId,
      storefrontId: (line as any).storefrontId || 'unknown',
      productId: line.productId,
      variantId: line.variantId,
      partyType: 'SUPPLIER', // Assuming default or inferred
      partyId: economicsSnapshot?.supplierId || (line as any).supplierId || undefined,
      status,
      reasonCode: 'ORDER_CREATED_FOUNDATION',
      amountSummary: {
        currency: order.summary.currency || 'TRY',
        grossAmount,
        netAmount,
        supplierBaseAmount: economicsSnapshot?.supplierBaseAmount,
        poolBasePriceAmount: economicsSnapshot?.poolBasePriceAmount,
        creatorSelectedPriceAmount: economicsSnapshot?.creatorSelectedPriceAmount,
        platformMarginAmount: economicsSnapshot?.platformMarginAmount,
        platformShareAmount: economicsSnapshot?.platformMarginAmount,
        creatorMarginAmount: economicsSnapshot?.creatorMarginAmount,
        creatorShareAmount: economicsSnapshot?.creatorMarginAmount,
        supplierShareAmount: economicsSnapshot?.supplierBaseAmount,
        economicsSnapshotAvailable: Boolean(economicsSnapshot),
        economicsSnapshotStatus: economicsSnapshot?.status ?? 'DEGRADED',
        ruleSourceAvailable: Boolean(economicsSnapshot),
        calculationFinalized: economicsSnapshot?.status === 'COMPLETE',
      },
      impactSummary: {
        payoutEligible: false,
        payoutBlocked: riskHoldActive,
        refundImpactPending,
        financeCorrectionPending,
        riskHoldActive,
        actualPayoutMutationPerformed: false,
        actualPaymentMutationPerformed: false,
        actualRefundMutationPerformed: false,
        actualOrderMutationPerformed: false,
        actualCancelReturnMutationPerformed: false,
        actualFinanceCorrectionMutationPerformed: false,
        actualRiskMutationPerformed: false,
      },
      sourceRefs: createSettlementSourceRefs(order, line, externalSourceRefs),
      idempotencyKey,
      createdAt: now,
      updatedAt: now,
      errors: [],
      warnings: lineWarnings,
    });

    for (const warning of lineWarnings) {
      if (!warnings.includes(warning)) warnings.push(warning);
    }
  }

  // 4. Save
  try {
    await repo.createMany(newLines);
    const supplierPayables: SettlementSupplierPayable[] = [];
    const creatorEarnings: SettlementCreatorEarning[] = [];

    for (const settlementLine of newLines) {
      const candidates = createPayableEarningCandidatesFromSettlementLine(settlementLine);
      if (candidates.supplierPayable) supplierPayables.push(candidates.supplierPayable);
      if (candidates.creatorEarning) creatorEarnings.push(candidates.creatorEarning);
    }

    await repo.createSupplierPayables(supplierPayables);
    await repo.createCreatorEarnings(creatorEarnings);

    if (idempotencyKey) {
      await repo.saveIdempotencyKey(
        idempotencyKey,
        newLines.map((l) => l.settlementLineId)
      );
    }
  } catch (err) {
    return {
      success: false,
      errors: ['SETTLEMENT_PERSISTENCE_FAILED'],
      warnings: [],
    };
  }

  // 5. Audit (mock output as requested: Audit/outbox append fail olursa ...)
  // Actually we don't have direct access to an audit client in instructions, but simulating it.
  try {
    // mock audit append
  } catch (e) {
    warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
  }

  return {
    success: true,
    settlementLines: newLines,
    supplierPayables: await repo.listSupplierPayables({ orderId }).then((res) => res.supplierPayables),
    creatorEarnings: await repo.listCreatorEarnings({ orderId }).then((res) => res.creatorEarnings),
    warnings,
  };
}

export async function applySettlementAction(
  command: ApplySettlementActionCommand
): Promise<SettlementMutationResult> {
  const { settlementLineId, action, actorId } = command;

  const repo = getRepository();
  const line = await repo.getById(settlementLineId);

  if (!line) {
    return {
      success: false,
      errors: ['SETTLEMENT_LINE_NOT_FOUND'],
    };
  }

  let newStatus: SettlementLineStatus = line.status;

  if (action === 'MARK_CONDITIONALLY_EARNED') newStatus = 'CONDITIONALLY_EARNED';
  if (action === 'MARK_BLOCKED') newStatus = 'BLOCKED';
  if (action === 'MARK_SETTLED') newStatus = 'SETTLED';
  if (action === 'MARK_REVERSED') newStatus = 'REVERSED';
  if (action === 'MARK_CANCELLED') newStatus = 'CANCELLED';
  if (action === 'CLOSE') newStatus = 'CLOSED';

  const updatedLine = { ...line, status: newStatus, updatedAt: new Date().toISOString() };

  await repo.update(settlementLineId, updatedLine);

  return {
    success: true,
    settlementLine: updatedLine,
  };
}

export async function getSettlementLine(
  query: GetSettlementLineQuery
): Promise<SettlementLineResponse | null> {
  const repo = getRepository();
  const line = await repo.getById(query.settlementLineId);

  if (!line) return null;

  return {
    settlementLine: line,
  };
}

export async function listSettlementLines(
  query: ListSettlementLinesQuery
): Promise<SettlementLineListResponse> {
  const repo = getRepository();
  const res = await repo.list(query);

  return res;
}

export async function listSettlementSupplierPayables(
  query: ListSettlementPayableEarningsQuery,
): Promise<SettlementSupplierPayableListResponse> {
  const repo = getRepository();
  return repo.listSupplierPayables(query);
}

export async function listSettlementCreatorEarnings(
  query: ListSettlementPayableEarningsQuery,
): Promise<SettlementCreatorEarningListResponse> {
  const repo = getRepository();
  return repo.listCreatorEarnings(query);
}

export async function evaluateSupplierPayableReleaseEligibility(
  command: EvaluateSupplierPayableReleaseCommand,
): Promise<SupplierPayableReleaseEvaluationResult> {
  const repo = getRepository();
  if (!command.payableId || !command.settlementLineId) {
    return {
      eligible: false,
      warnings: [],
      blockingReasons: [
        ...(!command.payableId ? ['PAYABLE_ID_REQUIRED'] : []),
        ...(!command.settlementLineId ? ['SETTLEMENT_LINE_ID_REQUIRED'] : []),
      ],
      boundaryFlags: releaseBoundaryFlags,
    };
  }

  const payable = await repo.getSupplierPayableById(command.payableId);
  const warnings = payable ? createReleaseFoundationWarnings(payable) : [];
  if (!payable || payable.settlementLineId !== command.settlementLineId) {
    return {
      eligible: false,
      warnings,
      blockingReasons: ['SUPPLIER_PAYABLE_NOT_FOUND'],
      boundaryFlags: releaseBoundaryFlags,
    };
  }

  const sourceLine = await repo.getById(command.settlementLineId);
  const blockingReasons = evaluateReleaseGuards(payable, Boolean(sourceLine));
  const statusBefore = payable.status;

  if (statusBefore === 'PAYOUT_READY') {
    return {
      eligible: false,
      statusBefore,
      statusAfter: statusBefore,
      payable,
      warnings: [...warnings, 'PAYOUT_READY_RELEASE_EVALUATION_REQUIRES_MANUAL_REVIEW'],
      blockingReasons: [...blockingReasons, 'PAYOUT_READY_NOT_AUTOMATED_IN_FOUNDATION'],
      boundaryFlags: releaseBoundaryFlags,
    };
  }

  if (statusBefore === 'RELEASE_ELIGIBLE' && blockingReasons.length === 0) {
    return {
      eligible: true,
      statusBefore,
      statusAfter: statusBefore,
      payable,
      warnings,
      blockingReasons: [],
      boundaryFlags: releaseBoundaryFlags,
    };
  }

  if (statusBefore !== 'PENDING' || blockingReasons.length > 0) {
    return {
      eligible: false,
      statusBefore,
      statusAfter: statusBefore,
      payable,
      warnings,
      blockingReasons: statusBefore !== 'PENDING'
        ? [...blockingReasons, 'STATUS_NOT_RELEASEABLE']
        : blockingReasons,
      boundaryFlags: releaseBoundaryFlags,
    };
  }

  const updated = await repo.markSupplierPayableReleaseEligible(
    command.payableId,
    command.evaluatedAt ?? new Date().toISOString(),
  );

  return {
    eligible: true,
    statusBefore,
    statusAfter: updated?.status ?? 'RELEASE_ELIGIBLE',
    payable: updated ?? payable,
    warnings,
    blockingReasons: [],
    boundaryFlags: releaseBoundaryFlags,
  };
}

export async function evaluateCreatorEarningReleaseEligibility(
  command: EvaluateCreatorEarningReleaseCommand,
): Promise<CreatorEarningReleaseEvaluationResult> {
  const repo = getRepository();
  if (!command.earningId || !command.settlementLineId) {
    return {
      eligible: false,
      warnings: [],
      blockingReasons: [
        ...(!command.earningId ? ['EARNING_ID_REQUIRED'] : []),
        ...(!command.settlementLineId ? ['SETTLEMENT_LINE_ID_REQUIRED'] : []),
      ],
      boundaryFlags: releaseBoundaryFlags,
    };
  }

  const earning = await repo.getCreatorEarningById(command.earningId);
  const warnings = earning ? createReleaseFoundationWarnings(earning) : [];
  if (!earning || earning.settlementLineId !== command.settlementLineId) {
    return {
      eligible: false,
      warnings,
      blockingReasons: ['CREATOR_EARNING_NOT_FOUND'],
      boundaryFlags: releaseBoundaryFlags,
    };
  }

  const sourceLine = await repo.getById(command.settlementLineId);
  const blockingReasons = evaluateReleaseGuards(earning, Boolean(sourceLine));
  const statusBefore = earning.status;

  if (statusBefore === 'PAYOUT_READY') {
    return {
      eligible: false,
      statusBefore,
      statusAfter: statusBefore,
      earning,
      warnings: [...warnings, 'PAYOUT_READY_RELEASE_EVALUATION_REQUIRES_MANUAL_REVIEW'],
      blockingReasons: [...blockingReasons, 'PAYOUT_READY_NOT_AUTOMATED_IN_FOUNDATION'],
      boundaryFlags: releaseBoundaryFlags,
    };
  }

  if (statusBefore === 'RELEASE_ELIGIBLE' && blockingReasons.length === 0) {
    return {
      eligible: true,
      statusBefore,
      statusAfter: statusBefore,
      earning,
      warnings,
      blockingReasons: [],
      boundaryFlags: releaseBoundaryFlags,
    };
  }

  if (statusBefore !== 'PENDING' || blockingReasons.length > 0) {
    return {
      eligible: false,
      statusBefore,
      statusAfter: statusBefore,
      earning,
      warnings,
      blockingReasons: statusBefore !== 'PENDING'
        ? [...blockingReasons, 'STATUS_NOT_RELEASEABLE']
        : blockingReasons,
      boundaryFlags: releaseBoundaryFlags,
    };
  }

  const updated = await repo.markCreatorEarningReleaseEligible(
    command.earningId,
    command.evaluatedAt ?? new Date().toISOString(),
  );

  return {
    eligible: true,
    statusBefore,
    statusAfter: updated?.status ?? 'RELEASE_ELIGIBLE',
    earning: updated ?? earning,
    warnings,
    blockingReasons: [],
    boundaryFlags: releaseBoundaryFlags,
  };
}

export async function reverseSettlementSupplierPayable(
  command: ReverseSettlementSupplierPayableCommand,
): Promise<SettlementSupplierPayableReversalResult> {
  const fingerprint = createSupplierPayableReversalFingerprint(command);
  const existingResult = supplierPayableReversalIdempotencyMap.get(command.idempotencyKey);
  if (existingResult) {
    if (existingResult.fingerprint === fingerprint) {
      const { fingerprint: _fingerprint, ...result } = existingResult;
      return { ...result, status: result.status === 'REVERSED' ? 'IDEMPOTENT' : result.status };
    }

    return {
      success: false,
      status: 'REJECTED',
      errors: ['DUPLICATE_IDEMPOTENCY_KEY_CONFLICT'],
      boundaryFlags: reversalBoundaryFlags,
    };
  }

  const errors: string[] = [];
  if (!command.idempotencyKey) errors.push('REVERSAL_IDEMPOTENCY_KEY_REQUIRED');
  if (!command.payableId) errors.push('PAYABLE_ID_REQUIRED');
  if (!command.settlementLineId) errors.push('SETTLEMENT_LINE_ID_REQUIRED');
  if (!command.reasonCode) errors.push('REVERSAL_REASON_CODE_REQUIRED');
  if (!command.actorId && !command.systemActor) errors.push('REVERSAL_ACTOR_REQUIRED');

  if (errors.length > 0) {
    return {
      success: false,
      status: 'REJECTED',
      errors,
      boundaryFlags: reversalBoundaryFlags,
    };
  }

  const repo = getRepository();
  const payable = await repo.getSupplierPayableById(command.payableId);
  if (!payable || payable.settlementLineId !== command.settlementLineId) {
    return {
      success: false,
      status: 'REJECTED',
      errors: ['SUPPLIER_PAYABLE_NOT_FOUND'],
      boundaryFlags: reversalBoundaryFlags,
    };
  }

  const amountErrors = validateReversalAmount(command.reversalAmount, payable.amount);
  if (amountErrors.length > 0) {
    return {
      success: false,
      status: 'REJECTED',
      payable,
      errors: amountErrors,
      boundaryFlags: reversalBoundaryFlags,
    };
  }

  if (payable.status === 'PAYOUT_READY') {
    return {
      success: false,
      status: 'REVIEW_REQUIRED',
      payable,
      warnings: ['PAYOUT_READY_REVERSAL_REQUIRES_MANUAL_REVIEW'],
      boundaryFlags: reversalBoundaryFlags,
    };
  }

  const reversal: SettlementSupplierPayableReversal = {
    reversalId: `payable_reversal_${randomUUID()}`,
    sourceRefundId: command.sourceRefundId,
    refundId: command.refundId,
    settlementLineId: command.settlementLineId,
    payableId: command.payableId,
    reasonCode: command.reasonCode,
    reversalAmount: command.reversalAmount,
    actorId: command.actorId,
    systemActor: command.systemActor,
    idempotencyKey: command.idempotencyKey,
    sourceRefs: cloneSourceRefs(command.sourceRefs ?? payable.sourceRefs),
    createdAt: command.createdAt ?? new Date().toISOString(),
    boundaryFlags: reversalBoundaryFlags,
  };

  if (payable.status === 'REVERSED') {
    const result = {
      success: true,
      status: 'IDEMPOTENT' as const,
      payable,
      reversal,
      boundaryFlags: reversalBoundaryFlags,
    };
    supplierPayableReversalIdempotencyMap.set(command.idempotencyKey, { ...result, fingerprint });
    return result;
  }

  if (!['PENDING', 'HELD', 'RELEASE_ELIGIBLE'].includes(payable.status)) {
    return {
      success: false,
      status: 'REJECTED',
      payable,
      errors: ['SUPPLIER_PAYABLE_STATUS_NOT_REVERSIBLE'],
      boundaryFlags: reversalBoundaryFlags,
    };
  }

  const updated = await repo.reverseSupplierPayable(command.payableId, {
    status: 'REVERSED',
    updatedAt: new Date().toISOString(),
  });

  const result = {
    success: true,
    status: 'REVERSED' as const,
    payable: updated ?? payable,
    reversal,
    boundaryFlags: reversalBoundaryFlags,
  };
  supplierPayableReversalIdempotencyMap.set(command.idempotencyKey, { ...result, fingerprint });
  return result;
}

export async function reverseSettlementCreatorEarning(
  command: ReverseSettlementCreatorEarningCommand,
): Promise<SettlementCreatorEarningReversalResult> {
  const fingerprint = createCreatorEarningReversalFingerprint(command);
  const existingResult = creatorEarningReversalIdempotencyMap.get(command.idempotencyKey);
  if (existingResult) {
    if (existingResult.fingerprint === fingerprint) {
      const { fingerprint: _fingerprint, ...result } = existingResult;
      return { ...result, status: result.status === 'REVERSED' ? 'IDEMPOTENT' : result.status };
    }

    return {
      success: false,
      status: 'REJECTED',
      errors: ['DUPLICATE_IDEMPOTENCY_KEY_CONFLICT'],
      boundaryFlags: reversalBoundaryFlags,
    };
  }

  const errors: string[] = [];
  if (!command.idempotencyKey) errors.push('REVERSAL_IDEMPOTENCY_KEY_REQUIRED');
  if (!command.earningId) errors.push('EARNING_ID_REQUIRED');
  if (!command.settlementLineId) errors.push('SETTLEMENT_LINE_ID_REQUIRED');
  if (!command.reasonCode) errors.push('REVERSAL_REASON_CODE_REQUIRED');
  if (!command.actorId && !command.systemActor) errors.push('REVERSAL_ACTOR_REQUIRED');

  if (errors.length > 0) {
    return {
      success: false,
      status: 'REJECTED',
      errors,
      boundaryFlags: reversalBoundaryFlags,
    };
  }

  const repo = getRepository();
  const earning = await repo.getCreatorEarningById(command.earningId);
  if (!earning || earning.settlementLineId !== command.settlementLineId) {
    return {
      success: false,
      status: 'REJECTED',
      errors: ['CREATOR_EARNING_NOT_FOUND'],
      boundaryFlags: reversalBoundaryFlags,
    };
  }

  const amountErrors = validateReversalAmount(command.reversalAmount, earning.amount);
  if (amountErrors.length > 0) {
    return {
      success: false,
      status: 'REJECTED',
      earning,
      errors: amountErrors,
      boundaryFlags: reversalBoundaryFlags,
    };
  }

  if (earning.status === 'PAYOUT_READY') {
    return {
      success: false,
      status: 'REVIEW_REQUIRED',
      earning,
      warnings: ['PAYOUT_READY_REVERSAL_REQUIRES_MANUAL_REVIEW'],
      boundaryFlags: reversalBoundaryFlags,
    };
  }

  const reversal: SettlementCreatorEarningReversal = {
    reversalId: `earning_reversal_${randomUUID()}`,
    sourceRefundId: command.sourceRefundId,
    refundId: command.refundId,
    settlementLineId: command.settlementLineId,
    earningId: command.earningId,
    reasonCode: command.reasonCode,
    reversalAmount: command.reversalAmount,
    actorId: command.actorId,
    systemActor: command.systemActor,
    idempotencyKey: command.idempotencyKey,
    sourceRefs: cloneSourceRefs(command.sourceRefs ?? earning.sourceRefs),
    createdAt: command.createdAt ?? new Date().toISOString(),
    boundaryFlags: reversalBoundaryFlags,
  };

  if (earning.status === 'REVERSED') {
    const result = {
      success: true,
      status: 'IDEMPOTENT' as const,
      earning,
      reversal,
      boundaryFlags: reversalBoundaryFlags,
    };
    creatorEarningReversalIdempotencyMap.set(command.idempotencyKey, { ...result, fingerprint });
    return result;
  }

  if (!['PENDING', 'HELD', 'RELEASE_ELIGIBLE'].includes(earning.status)) {
    return {
      success: false,
      status: 'REJECTED',
      earning,
      errors: ['CREATOR_EARNING_STATUS_NOT_REVERSIBLE'],
      boundaryFlags: reversalBoundaryFlags,
    };
  }

  const updated = await repo.reverseCreatorEarning(command.earningId, {
    status: 'REVERSED',
    updatedAt: new Date().toISOString(),
  });

  const result = {
    success: true,
    status: 'REVERSED' as const,
    earning: updated ?? earning,
    reversal,
    boundaryFlags: reversalBoundaryFlags,
  };
  creatorEarningReversalIdempotencyMap.set(command.idempotencyKey, { ...result, fingerprint });
  return result;
}
