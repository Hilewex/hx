import { getCancelReturnRepository } from './repository';
import {
  CancelReturnResponse,
  CreateCancelRequestCommand,
  CreateReturnRequestCommand,
  CancelReturnTransitionCommand,
  CancelReturnTransitionResult,
  CancelReturnLine
} from '@hx/contracts';
import { getOrderById } from '@hx/order';
import { getShipmentsByOrderId } from '@hx/shipment';
import { randomUUID } from 'node:crypto';

export async function createCancelRequest(command: CreateCancelRequestCommand): Promise<CancelReturnResponse> {
  const { orderId, orderLineIds, reasonCode, idempotencyKey: initialIdempotencyKey } = command;
  const repo = getCancelReturnRepository();

  const idempotencyKey = initialIdempotencyKey || `cancel-${orderId}-${orderLineIds.join('-')}`;
  
  const existingByIdempotency = await repo.getByIdempotencyKey(idempotencyKey);
  if (existingByIdempotency) {
    return existingByIdempotency;
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return createErrorResponse(orderId, 'CANCEL', ['CANCEL_RETURN_ORDER_NOT_FOUND']);
  }

  if (!orderLineIds || orderLineIds.length === 0) {
    return createErrorResponse(orderId, 'CANCEL', ['INVALID_REQUEST_EMPTY_LINES']);
  }

  const lines: CancelReturnLine[] = [];
  const existingRequests = await repo.getByOrderId(orderId);

  for (const lineId of orderLineIds) {
    const orderLine = order.lines.find(ol => ol.orderLineId === lineId);
    if (!orderLine) {
      return createErrorResponse(orderId, 'CANCEL', [`ORDER_LINE_NOT_FOUND: ${lineId}`]);
    }

    // 1. Check delivery state
    const shipments = await getShipmentsByOrderId(orderId);
    for (const shipment of shipments) {
      const shipmentLine = shipment.lines.find(sl => sl.orderLineId === lineId);
      if (shipmentLine && shipmentLine.state === 'DELIVERED') {
        return createErrorResponse(orderId, 'CANCEL', [`CANCEL_LINE_ALREADY_DELIVERED: ${lineId}`]);
      }
    }

    // 2. Duplicate check (Specific to CANCEL)
    const existingCancel = existingRequests.find(req => 
      req.type === 'CANCEL' && req.lines.some(l => l.orderLineId === lineId) && req.state !== 'REJECTED' && req.state !== 'CLOSED'
    );
    if (existingCancel) return existingCancel;

    lines.push({
      requestLineId: randomUUID(),
      orderLineId: lineId,
      productId: orderLine.productId,
      variantId: orderLine.variantId,
      storefrontId: orderLine.storefrontId,
      quantity: orderLine.quantity,
      reasonCode,
      state: 'CREATED'
    });
  }

  const response: CancelReturnResponse = {
    requestId: randomUUID(),
    type: 'CANCEL',
    orderId,
    state: 'CREATED',
    lines,
    refundImpactSummary: {
      refundRequired: true,
      refundState: 'PENDING',
      actualRefundExecutionPerformed: false
    },
    postDeliveryEntitlementImpactSummary: {
      reviewImpactPending: false,
      storyImpactPending: false,
      verifiedPurchaseImpactPending: false,
      actualEntitlementMutationPerformed: false
    },
    errors: [],
    warnings: []
  };

  await repo.save(response, idempotencyKey);
  return response;
}

export async function createReturnRequest(command: CreateReturnRequestCommand): Promise<CancelReturnResponse> {
  const { orderId, orderLineIds, reasonCode, idempotencyKey: initialIdempotencyKey } = command;
  const repo = getCancelReturnRepository();

  const idempotencyKey = initialIdempotencyKey || `return-${orderId}-${orderLineIds.join('-')}`;
  
  const existingByIdempotency = await repo.getByIdempotencyKey(idempotencyKey);
  if (existingByIdempotency) {
    return existingByIdempotency;
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return createErrorResponse(orderId, 'RETURN', ['CANCEL_RETURN_ORDER_NOT_FOUND']);
  }

  if (!orderLineIds || orderLineIds.length === 0) {
    return createErrorResponse(orderId, 'RETURN', ['INVALID_REQUEST_EMPTY_LINES']);
  }

  const lines: CancelReturnLine[] = [];
  const existingRequests = await repo.getByOrderId(orderId);

  for (const lineId of orderLineIds) {
    const orderLine = order.lines.find(ol => ol.orderLineId === lineId);
    if (!orderLine) {
      return createErrorResponse(orderId, 'RETURN', [`ORDER_LINE_NOT_FOUND: ${lineId}`]);
    }

    // 1. Policy: Block return if active cancel exists
    const activeCancel = existingRequests.find(req => 
      req.type === 'CANCEL' && req.lines.some(l => l.orderLineId === lineId) && !['REJECTED', 'CLOSED'].includes(req.state)
    );
    if (activeCancel) {
      console.log(`[CancelReturnService] Return blocked by active cancel ${activeCancel.requestId} in state ${activeCancel.state}`);
      return createErrorResponse(orderId, 'RETURN', [`RETURN_NOT_ALLOWED_DUE_TO_ACTIVE_CANCEL: ${lineId}`]);
    }

    // 2. Check delivery state (MUST BE DELIVERED)
    const shipments = await getShipmentsByOrderId(orderId);
    let isDelivered = false;
    for (const shipment of shipments) {
      const shipmentLine = shipment.lines.find(sl => sl.orderLineId === lineId);
      if (shipmentLine && shipmentLine.state === 'DELIVERED') {
        isDelivered = true;
        break;
      }
    }
    
    if (!isDelivered) {
      return createErrorResponse(orderId, 'RETURN', [`RETURN_LINE_NOT_DELIVERED: ${lineId}`]);
    }

    // 3. Duplicate check (Specific to RETURN)
    const existingReturn = existingRequests.find(req => 
      req.type === 'RETURN' && req.lines.some(l => l.orderLineId === lineId) && req.state !== 'REJECTED' && req.state !== 'CLOSED'
    );
    if (existingReturn) return existingReturn;

    lines.push({
      requestLineId: randomUUID(),
      orderLineId: lineId,
      productId: orderLine.productId,
      variantId: orderLine.variantId,
      storefrontId: orderLine.storefrontId,
      quantity: orderLine.quantity,
      reasonCode,
      state: 'CREATED'
    });
  }

  const response: CancelReturnResponse = {
    requestId: randomUUID(),
    type: 'RETURN',
    orderId,
    state: 'CREATED',
    lines,
    refundImpactSummary: {
      refundRequired: true,
      refundState: 'PENDING',
      actualRefundExecutionPerformed: false
    },
    postDeliveryEntitlementImpactSummary: {
      reviewImpactPending: true,
      storyImpactPending: true,
      verifiedPurchaseImpactPending: true,
      actualEntitlementMutationPerformed: false
    },
    errors: [],
    warnings: []
  };

  await repo.save(response, idempotencyKey);
  return response;
}

export async function getCancelReturnRequestById(requestId: string): Promise<CancelReturnResponse | undefined> {
  const repo = getCancelReturnRepository();
  return repo.getById(requestId);
}

export async function getCancelReturnRequestsByOrderId(orderId: string): Promise<CancelReturnResponse[]> {
  const repo = getCancelReturnRepository();
  return repo.getByOrderId(orderId);
}

export async function transitionCancelReturnRequest(command: CancelReturnTransitionCommand): Promise<CancelReturnTransitionResult> {
  const { requestId, targetState } = command;
  const repo = getCancelReturnRepository();
  const request = await repo.getById(requestId);

  if (!request) {
    return { success: false, error: 'CANCEL_RETURN_REQUEST_NOT_FOUND' };
  }

  if (!isValidTransition(request.type, request.state as any, targetState as any)) {
    return { success: false, error: 'INVALID_TRANSITION' };
  }

  request.state = targetState;
  for (const line of request.lines) {
    line.state = targetState;
  }

  await repo.save(request);
  return { success: true, request };
}

function isValidTransition(type: 'CANCEL' | 'RETURN', current: string, target: string): boolean {
  if (type === 'CANCEL') {
    const transitions: Record<string, string[]> = {
      'CREATED': ['UNDER_REVIEW'],
      'UNDER_REVIEW': ['APPROVED', 'REJECTED', 'OPERATIONALLY_BLOCKED'],
      'APPROVED': ['REFUND_PENDING', 'CLOSED'],
      'REFUND_PENDING': ['REFUNDED'],
      'REFUNDED': ['CLOSED'],
      'REJECTED': ['CLOSED'],
      'OPERATIONALLY_BLOCKED': ['CLOSED'],
      'CLOSED': []
    };
    return transitions[current]?.includes(target) || false;
  } else {
    const transitions: Record<string, string[]> = {
      'CREATED': ['UNDER_REVIEW'],
      'UNDER_REVIEW': ['APPROVED', 'REJECTED', 'AWAITING_RETURN_SHIPMENT'],
      'AWAITING_RETURN_SHIPMENT': ['RETURN_IN_TRANSIT'],
      'RETURN_IN_TRANSIT': ['RECEIVED_BACK'],
      'RECEIVED_BACK': ['APPROVED', 'PARTIALLY_APPROVED', 'REJECTED'],
      'APPROVED': ['REFUND_PENDING', 'CLOSED'],
      'PARTIALLY_APPROVED': ['REFUND_PENDING', 'CLOSED'],
      'REFUND_PENDING': ['REFUNDED_PARTIALLY', 'REFUNDED_FULLY'],
      'REFUNDED_PARTIALLY': ['CLOSED'],
      'REFUNDED_FULLY': ['CLOSED'],
      'REJECTED': ['CLOSED'],
      'CLOSED': []
    };
    return transitions[current]?.includes(target) || false;
  }
}

function createErrorResponse(orderId: string, type: 'CANCEL' | 'RETURN', errors: string[]): CancelReturnResponse {
  return {
    requestId: '',
    type,
    orderId,
    state: 'REJECTED', // Valid state for errors in foundation
    lines: [],
    refundImpactSummary: { refundRequired: false, refundState: 'NOT_REQUIRED', actualRefundExecutionPerformed: false },
    postDeliveryEntitlementImpactSummary: { reviewImpactPending: false, storyImpactPending: false, verifiedPurchaseImpactPending: false, actualEntitlementMutationPerformed: false },
    errors,
    warnings: []
  };
}
