import { randomUUID } from 'node:crypto';
import {
  buildOutboxEventInput,
  closePool,
  getAuditEventRepositories,
} from '@hx/persistence';
import { SmokeRunner } from '../types';

function hasOutboxFailureReason(payload: Record<string, unknown>, expectedReason: string): boolean {
  const failure = payload.outboxFailure;
  return Boolean(
    failure &&
    typeof failure === 'object' &&
    'reason' in failure &&
    (failure as { reason?: unknown }).reason === expectedReason
  );
}

export const eventOutboxSmoke: SmokeRunner = {
  name: 'event-outbox',
  run: async () => {
    try {
      const { outbox } = getAuditEventRepositories();
      const correlationId = `corr_${randomUUID()}`;
      const causationId = `cause_${randomUUID()}`;
      const aggregateId = `outbox_${randomUUID()}`;
      const idempotencyKey = `event-outbox:${aggregateId}`;

      const appendInput = buildOutboxEventInput({
        topic: 'event_outbox.lifecycle_verified',
        payloadSchema: 'event_outbox.lifecycle_verified.v1',
        schemaVersion: 'v1',
        payload: {
          aggregateId,
          schemaVersion: 'v1',
          payloadSchema: 'event_outbox.lifecycle_verified.v1',
          businessTruthMutated: false,
          ownerStateMutated: false,
          deliveryGuaranteed: false,
          productionWorkerImplemented: false,
        },
        owner: 'event-outbox',
        aggregateType: 'outbox_smoke',
        aggregateId,
        idempotencyKey,
        correlationId,
        causationId,
      });

      const appended = await outbox.appendOutboxEvent(appendInput);

      if (
        appended.status !== 'pending' ||
        appended.retryCount !== 0 ||
        appended.topic !== 'event_outbox.lifecycle_verified' ||
        appended.payloadSchema !== 'event_outbox.lifecycle_verified.v1' ||
        appended.ownerService !== 'event-outbox' ||
        appended.entityType !== 'outbox_smoke' ||
        appended.entityId !== aggregateId ||
        appended.idempotencyKey !== idempotencyKey ||
        appended.correlationId !== correlationId ||
        appended.causationId !== causationId ||
        appended.businessTruthMutated !== false ||
        appended.ownerStateMutated !== false ||
        appended.deliveryGuaranteed !== false
      ) {
        return { result: 'FAIL', message: 'Outbox append did not preserve lifecycle, producer policy, or boundary fields' };
      }

      const pending = await outbox.listPendingOutboxEvents(10, {
        ownerService: 'event-outbox',
        entityType: 'outbox_smoke',
        entityId: aggregateId,
      });
      if (pending.length !== 1 || pending[0].eventId !== appended.eventId || pending[0].status !== 'pending') {
        return { result: 'FAIL', message: 'Pending outbox list did not include the appended pending event' };
      }

      const duplicate = await outbox.appendOutboxEvent({
        ...appendInput,
        eventId: randomUUID(),
        payload: {
          aggregateId,
          duplicateProbe: true,
          businessTruthMutated: true,
          ownerStateMutated: true,
          deliveryGuaranteed: true,
        },
      });

      if (
        duplicate.eventId !== appended.eventId ||
        duplicate.status !== 'pending' ||
        duplicate.payload.businessTruthMutated !== false ||
        duplicate.payload.ownerStateMutated !== false ||
        duplicate.payload.deliveryGuaranteed !== false
      ) {
        return { result: 'FAIL', message: 'Duplicate idempotency key did not deterministically return the original outbox event' };
      }

      const published = await outbox.markOutboxEventPublished(appended.eventId);
      if (!published || published.status !== 'published' || published.retryCount !== 0) {
        return { result: 'FAIL', message: 'Published transition did not return published status without retry increment' };
      }

      const pendingAfterPublish = await outbox.listPendingOutboxEvents(10, {
        ownerService: 'event-outbox',
        entityType: 'outbox_smoke',
        entityId: aggregateId,
      });
      if (pendingAfterPublish.some(event => event.eventId === appended.eventId)) {
        return { result: 'FAIL', message: 'Published outbox event remained in pending list' };
      }

      const failAggregateId = `outbox_fail_${randomUUID()}`;
      const failedProbe = await outbox.appendOutboxEvent(buildOutboxEventInput({
        topic: 'event_outbox.failure_verified',
        payloadSchema: 'event_outbox.failure_verified.v1',
        payload: {
          aggregateId: failAggregateId,
          schemaVersion: 'v1',
          payloadSchema: 'event_outbox.failure_verified.v1',
          businessTruthMutated: false,
          ownerStateMutated: false,
          deliveryGuaranteed: false,
          productionWorkerImplemented: false,
        },
        ownerService: 'event-outbox',
        entityType: 'outbox_smoke',
        entityId: failAggregateId,
        idempotencyKey: `event-outbox:${failAggregateId}`,
        correlationId,
        causationId,
      }));

      const failed = await outbox.markOutboxEventFailed(failedProbe.eventId, {
        reason: 'CONTROLLED_SMOKE_FAILURE',
        workerScope: 'foundation-only',
      });

      if (
        !failed ||
        failed.status !== 'failed' ||
        failed.retryCount !== 1 ||
        failed.correlationId !== correlationId ||
        failed.causationId !== causationId ||
        failed.payloadSchema !== 'event_outbox.failure_verified.v1' ||
        failed.deliveryGuaranteed !== false ||
        failed.businessTruthMutated !== false ||
        failed.ownerStateMutated !== false ||
        !hasOutboxFailureReason(failed.payload, 'CONTROLLED_SMOKE_FAILURE')
      ) {
        return { result: 'FAIL', message: 'Failed transition did not preserve retry, failure metadata, correlation, schema, or boundary fields' };
      }

      const failedReload = await outbox.getOutboxEventById(failedProbe.eventId);
      if (!failedReload || failedReload.status !== 'failed' || failedReload.retryCount !== 1) {
        return { result: 'FAIL', message: 'Outbox get by id did not return the failed lifecycle state' };
      }

      const finalPending = await outbox.listPendingOutboxEvents(10, {
        ownerService: 'event-outbox',
        entityType: 'outbox_smoke',
        entityId: failAggregateId,
      });
      if (finalPending.some(event => event.eventId === failedProbe.eventId)) {
        return { result: 'FAIL', message: 'Failed outbox event remained in pending list' };
      }

      await closePool().catch(() => undefined);
      return {
        result: 'PASS',
        message: 'Outbox append, pending list, published/failed transitions, retry count, idempotency, correlation/causation, schema, and boundary flags verified; no production worker or delivery guarantee is implemented',
      };
    } catch (error: any) {
      await closePool().catch(() => undefined);
      return { result: 'FAIL', message: error.message };
    }
  },
};
