import {
  InitiatePaymentCommand,
  PaymentInitiationResponse,
  SimulatePaymentSuccessResponse,
  ProviderRefundSimulationInput,
  ProviderRefundSimulationResult,
  ProviderResultEnvelope,
} from '@hx/contracts';
import { getCheckoutReview } from '@hx/checkout';
import { createInternalRiskSignal } from '@hx/risk';
import { randomUUID } from 'node:crypto';
import { getPaymentRepository } from './repository/index';
import { getAuditEventRepositories } from '@hx/persistence';
import {
  getPaymentProviderAdapter,
  NormalizedPaymentInitiation,
} from './provider-adapter';

const FAILED_PAYMENT_WINDOW_MS = 60_000;
const FAILED_PAYMENT_SIGNAL_THRESHOLD = 2;
const failedPaymentAttempts = new Map<string, number[]>();

async function recordFailedPaymentPattern(params: {
  checkoutId: string;
  actorId: string;
  actorType: string;
  reason: string;
}) {
  const key = `${params.actorType}:${params.actorId}:${params.checkoutId}`;
  const now = Date.now();
  const recentAttempts = (failedPaymentAttempts.get(key) || [])
    .filter((createdAt) => now - createdAt <= FAILED_PAYMENT_WINDOW_MS);
  recentAttempts.push(now);
  failedPaymentAttempts.set(key, recentAttempts);

  if (recentAttempts.length >= FAILED_PAYMENT_SIGNAL_THRESHOLD) {
    await createInternalRiskSignal({
      targetId: params.checkoutId,
      targetType: 'CHECKOUT',
      type: 'PAYMENT_ANOMALY',
      level: 'HIGH',
      source: 'PAYMENT_SIGNAL',
      reasonCode: 'PAYMENT_ANOMALY',
      metadata: {
        actorId: params.actorId,
        actorType: params.actorType,
        checkoutId: params.checkoutId,
        reason: 'REPEATED_FAILED_PAYMENT_ATTEMPT',
        lastFailureReason: params.reason,
        attemptCount: recentAttempts.length,
        windowMs: FAILED_PAYMENT_WINDOW_MS,
        paymentTruthMutated: false,
      },
      correlationId: randomUUID(),
    });
  }
}

export async function getPayment(paymentId: string): Promise<PaymentInitiationResponse | undefined> {
  return getPaymentRepository().getById(paymentId);
}

export async function simulatePaymentSuccess(
  paymentAttemptId: string,
): Promise<SimulatePaymentSuccessResponse> {
  const repo = getPaymentRepository();
  const found = await repo.getByPaymentAttemptId(paymentAttemptId);

  if (!found) {
    return {
      paymentId: '',
      paymentAttemptId,
      state: 'FAILED',
      attemptState: 'INITIATION_FAILED',
      errors: ['PAYMENT_NOT_FOUND'],
    };
  }

  if (found.state === 'SUCCEEDED') {
    return {
      paymentId: found.paymentId,
      paymentAttemptId,
      state: found.state,
      attemptState: found.attempt.state,
      errors: [],
    };
  }

  // Update state to SUCCEEDED
  found.state = 'SUCCEEDED';
  found.attempt.state = 'SUCCEEDED';
  await repo.save(found);

  const errors: string[] = [];
  try {
    const auditEvent = getAuditEventRepositories();
    await auditEvent.audit.appendAuditLog({
      actorType: 'SYSTEM',
      actorId: 'payment-simulator',
      actionType: 'payment.succeeded',
      ownerService: 'payment',
      entityType: 'payment',
      entityId: found.paymentId,
      beforeState: { state: 'INITIATED', attemptState: 'PROVIDER_REDIRECT_READY' },
      afterState: found,
      correlationId: found.paymentId,
      metadata: {
        paymentAttemptId,
        orderCreated: false,
      },
    });
    await auditEvent.outbox.appendOutboxEvent({
      topic: 'payment.succeeded',
      payloadSchema: 'payment.succeeded.v1',
      payload: {
        paymentId: found.paymentId,
        paymentAttemptId,
        checkoutId: found.checkoutId,
        state: found.state,
        orderCreated: false,
      },
      ownerService: 'payment',
      entityType: 'payment',
      entityId: found.paymentId,
      idempotencyKey: `payment-success:${paymentAttemptId}`,
      correlationId: found.paymentId,
    });
  } catch (error) {
    errors.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
  }

  return {
    paymentId: found.paymentId,
    paymentAttemptId,
    state: found.state,
    attemptState: found.attempt.state,
    errors,
  };
}

export async function initiatePayment(
  command: InitiatePaymentCommand,
): Promise<PaymentInitiationResponse> {
  const {
    checkoutId,
    paymentMethod,
    idempotencyKey: initialIdempotencyKey,
  } = command;

  const idempotencyKey =
    initialIdempotencyKey || `${checkoutId}-${randomUUID()}`;

  const repo = getPaymentRepository();
  const existing = await repo.getByIdempotencyKey('payment', idempotencyKey);
  if (existing) {
    return existing;
  }

  const errors: string[] = [];
  const checkout = await getCheckoutReview(checkoutId);

  if (!checkout) {
    const failedResponse: PaymentInitiationResponse = {
      paymentId: randomUUID(),
      checkoutId,
      cartContext: command.cartContext,
      state: 'FAILED',
      attempt: {
        paymentAttemptId: randomUUID(),
        checkoutId,
        amount: 0,
        currency: 'TRY',
        method: paymentMethod,
        state: 'INITIATION_FAILED',
        idempotencyKey,
      },
      errors: ['CHECKOUT_NOT_FOUND'],
      warnings: [],
    };
    await repo.saveWithIdempotency('payment', idempotencyKey, failedResponse);
    try {
      const auditEvent = getAuditEventRepositories();
      await auditEvent.audit.appendAuditLog({
        actorType: command.cartContext.actorType,
        actorId: command.cartContext.actorId,
        actionType: 'payment.initiation_failed',
        ownerService: 'payment',
        entityType: 'payment',
        entityId: failedResponse.paymentId,
        afterState: failedResponse,
        reason: 'CHECKOUT_NOT_FOUND',
        idempotencyKey,
        correlationId: failedResponse.paymentId,
        metadata: {
          checkoutId,
          paymentAttemptId: failedResponse.attempt.paymentAttemptId,
          orderCreated: false,
        },
      });
      await auditEvent.outbox.appendOutboxEvent({
        topic: 'payment.initiation_failed',
        payloadSchema: 'payment.initiation_failed.v1',
        payload: {
          paymentId: failedResponse.paymentId,
          paymentAttemptId: failedResponse.attempt.paymentAttemptId,
          checkoutId,
          state: failedResponse.state,
          errors: failedResponse.errors,
          orderCreated: false,
        },
        ownerService: 'payment',
        entityType: 'payment',
        entityId: failedResponse.paymentId,
        idempotencyKey: `event:${idempotencyKey}`,
        correlationId: failedResponse.paymentId,
      });
    } catch (error) {
      failedResponse.warnings.push(
        'AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE'
      );
    }
    return failedResponse;
  }

  if (checkout.state !== 'REVIEW_READY' || checkout.validationState !== 'VALID') {
    console.log(
      `Payment check warning: state=${checkout.state}, validation=${checkout.validationState}`
    );
  }

  if (checkout.cartContext.actorId !== command.cartContext.actorId) {
    await createInternalRiskSignal({
      targetId: checkoutId,
      targetType: 'CHECKOUT',
      type: 'PAYMENT_ANOMALY',
      level: 'HIGH',
      source: 'PAYMENT_SIGNAL',
      reasonCode: 'PAYMENT_ANOMALY',
      metadata: {
        checkoutOwner: checkout.cartContext.actorId,
        paymentActor: command.cartContext.actorId,
        reason: 'CHECKOUT_OWNER_MISMATCH',
      },
      correlationId: randomUUID(),
    });
  }

  const calculatedAmount = checkout.summary.grandTotal || 100;
  const calculatedCurrency = checkout.summary.currency || 'TRY';

  if (command.amount !== undefined && command.amount !== calculatedAmount) {
    await createInternalRiskSignal({
      targetId: checkoutId,
      targetType: 'CHECKOUT',
      type: 'PAYMENT_ANOMALY',
      level: 'CRITICAL',
      source: 'PAYMENT_SIGNAL',
      reasonCode: 'PAYMENT_ANOMALY',
      metadata: {
        clientAmount: command.amount,
        calculatedAmount,
        reason: 'CLIENT_AMOUNT_SPOOF_ATTEMPT',
      },
      correlationId: randomUUID(),
    });
  }

  if (
    command.currency !== undefined &&
    command.currency !== calculatedCurrency
  ) {
    await createInternalRiskSignal({
      targetId: checkoutId,
      targetType: 'CHECKOUT',
      type: 'PAYMENT_ANOMALY',
      level: command.currency === 'TRY' ? 'MEDIUM' : 'HIGH',
      source: 'PAYMENT_SIGNAL',
      reasonCode: 'PAYMENT_ANOMALY',
      metadata: {
        clientCurrency: command.currency,
        calculatedCurrency,
        reason: 'CLIENT_CURRENCY_SPOOF_ATTEMPT',
        paymentTruthMutated: false,
      },
      correlationId: randomUUID(),
    });
  }

  const amount = calculatedAmount;
  const currency = calculatedCurrency;

  const clientAmount = command.amount !== undefined ? command.amount : amount;

  if (clientAmount <= 0) {
    errors.push('INVALID_AMOUNT');
    await createInternalRiskSignal({
      targetId: checkoutId,
      targetType: 'CHECKOUT',
      type: 'PAYMENT_ANOMALY',
      level: 'MEDIUM',
      source: 'PAYMENT_SIGNAL',
      reasonCode: 'PAYMENT_ANOMALY',
      metadata: { amount: clientAmount, checkoutId, error: 'INVALID_AMOUNT' },
      correlationId: randomUUID(),
    });
    await recordFailedPaymentPattern({
      checkoutId,
      actorId: command.cartContext.actorId,
      actorType: command.cartContext.actorType,
      reason: 'INVALID_AMOUNT',
    });
  }
  if (command.currency !== undefined && command.currency !== 'TRY') {
    errors.push('UNSUPPORTED_CURRENCY');
    await createInternalRiskSignal({
      targetId: checkoutId,
      targetType: 'CHECKOUT',
      type: 'PAYMENT_ANOMALY',
      level: 'LOW',
      source: 'PAYMENT_SIGNAL',
      reasonCode: 'PAYMENT_ANOMALY',
      metadata: {
        currency: command.currency,
        checkoutId,
        error: 'UNSUPPORTED_CURRENCY',
      },
      correlationId: randomUUID(),
    });
    await recordFailedPaymentPattern({
      checkoutId,
      actorId: command.cartContext.actorId,
      actorType: command.cartContext.actorType,
      reason: 'UNSUPPORTED_CURRENCY',
    });
  }

  const paymentId = randomUUID();
  const adapter = getPaymentProviderAdapter();
  const providerResult = await adapter.initiatePayment({
    amount,
    currency,
    checkoutId,
    idempotencyKey,
    correlationId: paymentId,
    simulationScenario: command.simulationScenario, // HARDENING-09C
  });

  const response: PaymentInitiationResponse = {
    paymentId,
    checkoutId,
    cartContext: command.cartContext,
    state: 'INITIATED',
    attempt: {
      paymentAttemptId:
        providerResult.normalized?.paymentAttemptId || randomUUID(),
      checkoutId,
      amount,
      currency,
      method: paymentMethod,
      state: 'PROVIDER_REDIRECT_READY',
      providerSimulationRef: providerResult.providerReference,
      idempotencyKey,
    },
    redirectUrl: providerResult.normalized?.redirectUrl,
    errors: [],
    warnings: [],
    providerEnvelope: providerResult as any, 
  };

  await repo.saveWithIdempotency('payment', idempotencyKey, response);

  try {
    const auditEvent = getAuditEventRepositories();
    await auditEvent.audit.appendAuditLog({
      actorType: command.cartContext.actorType,
      actorId: command.cartContext.actorId,
      actionType: 'payment.initiated',
      ownerService: 'payment',
      entityType: 'payment',
      entityId: paymentId,
      afterState: response,
      idempotencyKey,
      correlationId: paymentId,
      metadata: {
        checkoutId,
        paymentAttemptId: response.attempt.paymentAttemptId,
        orderCreated: false,
        provider: {
          name: providerResult.providerName,
          mode: providerResult.providerMode,
          reference: providerResult.providerReference,
        },
      },
    });
    await auditEvent.outbox.appendOutboxEvent({
      topic: 'payment.initiated',
      payloadSchema: 'payment.initiated.v1',
      payload: {
        paymentId,
        paymentAttemptId: response.attempt.paymentAttemptId,
        checkoutId,
        state: response.state,
        orderCreated: false,
      },
      ownerService: 'payment',
      entityType: 'payment',
      entityId: paymentId,
      idempotencyKey: `event:${idempotencyKey}`,
      correlationId: paymentId,
    });
  } catch (error) {
    response.warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
  }

  return response;
}

export async function simulateProviderRefund(
  input: ProviderRefundSimulationInput,
): Promise<ProviderRefundSimulationResult> {
  const { paymentId, amount, currency } = input;

  const payment = await getPayment(paymentId);

  if (!payment) {
    return {
      success: false,
      error: 'PAYMENT_NOT_FOUND',
      simulationOnly: true,
      actualProviderRefundPerformed: false,
    };
  }

  if (payment.state !== 'SUCCEEDED') {
    return {
      success: false,
      error: 'PAYMENT_NOT_REFUNDABLE',
      simulationOnly: true,
      actualProviderRefundPerformed: false,
    };
  }

  if (amount <= 0) {
    return {
      success: false,
      error: 'INVALID_REFUND_AMOUNT',
      simulationOnly: true,
      actualProviderRefundPerformed: false,
    };
  }

  if (payment.attempt.currency !== currency) {
    return {
      success: false,
      error: 'REFUND_CURRENCY_MISMATCH',
      simulationOnly: true,
      actualProviderRefundPerformed: false,
    };
  }

  // Simulation success
  return {
    success: true,
    providerRefundReference: `ref_sim_${randomUUID()}`,
    simulationOnly: true,
    actualProviderRefundPerformed: false,
  };
}
