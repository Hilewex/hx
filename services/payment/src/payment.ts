import {
  InitiatePaymentCommand,
  PaymentAttemptState,
  PaymentInitiationResponse,
  PaymentState,
  SimulatePaymentSuccessResponse,
  ProviderRefundSimulationInput,
  ProviderRefundSimulationResult,
  ProviderResultEnvelope,
} from '@hx/contracts';
import { PaymentCallbackOwnerCommand } from '../../../packages/contracts/src/payment';
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

function createRejectedPaymentInitiationResponse(input: {
  readonly checkoutId: string;
  readonly command: InitiatePaymentCommand;
  readonly idempotencyKey: string;
  readonly errors: string[];
  readonly amount?: number;
  readonly currency?: string;
}): PaymentInitiationResponse {
  return {
    paymentId: '',
    checkoutId: input.checkoutId,
    cartContext: input.command.cartContext,
    state: 'FAILED',
    attempt: {
      paymentAttemptId: '',
      checkoutId: input.checkoutId,
      amount: input.amount ?? 0,
      currency: input.currency ?? 'TRY',
      method: input.command.paymentMethod,
      state: 'INITIATION_FAILED',
      idempotencyKey: input.idempotencyKey,
    },
    errors: input.errors,
    warnings: [],
  };
}

function validateCheckoutPaymentReadiness(
  checkout: NonNullable<Awaited<ReturnType<typeof getCheckoutReview>>>,
): string[] {
  const errors: string[] = [];

  if (checkout.state !== 'REVIEW_READY' || checkout.validationState !== 'VALID') {
    errors.push('CHECKOUT_NOT_READY');
  }

  if (!Number.isFinite(checkout.summary.grandTotal) || checkout.summary.grandTotal <= 0) {
    errors.push('CHECKOUT_AMOUNT_INVALID');
  }

  if (!checkout.summary.currency || checkout.summary.currency.trim().length === 0) {
    errors.push('CHECKOUT_CURRENCY_INVALID');
  }

  const hasBlockingLine = checkout.lines.some(
    (line) => line.validationState !== 'VALID' || line.errors.length > 0,
  );
  if (hasBlockingLine && !errors.includes('CHECKOUT_NOT_READY')) {
    errors.push('CHECKOUT_NOT_READY');
  }

  return errors;
}

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

export interface ApplyPaymentCallbackOwnerCommandResult {
  readonly paymentId: string;
  readonly paymentAttemptId: string;
  readonly previousState: PaymentState;
  readonly nextState: PaymentState;
  readonly previousAttemptState: PaymentAttemptState;
  readonly nextAttemptState: PaymentAttemptState;
  readonly idempotencyKey: string;
  readonly applied: boolean;
  readonly alreadyApplied: boolean;
  readonly ignored: boolean;
  readonly errors: string[];
  readonly warnings: string[];
}

function emptyOwnerCommandResult(input: {
  readonly command: PaymentCallbackOwnerCommand;
  readonly errors?: string[];
  readonly warnings?: string[];
}): ApplyPaymentCallbackOwnerCommandResult {
  return {
    paymentId: input.command.paymentId ?? '',
    paymentAttemptId: input.command.paymentAttemptId,
    previousState: 'UNKNOWN_RESULT',
    nextState: 'UNKNOWN_RESULT',
    previousAttemptState: 'UNKNOWN_RESULT',
    nextAttemptState: 'UNKNOWN_RESULT',
    idempotencyKey: input.command.idempotencyKey,
    applied: false,
    alreadyApplied: false,
    ignored: true,
    errors: input.errors ?? [],
    warnings: input.warnings ?? [],
  };
}

function resolveOwnerCommandTargetState(
  commandType: PaymentCallbackOwnerCommand['commandType'],
): { state: PaymentState; attemptState: PaymentAttemptState } | undefined {
  switch (commandType) {
    case 'MARK_PAYMENT_SUCCEEDED':
      return { state: 'SUCCEEDED', attemptState: 'SUCCEEDED' };
    case 'MARK_PAYMENT_FAILED':
      return { state: 'FAILED', attemptState: 'FAILED' };
    default:
      return undefined;
  }
}

function isTerminalPaymentState(state: PaymentState): boolean {
  return state === 'SUCCEEDED' || state === 'FAILED' || state === 'CANCELLED';
}

function hasTerminalStateConflict(input: {
  readonly previousState: PaymentState;
  readonly targetState: PaymentState;
}): boolean {
  return (
    isTerminalPaymentState(input.previousState) &&
    input.previousState !== input.targetState
  );
}

export async function applyPaymentCallbackOwnerCommand(
  command: PaymentCallbackOwnerCommand,
): Promise<ApplyPaymentCallbackOwnerCommandResult> {
  if (
    (command.source as string) === 'reconciliation_worker' &&
    command.commandType !== 'MARK_PAYMENT_SUCCEEDED'
  ) {
    return emptyOwnerCommandResult({
      command,
      errors: ['RECONCILIATION_OWNER_COMMAND_TYPE_NOT_SUPPORTED'],
    });
  }

  const target = resolveOwnerCommandTargetState(command.commandType);
  if (!target) {
    return emptyOwnerCommandResult({
      command,
      errors: ['OWNER_COMMAND_TYPE_NOT_SUPPORTED'],
    });
  }

  const repo = getPaymentRepository();
  const foundByAttempt = await repo.getByPaymentAttemptId(command.paymentAttemptId);
  const foundByProviderReference =
    !foundByAttempt && command.providerReference
      ? await repo.getByProviderReference(command.providerName, command.providerReference)
      : undefined;
  const found = foundByAttempt ?? foundByProviderReference;

  if (!found) {
    return emptyOwnerCommandResult({
      command,
      errors: ['PAYMENT_NOT_FOUND'],
    });
  }

  if (command.paymentId && command.paymentId !== found.paymentId) {
    return emptyOwnerCommandResult({
      command,
      errors: ['PAYMENT_ID_MISMATCH'],
    });
  }

  if (command.checkoutId && command.checkoutId !== found.checkoutId) {
    return emptyOwnerCommandResult({
      command,
      errors: ['CHECKOUT_ID_MISMATCH'],
    });
  }

  const previousState = found.state;
  const previousAttemptState = found.attempt.state;
  const alreadyApplied =
    previousState === target.state &&
    previousAttemptState === target.attemptState &&
    found.attempt.lastCallbackStatus === command.normalizedStatus;

  if (alreadyApplied) {
    return {
      paymentId: found.paymentId,
      paymentAttemptId: found.attempt.paymentAttemptId,
      previousState,
      nextState: found.state,
      previousAttemptState,
      nextAttemptState: found.attempt.state,
      idempotencyKey: command.idempotencyKey,
      applied: false,
      alreadyApplied: true,
      ignored: false,
      errors: [],
      warnings: [],
    };
  }

  if (hasTerminalStateConflict({ previousState, targetState: target.state })) {
    return {
      paymentId: found.paymentId,
      paymentAttemptId: found.attempt.paymentAttemptId,
      previousState,
      nextState: found.state,
      previousAttemptState,
      nextAttemptState: found.attempt.state,
      idempotencyKey: command.idempotencyKey,
      applied: false,
      alreadyApplied: false,
      ignored: true,
      errors: ['PAYMENT_TERMINAL_STATE_CONFLICT'],
      warnings: [],
    };
  }

  found.state = target.state;
  found.attempt.state = target.attemptState;
  found.attempt.callbackRecordId = command.callbackRecordId;
  found.attempt.lastCallbackAt = command.occurredAt;
  found.attempt.lastCallbackStatus = command.normalizedStatus;
  if (command.providerReference && !found.attempt.providerReference) {
    found.attempt.providerReference = command.providerReference;
  }
  if (command.providerEventId && !found.attempt.providerEventId) {
    found.attempt.providerEventId = command.providerEventId;
  }

  await repo.save(found);

  return {
    paymentId: found.paymentId,
    paymentAttemptId: found.attempt.paymentAttemptId,
    previousState,
    nextState: found.state,
    previousAttemptState,
    nextAttemptState: found.attempt.state,
    idempotencyKey: command.idempotencyKey,
    applied: true,
    alreadyApplied: false,
    ignored: false,
    errors: [],
    warnings: [],
  };
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
    return createRejectedPaymentInitiationResponse({
      checkoutId,
      errors: ['CHECKOUT_NOT_FOUND'],
      command,
      idempotencyKey,
    });
  }

  const readinessErrors = validateCheckoutPaymentReadiness(checkout);
  if (readinessErrors.length > 0) {
    return createRejectedPaymentInitiationResponse({
      checkoutId,
      command,
      idempotencyKey,
      errors: readinessErrors,
      amount: checkout.summary.grandTotal,
      currency: checkout.summary.currency,
    });
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
      providerName: providerResult.providerName,
      ...(providerResult.providerReference
        ? {
            providerReference: providerResult.providerReference,
            providerEventId: providerResult.providerReference,
          }
        : {}),
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
