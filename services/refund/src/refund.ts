import { getRefundRepository } from './repository';
import {
  CreateRefundFromCancelReturnCommand,
  RefundResponse,
  RefundState,
  RefundTransitionCommand,
  RefundTransitionResult,
  RefundLine,
  RefundDetailResponse,
  RefundCouponSponsorReversalCommand,
  RefundCouponSponsorReversalResult,
  RefundCouponSponsorReversalSummary,
} from '@hx/contracts';
import { getCancelReturnRequestById } from '@hx/cancel-return';
import { simulateProviderRefund } from '@hx/payment';
import { randomUUID } from 'node:crypto';

const refundCouponSponsorReversalGuard = new Map<string, RefundCouponSponsorReversalResult & { fingerprint: string }>();

function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function emptyRefundCouponSponsorReversalSummary(): RefundCouponSponsorReversalSummary {
  return {
    platformReversalAmount: 0,
    creatorReversalAmount: 0,
    supplierReversalAmount: 0,
    brandReversalAmount: 0,
    totalReversalAmount: 0,
    settlementAdjustedCreated: false,
    payoutReversalCreated: false,
    ledgerEntryCreated: false,
    orderStateMutated: false,
    paymentStateMutated: false,
    refundStateMutated: false,
  };
}

function canonicalizeRefundCouponSponsorReversalCommand(command: RefundCouponSponsorReversalCommand): string {
  return JSON.stringify({
    refundId: command.refundId,
    refundLines: [...command.refundLines].sort((a, b) =>
      `${a.refundLineId ?? ''}:${a.lineId ?? ''}:${a.cartLineId ?? ''}:${a.orderLineId ?? ''}`.localeCompare(
        `${b.refundLineId ?? ''}:${b.lineId ?? ''}:${b.cartLineId ?? ''}:${b.orderLineId ?? ''}`,
      ),
    ),
    discountLineAllocations: [...command.discountLineAllocations].sort((a, b) => a.allocationId.localeCompare(b.allocationId)),
    reversalReason: command.reversalReason ?? 'REFUND_LINE_COUPON_SPONSOR_REVERSAL',
  });
}

function lineMatchesAllocation(
  line: RefundCouponSponsorReversalCommand['refundLines'][number],
  allocation: RefundCouponSponsorReversalCommand['discountLineAllocations'][number],
): boolean {
  return Boolean(
    (line.orderLineId && allocation.orderLineId && line.orderLineId === allocation.orderLineId) ||
      (line.lineId && line.lineId === allocation.lineId) ||
      (line.cartLineId && allocation.cartLineId && line.cartLineId === allocation.cartLineId),
  );
}

function reversalRatio(line: RefundCouponSponsorReversalCommand['refundLines'][number]): number {
  if (line.refundAmount === undefined || line.originalLineAmount === undefined) return 1;
  if (line.originalLineAmount <= 0 || line.refundAmount <= 0) return 0;
  return Math.min(1, line.refundAmount / line.originalLineAmount);
}

export function resetRefundCouponSponsorReversalGuardForTesting(): void {
  refundCouponSponsorReversalGuard.clear();
}

export function calculateRefundCouponSponsorReversal(
  command: RefundCouponSponsorReversalCommand,
): RefundCouponSponsorReversalResult {
  const summary = emptyRefundCouponSponsorReversalSummary();
  const errors: string[] = [];

  if (!command.refundId) errors.push('REFUND_ID_REQUIRED');
  if (!command.idempotencyKey) errors.push('IDEMPOTENCY_KEY_REQUIRED');
  if (!command.refundLines.length) errors.push('REFUND_LINE_REQUIRED');
  if (!command.discountLineAllocations.length) errors.push('DISCOUNT_LINE_ALLOCATION_REQUIRED');

  const fingerprint = canonicalizeRefundCouponSponsorReversalCommand(command);
  const existing = refundCouponSponsorReversalGuard.get(command.idempotencyKey);
  if (existing) {
    if (existing.fingerprint !== fingerprint) {
      return {
        status: 'CONFLICT',
        reversals: [],
        summary,
        errors: ['DUPLICATE_IDEMPOTENCY_KEY_CONFLICT'],
        idempotencyKey: command.idempotencyKey,
      };
    }

    const { fingerprint: _fingerprint, ...result } = existing;
    return result;
  }

  const unsupportedAllocation = command.discountLineAllocations.find((allocation) =>
    allocation.sponsorType === 'SUPPLIER' || allocation.sponsorType === 'BRAND' || allocation.sponsorType === 'MIXED',
  );
  if (unsupportedAllocation) {
    errors.push('FIRST_PHASE_REFUND_COUPON_SPONSOR_REVERSAL_UNSUPPORTED');
  }

  if (errors.length > 0) {
    return {
      status: 'BLOCKED',
      reversals: [],
      summary,
      errors,
      idempotencyKey: command.idempotencyKey,
    };
  }

  const createdAt = new Date().toISOString();
  const reversals = command.refundLines.flatMap((line) => {
    const ratio = reversalRatio(line);
    if (ratio <= 0) return [];

    return command.discountLineAllocations
      .filter((allocation) => lineMatchesAllocation(line, allocation))
      .filter((allocation) => allocation.sponsorType === 'PLATFORM' || allocation.sponsorType === 'CREATOR')
      .map((allocation) => {
        const reversedAmount = roundMoney(Math.min(allocation.allocatedAmount, allocation.allocatedAmount * ratio));

        return {
          reversalId: `rcr_${randomUUID()}`,
          refundId: command.refundId,
          refundLineId: line.refundLineId,
          lineId: allocation.lineId,
          cartLineId: allocation.cartLineId,
          orderLineId: allocation.orderLineId ?? line.orderLineId,
          discountSnapshotId: allocation.discountSnapshotId,
          allocationId: allocation.allocationId,
          discountKind: allocation.discountKind,
          sponsorType: allocation.sponsorType as 'PLATFORM' | 'CREATOR',
          sponsorId: allocation.sponsorId,
          reversedAmount,
          currency: allocation.currency || line.currency,
          reversalReason: command.reversalReason ?? 'REFUND_LINE_COUPON_SPONSOR_REVERSAL',
          idempotencyKey: command.idempotencyKey,
          createdAt,
        };
      });
  });

  summary.platformReversalAmount = roundMoney(
    reversals.filter((reversal) => reversal.sponsorType === 'PLATFORM').reduce((sum, reversal) => sum + reversal.reversedAmount, 0),
  );
  summary.creatorReversalAmount = roundMoney(
    reversals.filter((reversal) => reversal.sponsorType === 'CREATOR').reduce((sum, reversal) => sum + reversal.reversedAmount, 0),
  );
  summary.totalReversalAmount = roundMoney(summary.platformReversalAmount + summary.creatorReversalAmount);

  const result: RefundCouponSponsorReversalResult = {
    status: 'CALCULATED',
    reversals,
    summary,
    errors: [],
    idempotencyKey: command.idempotencyKey,
  };
  refundCouponSponsorReversalGuard.set(command.idempotencyKey, { ...result, fingerprint });
  return result;
}

export async function createRefundFromCancelReturn(
  command: CreateRefundFromCancelReturnCommand
): Promise<RefundResponse> {
  const { cancelReturnRequestId, idempotencyKey } = command;
  const repo = getRefundRepository();

  // Idempotency check 1: idempotencyKey
  if (idempotencyKey) {
    const existingRefund = await repo.getByIdempotencyKey(idempotencyKey);
    if (existingRefund) return existingRefund;
  }

  // Idempotency check 2: cancelReturnRequestId (one refund per request rule)
  const existingRefundForRequest = await repo.getByCancelReturnRequestId(cancelReturnRequestId);
  if (existingRefundForRequest) {
    return existingRefundForRequest;
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Read request from owner
  const request = await getCancelReturnRequestById(cancelReturnRequestId);

  // Not found
  if (!request) {
    return createErrorResponse('CANCEL_RETURN_REQUEST_NOT_FOUND', cancelReturnRequestId);
  }

  // State check: Only approved/pending states allowed for refund creation
  const allowedStates = ['APPROVED', 'PARTIALLY_APPROVED', 'REFUND_PENDING'];
  if (!allowedStates.includes(request.state)) {
    return createErrorResponse('REFUND_SOURCE_NOT_APPROVED', cancelReturnRequestId);
  }

  // Impact check
  if (!request.refundImpactSummary.refundRequired) {
    return createErrorResponse('REFUND_NOT_REQUIRED', cancelReturnRequestId);
  }

  const refundId = randomUUID();

  // Lines from request
  const lines: RefundLine[] = request.lines.map((l: any) => ({
    refundLineId: randomUUID(),
    requestLineId: l.requestLineId,
    orderLineId: l.orderLineId,
    productId: l.productId,
    variantId: l.variantId,
    storefrontId: l.storefrontId,
    quantity: l.quantity,
    amount: 0, 
    currency: 'TRY',
  }));

  if (lines.length > 0) {
    warnings.push('REFUND_AMOUNT_SOURCE_NOT_AVAILABLE');
  }

  const refund: RefundResponse = {
    refundId,
    cancelReturnRequestId,
    sourceType: request.type as any,
    state: 'CREATED',
    lines,
    amountSummary: {
      requestedAmount: 0,
      approvedAmount: 0,
      refundedAmount: 0,
      currency: 'TRY',
    },
    paymentSummary: {
      simulationOnly: true,
      actualProviderRefundPerformed: false,
    },
    settlementImpactSummary: {
      settlementAdjustmentRequired: true,
      actualSettlementMutationPerformed: false,
    },
    payoutImpactSummary: {
      payoutAdjustmentRequired: true,
      actualPayoutMutationPerformed: false,
    },
    errors,
    warnings,
  };

  await repo.save(refund, idempotencyKey);
  return refund;
}

export async function getRefundById(refundId: string): Promise<RefundResponse | undefined> {
  const repo = getRefundRepository();
  return repo.getById(refundId);
}

export async function getRefundByCancelReturnRequestId(requestId: string): Promise<RefundResponse | undefined> {
  const repo = getRefundRepository();
  return repo.getByCancelReturnRequestId(requestId);
}

export async function getRefundDetail(refundId: string): Promise<RefundDetailResponse | undefined> {
  return getRefundById(refundId);
}

export async function processRefund(refundId: string): Promise<RefundResponse> {
  const repo = getRefundRepository();
  const refund = await repo.getById(refundId);
  if (!refund) {
    throw new Error('REFUND_NOT_FOUND');
  }

  // Check processable state
  if (refund.state !== 'CREATED' && refund.state !== 'VALIDATED') {
    return refund;
  }

  // Try to find payment reference from cancel-return request
  const request = await getCancelReturnRequestById(refund.cancelReturnRequestId);
  
  // P18 Limitation: "refund source payment reference missing"
  let paymentId: string | undefined;
  
  if (request && (request as any).paymentId) {
      paymentId = (request as any).paymentId;
  }

  if (!paymentId) {
    refund.state = 'RECONCILIATION_REQUIRED';
    refund.warnings.push('REFUND_SOURCE_PAYMENT_REFERENCE_MISSING');
    await repo.save(refund);
    return refund;
  }

  refund.state = 'PROCESSING';
  refund.paymentSummary.originalPaymentId = paymentId;

  const simResult = await simulateProviderRefund({
    paymentId,
    amount: refund.amountSummary.requestedAmount,
    currency: refund.amountSummary.currency,
    refundId: refund.refundId
  });

  if (simResult.success) {
    refund.state = 'SUCCEEDED';
    refund.paymentSummary.providerRefundReference = simResult.providerRefundReference;
  } else {
    refund.state = 'FAILED';
    refund.errors.push(simResult.error || 'SIMULATION_FAILED');
  }

  await repo.save(refund);
  return refund;
}

export async function transitionRefundState(
  command: RefundTransitionCommand
): Promise<RefundTransitionResult> {
  const { refundId, targetState } = command;
  const repo = getRefundRepository();
  const refund = await repo.getById(refundId);

  if (!refund) {
    return { success: false, error: 'REFUND_NOT_FOUND' };
  }

  const currentState = refund.state;

  const allowedTransitions: Record<RefundState, RefundState[]> = {
    CREATED: ['VALIDATED', 'CANCELLED'],
    VALIDATED: ['PROCESSING'],
    PROCESSING: ['SUCCEEDED', 'FAILED', 'UNKNOWN_RESULT'],
    UNKNOWN_RESULT: ['RECONCILIATION_REQUIRED'],
    FAILED: ['RECONCILIATION_REQUIRED', 'CLOSED'],
    SUCCEEDED: ['CLOSED'],
    RECONCILIATION_REQUIRED: ['CLOSED'],
    CANCELLED: ['CLOSED'],
    CLOSED: [],
  };

  if (!allowedTransitions[currentState]?.includes(targetState)) {
    return { success: false, error: 'INVALID_TRANSITION', refund };
  }

  refund.state = targetState;
  await repo.save(refund);

  return { success: true, refund };
}

function createErrorResponse(error: string, requestId: string): RefundResponse {
  return {
    refundId: '',
    cancelReturnRequestId: requestId,
    sourceType: 'CANCEL',
    state: 'FAILED',
    lines: [],
    amountSummary: {
      requestedAmount: 0,
      approvedAmount: 0,
      refundedAmount: 0,
      currency: 'TRY',
    },
    paymentSummary: {
      simulationOnly: true,
      actualProviderRefundPerformed: false,
    },
    settlementImpactSummary: {
      settlementAdjustmentRequired: false,
      actualSettlementMutationPerformed: false,
    },
    payoutImpactSummary: {
      payoutAdjustmentRequired: false,
      actualPayoutMutationPerformed: false,
    },
    errors: [error],
    warnings: [],
  };
}
