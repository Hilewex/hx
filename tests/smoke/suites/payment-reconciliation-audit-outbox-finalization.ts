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
import {
  InMemoryAuditLogRepository,
  InMemoryOutboxEventRepository,
} from '../../../packages/persistence/src/audit-event';
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
  'order' + 'Command',
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
  return kind === 'inconclusive'
    ? {
        status: 'error',
        err_no: '003',
        err_msg: 'merchant_oid ile basarili odeme bulunamadi',
      }
    : {
        status: 'error',
        err_no: '999',
        err_msg: 'temporary provider failure',
      };
}

function createTask(input: {
  readonly suffix: string;
  readonly triggerReason?: PaymentReconciliationTaskCandidate['triggerReason'];
  readonly attemptCount?: number;
  readonly paymentAttemptId?: string;
  readonly omitPaymentAttemptId?: boolean;
}): PaymentReconciliationTaskCandidate {
  return createPaymentReconciliationTaskCandidate({
    reconciliationRef: `reconciliation-${input.suffix}`,
    paymentId: `payment-${input.suffix}`,
    ...(input.omitPaymentAttemptId ? {} : { paymentAttemptId: input.paymentAttemptId ?? `attempt-${input.suffix}` }),
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
  if (!value || typeof value !== 'object') return;

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
    'tests/smoke/suites/payment-reconciliation-audit-outbox-finalization.ts',
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
    ok(!executableLines.some((line) => /\borderCommand\b/.test(line)), `${file} must not expose order command`);
    ok(!executableLines.some((line) => new RegExp('topic\\s*:\\s*[\\\'"]order\\.').test(line)), `${file} must not emit order topic`);
  }
}

async function createRepositoryTask(
  repository: InMemoryPaymentReconciliationTaskRepository,
  task: PaymentReconciliationTaskCandidate,
) {
  return repository.createTask(task);
}

async function runControlled(input: {
  readonly task: PaymentReconciliationTaskCandidate;
  readonly response: PaytrStatusInquirySuccessResponse | PaytrStatusInquiryErrorResponse;
  readonly repository?: InMemoryPaymentReconciliationTaskRepository;
  readonly audit?: InMemoryAuditLogRepository;
  readonly outbox?: InMemoryOutboxEventRepository;
}) {
  const repository = input.repository ?? new InMemoryPaymentReconciliationTaskRepository();
  const task = await createRepositoryTask(repository, input.task);
  const audit = input.audit ?? new InMemoryAuditLogRepository();
  const outbox = input.outbox ?? new InMemoryOutboxEventRepository();

  return {
    repository,
    audit,
    outbox,
    result: await processPaymentReconciliationTaskControlledMutation({
      task,
      repository,
      providerAdapter: getPaymentProviderAdapter(),
      now: new Date('2026-05-07T00:00:00.000Z'),
      expectedAmountMinor: 10000,
      expectedCurrency: 'TRY',
      simulationResponse: input.response,
      enableOwnerCommandApplication: true,
      auditEventRepositories: { audit, outbox },
    }),
  };
}

async function assertNoEvidence(input: {
  readonly audit: InMemoryAuditLogRepository;
  readonly outbox: InMemoryOutboxEventRepository;
  readonly paymentId: string;
}) {
  const audits = await input.audit.listAuditLogsByEntity('payment', 'payment', input.paymentId);
  const pending = await input.outbox.listPendingOutboxEvents(100, {
    ownerService: 'payment',
    entityType: 'payment',
    entityId: input.paymentId,
  });
  strictEqual(audits.length, 0);
  strictEqual(pending.length, 0);
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

        await paymentRepository.save(createPayment({ suffix: 'success' }));
        const successRun = await runControlled({
          task: createTask({ suffix: 'success' }),
          response: successResponse(),
        });
        const success = successRun.result;
        const successPayment = await paymentRepository.getById('payment-success');
        strictEqual(success.mutationApplied, true);
        strictEqual(success.taskFinalized, true);
        strictEqual(success.task.status, 'reconciled');
        strictEqual(success.auditAppended, true);
        strictEqual(success.outboxAppended, true);
        strictEqual(success.evidenceWarnings?.length, 0);
        strictEqual(successPayment?.state, 'SUCCEEDED');
        strictEqual(successPayment?.attempt.state, 'SUCCEEDED');
        strictEqual(success.auditRecord?.actionType, 'payment.reconciliation.completed');
        strictEqual(success.auditRecord?.actorType, 'SYSTEM');
        strictEqual(success.auditRecord?.actorId, 'reconciliation-worker');
        strictEqual(success.auditRecord?.metadata.orderCreated, false);
        strictEqual(success.auditRecord?.metadata.orderHandoff, false);
        strictEqual(success.auditRecord?.metadata.financeMutation, false);
        strictEqual(success.auditRecord?.metadata.riskMutation, false);
        strictEqual(success.outboxRecord?.topic, 'payment.reconciliation.completed');
        strictEqual(success.outboxRecord?.idempotencyKey, 'payment-reconciliation-completed:reconciliation-success:attempt-success');
        strictEqual(success.outboxRecord?.payload.orderCreated, false);
        strictEqual(success.outboxRecord?.payload.orderHandoff, false);
        assertNoExternalMutationShape(success, 'success result');
        assertNoExternalMutationShape(success.outboxRecord?.payload, 'success outbox payload');

        await paymentRepository.save(createPayment({ suffix: 'dry-run' }));
        const dryRunRepository = new InMemoryPaymentReconciliationTaskRepository();
        const dryRunTask = await createRepositoryTask(dryRunRepository, createTask({ suffix: 'dry-run' }));
        const dryRun = await processPaymentReconciliationTaskDryRun({
          task: dryRunTask,
          repository: dryRunRepository,
          providerAdapter: getPaymentProviderAdapter(),
          now: new Date('2026-05-07T00:00:00.000Z'),
          expectedAmountMinor: 10000,
          expectedCurrency: 'TRY',
          simulationResponse: successResponse(),
          enableOwnerCommandApplication: false,
        });
        strictEqual(dryRun.mutationApplied, false);
        strictEqual(dryRun.task.status, 'status_query_succeeded');
        strictEqual((await paymentRepository.getById('payment-dry-run'))?.state, 'INITIATED');

        await paymentRepository.save(createPayment({ suffix: 'amount-mismatch' }));
        const amountMismatch = await runControlled({
          task: createTask({ suffix: 'amount-mismatch', triggerReason: 'amount_mismatch' }),
          response: successResponse({ amount: '99.00' }),
        });
        strictEqual(amountMismatch.result.mutationApplied, false);
        strictEqual(amountMismatch.result.taskFinalized, undefined);
        strictEqual(amountMismatch.result.task.status, 'manual_review_required');
        await assertNoEvidence({
          audit: amountMismatch.audit,
          outbox: amountMismatch.outbox,
          paymentId: 'payment-amount-mismatch',
        });

        await paymentRepository.save(createPayment({ suffix: 'currency-mismatch' }));
        const currencyMismatch = await runControlled({
          task: createTask({ suffix: 'currency-mismatch', triggerReason: 'currency_mismatch' }),
          response: successResponse({ currency: 'USD' }),
        });
        strictEqual(currencyMismatch.result.mutationApplied, false);
        strictEqual(currencyMismatch.result.taskFinalized, undefined);
        strictEqual(currencyMismatch.result.task.status, 'manual_review_required');
        await assertNoEvidence({
          audit: currencyMismatch.audit,
          outbox: currencyMismatch.outbox,
          paymentId: 'payment-currency-mismatch',
        });

        await paymentRepository.save(createPayment({ suffix: 'inconclusive' }));
        const inconclusive = await runControlled({
          task: createTask({
            suffix: 'inconclusive',
            triggerReason: 'status_query_inconclusive',
            attemptCount: 1,
          }),
          response: errorResponse('inconclusive'),
        });
        strictEqual(inconclusive.result.mutationApplied, false);
        strictEqual(inconclusive.result.task.status, 'status_query_inconclusive');
        await assertNoEvidence({
          audit: inconclusive.audit,
          outbox: inconclusive.outbox,
          paymentId: 'payment-inconclusive',
        });

        await paymentRepository.save(createPayment({ suffix: 'failed-query' }));
        const failedQuery = await runControlled({
          task: createTask({
            suffix: 'failed-query',
            triggerReason: 'status_query_failed',
            attemptCount: 1,
          }),
          response: errorResponse('failed'),
        });
        strictEqual(failedQuery.result.mutationApplied, false);
        strictEqual(failedQuery.result.task.status, 'status_query_failed');
        await assertNoEvidence({
          audit: failedQuery.audit,
          outbox: failedQuery.outbox,
          paymentId: 'payment-failed-query',
        });

        await paymentRepository.save(createPayment({
          suffix: 'failed',
          state: 'FAILED',
          attemptState: 'FAILED',
        }));
        const failedConflict = await runControlled({
          task: createTask({ suffix: 'failed' }),
          response: successResponse(),
        });
        strictEqual(failedConflict.result.ownerCommandApplyResult?.applied, false);
        strictEqual(failedConflict.result.ownerCommandApplyResult?.alreadyApplied, false);
        strictEqual(failedConflict.result.taskFinalized, false);
        strictEqual(failedConflict.result.mutationApplied, false);
        strictEqual((await paymentRepository.getById('payment-failed'))?.state, 'FAILED');
        await assertNoEvidence({
          audit: failedConflict.audit,
          outbox: failedConflict.outbox,
          paymentId: 'payment-failed',
        });

        await paymentRepository.save(createPayment({
          suffix: 'cancelled',
          state: 'CANCELLED',
          attemptState: 'CANCELLED',
        }));
        const cancelledConflict = await runControlled({
          task: createTask({ suffix: 'cancelled' }),
          response: successResponse(),
        });
        strictEqual(cancelledConflict.result.ownerCommandApplyResult?.applied, false);
        strictEqual(cancelledConflict.result.ownerCommandApplyResult?.alreadyApplied, false);
        strictEqual(cancelledConflict.result.taskFinalized, false);
        strictEqual(cancelledConflict.result.mutationApplied, false);
        strictEqual((await paymentRepository.getById('payment-cancelled'))?.state, 'CANCELLED');
        await assertNoEvidence({
          audit: cancelledConflict.audit,
          outbox: cancelledConflict.outbox,
          paymentId: 'payment-cancelled',
        });

        await paymentRepository.save(createPayment({ suffix: 'missing-attempt' }));
        const missingAttempt = await runControlled({
          task: createTask({ suffix: 'missing-attempt', omitPaymentAttemptId: true }),
          response: successResponse(),
        });
        strictEqual(missingAttempt.result.ownerCommandEligibility.status, 'not_eligible');
        strictEqual(missingAttempt.result.mutationApplied, false);
        strictEqual(missingAttempt.result.taskFinalized, undefined);
        await assertNoEvidence({
          audit: missingAttempt.audit,
          outbox: missingAttempt.outbox,
          paymentId: 'payment-missing-attempt',
        });

        const duplicateRepository = new InMemoryPaymentReconciliationTaskRepository();
        const duplicateAudit = new InMemoryAuditLogRepository();
        const duplicateOutbox = new InMemoryOutboxEventRepository();
        await paymentRepository.save(createPayment({ suffix: 'duplicate' }));
        const firstDuplicateRun = await runControlled({
          task: createTask({ suffix: 'duplicate' }),
          response: successResponse(),
          repository: duplicateRepository,
          audit: duplicateAudit,
          outbox: duplicateOutbox,
        });
        const secondDuplicateRun = await runControlled({
          task: createTask({ suffix: 'duplicate' }),
          response: successResponse(),
          repository: duplicateRepository,
          audit: duplicateAudit,
          outbox: duplicateOutbox,
        });
        strictEqual(firstDuplicateRun.result.mutationApplied, true);
        strictEqual(secondDuplicateRun.result.ownerCommandApplyResult?.alreadyApplied, true);
        strictEqual(secondDuplicateRun.result.mutationApplied, false);
        strictEqual(secondDuplicateRun.result.taskFinalized, true);
        strictEqual(secondDuplicateRun.result.task.status, 'reconciled');
        strictEqual(secondDuplicateRun.result.outboxRecord?.idempotencyKey, firstDuplicateRun.result.outboxRecord?.idempotencyKey);
        strictEqual(secondDuplicateRun.result.outboxRecord?.eventId, firstDuplicateRun.result.outboxRecord?.eventId);
        strictEqual((await duplicateAudit.listAuditLogsByEntity('payment', 'payment', 'payment-duplicate')).length, 1);
        strictEqual(
          (await duplicateOutbox.listPendingOutboxEvents(100, {
            ownerService: 'payment',
            entityType: 'payment',
            entityId: 'payment-duplicate',
          })).length,
          1,
        );
        assertNoExternalMutationShape(secondDuplicateRun.result, 'duplicate result');
      },
    );

    assertNoLiveRequestSourceUsage();
    assertNoOrderHandoffSourceUsage();

    return {
      result: 'PASS',
      message:
        'Payment reconciliation audit/outbox/finalization assertions passed with explicit opt-in evidence, dry-run regression, negative cases, idempotent duplicate evidence, and no order handoff.',
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

export const paymentReconciliationAuditOutboxFinalizationSmoke: SmokeRunner = {
  name: 'payment-reconciliation-audit-outbox-finalization',
  run: async () => runTest(),
};
