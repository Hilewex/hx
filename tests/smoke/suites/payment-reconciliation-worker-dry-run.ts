import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { deepStrictEqual, ok, strictEqual } from 'node:assert';
import {
  createPaymentReconciliationTaskCandidate,
  PaytrStatusInquiryErrorResponse,
  PaytrStatusInquirySuccessResponse,
  PaymentReconciliationTaskCandidate,
} from '../../../packages/contracts/src/payment';
import { createProviderBoundaryFlags } from '../../../packages/contracts/src/provider';
import { InMemoryPaymentReconciliationTaskRepository } from '../../../packages/persistence/src/payment-reconciliation-task';
import { getPaymentProviderAdapter } from '../../../services/payment/src/provider-adapter';
import {
  processPaymentReconciliationTaskDryRun,
  runPaymentReconciliationWorkerDryRun,
} from '../../../services/payment/src/reconciliation-worker';
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
  readonly reconciliationRef: string;
  readonly providerReference: string;
  readonly triggerReason?: PaymentReconciliationTaskCandidate['triggerReason'];
  readonly status?: PaymentReconciliationTaskCandidate['status'];
  readonly attemptCount?: number;
  readonly maxAttempts?: number;
}): PaymentReconciliationTaskCandidate & { reconciliationRef: string } {
  return createPaymentReconciliationTaskCandidate({
    reconciliationRef: input.reconciliationRef,
    paymentId: `payment-${input.providerReference}`,
    paymentAttemptId: `attempt-${input.providerReference}`,
    checkoutId: `checkout-${input.providerReference}`,
    providerName: 'paytr',
    providerReference: input.providerReference,
    merchantOid: input.providerReference,
    triggerReason: input.triggerReason ?? 'payment_unknown_result',
    status: input.status ?? 'reconciliation_required',
    attemptCount: input.attemptCount ?? 0,
    maxAttempts: input.maxAttempts ?? 3,
    manualReviewRequired: false,
    createdAt: new Date('2026-05-07T00:00:00.000Z'),
  }) as PaymentReconciliationTaskCandidate & { reconciliationRef: string };
}

function assertNoMutationShape(value: object): void {
  strictEqual('paymentStatus' in value, false);
  strictEqual('paymentState' in value, false);
  strictEqual('ownerCommand' in value, false);
  strictEqual('orderStatus' in value, false);
  strictEqual('settlementStatus' in value, false);
  strictEqual('payoutStatus' in value, false);
  strictEqual('riskStatus' in value, false);
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

const runTest = async (): Promise<{ result: SmokeResult; message: string }> => {
  try {
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
        const adapter = getPaymentProviderAdapter();
        const now = new Date('2026-05-07T00:00:00.000Z');
        const boundary = createProviderBoundaryFlags();

        const successRepository = new InMemoryPaymentReconciliationTaskRepository();
        const successTask = await successRepository.createTask(createTask({
          reconciliationRef: 'reconciliation-success',
          providerReference: 'oid-success',
        }));
        const successResponse: PaytrStatusInquirySuccessResponse = {
          status: 'success',
          payment_amount: '100.00',
          payment_total: '100.00',
          returns: {},
          currency: 'TRY',
        };

        const success = await processPaymentReconciliationTaskDryRun({
          task: successTask,
          repository: successRepository,
          providerAdapter: adapter,
          now,
          expectedAmountMinor: 10000,
          expectedCurrency: 'TRY',
          simulationResponse: successResponse,
          correlationId: 'corr-success',
        });

        strictEqual(success.dryRun, true);
        strictEqual(success.mutationApplied, false);
        strictEqual(success.providerEnvelope?.operationStatus, 'succeeded');
        strictEqual(success.providerEnvelope?.normalized?.normalizedStatus, 'succeeded_candidate');
        strictEqual(success.decision.decisionType, 'mark_reconciled_candidate');
        strictEqual(success.decision.status, 'status_query_succeeded');
        strictEqual(success.decision.shouldProcessPaymentMutation, false);
        strictEqual(success.task.status, 'status_query_succeeded');
        strictEqual(success.task.attemptCount, 1);
        deepStrictEqual(success.boundary, boundary);
        deepStrictEqual(success.providerEnvelope?.boundary, boundary);
        deepStrictEqual(success.providerEnvelope?.normalized?.boundary, boundary);
        deepStrictEqual(success.decision.boundary, boundary);
        assertNoMutationShape(success);
        assertNoMutationShape(success.task);

        const inconclusiveRepository = new InMemoryPaymentReconciliationTaskRepository();
        const inconclusiveTask = await inconclusiveRepository.createTask(createTask({
          reconciliationRef: 'reconciliation-inconclusive',
          providerReference: 'oid-inconclusive',
          triggerReason: 'status_query_inconclusive',
          status: 'status_query_inconclusive',
          attemptCount: 1,
        }));
        const inconclusiveResponse: PaytrStatusInquiryErrorResponse = {
          status: 'error',
          err_no: '003',
          err_msg: 'merchant_oid ile basarili odeme bulunamadi',
        };

        const inconclusive = await processPaymentReconciliationTaskDryRun({
          task: inconclusiveTask,
          repository: inconclusiveRepository,
          providerAdapter: adapter,
          now,
          expectedAmountMinor: 10000,
          expectedCurrency: 'TRY',
          simulationResponse: inconclusiveResponse,
        });

        strictEqual(inconclusive.providerEnvelope?.normalized?.normalizedStatus, 'status_query_inconclusive');
        strictEqual(inconclusive.decision.decisionType, 'retry_status_query');
        strictEqual(inconclusive.decision.shouldRetry, true);
        strictEqual(inconclusive.mutationApplied, false);

        const mismatchRepository = new InMemoryPaymentReconciliationTaskRepository();
        const mismatchTask = await mismatchRepository.createTask(createTask({
          reconciliationRef: 'reconciliation-mismatch',
          providerReference: 'oid-mismatch',
          triggerReason: 'amount_mismatch',
        }));
        const amountMismatchResponse: PaytrStatusInquirySuccessResponse = {
          status: 'success',
          payment_amount: '99.00',
          payment_total: '99.00',
          returns: {},
          currency: 'TRY',
        };

        const mismatch = await processPaymentReconciliationTaskDryRun({
          task: mismatchTask,
          repository: mismatchRepository,
          providerAdapter: adapter,
          now,
          expectedAmountMinor: 10000,
          expectedCurrency: 'TRY',
          simulationResponse: amountMismatchResponse,
        });

        strictEqual(mismatch.providerEnvelope?.operationStatus, 'rejected');
        strictEqual(mismatch.providerEnvelope?.normalized?.normalizedStatus, 'rejected_amount_mismatch');
        strictEqual(mismatch.decision.decisionType, 'require_manual_review');
        strictEqual(mismatch.task.status, 'manual_review_required');
        strictEqual(mismatch.task.manualReviewRequired, true);
        strictEqual(mismatch.mutationApplied, false);

        const missingSimulationRepository = new InMemoryPaymentReconciliationTaskRepository();
        const missingSimulationTask = await missingSimulationRepository.createTask(createTask({
          reconciliationRef: 'reconciliation-missing-simulation',
          providerReference: 'oid-missing-simulation',
        }));

        const missingSimulation = await processPaymentReconciliationTaskDryRun({
          task: missingSimulationTask,
          repository: missingSimulationRepository,
          providerAdapter: adapter,
          now,
          expectedAmountMinor: 10000,
          expectedCurrency: 'TRY',
        });

        strictEqual(missingSimulation.providerEnvelope?.operationStatus, 'unknown_result');
        strictEqual(missingSimulation.providerEnvelope?.normalized, undefined);
        strictEqual(missingSimulation.decision.decisionType, 'schedule_status_query');
        strictEqual(missingSimulation.task.status, 'status_query_pending');
        strictEqual(missingSimulation.mutationApplied, false);

        const workerRepository = new InMemoryPaymentReconciliationTaskRepository();
        await workerRepository.createTask(createTask({
          reconciliationRef: 'reconciliation-worker-1',
          providerReference: 'oid-worker-1',
        }));
        await workerRepository.createTask(createTask({
          reconciliationRef: 'reconciliation-worker-2',
          providerReference: 'oid-worker-2',
        }));

        const workerResult = await runPaymentReconciliationWorkerDryRun({
          repository: workerRepository,
          providerAdapter: adapter,
          statuses: ['reconciliation_required'],
          limit: 10,
          now,
          defaultExpectedAmountMinor: 10000,
          defaultExpectedCurrency: 'TRY',
          simulationResponsesByProviderReference: {
            'oid-worker-1': successResponse,
            'oid-worker-2': inconclusiveResponse,
          },
        });

        strictEqual(workerResult.dryRun, true);
        strictEqual(workerResult.mutationApplied, false);
        strictEqual(workerResult.results.length, 2);
        strictEqual(workerResult.results[0].mutationApplied, false);
        strictEqual(workerResult.results[1].mutationApplied, false);
        deepStrictEqual(workerResult.boundary, boundary);
      },
    );

    assertNoLiveRequestSourceUsage();

    return {
      result: 'PASS',
      message:
        'Payment reconciliation worker dry-run assertions passed without live requests or owner mutations.',
    };
  } catch (error) {
    return {
      result: 'FAIL',
      message: (error as Error).stack || (error as Error).message,
    };
  }
};

export const paymentReconciliationWorkerDryRunSmoke: SmokeRunner = {
  name: 'payment-reconciliation-worker-dry-run',
  run: async () => runTest(),
};
