import { ok, strictEqual } from 'node:assert';
import { InMemoryOperationalIntentRepository } from '../../../packages/persistence/src/operational-intent';
import { runOperationalAuditOutboxWorkerDryRun } from '../../../services/operational-outbox/src/operational-audit-outbox-worker';
import { SmokeRunner } from '../types';

export const operationalOutboxWorkerLeaseSmoke: SmokeRunner = {
  name: 'operational-outbox-worker-lease',
  run: async () => {
    try {
      const repository = new InMemoryOperationalIntentRepository();
      const now = new Date('2026-05-12T12:00:00.000Z');
      const seed = await repository.recordIntentWithAuditOutbox({
        domain: 'risk',
        targetId: 'lease-risk-1',
        actionType: 'RISK_OWNER_HANDOFF',
        makerActorId: 'maker-lease',
        checkerActorId: 'checker-lease',
        workflowState: 'owner_handoff_pending',
        reasonCode: 'LEASE_SMOKE',
        evidenceRefs: ['lease-evidence-1'],
        idempotencyKey: 'ops-outbox-lease-1',
        boundaryFlags: {
          enforcementExecuted: false,
          ownerTruthMutated: false,
          payoutBlockedTruth: false,
          refundExecutionTruth: false,
        },
        actorId: 'maker-lease',
        makerCheckerContext: { dryRunOwnerHandoff: true },
      });

      const firstClaim = await repository.claimAuditOutboxLease(seed.auditOutbox.outboxId, {
        leaseOwner: 'lease-owner-1',
        leaseUntil: new Date(now.getTime() + 60_000),
        now,
      });
      ok(firstClaim, 'first lease claim should succeed');
      strictEqual(firstClaim?.leaseOwner, 'lease-owner-1');

      const duplicateClaim = await repository.claimAuditOutboxLease(seed.auditOutbox.outboxId, {
        leaseOwner: 'lease-owner-2',
        leaseUntil: new Date(now.getTime() + 60_000),
        now,
      });
      strictEqual(duplicateClaim, null);

      const workerResult = await runOperationalAuditOutboxWorkerDryRun({
        repository,
        now,
        limit: 10,
        leaseOwner: 'worker-lease-smoke',
      });
      strictEqual(workerResult.scanned, 0);
      strictEqual(workerResult.claimed, 0);
      strictEqual(workerResult.delivered, 0);
      strictEqual(workerResult.ownerTruthMutated, false);
      strictEqual(workerResult.enforcementExecuted, false);

      await repository.releaseAuditOutboxLease(seed.auditOutbox.outboxId, 'lease-owner-1');
      const released = await repository.getAuditOutboxByIntentId(seed.intent.intentId);
      strictEqual(released?.leaseOwner, null);

      const secondWorkerResult = await runOperationalAuditOutboxWorkerDryRun({
        repository,
        now,
        limit: 10,
        leaseOwner: 'worker-lease-smoke',
      });
      strictEqual(secondWorkerResult.scanned, 1);
      strictEqual(secondWorkerResult.claimed, 1);
      strictEqual(secondWorkerResult.delivered, 1);
      const delivered = await repository.getAuditOutboxByIntentId(seed.intent.intentId);
      strictEqual(delivered?.deliveryState, 'delivered');
      strictEqual(delivered?.leaseOwner, null);
      strictEqual(delivered?.leaseUntil, null);
      ok(delivered?.processingStartedAt);

      return {
        result: 'PASS',
        message: 'Operational outbox lease claim/release and duplicate-claim guard passed without owner mutation.',
      };
    } catch (error) {
      return { result: 'FAIL', message: (error as Error).stack || (error as Error).message };
    }
  },
};
