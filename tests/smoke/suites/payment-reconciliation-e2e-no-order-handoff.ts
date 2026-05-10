import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ok, strictEqual } from 'node:assert';
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

const FORBIDDEN_EXTERNAL_KEYS = [
  'orderId',
  'orderStatus',
  'orderCreated',
  'orderHandoff',
  'orderCommand',
  'financeStatus',
  'settlementStatus',
  'payoutStatus',
  'riskStatus',
  'financeMutation',
  'settlementMutation',
  'payoutMutation',
  'riskMutation',
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
  readonly triggerReason?: PaymentReconciliationTaskCandidate['triggerReason'];
  readonly attemptCount?: number;
}): PaymentReconciliationTaskCandidate {
  return createPaymentReconciliationTaskCandidate({
    reconciliationRef: `reconciliation-${input.suffix}`,
    paymentId: `payment-${input.suffix}`,
    paymentAttemptId: `attempt-${input.suffix}`,
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

function assertNoExternalMutationShape(value: unknown, label: string): void {
  if (!value || typeof value !== 'object') {
    return;
  }

  for (const key of FORBIDDEN_EXTERNAL_KEYS) {
    strictEqual(key in value, false, `${label} must not expose ${key}`);
  }
}

function assertNoLiveRequestSourceUsage(): void {
  for (const file of [
    'services/payment/src/provider-adapter.ts',
    'services/payment/src/reconciliation-worker.ts',
  ]) {
    const source = readFileSync(resolve(process.cwd(), file), 'utf8');

    ok(!/\bfetch\s*\(/.test(source), `${file} must not call fetch`);
    ok(!/\baxios\b/.test(source), `${file} must not use axios`);
    ok(!/\brequest\s*\(/.test(source), `${file} must not call request`);
    ok(!/node:http/.test(source), `${file} must not import node:http`);
    ok(!/node:https/.test(source), `${file} must not import node:https`);
    ok(!/require\(['"]http['"]\)/.test(source), `${file} must not require http`);
    ok(!/require\(['"]https['"]\)/.test(source), `${file} must not require https`);
  }
}

function assertNoOrderHandoffSourceUsage(): void {
  for (const file of [
    'services/payment/src/reconciliation-worker.ts',
    'tests/smoke/suites/payment-reconciliation-e2e-no-order-handoff.ts',
  ]) {
    const source = readFileSync(resolve(process.cwd(), file), 'utf8');
    const executableLines = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('//') && !line.startsWith('ok(!/'));

    ok(
      !executableLines.some((line) => line.startsWith('import ') && line.includes('services/order')),
      `${file} must not import services/order`,
    );
    ok(
      !executableLines.some((line) => line.startsWith('import ') && line.includes('@hx/order')),
      `${file} must not import @hx/order`,
    );
    ok(!executableLines.some((line) => /\bcreateOrder\s*\(/.test(line)), `${file} must not call createOrder`);
    ok(!executableLines.some((line) => /\bhandoffToOrder\s*\(/.test(line)), `${file} must not call handoffToOrder`);
    ok(!executableLines.some((line) => /\borderHandoff\s*\(/.test(line)), `${file} must not call orderHandoff`);
  }
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
}) {
  const { repository, task } = await createRepositoryTask(input.task);

  return processPaymentReconciliationTaskControlledMutation({
    task,
    repository,
    providerAdapter: getPaymentProviderAdapter(),
    now: new Date('2026-05-07T00:00:00.000Z'),
    expectedAmountMinor: 10000,
    expectedCurrency: 'TRY',
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
        strictEqual(dryRun.providerEnvelope?.normalized?.normalizedStatus, 'succeeded_candidate');
        strictEqual(dryRun.decision.decisionType, 'mark_reconciled_candidate');
        strictEqual(dryRun.ownerCommandEligibility.status, 'command_ready');
        strictEqual(dryRun.ownerCommandCandidate?.commandType, 'MARK_PAYMENT_SUCCEEDED');
        strictEqual(dryRun.mutationApplied, false);
        strictEqual(dryRunPayment?.state, 'INITIATED');
        strictEqual(dryRunPayment?.attempt.state, 'PROVIDER_REDIRECT_READY');
        assertNoExternalMutationShape(dryRun, 'dry-run result');
        assertNoExternalMutationShape(dryRunPayment, 'dry-run payment');

        await paymentRepository.save(createPayment({ suffix: 'success' }));
        const success = await runControlled({
          task: createTask({ suffix: 'success' }),
          response: successResponse(),
        });
        const successPayment = await paymentRepository.getById('payment-success');
        strictEqual(success.providerEnvelope?.normalized?.normalizedStatus, 'succeeded_candidate');
        strictEqual(success.decision.decisionType, 'mark_reconciled_candidate');
        strictEqual(success.ownerCommandEligibility.status, 'command_ready');
        strictEqual(success.ownerCommandCandidate?.commandType, 'MARK_PAYMENT_SUCCEEDED');
        strictEqual(success.ownerCommandApplyResult?.applied, true);
        strictEqual(success.mutationApplied, true);
        strictEqual(successPayment?.state, 'SUCCEEDED');
        strictEqual(successPayment?.attempt.state, 'SUCCEEDED');
        assertNoExternalMutationShape(success, 'success result');
        assertNoExternalMutationShape(successPayment, 'success payment');
        assertNoExternalMutationShape(successPayment?.attempt, 'success payment attempt');

        const duplicate = await runControlled({
          task: createTask({ suffix: 'success' }),
          response: successResponse(),
        });
        strictEqual(duplicate.ownerCommandApplyResult?.alreadyApplied, true);
        strictEqual(duplicate.ownerCommandApplyResult?.applied, false);
        strictEqual(duplicate.mutationApplied, false);
        strictEqual((await paymentRepository.getById('payment-success'))?.state, 'SUCCEEDED');
        assertNoExternalMutationShape(duplicate, 'duplicate result');

        await paymentRepository.save(createPayment({ suffix: 'amount-mismatch' }));
        const amountMismatch = await runControlled({
          task: createTask({ suffix: 'amount-mismatch', triggerReason: 'amount_mismatch' }),
          response: successResponse({ amount: '99.00' }),
        });
        strictEqual(amountMismatch.ownerCommandEligibility.status, 'requires_manual_review');
        strictEqual(amountMismatch.task.status, 'manual_review_required');
        strictEqual(amountMismatch.ownerCommandCandidate, undefined);
        strictEqual(amountMismatch.ownerCommandApplyResult, undefined);
        strictEqual(amountMismatch.mutationApplied, false);
        strictEqual((await paymentRepository.getById('payment-amount-mismatch'))?.state, 'INITIATED');
        assertNoExternalMutationShape(amountMismatch, 'amount mismatch result');

        await paymentRepository.save(createPayment({ suffix: 'currency-mismatch' }));
        const currencyMismatch = await runControlled({
          task: createTask({ suffix: 'currency-mismatch', triggerReason: 'currency_mismatch' }),
          response: successResponse({ currency: 'USD' }),
        });
        strictEqual(currencyMismatch.ownerCommandEligibility.status, 'requires_manual_review');
        strictEqual(currencyMismatch.ownerCommandCandidate, undefined);
        strictEqual(currencyMismatch.ownerCommandApplyResult, undefined);
        strictEqual(currencyMismatch.mutationApplied, false);
        strictEqual((await paymentRepository.getById('payment-currency-mismatch'))?.state, 'INITIATED');
        assertNoExternalMutationShape(currencyMismatch, 'currency mismatch result');

        await paymentRepository.save(createPayment({ suffix: 'inconclusive' }));
        const inconclusive = await runControlled({
          task: createTask({
            suffix: 'inconclusive',
            triggerReason: 'status_query_inconclusive',
            attemptCount: 1,
          }),
          response: errorResponse('inconclusive'),
        });
        strictEqual(inconclusive.decision.decisionType, 'retry_status_query');
        strictEqual(inconclusive.ownerCommandEligibility.status, 'requires_retry');
        strictEqual(inconclusive.ownerCommandCandidate, undefined);
        strictEqual(inconclusive.ownerCommandApplyResult, undefined);
        strictEqual(inconclusive.mutationApplied, false);
        strictEqual((await paymentRepository.getById('payment-inconclusive'))?.state, 'INITIATED');
        assertNoExternalMutationShape(inconclusive, 'inconclusive result');

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
        assertNoExternalMutationShape(failedQuery, 'failed query result');

        await paymentRepository.save(createPayment({
          suffix: 'failed',
          state: 'FAILED',
          attemptState: 'FAILED',
        }));
        const failedConflict = await runControlled({
          task: createTask({ suffix: 'failed' }),
          response: successResponse(),
        });
        strictEqual(failedConflict.ownerCommandApplyResult?.applied, false);
        strictEqual(failedConflict.ownerCommandApplyResult?.ignored, true);
        ok(failedConflict.ownerCommandApplyResult?.errors.includes('PAYMENT_TERMINAL_STATE_CONFLICT'));
        strictEqual(failedConflict.mutationApplied, false);
        strictEqual((await paymentRepository.getById('payment-failed'))?.state, 'FAILED');
        assertNoExternalMutationShape(failedConflict, 'failed conflict result');

        await paymentRepository.save(createPayment({
          suffix: 'cancelled',
          state: 'CANCELLED',
          attemptState: 'CANCELLED',
        }));
        const cancelledConflict = await runControlled({
          task: createTask({ suffix: 'cancelled' }),
          response: successResponse(),
        });
        strictEqual(cancelledConflict.ownerCommandApplyResult?.applied, false);
        strictEqual(cancelledConflict.ownerCommandApplyResult?.ignored, true);
        ok(cancelledConflict.ownerCommandApplyResult?.errors.includes('PAYMENT_TERMINAL_STATE_CONFLICT'));
        strictEqual(cancelledConflict.mutationApplied, false);
        strictEqual((await paymentRepository.getById('payment-cancelled'))?.state, 'CANCELLED');
        assertNoExternalMutationShape(cancelledConflict, 'cancelled conflict result');
      },
    );

    assertNoLiveRequestSourceUsage();
    assertNoOrderHandoffSourceUsage();

    return {
      result: 'PASS',
      message:
        'Payment reconciliation E2E assertions passed with explicit opt-in payment mutation, dry-run regression, negative cases, and no order handoff.',
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

export const paymentReconciliationE2eNoOrderHandoffSmoke: SmokeRunner = {
  name: 'payment-reconciliation-e2e-no-order-handoff',
  run: async () => runTest(),
};
