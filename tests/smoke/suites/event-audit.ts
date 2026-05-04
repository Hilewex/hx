import { randomUUID } from 'node:crypto';
import { createEventEnvelope } from '@hx/events';
import {
  InMemoryAuditLogRepository,
  InMemoryOutboxEventRepository,
  buildOutboxEventInput,
} from '@hx/persistence';
import { SmokeRunner } from '../types';

export const eventAuditSmoke: SmokeRunner = {
  name: 'event-audit',
  run: async () => {
    try {
      const correlationId = `corr_${randomUUID()}`;
      const causationId = `cause_${randomUUID()}`;
      const aggregateId = `order_${randomUUID()}`;

      const envelope = createEventEnvelope({
        eventId: randomUUID(),
        eventType: 'order.created',
        payload: { orderId: aggregateId },
        source: 'event-audit-smoke',
        aggregateType: 'order',
        aggregateId,
        actorId: 'system',
        correlationId,
        causationId,
        traceId: 'trace_event_audit_smoke',
        schemaVersion: 'v1',
      });

      if (
        envelope.aggregateId !== aggregateId ||
        envelope.aggregateType !== 'order' ||
        envelope.actorId !== 'system' ||
        envelope.correlationId !== correlationId ||
        envelope.causationId !== causationId ||
        envelope.schemaVersion !== 'v1' ||
        envelope.businessTruthMutated !== false ||
        envelope.ownerStateMutated !== false
      ) {
        return { result: 'FAIL', message: 'EventEnvelope canonical fields or boundary flags failed' };
      }

      const audit = new InMemoryAuditLogRepository();
      const outbox = new InMemoryOutboxEventRepository();

      const auditRecord = await audit.appendAuditLog({
        actorType: 'system',
        actorId: 'event-audit-smoke',
        actionType: 'event_audit.foundation_verified',
        ownerService: 'event-audit',
        entityType: 'order',
        entityId: aggregateId,
        reason: 'FOUNDATION_SMOKE',
        correlationId,
        metadata: {
          causationId,
          auditBusinessMutationExpected: false,
        },
      });

      if (
        auditRecord.correlationId !== correlationId ||
        auditRecord.auditTruth !== true ||
        auditRecord.businessTruthMutated !== false ||
        auditRecord.ownerStateMutated !== false
      ) {
        return { result: 'FAIL', message: 'Audit append did not preserve foundation boundary fields' };
      }

      const outboxInput = buildOutboxEventInput({
        topic: 'event_audit.foundation_event',
        schemaVersion: 'v1',
        payloadSchema: 'event_audit.foundation_event.v1',
        payload: {
          aggregateId,
          businessTruthMutated: false,
          ownerStateMutated: false,
        },
        owner: 'event-audit',
        aggregateType: 'order',
        aggregateId,
        idempotencyKey: `event-audit:${aggregateId}`,
        correlationId,
        causationId,
      });

      const outboxRecord = await outbox.appendOutboxEvent(outboxInput);
      const duplicate = await outbox.appendOutboxEvent(outboxInput);
      if (
        outboxRecord.eventId !== duplicate.eventId ||
        outboxRecord.topic !== 'event_audit.foundation_event' ||
        outboxRecord.payloadSchema !== 'event_audit.foundation_event.v1' ||
        outboxRecord.correlationId !== correlationId ||
        outboxRecord.causationId !== causationId ||
        outboxRecord.businessTruthMutated !== false ||
        outboxRecord.ownerStateMutated !== false ||
        outboxRecord.deliveryGuaranteed !== false
      ) {
        return { result: 'FAIL', message: 'Outbox append policy, idempotency, or boundary fields failed' };
      }

      const pending = await outbox.listPendingOutboxEvents(10);
      if (pending.length !== 1 || pending[0].status !== 'pending') {
        return { result: 'FAIL', message: 'Outbox pending list failed' };
      }

      await outbox.markOutboxEventFailed(outboxRecord.eventId);
      const failed = await outbox.listPendingOutboxEvents(10);
      if (failed.some(event => event.eventId === outboxRecord.eventId)) {
        return { result: 'FAIL', message: 'Failed outbox event remained pending' };
      }

      const secondOutbox = await outbox.appendOutboxEvent(buildOutboxEventInput({
        topic: 'event_audit.publish_probe',
        payloadSchema: 'event_audit.publish_probe.v1',
        payload: { workerImplemented: false },
        ownerService: 'event-audit',
        entityType: 'order',
        entityId: `${aggregateId}:publish`,
        correlationId,
      }));
      await outbox.markOutboxEventPublished(secondOutbox.eventId);
      const finalPending = await outbox.listPendingOutboxEvents(10);
      if (finalPending.some(event => event.eventId === secondOutbox.eventId)) {
        return { result: 'FAIL', message: 'Published outbox event remained pending' };
      }

      return {
        result: 'PASS',
        message: 'Event envelope, audit append, outbox policy, boundary flags, and repository status transitions verified; no consumer/worker is implemented by this suite',
      };
    } catch (error: any) {
      return { result: 'FAIL', message: error.message };
    }
  },
};
