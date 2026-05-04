import {
  CreateOrderCommand,
  OrderResponse,
  OrderDetailResponse,
  OrderLine
} from '@hx/contracts';
import { getCheckoutReview } from '@hx/checkout';
import { getPayment } from '@hx/payment';
import { createInternalRiskSignal } from '@hx/risk';
import { randomUUID } from 'node:crypto';
import { getOrderRepository } from './repository/index';
import { getAuditEventRepositories } from '@hx/persistence';

export async function getOrderById(orderId: string): Promise<OrderResponse | undefined> {
  return getOrderRepository().getById(orderId);
}

export async function getOrderDetail(orderId: string): Promise<OrderDetailResponse> {
  const order = await getOrderById(orderId);

  if (!order) {
    return {
      orderId: '',
      orderNumber: '',
      checkoutId: '',
      paymentId: '',
      paymentAttemptId: '',
      state: 'CREATE_FAILED',
      lines: [],
      summary: { totalQuantity: 0, subTotal: 0, grandTotal: 0, currency: 'TRY' },
      errors: ['ORDER_NOT_FOUND'],
      warnings: [],
      paymentSummary: { state: 'FAILED', method: 'UNKNOWN' },
      fulfillmentStateSummary: 'NOT_STARTED',
      shipmentStateSummary: 'NOT_AVAILABLE',
      actions: { canCancel: false, canReturn: false }
    };
  }

  return {
    ...order,
    paymentSummary: {
      state: order.state === 'CREATED' ? 'CAPTURED' : 'FAILED',
      method: 'CARD'
    },
    fulfillmentStateSummary: 'NOT_STARTED',
    shipmentStateSummary: 'NOT_AVAILABLE',
    actions: {
      canCancel: false,
      canReturn: false
    }
  };
}

export async function createOrderFromPayment(command: CreateOrderCommand): Promise<OrderResponse> {
  const { paymentId, paymentAttemptId, checkoutId, idempotencyKey: initialIdempotencyKey } = command;

  const idempotencyKey = initialIdempotencyKey || `order-${paymentAttemptId}`;

  const repo = getOrderRepository();
  const existingIdemp = await repo.getByIdempotencyKey('order', idempotencyKey);
  if (existingIdemp) {
    // HARDENING-06D: Duplicate order create attempt
    await createInternalRiskSignal({
        targetId: paymentAttemptId,
        targetType: 'ORDER',
        type: 'PAYMENT_ANOMALY',
        level: 'LOW',
        source: 'ORDER_SIGNAL',
        reasonCode: 'PAYMENT_ANOMALY',
        metadata: { 
            paymentAttemptId,
            reason: 'DUPLICATE_ORDER_CREATE_ATTEMPT'
        },
        correlationId: randomUUID(),
    });
    return existingIdemp;
  }

  const existingByAttempt = await repo.getByPaymentAttemptId(paymentAttemptId);
  if (existingByAttempt) {
    return existingByAttempt;
  }

  const payment = await getPayment(paymentId);
  if (!payment) {
    console.error('Order creation failed: payment not found');
    await createInternalRiskSignal({
      targetId: checkoutId,
      targetType: 'ORDER',
      type: 'PAYMENT_ANOMALY',
      level: 'HIGH',
      source: 'ORDER_SIGNAL',
      reasonCode: 'PAYMENT_ANOMALY',
      metadata: {
        paymentId,
        paymentAttemptId,
        checkoutId,
        error: 'PAYMENT_NOT_FOUND',
        reason: 'SUSPICIOUS_ORDER_CREATE_ATTEMPT',
        orderTruthMutated: false,
      },
      correlationId: randomUUID(),
    });
    return createErrorResponse(checkoutId, paymentId, paymentAttemptId, ['PAYMENT_NOT_FOUND']);
  }

  // HARDENING-06D: Another actor payment's order create attempt
  if (payment.cartContext.actorId !== command.customerId) {
    await createInternalRiskSignal({
        targetId: paymentId,
        targetType: 'PAYMENT',
        type: 'PAYMENT_ANOMALY',
        level: 'CRITICAL',
        source: 'ORDER_SIGNAL',
        reasonCode: 'PAYMENT_ANOMALY',
        metadata: { 
            paymentOwner: payment.cartContext.actorId, 
            orderActor: command.customerId,
            reason: 'PAYMENT_OWNER_MISMATCH'
        },
        correlationId: randomUUID(),
    });
  }

  if (payment.state !== 'SUCCEEDED') {
    console.error(`Order creation failed: payment not succeeded, state=${payment.state}`);
    await createInternalRiskSignal({
      targetId: checkoutId,
      targetType: 'ORDER',
      type: 'PAYMENT_ANOMALY',
      level: 'HIGH',
      source: 'ORDER_SIGNAL',
      reasonCode: 'PAYMENT_ANOMALY',
      metadata: {
        paymentId,
        paymentState: payment.state,
        checkoutId,
        error: 'PAYMENT_NOT_SUCCEEDED',
        reason: 'NON_SUCCESS_PAYMENT_ORDER_CREATE_ATTEMPT',
        orderTruthMutated: false,
      },
      correlationId: randomUUID(),
    });
    return createErrorResponse(checkoutId, paymentId, paymentAttemptId, ['PAYMENT_NOT_SUCCEEDED']);
  }

  if (payment.attempt.paymentAttemptId !== paymentAttemptId) {
    console.error('Order creation failed: payment attempt mismatch');
    return createErrorResponse(checkoutId, paymentId, paymentAttemptId, ['PAYMENT_ATTEMPT_MISMATCH']);
  }

  const checkout = await getCheckoutReview(checkoutId);
  if (!checkout || checkout.state !== 'REVIEW_READY' || checkout.validationState !== 'VALID') {
    console.error(`Order creation failed: checkout not ready, state=${checkout?.state}, validation=${checkout?.validationState}`);
    return createErrorResponse(checkoutId, paymentId, paymentAttemptId, ['CHECKOUT_NOT_READY']);
  }

  const orderId = randomUUID();
  const orderNumber = `ORD-${Date.now()}-${orderId.slice(0, 8).toUpperCase()}`;

  const lines: OrderLine[] = checkout.lines.map(cl => ({
    orderLineId: randomUUID(),
    productId: cl.productId,
    variantId: cl.variantId,
    storefrontId: cl.storefrontId,
    quantity: cl.quantity,
    productNameSnapshot: `Product ${cl.productId}`,
    unitPriceSnapshot: cl.unitPrice || 0,
    lineTotalSnapshot: cl.lineTotal || 0
  }));

  const response: OrderResponse = {
    orderId,
    orderNumber,
    customerId: command.customerId,
    checkoutId,
    paymentId,
    paymentAttemptId,
    state: 'CREATED',
    lines,
    summary: { ...checkout.summary },
    errors: [],
    warnings: []
  };

  await repo.saveWithIdempotency('order', idempotencyKey, response);
  try {
    const auditEvent = getAuditEventRepositories();
    await auditEvent.audit.appendAuditLog({
      actorType: 'SYSTEM',
      actorId: 'order-service',
      actionType: 'order.created',
      ownerService: 'order',
      entityType: 'order',
      entityId: orderId,
      afterState: response,
      idempotencyKey,
      correlationId: orderId,
      metadata: {
        paymentId,
        paymentAttemptId,
        checkoutId,
      },
    });
    await auditEvent.outbox.appendOutboxEvent({
      topic: 'order.created',
      payloadSchema: 'order.created.v1',
      payload: {
        orderId,
        orderNumber,
        paymentId,
        paymentAttemptId,
        checkoutId,
        state: response.state,
      },
      ownerService: 'order',
      entityType: 'order',
      entityId: orderId,
      idempotencyKey: `event:${idempotencyKey}`,
      correlationId: orderId,
    });
  } catch (error) {
    response.warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
  }
  return response;
}

function createErrorResponse(
  checkoutId: string, 
  paymentId: string, 
  paymentAttemptId: string, 
  errors: string[]
): OrderResponse {
  return {
    orderId: '',
    orderNumber: '',
    checkoutId,
    paymentId,
    paymentAttemptId,
    state: 'CREATE_FAILED',
    lines: [],
    summary: { totalQuantity: 0, subTotal: 0, grandTotal: 0, currency: 'TRY' },
    errors,
    warnings: []
  };
}
