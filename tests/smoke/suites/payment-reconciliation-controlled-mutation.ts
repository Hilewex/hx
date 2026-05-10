import { deepStrictEqual, ok, strictEqual } from 'node:assert';
import {
  createPaymentReconciliationTaskCandidate,
  PaymentAttemptState,
  PaymentInitiationResponse,
  PaymentReconciliationTaskCandidate,
  PaymentState,
  PaytrStatusInquiryErrorResponse,
  PaytrStatusInquirySuccessResponse,
} from '../../../packages/contracts/src/payment';
import { InMemoryPaymentReconciliationTaskRepository } from '../../../packages/persistence/src/payment-reconciliation-task';
import { getPaymentProviderAdapter } from '../../../services/payment/src/provider-adapter';
import {
  processPaymentReconciliationTaskControlledMutation,
  processPaymentReconciliationTaskDryRun,
} from '../../../services/payment/src/reconciliation-worker';
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

function successResponse(input: {
  readonly amount?: string;
  readonly total?: string;
  readonly currency?: string;
} = {}): PaytrStatusInquirySuccessResponse {
  return {
    status: 'success',
    payment_amount: input.amount ?? '100.00',
    payment_total: input.total ?? input.amount ?? '100.00',
    returns: {},
    currency: input.currency ?? 'TRY',
  };
}

function errorResponse(kind: 'inconclusive' | 'failed'): PaytrStatusInquiryErrorResponse {
  if (kind === 'inconclusive') {
    return {
      status: 'error',
      err_no: '003',
      err_msg: 'merchant_oid ile basarili odeme bulunamadi',
    };
  }

  return {
    status: 'error',
    err_no: '999',
    err_msg: 'temporary provider failure',
  };
}

function createTask(input: {
  readonly suffix: string;
  readonly paymentAttemptId?: string;
  readonly includePaymentAttemptId?: boolean;
  readonly triggerReason?: PaymentReconciliationTaskCandidate['triggerReason'];
  readonly attemptCount?: number;
}): PaymentReconciliationTaskCandidate {
  const paymentAttemptId = input.paymentAttemptId ?? `attempt-${input.suffix}`;
  const includePaymentAttemptId = input.includePaymentAttemptId ?? true;

  return createPaymentReconciliationTaskCandidate({
    reconciliationRef: `reconciliation-${input.suffix}`,
    paymentId: `payment-${input.suffix}`,
    ...(includePaymentAttemptId ? { paymentAttemptId } : {}),
    checkoutId: `checkout-${input.suffix}`,
    providerName: 'paytr',
    providerReference: `oid-${input.suffix}`,
    merchantOid: `oid-${input.suffix}`,
    triggerReason: input.triggerReason ?? 'callback_requires_reconciliation',
    status: 'reconciliation_required',
    attemptCount: input.attemptCount ?? 0,
    maxAttempts: 3,
    manualReviewRequired: false,
    createdAt: new Date('2026-05-07T00:00:00.000Z'),
  });
}

function createPayment(input: {
  readonly suffix: string;
  readonly state?: PaymentState;
  readonly attemptState?: PaymentAttemptState;
}): PaymentInitiationResponse {
  return {
    paymentId: `payment-${input.suffix}`,
    checkoutId: `checkout-${input.suffix}`,
    cartContext: { actorType: 'CUSTOMER', actorId: `customer-${input.suffix}` },
    state: input.state ?? 'INITIATED',
    attempt: {
      paymentAttemptId: `attempt-${input.suffix}`,
      checkoutId: `checkout-${input.suffix}`,
      amount: 10000,
      currency: 'TRY',
      method: 'CARD',
      state: input.attemptState ?? 'PROVIDER_REDIRECT_READY',
      providerName: 'paytr',
      providerReference: `oid-${input.suffix}`,
      idempotencyKey: `payment-${input.suffix}-idempotency`,
    },
    errors: [],
    warnings: [],
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

async function createRepositoryTask(task: PaymentReconciliationTaskCandidate) {
  const repository = new InMemoryPaymentReconciliationTaskRepository();
  return {
    repository,
    task: await repository.createTask(task),
  };
}

async function runControlled(input: {
  readonly task: PaymentReconciliationTaskCandidate;
  readonly response: PaytrStatusInquirySuccessResponse | PaytrStatusInquiryErrorResponse;
  readonly expectedAmountMinor?: number;
  readonly expectedCurrency?: string;
}) {
  const { repository, task } = await createRepositoryTask(input.task);

  return processPaymentReconciliationTaskControlledMutation({
    task,
    repository,
    providerAdapter: getPaymentProviderAdapter(),
    now: new Date('2026-05-07T00:00:00.000Z'),
    expectedAmountMinor: input.expectedAmountMinor ?? 10000,
    expectedCurrency: input.expectedCurrency ?? 'TRY',
    simulationResponse: input.response,
    enableOwnerCommandApplication: true,
  });
}

const runTest = async (): Promise<{ result: SmokeResult; message: string }> => {
  const originalPersistenceMode = process.env.PERSISTENCE_MODE;

  try {
    process.env.PERSISTENCE_MODE = 'memory';
    resetPaymentRepository();

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
        const paymentRepository = getPaymentRepository();

        await paymentRepository.save(createPayment({ suffix: 'dry-run' }));
        const dryRunTask = await createRepositoryTask(createTask({ suffix: 'dry-run' }));
        const dryRun = await processPaymentReconciliationTaskDryRun({
          task: dryRunTask.task,
          repository: dryRunTask.repository,
          providerAdapter: getPaymentProviderAdapter(),
          now: new Date('2026-05-07T00:00:00.000Z'),
          expectedAmountMinor: 10000,
          expectedCurrency: 'TRY',
          simulationResponse: successResponse(),
          enableOwnerCommandApplication: false,
        });
        const dryRunPayment = await paymentRepository.getById('payment-dry-run');
        strictEqual(dryRun.ownerCommandCandidate?.commandType, 'MARK_PAYMENT_SUCCEEDED');
        strictEqual(dryRun.mutationApplied, false);
        strictEqual(dryRunPayment?.state, 'INITIATED');
        strictEqual(dryRunPayment?.attempt.state, 'PROVIDER_REDIRECT_READY');

        await paymentRepository.save(createPayment({ suffix: 'success' }));
        const success = await runControlled({
          task: createTask({ suffix: 'success' }),
          response: successResponse(),
        });
        const successPayment = await paymentRepository.getById('payment-success');
        strictEqual(success.ownerCommandApplyResult?.applied, true);
        strictEqual(success.mutationApplied, true);
        strictEqual(successPayment?.state, 'SUCCEEDED');
        strictEqual(successPayment?.attempt.state, 'SUCCEEDED');
        assertNoExternalMutationShape(success);
        assertNoExternalMutationShape(successPayment ?? {});
        assertNoExternalMutationShape(successPayment?.attempt ?? {});

        const duplicate = await runControlled({
          task: createTask({ suffix: 'success' }),
          response: successResponse(),
        });
        const duplicatePayment = await paymentRepository.getById('payment-success');
        strictEqual(duplicate.ownerCommandApplyResult?.alreadyApplied, true);
        strictEqual(duplicate.ownerCommandApplyResult?.applied, false);
        strictEqual(duplicate.mutationApplied, false);
        strictEqual(duplicatePayment?.state, 'SUCCEEDED');
        strictEqual(duplicatePayment?.attempt.state, 'SUCCEEDED');
        assertNoExternalMutationShape(duplicate);

        await paymentRepository.save(createPayment({
          suffix: 'failed',
          state: 'FAILED',
          attemptState: 'FAILED',
        }));
        const failedConflict = await runControlled({
          task: createTask({ suffix: 'failed' }),
          response: successResponse(),
        });
        const failedPayment = await paymentRepository.getById('payment-failed');
        strictEqual(failedConflict.ownerCommandApplyResult?.applied, false);
        strictEqual(failedConflict.ownerCommandApplyResult?.ignored, true);
        ok(failedConflict.ownerCommandApplyResult?.errors.includes('PAYMENT_TERMINAL_STATE_CONFLICT'));
        strictEqual(failedConflict.mutationApplied, false);
        strictEqual(failedPayment?.state, 'FAILED');
        strictEqual(failedPayment?.attempt.state, 'FAILED');

        await paymentRepository.save(createPayment({
          suffix: 'cancelled',
          state: 'CANCELLED',
          attemptState: 'CANCELLED',
        }));
        const cancelledConflict = await runControlled({
          task: createTask({ suffix: 'cancelled' }),
          response: successResponse(),
        });
        const cancelledPayment = await paymentRepository.getById('payment-cancelled');
        strictEqual(cancelledConflict.ownerCommandApplyResult?.applied, false);
        strictEqual(cancelledConflict.ownerCommandApplyResult?.ignored, true);
        ok(cancelledConflict.ownerCommandApplyResult?.errors.includes('PAYMENT_TERMINAL_STATE_CONFLICT'));
        strictEqual(cancelledConflict.mutationApplied, false);
        strictEqual(cancelledPayment?.state, 'CANCELLED');
        strictEqual(cancelledPayment?.attempt.state, 'CANCELLED');

        await paymentRepository.save(createPayment({ suffix: 'amount-mismatch' }));
        const amountMismatch = await runControlled({
          task: createTask({ suffix: 'amount-mismatch', triggerReason: 'amount_mismatch' }),
          response: successResponse({ amount: '99.00' }),
        });
        const amountMismatchPayment = await paymentRepository.getById('payment-amount-mismatch');
        strictEqual(amountMismatch.ownerCommandEligibility.status, 'requires_manual_review');
        strictEqual(amountMismatch.task.status, 'manual_review_required');
        strictEqual(amountMismatch.ownerCommandCandidate, undefined);
        strictEqual(amountMismatch.ownerCommandApplyResult, undefined);
        strictEqual(amountMismatch.mutationApplied, false);
        strictEqual(amountMismatchPayment?.state, 'INITIATED');

        await paymentRepository.save(createPayment({ suffix: 'currency-mismatch' }));
        const currencyMismatch = await runControlled({
          task: createTask({ suffix: 'currency-mismatch', triggerReason: 'currency_mismatch' }),
          response: successResponse({ currency: 'USD' }),
        });
        const currencyMismatchPayment = await paymentRepository.getById('payment-currency-mismatch');
        strictEqual(currencyMismatch.ownerCommandEligibility.status, 'requires_manual_review');
        strictEqual(currencyMismatch.ownerCommandCandidate, undefined);
        strictEqual(currencyMismatch.ownerCommandApplyResult, undefined);
        strictEqual(currencyMismatch.mutationApplied, false);
        strictEqual(currencyMismatchPayment?.state, 'INITIATED');

        await paymentRepository.save(createPayment({ suffix: 'inconclusive' }));
        const inconclusive = await runControlled({
          task: createTask({
            suffix: 'inconclusive',
            triggerReason: 'status_query_inconclusive',
            attemptCount: 1,
          }),
          response: errorResponse('inconclusive'),
        });
        strictEqual(inconclusive.ownerCommandEligibility.status, 'requires_retry');
        strictEqual(inconclusive.ownerCommandCandidate, undefined);
        strictEqual(inconclusive.ownerCommandApplyResult, undefined);
        strictEqual(inconclusive.mutationApplied, false);
        strictEqual((await paymentRepository.getById('payment-inconclusive'))?.state, 'INITIATED');

        await paymentRepository.save(createPayment({ suffix: 'failed-query' }));
        const failedQuery = await runControlled({
          task: createTask({
            suffix: 'failed-query',
            triggerReason: 'status_query_failed',
            attemptCount: 1,
          }),
          response: errorResponse('failed'),
        });
        strictEqual(failedQuery.ownerCommandEligibility.status, 'requires_retry');
        strictEqual(failedQuery.ownerCommandCandidate, undefined);
        strictEqual(failedQuery.ownerCommandApplyResult, undefined);
        strictEqual(failedQuery.mutationApplied, false);
        strictEqual((await paymentRepository.getById('payment-failed-query'))?.state, 'INITIATED');

        await paymentRepository.save(createPayment({ suffix: 'missing-attempt' }));
        const missingAttempt = await runControlled({
          task: createTask({ suffix: 'missing-attempt', includePaymentAttemptId: false }),
          response: successResponse(),
        });
        const missingAttemptPayment = await paymentRepository.getById('payment-missing-attempt');
        strictEqual(missingAttempt.ownerCommandEligibility.status, 'not_eligible');
        strictEqual(missingAttempt.ownerCommandCandidate, undefined);
        strictEqual(missingAttempt.ownerCommandApplyResult, undefined);
        strictEqual(missingAttempt.mutationApplied, false);
        strictEqual(missingAttemptPayment?.state, 'INITIATED');

        deepStrictEqual(
          [
            'orderStatus',
            'orderId',
            'settlementStatus',
            'payoutStatus',
            'riskStatus',
            'financeStatus',
          ].filter((key) => key in (successPayment ?? {})),
          [],
        );
      },
    );

    return {
      result: 'PASS',
      message:
        'Payment reconciliation controlled mutation assertions passed with explicit opt-in, terminal conflict, idempotency, and owner-boundary guards.',
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

export const paymentReconciliationControlledMutationSmoke: SmokeRunner = {
  name: 'payment-reconciliation-controlled-mutation',
  run: async () => runTest(),
};
