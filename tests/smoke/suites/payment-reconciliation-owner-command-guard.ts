import { deepStrictEqual, ok, strictEqual } from 'node:assert';
import {
  createPaymentReconciliationOwnerCommand,
  createPaymentReconciliationTaskCandidate,
  decidePaymentReconciliationAction,
  decidePaymentReconciliationOwnerCommandEligibility,
  mapPaytrStatusInquiryToReconciliationCandidate,
  NormalizedPaytrStatusInquiryCandidate,
  PaymentCallbackOwnerCommand,
  PaymentInitiationResponse,
  PaymentReconciliationDecision,
  PaymentReconciliationTaskCandidate,
  PaytrStatusInquiryErrorResponse,
  PaytrStatusInquirySuccessResponse,
} from '../../../packages/contracts/src/payment';
import { createProviderBoundaryFlags } from '../../../packages/contracts/src/provider';
import { InMemoryPaymentReconciliationTaskRepository } from '../../../packages/persistence/src/payment-reconciliation-task';
import { applyPaymentCallbackOwnerCommand } from '../../../services/payment/src/payment';
import { getPaymentProviderAdapter } from '../../../services/payment/src/provider-adapter';
import { processPaymentReconciliationTaskDryRun } from '../../../services/payment/src/reconciliation-worker';
import { getPaymentRepository, resetPaymentRepository } from '../../../services/payment/src/repository';
import { SmokeResult, SmokeRunner } from '../types';

const ENV_KEYS = [
  'PAYMENT_PROVIDER_NAME',
  'PAYMENT_PROVIDER_MODE',
  'PAYTR_PROVIDER_MODE',
  'PAYTR_MERCHANT_ID',
  'PAYTR_MERCHANT_KEY',
  'PAYTR_MERCHANT_SALT',
] as const;

function withProviderEnv<T>(
  env: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>,
  fn: () => Promise<T>,
): Promise<T> {
  const previous = new Map<(typeof ENV_KEYS)[number], string | undefined>();
  for (const key of ENV_KEYS) {
    previous.set(key, process.env[key]);
    const nextValue = env[key];
    if (nextValue === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = nextValue;
    }
  }

  return fn().finally(() => {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });
}

function createTask(input: {
  readonly reconciliationRef?: string;
  readonly providerReference?: string;
  readonly paymentAttemptId?: string;
  readonly triggerReason?: PaymentReconciliationTaskCandidate['triggerReason'];
} = {}): PaymentReconciliationTaskCandidate {
  const hasPaymentAttemptId = Object.prototype.hasOwnProperty.call(input, 'paymentAttemptId');

  return createPaymentReconciliationTaskCandidate({
    reconciliationRef: input.reconciliationRef ?? 'reconciliation-guard',
    paymentId: 'payment-guard',
    ...(hasPaymentAttemptId
      ? { paymentAttemptId: input.paymentAttemptId }
      : { paymentAttemptId: 'attempt-guard' }),
    checkoutId: 'checkout-guard',
    providerName: 'paytr',
    providerReference: input.providerReference ?? 'oid-guard',
    merchantOid: input.providerReference ?? 'oid-guard',
    triggerReason: input.triggerReason ?? 'callback_requires_reconciliation',
    status: 'reconciliation_required',
    attemptCount: 0,
    maxAttempts: 3,
    manualReviewRequired: false,
    createdAt: new Date('2026-05-07T00:00:00.000Z'),
  });
}

function createCandidate(
  response: PaytrStatusInquirySuccessResponse | PaytrStatusInquiryErrorResponse,
  expectedAmountMinor = 10000,
  expectedCurrency = 'TRY',
): NormalizedPaytrStatusInquiryCandidate {
  return mapPaytrStatusInquiryToReconciliationCandidate({
    merchantOid: 'oid-guard',
    expectedAmountMinor,
    expectedCurrency,
    response,
    occurredAt: new Date('2026-05-07T00:00:00.000Z'),
    inquiryRef: `inquiry-${response.status}`,
  });
}

function decide(
  task: PaymentReconciliationTaskCandidate,
  candidate?: NormalizedPaytrStatusInquiryCandidate,
): PaymentReconciliationDecision {
  return decidePaymentReconciliationAction({
    currentStatus: task.status,
    triggerReason: task.triggerReason,
    statusInquiryCandidate: candidate,
    attemptCount: task.attemptCount,
    maxAttempts: task.maxAttempts,
    now: new Date('2026-05-07T00:00:00.000Z'),
  });
}

function createPayment(overrides: Partial<PaymentInitiationResponse> = {}): PaymentInitiationResponse {
  return {
    paymentId: 'payment-guard',
    checkoutId: 'checkout-guard',
    cartContext: { actorType: 'CUSTOMER', actorId: 'customer-guard' },
    state: 'INITIATED',
    attempt: {
      paymentAttemptId: 'attempt-guard',
      checkoutId: 'checkout-guard',
      amount: 10000,
      currency: 'TRY',
      method: 'CARD',
      state: 'PROVIDER_REDIRECT_READY',
      providerName: 'paytr',
      providerReference: 'oid-guard',
      idempotencyKey: 'payment-guard-idempotency',
    },
    errors: [],
    warnings: [],
    ...overrides,
    attempt: {
      paymentAttemptId: 'attempt-guard',
      checkoutId: 'checkout-guard',
      amount: 10000,
      currency: 'TRY',
      method: 'CARD',
      state: 'PROVIDER_REDIRECT_READY',
      providerName: 'paytr',
      providerReference: 'oid-guard',
      idempotencyKey: 'payment-guard-idempotency',
      ...overrides.attempt,
    },
  };
}

function assertNoExternalMutationShape(value: object): void {
  strictEqual('orderStatus' in value, false);
  strictEqual('orderId' in value, false);
  strictEqual('settlementStatus' in value, false);
  strictEqual('payoutStatus' in value, false);
  strictEqual('riskStatus' in value, false);
  strictEqual('financeStatus' in value, false);
}

const runTest = async (): Promise<{ result: SmokeResult; message: string }> => {
  const originalPersistenceMode = process.env.PERSISTENCE_MODE;

  try {
    const boundary = createProviderBoundaryFlags();
    const successCandidate = createCandidate({
      status: 'success',
      payment_amount: '100.00',
      payment_total: '100.00',
      returns: {},
      currency: 'TRY',
    });
    const successTask = createTask();
    const successDecision = decide(successTask, successCandidate);
    const ready = decidePaymentReconciliationOwnerCommandEligibility({
      decision: successDecision,
      task: successTask,
      candidate: successCandidate,
      reconciliationRef: 'reconciliation-guard',
    });

    strictEqual(ready.status, 'command_ready');
    strictEqual(ready.commandType, 'MARK_PAYMENT_SUCCEEDED');
    strictEqual(ready.shouldProcessPaymentMutation, true);
    deepStrictEqual(ready.boundary, boundary);

    const command = createPaymentReconciliationOwnerCommand({
      eligibility: ready,
      occurredAt: new Date('2026-05-07T00:00:00.000Z'),
    });
    ok(command);
    strictEqual(command.commandType, 'MARK_PAYMENT_SUCCEEDED');
    strictEqual(command.source, 'reconciliation_worker');
    strictEqual(
      command.idempotencyKey,
      'payment-reconciliation:paytr:reconciliation-guard:attempt-guard:MARK_PAYMENT_SUCCEEDED',
    );
    deepStrictEqual(command.boundary, boundary);
    assertNoExternalMutationShape(command);

    const missingAttemptTask = createTask({ paymentAttemptId: undefined });
    const missingAttemptEligibility = decidePaymentReconciliationOwnerCommandEligibility({
      decision: decide(missingAttemptTask, successCandidate),
      task: missingAttemptTask,
      candidate: successCandidate,
    });
    strictEqual(missingAttemptEligibility.status, 'not_eligible');
    strictEqual(missingAttemptEligibility.shouldProcessPaymentMutation, false);
    strictEqual(createPaymentReconciliationOwnerCommand({ eligibility: missingAttemptEligibility }), undefined);

    const amountMismatch = createCandidate({
      status: 'success',
      payment_amount: '99.00',
      payment_total: '99.00',
      returns: {},
      currency: 'TRY',
    });
    const amountMismatchEligibility = decidePaymentReconciliationOwnerCommandEligibility({
      decision: decide(createTask({ triggerReason: 'amount_mismatch' }), amountMismatch),
      task: createTask({ triggerReason: 'amount_mismatch' }),
      candidate: amountMismatch,
    });
    strictEqual(amountMismatchEligibility.status, 'requires_manual_review');
    strictEqual(amountMismatchEligibility.shouldProcessPaymentMutation, false);
    strictEqual(createPaymentReconciliationOwnerCommand({ eligibility: amountMismatchEligibility }), undefined);

    const currencyMismatch = createCandidate(
      {
        status: 'success',
        payment_amount: '100.00',
        payment_total: '100.00',
        returns: {},
        currency: 'USD',
      },
      10000,
      'TRY',
    );
    const currencyMismatchEligibility = decidePaymentReconciliationOwnerCommandEligibility({
      decision: decide(createTask({ triggerReason: 'currency_mismatch' }), currencyMismatch),
      task: createTask({ triggerReason: 'currency_mismatch' }),
      candidate: currencyMismatch,
    });
    strictEqual(currencyMismatchEligibility.status, 'requires_manual_review');
    strictEqual(createPaymentReconciliationOwnerCommand({ eligibility: currencyMismatchEligibility }), undefined);

    const inconclusive = createCandidate({
      status: 'error',
      err_no: '003',
      err_msg: 'merchant_oid ile basarili odeme bulunamadi',
    });
    const inconclusiveEligibility = decidePaymentReconciliationOwnerCommandEligibility({
      decision: decide(createTask({ triggerReason: 'status_query_inconclusive' }), inconclusive),
      task: createTask({ triggerReason: 'status_query_inconclusive' }),
      candidate: inconclusive,
    });
    strictEqual(inconclusiveEligibility.status, 'requires_retry');
    strictEqual(createPaymentReconciliationOwnerCommand({ eligibility: inconclusiveEligibility }), undefined);

    const failed = createCandidate({
      status: 'error',
      err_no: '999',
      err_msg: 'temporary provider failure',
    });
    const failedEligibility = decidePaymentReconciliationOwnerCommandEligibility({
      decision: decide(createTask({ triggerReason: 'status_query_failed' }), failed),
      task: createTask({ triggerReason: 'status_query_failed' }),
      candidate: failed,
    });
    strictEqual(failedEligibility.status, 'requires_retry');
    strictEqual(createPaymentReconciliationOwnerCommand({ eligibility: failedEligibility }), undefined);

    const terminalConflictTask = createTask({ triggerReason: 'terminal_conflict' });
    const terminalConflictEligibility = decidePaymentReconciliationOwnerCommandEligibility({
      decision: decide(terminalConflictTask),
      task: terminalConflictTask,
    });
    strictEqual(terminalConflictEligibility.status, 'requires_manual_review');
    strictEqual(createPaymentReconciliationOwnerCommand({ eligibility: terminalConflictEligibility }), undefined);

    await withProviderEnv(
      {
        PAYMENT_PROVIDER_NAME: 'internal_simulation',
        PAYMENT_PROVIDER_MODE: 'simulation',
        PAYTR_PROVIDER_MODE: undefined,
        PAYTR_MERCHANT_ID: undefined,
        PAYTR_MERCHANT_KEY: undefined,
        PAYTR_MERCHANT_SALT: undefined,
      },
      async () => {
        const repository = new InMemoryPaymentReconciliationTaskRepository();
        const task = await repository.createTask(successTask);
        const workerResult = await processPaymentReconciliationTaskDryRun({
          task,
          repository,
          providerAdapter: getPaymentProviderAdapter(),
          now: new Date('2026-05-07T00:00:00.000Z'),
          expectedAmountMinor: 10000,
          expectedCurrency: 'TRY',
          simulationResponse: {
            status: 'success',
            payment_amount: '100.00',
            payment_total: '100.00',
            returns: {},
            currency: 'TRY',
          },
        });

        strictEqual(workerResult.dryRun, true);
        strictEqual(workerResult.mutationApplied, false);
        strictEqual(workerResult.ownerCommandEligibility.status, 'command_ready');
        strictEqual(workerResult.ownerCommandCandidate?.commandType, 'MARK_PAYMENT_SUCCEEDED');
        strictEqual(workerResult.ownerCommandCandidate?.idempotencyKey, command.idempotencyKey);
        strictEqual(workerResult.ownerCommandCandidate?.providerName, command.providerName);
        strictEqual(workerResult.ownerCommandCandidate?.providerReference, command.providerReference);
        strictEqual(workerResult.ownerCommandCandidate?.paymentAttemptId, command.paymentAttemptId);
        strictEqual(workerResult.ownerCommandCandidate?.paymentId, command.paymentId);
        strictEqual(workerResult.ownerCommandCandidate?.checkoutId, command.checkoutId);
        strictEqual(workerResult.ownerCommandCandidate?.callbackRecordId, command.callbackRecordId);
        assertNoExternalMutationShape(workerResult);
      },
    );

    process.env.PERSISTENCE_MODE = 'memory';
    resetPaymentRepository();
    const paymentRepository = getPaymentRepository();
    await paymentRepository.save(createPayment());
    const applied = await applyPaymentCallbackOwnerCommand(command);
    strictEqual(applied.applied, true);
    strictEqual(applied.nextState, 'SUCCEEDED');
    const duplicate = await applyPaymentCallbackOwnerCommand(command);
    strictEqual(duplicate.alreadyApplied, true);
    strictEqual(duplicate.applied, false);

    resetPaymentRepository();
    const conflictRepository = getPaymentRepository();
    await conflictRepository.save(createPayment({
      state: 'FAILED',
      attempt: {
        paymentAttemptId: 'attempt-guard',
        checkoutId: 'checkout-guard',
        amount: 10000,
        currency: 'TRY',
        method: 'CARD',
        state: 'FAILED',
        providerName: 'paytr',
        providerReference: 'oid-guard',
        idempotencyKey: 'payment-guard-idempotency',
      },
    }));
    const conflict = await applyPaymentCallbackOwnerCommand(command);
    const failedAfterConflict = await conflictRepository.getById('payment-guard');
    strictEqual(conflict.applied, false);
    strictEqual(conflict.ignored, true);
    ok(conflict.errors.includes('PAYMENT_TERMINAL_STATE_CONFLICT'));
    strictEqual(failedAfterConflict?.state, 'FAILED');
    strictEqual(failedAfterConflict?.attempt.state, 'FAILED');

    resetPaymentRepository();
    const cancelledRepository = getPaymentRepository();
    await cancelledRepository.save(createPayment({
      state: 'CANCELLED',
      attempt: {
        paymentAttemptId: 'attempt-guard',
        checkoutId: 'checkout-guard',
        amount: 10000,
        currency: 'TRY',
        method: 'CARD',
        state: 'CANCELLED',
        providerName: 'paytr',
        providerReference: 'oid-guard',
        idempotencyKey: 'payment-guard-idempotency',
      },
    }));
    const cancelledConflict = await applyPaymentCallbackOwnerCommand(command);
    const cancelledAfterConflict = await cancelledRepository.getById('payment-guard');
    strictEqual(cancelledConflict.applied, false);
    strictEqual(cancelledConflict.ignored, true);
    ok(cancelledConflict.errors.includes('PAYMENT_TERMINAL_STATE_CONFLICT'));
    strictEqual(cancelledAfterConflict?.state, 'CANCELLED');
    strictEqual(cancelledAfterConflict?.attempt.state, 'CANCELLED');

    const rejectedCommand: PaymentCallbackOwnerCommand = {
      ...command,
      commandType: 'MARK_PAYMENT_FAILED',
      normalizedStatus: 'failed',
      idempotencyKey: 'payment-reconciliation:paytr:reconciliation-guard:attempt-guard:MARK_PAYMENT_FAILED',
    };
    const rejected = await applyPaymentCallbackOwnerCommand(rejectedCommand);
    strictEqual(rejected.applied, false);
    strictEqual(rejected.ignored, true);
    deepStrictEqual(rejected.errors, ['RECONCILIATION_OWNER_COMMAND_TYPE_NOT_SUPPORTED']);

    return {
      result: 'PASS',
      message:
        'Payment reconciliation owner command guard assertions passed with dry-run default and guarded succeeded-only command creation.',
    };
  } catch (error) {
    return { result: 'FAIL', message: (error as Error).stack || (error as Error).message };
  } finally {
    resetPaymentRepository();
    if (originalPersistenceMode === undefined) {
      delete process.env.PERSISTENCE_MODE;
    } else {
      process.env.PERSISTENCE_MODE = originalPersistenceMode;
    }
  }
};

export const paymentReconciliationOwnerCommandGuardSmoke: SmokeRunner = {
  name: 'payment-reconciliation-owner-command-guard',
  run: async () => runTest(),
};
