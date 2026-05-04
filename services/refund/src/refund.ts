import { getRefundRepository } from './repository';
import {
  CreateRefundFromCancelReturnCommand,
  RefundResponse,
  RefundState,
  RefundTransitionCommand,
  RefundTransitionResult,
  RefundLine,
  RefundDetailResponse,
} from '@hx/contracts';
import { getCancelReturnRequestById } from '@hx/cancel-return';
import { simulateProviderRefund } from '@hx/payment';
import { randomUUID } from 'node:crypto';

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
