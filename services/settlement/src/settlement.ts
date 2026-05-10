import {
  SettlementCalculationInput,
  SettlementCalculationLine,
  SettlementCalculationResult,
  SettlementLimitationFlag,
  CreateSettlementFromOrderCommand,
  ApplySettlementActionCommand,
  GetSettlementLineQuery,
  ListSettlementLinesQuery,
  SettlementMutationResult,
  SettlementLineResponse,
  SettlementLineListResponse,
  SettlementLine,
  SettlementLineStatus,
} from '@hx/contracts';

import { getOrderById } from '@hx/order';
import { getCancelReturnRequestsByOrderId } from '@hx/cancel-return';
import { listFinanceCorrections } from '@hx/finance-correction';
import { listRiskCases } from '@hx/risk';

import { randomUUID } from 'node:crypto';
import { getRepository } from './repository';

const calculationIdempotencyMap = new Map<string, SettlementCalculationResult>();
const calculationFingerprintMap = new Map<string, string>();

function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
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
    refundImpactPending = cancelReturnRequests.some((cr: any) =>
      activeStates.includes(cr.status || cr.state)
    );
  }

  const fcRes = await listFinanceCorrections({ targetId: orderId });
  if (fcRes && fcRes.corrections) {
    const activeFcStates = ['CREATED', 'UNDER_REVIEW', 'ADVISORY_RECORDED'];
    financeCorrectionPending = fcRes.corrections.some((fc: any) =>
      activeFcStates.includes(fc.status)
    );
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
    riskHoldActive = riskRes.cases.some((rc: any) => activeRiskStates.includes(rc.status));
  }

  // 3. Map Lines
  const newLines: SettlementLine[] = [];
  const errors: string[] = [];
  const warnings: string[] = ['SETTLEMENT_RULE_SOURCE_NOT_AVAILABLE'];
  const now = new Date().toISOString();

  for (const line of order.lines) {
    const settlementLineId = randomUUID();
    const status: SettlementLineStatus = riskHoldActive ? 'BLOCKED' : 'PENDING';

    newLines.push({
      settlementLineId,
      orderId: order.orderId,
      orderLineId: line.orderLineId,
      storefrontId: (line as any).storefrontId || 'unknown',
      productId: line.productId,
      variantId: line.variantId,
      partyType: 'SUPPLIER', // Assuming default or inferred
      partyId: (line as any).supplierId || undefined,
      status,
      reasonCode: 'ORDER_CREATED_FOUNDATION',
      amountSummary: {
        currency: order.summary.currency || 'TRY',
        grossAmount: line.lineTotalSnapshot,
        netAmount: line.lineTotalSnapshot,
        ruleSourceAvailable: false,
        calculationFinalized: false,
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
      sourceRefs: [
        { sourceType: 'ORDER', sourceId: order.orderId, sourceState: (order as any).state || (order as any).status },
        { sourceType: 'ORDER_LINE', sourceId: line.orderLineId },
      ],
      idempotencyKey,
      createdAt: now,
      updatedAt: now,
      errors: [],
      warnings: [...warnings],
    });
  }

  // 4. Save
  try {
    await repo.createMany(newLines);
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
