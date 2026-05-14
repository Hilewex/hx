import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ok, strictEqual } from 'node:assert';
import { InMemoryOperationalIntentRepository } from '../../../packages/persistence/src/operational-intent';
import { runOperationalAuditOutboxWorkerDryRun } from '../../../services/operational-outbox/src/operational-audit-outbox-worker';
import { SmokeRunner } from '../types';

function assertNoTruthMutationShape(value: object): void {
  strictEqual('refundCompleted' in value, false);
  strictEqual('payoutBlocked' in value, false);
  strictEqual('userBanned' in value, false);
  strictEqual('moderationFinalized' in value, false);
  strictEqual('fraudConfirmed' in value, false);
  strictEqual('settlementMutated' in value, false);
  strictEqual('providerCalled' in value, false);
}

async function seedIntent(repository: InMemoryOperationalIntentRepository, input: {
  domain: 'refund' | 'moderation' | 'risk';
  targetId: string;
  actionType: string;
  idempotencyKey: string;
}) {
  return repository.recordIntentWithAuditOutbox({
    domain: input.domain,
    targetId: input.targetId,
    actionType: input.actionType,
    makerActorId: 'maker-1',
    checkerActorId: 'checker-1',
    workflowState: 'owner_handoff_pending',
    reasonCode: 'OPS_REVIEW_REQUIRED',
    evidenceRefs: ['evidence-1'],
    idempotencyKey: input.idempotencyKey,
    boundaryFlags: {
      enforcementExecuted: false,
      ownerTruthMutated: false,
      payoutBlockedTruth: false,
      refundExecutionTruth: false,
    },
    actorId: 'maker-1',
    makerCheckerContext: {
      makerActorId: 'maker-1',
      checkerActorId: 'checker-1',
      dryRunOwnerHandoff: true,
    },
  });
}

function assertNoForbiddenWorkerBoundaryCalls(): void {
  const source = readFileSync(
    resolve(process.cwd(), 'services/operational-outbox/src/operational-audit-outbox-worker.ts'),
    'utf8',
  );

  ok(!/applyPaymentCallbackOwnerCommand/.test(source), 'worker must not call payment owner mutation');
  ok(!/handleProcessRefund/.test(source), 'worker must not execute refund processing');
  ok(!/handleApplyPayout/.test(source), 'worker must not execute payout mutation');
  ok(!/settlement\/action/.test(source), 'worker must not mutate settlement');
  ok(!/\bfetch\s*\(/.test(source), 'worker must not call external providers');
  ok(!/\baxios\b/.test(source), 'worker must not use axios');
  ok(!/refund completed/i.test(source), 'worker must not project refund completed truth');
  ok(!/payout blocked/i.test(source), 'worker must not project payout blocked truth');
  ok(!/user banned/i.test(source), 'worker must not project user banned truth');
  ok(!/moderation finalized/i.test(source), 'worker must not project moderation finalized truth');
  ok(!/fraud confirmed/i.test(source), 'worker must not project fraud confirmed truth');
}

export const operationalOutboxWorkerDryRunSmoke: SmokeRunner = {
  name: 'operational-outbox-worker-dry-run',
  run: async () => {
    try {
      const repository = new InMemoryOperationalIntentRepository();
      const now = new Date('2026-05-12T12:00:00.000Z');

      const deliveredSeed = await seedIntent(repository, {
        domain: 'refund',
        targetId: 'refund-ops-1',
        actionType: 'REFUND_OWNER_HANDOFF',
        idempotencyKey: 'ops-outbox-delivered-1',
      });
      const failedSeed = await seedIntent(repository, {
        domain: 'risk',
        targetId: 'risk-ops-1',
        actionType: 'RISK_OWNER_HANDOFF',
        idempotencyKey: 'ops-outbox-failed-1',
      });
      const deadLetterSeed = await seedIntent(repository, {
        domain: 'moderation',
        targetId: 'moderation-ops-1',
        actionType: 'MODERATION_OWNER_HANDOFF',
        idempotencyKey: 'ops-outbox-deadletter-1',
      });

      const result = await runOperationalAuditOutboxWorkerDryRun({
        repository,
        now,
        limit: 10,
        maxRetries: 1,
        retryDelayMs: 60_000,
        simulateFailureForOutboxIds: [
          failedSeed.auditOutbox.outboxId,
          deadLetterSeed.auditOutbox.outboxId,
        ],
      });

      strictEqual(result.scanned, 3);
      strictEqual(result.delivered, 1);
      strictEqual(result.failed, 0);
      strictEqual(result.deadLettered, 2);
      strictEqual(result.dryRunOwnerHandoff, true);
      strictEqual(result.enforcementExecuted, false);
      strictEqual(result.ownerTruthMutated, false);
      strictEqual(result.payoutBlockedTruth, false);
      strictEqual(result.refundExecutionTruth, false);
      strictEqual(result.internalCaller.callerId, 'operational-audit-outbox-worker');
      strictEqual(result.internalCaller.allowlisted, true);
      assertNoTruthMutationShape(result);

      const delivered = await repository.getAuditOutboxByIntentId(deliveredSeed.intent.intentId);
      strictEqual(delivered?.deliveryState, 'delivered');
      strictEqual(delivered?.retryCount, 0);
      ok(delivered?.lastDeliveryAttemptAt);

      const deadLetter = await repository.getAuditOutboxByIntentId(deadLetterSeed.intent.intentId);
      strictEqual(deadLetter?.deliveryState, 'dead_letter');
      strictEqual(deadLetter?.retryCount, 1);
      strictEqual(deadLetter?.deadLetterReason, 'DRY_RUN_RETRY_LIMIT_REACHED');

      for (const delivery of result.deliveries) {
        strictEqual(delivery.projectionOnly, true);
        strictEqual(delivery.enforcementExecuted, false);
        strictEqual(delivery.ownerTruthMutated, false);
        strictEqual(delivery.payoutBlockedTruth, false);
        strictEqual(delivery.refundExecutionTruth, false);
        assertNoTruthMutationShape(delivery);
      }

      const attemptStates = result.attempts.map((attempt) => attempt.attemptState);
      ok(attemptStates.includes('handoff_simulated'));
      ok(attemptStates.includes('owner_accepted'));
      ok(attemptStates.includes('queued_for_owner'));
      ok(attemptStates.includes('dead_lettered'));

      assertNoForbiddenWorkerBoundaryCalls();

      return {
        result: 'PASS',
        message: 'Operational outbox worker dry-run lifecycle, dead-letter, auth placeholder, and boundary assertions passed.',
      };
    } catch (error) {
      return {
        result: 'FAIL',
        message: (error as Error).stack || (error as Error).message,
      };
    }
  },
};
