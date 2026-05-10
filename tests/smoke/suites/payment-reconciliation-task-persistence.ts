import { deepStrictEqual, strictEqual } from 'node:assert';
import {
  createPaymentReconciliationTaskCandidate,
  mapPaytrStatusInquiryToReconciliationCandidate,
  PaymentReconciliationTaskCandidate,
} from '../../../packages/contracts/src/payment';
import { createProviderBoundaryFlags } from '../../../packages/contracts/src/provider';
import { InMemoryPaymentReconciliationTaskRepository } from '../../../packages/persistence/src/payment-reconciliation-task';
import { SmokeResult, SmokeRunner } from '../types';

function createTask(
  reconciliationRef: string,
): PaymentReconciliationTaskCandidate & { reconciliationRef: string } {
  return createPaymentReconciliationTaskCandidate({
    reconciliationRef,
    paymentId: 'payment-1',
    paymentAttemptId: 'attempt-1',
    checkoutId: 'checkout-1',
    providerName: 'paytr',
    providerReference: 'provider-ref-1',
    merchantOid: 'merchant-oid-1',
    triggerReason: 'payment_unknown_result',
    status: 'reconciliation_required',
    attemptCount: 0,
    maxAttempts: 3,
    manualReviewRequired: false,
    createdAt: new Date('2026-05-07T00:00:00.000Z'),
  }) as PaymentReconciliationTaskCandidate & { reconciliationRef: string };
}

const runTest = async (): Promise<{ result: SmokeResult; message: string }> => {
  try {
    const repository = new InMemoryPaymentReconciliationTaskRepository();
    const boundary = createProviderBoundaryFlags();
    const candidate = createTask('reconciliation-ref-1');

    const created = await repository.createTask(candidate);
    strictEqual(created.reconciliationRef, 'reconciliation-ref-1');
    strictEqual(created.status, 'reconciliation_required');
    strictEqual(created.providerName, 'paytr');
    deepStrictEqual(created.boundary, boundary);

    const duplicate = await repository.createTask({
      ...candidate,
      status: 'manual_review_required',
      manualReviewRequired: true,
    });
    strictEqual(duplicate.taskId, created.taskId);
    strictEqual(duplicate.status, 'reconciliation_required');
    strictEqual((await repository.listTasksByStatus('reconciliation_required')).length, 1);

    const byRef = await repository.getTaskByReconciliationRef(
      'reconciliation-ref-1',
    );
    strictEqual(byRef?.taskId, created.taskId);

    const openByProviderReference =
      await repository.findOpenTaskByProviderReference('paytr', 'provider-ref-1');
    strictEqual(openByProviderReference?.taskId, created.taskId);

    const listed = await repository.listTasksByStatus('reconciliation_required');
    strictEqual(listed.length, 1);
    strictEqual(listed[0].taskId, created.taskId);

    const statusUpdated = await repository.updateTaskStatus(created.taskId!, {
      status: 'status_query_pending',
      nextAttemptAt: new Date('2026-05-07T00:05:00.000Z'),
    });
    strictEqual(statusUpdated?.status, 'status_query_pending');
    strictEqual(statusUpdated?.paymentId, 'payment-1');
    strictEqual(statusUpdated?.providerReference, 'provider-ref-1');
    deepStrictEqual(statusUpdated?.boundary, boundary);

    const lastCandidate = mapPaytrStatusInquiryToReconciliationCandidate({
      merchantOid: 'merchant-oid-1',
      expectedAmountMinor: 10000,
      expectedCurrency: 'TRY',
      response: {
        status: 'error',
        err_no: '003',
        err_msg: 'merchant_oid ile basarili odeme bulunamadi',
      },
      occurredAt: new Date('2026-05-07T00:05:00.000Z'),
      inquiryRef: 'inquiry-1',
    });

    const attemptMarked = await repository.markTaskAttempt(created.taskId!, {
      attemptCount: 1,
      nextAttemptAt: new Date('2026-05-07T00:10:00.000Z'),
      lastInquiryRef: 'inquiry-1',
      lastCandidate,
    });
    strictEqual(attemptMarked?.attemptCount, 1);
    strictEqual(attemptMarked?.lastInquiryRef, 'inquiry-1');
    strictEqual(attemptMarked?.lastCandidate?.normalizedStatus, 'status_query_inconclusive');
    strictEqual(attemptMarked?.paymentId, 'payment-1');
    strictEqual(attemptMarked?.checkoutId, 'checkout-1');
    deepStrictEqual(attemptMarked?.boundary, boundary);

    const missingPaymentMutation = !('paymentStatus' in attemptMarked!);
    const missingOrderMutation = !('orderStatus' in attemptMarked!);
    const missingFinanceMutation = !('settlementStatus' in attemptMarked!);
    const missingRiskMutation = !('riskStatus' in attemptMarked!);
    strictEqual(missingPaymentMutation, true);
    strictEqual(missingOrderMutation, true);
    strictEqual(missingFinanceMutation, true);
    strictEqual(missingRiskMutation, true);

    return {
      result: 'PASS',
      message:
        'Payment reconciliation task persistence assertions passed with in-memory repository and no owner mutations.',
    };
  } catch (error) {
    return {
      result: 'FAIL',
      message: (error as Error).stack || (error as Error).message,
    };
  }
};

export const paymentReconciliationTaskPersistenceSmoke: SmokeRunner = {
  name: 'payment-reconciliation-task-persistence',
  run: async () => runTest(),
};
