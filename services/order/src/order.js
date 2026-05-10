"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderById = getOrderById;
exports.getOrderDetail = getOrderDetail;
exports.createOrderFromPayment = createOrderFromPayment;
const checkout_1 = require("@hx/checkout");
const payment_1 = require("@hx/payment");
const risk_1 = require("@hx/risk");
const node_crypto_1 = require("node:crypto");
const index_1 = require("./repository/index");
const persistence_1 = require("@hx/persistence");
async function getOrderById(orderId) {
    return (0, index_1.getOrderRepository)().getById(orderId);
}
async function getOrderDetail(orderId) {
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
async function createOrderFromPayment(command) {
    const { paymentId, paymentAttemptId, checkoutId, idempotencyKey: initialIdempotencyKey } = command;
    const idempotencyKey = initialIdempotencyKey || `order-${paymentAttemptId}`;
    const repo = (0, index_1.getOrderRepository)();
    const existingIdemp = await repo.getByIdempotencyKey('order', idempotencyKey);
    if (existingIdemp) {
        // HARDENING-06D: Duplicate order create attempt
        await (0, risk_1.createInternalRiskSignal)({
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
            correlationId: (0, node_crypto_1.randomUUID)(),
        });
        return existingIdemp;
    }
    const existingByAttempt = await repo.getByPaymentAttemptId(paymentAttemptId);
    if (existingByAttempt) {
        return existingByAttempt;
    }
    const payment = await (0, payment_1.getPayment)(paymentId);
    if (!payment) {
        console.error('Order creation failed: payment not found');
        await (0, risk_1.createInternalRiskSignal)({
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
            correlationId: (0, node_crypto_1.randomUUID)(),
        });
        return createErrorResponse(checkoutId, paymentId, paymentAttemptId, ['PAYMENT_NOT_FOUND']);
    }
    // HARDENING-06D: Another actor payment's order create attempt
    if (payment.cartContext.actorId !== command.customerId) {
        await (0, risk_1.createInternalRiskSignal)({
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
            correlationId: (0, node_crypto_1.randomUUID)(),
        });
    }
    if (payment.state !== 'SUCCEEDED') {
        console.error(`Order creation failed: payment not succeeded, state=${payment.state}`);
        await (0, risk_1.createInternalRiskSignal)({
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
            correlationId: (0, node_crypto_1.randomUUID)(),
        });
        return createErrorResponse(checkoutId, paymentId, paymentAttemptId, ['PAYMENT_NOT_SUCCEEDED']);
    }
    if (payment.attempt.paymentAttemptId !== paymentAttemptId) {
        console.error('Order creation failed: payment attempt mismatch');
        return createErrorResponse(checkoutId, paymentId, paymentAttemptId, ['PAYMENT_ATTEMPT_MISMATCH']);
    }
    const checkout = await (0, checkout_1.getCheckoutReview)(checkoutId);
    if (!checkout || checkout.state !== 'REVIEW_READY' || checkout.validationState !== 'VALID') {
        console.error(`Order creation failed: checkout not ready, state=${checkout?.state}, validation=${checkout?.validationState}`);
        return createErrorResponse(checkoutId, paymentId, paymentAttemptId, ['CHECKOUT_NOT_READY']);
    }
    const orderId = (0, node_crypto_1.randomUUID)();
    const orderNumber = `ORD-${Date.now()}-${orderId.slice(0, 8).toUpperCase()}`;
    const lines = checkout.lines.map(cl => ({
        orderLineId: (0, node_crypto_1.randomUUID)(),
        productId: cl.productId,
        variantId: cl.variantId,
        storefrontId: cl.storefrontId,
        quantity: cl.quantity,
        productNameSnapshot: `Product ${cl.productId}`,
        unitPriceSnapshot: cl.unitPrice || 0,
        lineTotalSnapshot: cl.lineTotal || 0
    }));
    const response = {
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
        const auditEvent = (0, persistence_1.getAuditEventRepositories)();
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
    }
    catch (error) {
        response.warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
    }
    return response;
}
function createErrorResponse(checkoutId, paymentId, paymentAttemptId, errors) {
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
