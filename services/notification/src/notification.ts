import { 
  NotificationRecord, 
  CreateNotificationCommand, 
  NotificationListQuery, 
  NotificationListResponse,
  MarkNotificationReadCommand,
  ArchiveNotificationCommand,
  NotificationMutationResult,
  NotificationChannel,
  NotificationDeliveryMode,
  NotificationDeliveryAttempt,
  NotificationActorType,
  NotificationProviderType,
  NotificationDeliveryState
} from '@hx/contracts';
import { getNotificationRepository, setNotificationRepository } from './repository';
import { FoundationNotificationProviderAdapter } from './provider-adapter';
// @ts-ignore
import { getAuditEventRepositories } from '@hx/persistence';
import { randomUUID } from 'node:crypto';

export { setNotificationRepository };

export interface NotificationActorRef {
  actorType: NotificationActorType;
  actorId: string;
  allowCrossActorAccess?: boolean;
}

const notificationBoundary = {
  notificationTruthMutated: true,
  businessTruthMutated: false as const,
  ownerStateMutated: false as const,
  deliveryTruth: false as const,
  actualProviderDeliveryPerformed: false as const,
  outboxDeliveryGuaranteed: false as const,
};

export async function createNotification(command: CreateNotificationCommand): Promise<NotificationMutationResult> {
  const repository = getNotificationRepository();
  const { 
    actorType, actorId, title, body, category, priority,
    idempotencyKey, correlationId, objectType, objectId
  } = command;

  if (!actorType || !actorId) {
    return { success: false, errors: ['INVALID_NOTIFICATION_ACTOR'] };
  }

  if (!title || !body) {
    return { success: false, errors: ['INVALID_NOTIFICATION_CONTENT'] };
  }

  if (idempotencyKey) {
    const existingId = await repository.checkIdempotency(idempotencyKey);
    if (existingId) {
      const existingRecord = await repository.findById(existingId);
      return { success: true, record: existingRecord || undefined, ...notificationBoundary };
    }
  }

  const notificationId = randomUUID();
  const warnings: string[] = [];

  let isMandatory = false;
  let preferenceOverridable = true;
  let deliveryMode: NotificationDeliveryMode = command.deliveryMode || 'IMMEDIATE';

  if (priority === 'MANDATORY' || priority === 'CRITICAL') {
    isMandatory = true;
    preferenceOverridable = false;
    deliveryMode = 'IMMEDIATE';
  }

  if (priority === 'DIGEST' || category === 'SOCIAL') {
    deliveryMode = command.deliveryMode || 'DIGEST';
    preferenceOverridable = true;
  }

  let channels: NotificationChannel[] = command.channels || [];
  if (channels.length === 0) {
    if (actorType === 'SUPPLIER') {
      channels = ['PANEL_TASK', 'IN_APP'];
    } else {
      channels = ['IN_APP'];
    }
  }

  const record: NotificationRecord = {
    notificationId,
    actorType,
    actorId,
    recipientActorType: command.recipientActorType || actorType,
    recipientActorId: command.recipientActorId || actorId,
    submittedByActorType: command.submittedByActorType,
    submittedByActorId: command.submittedByActorId,
    actorContextSource: command.actorContextSource || 'SERVICE_COMMAND',
    category,
    priority,
    state: 'UNREAD',
    deliveryMode,
    channels,
    title,
    body,
    objectType,
    objectId,
    correlationId,
    causationId: command.causationId,
    schemaVersion: command.schemaVersion || 'v1',
    idempotencyKey,
    createdAt: new Date().toISOString(),
    isMandatory,
    preferenceOverridable,
    notificationTruthMutated: true,
    businessTruthMutated: false,
    ownerStateMutated: false,
    deliveryTruth: false,
    actualProviderDeliveryPerformed: false,
    outboxDeliveryGuaranteed: false,
    paymentTruthMutated: false,
    orderTruthMutated: false,
    refundTruthMutated: false,
    settlementTruthMutated: false,
    payoutTruthMutated: false,
    deliveryAttempts: [],
    warnings: warnings.length > 0 ? warnings : undefined
  };

  await repository.create(record);

  if (idempotencyKey) {
    await repository.saveIdempotency(idempotencyKey, notificationId);
  }

  const auditPromises: Promise<void>[] = [];

  // Handle Delivery Attempts
  for (const channel of channels) {
    const promise = (async () => {
      let attempt: NotificationDeliveryAttempt | null = null;
      const now = new Date().toISOString();
      let auditTopic: string | null = 'notification.delivery_attempted';

      if (channel === 'EMAIL') {
        const adapter = new FoundationNotificationProviderAdapter(process.env.NOTIFICATION_EMAIL_PROVIDER_NAME || 'email_sandbox', 'sandbox');
        const providerEnvelope = await adapter.send({ channel, correlationId: record.correlationId, causationId: record.causationId });
        attempt = {
          attemptId: randomUUID(),
          notificationId,
          providerType: 'EMAIL_SANDBOX',
          state: 'SANDBOX_DELIVERED',
          attemptedAt: now,
          actualProviderDeliveryPerformed: false,
          deliveryTruth: false,
          providerBoundary: 'SANDBOX',
          providerEnvelope,
        };
      } else if (channel === 'PUSH') {
        const adapter = new FoundationNotificationProviderAdapter(process.env.NOTIFICATION_PUSH_PROVIDER_NAME || 'push_parked', 'parked');
        const providerEnvelope = await adapter.send({ channel, correlationId: record.correlationId, causationId: record.causationId });
        attempt = {
          attemptId: randomUUID(),
          notificationId,
          providerType: 'PUSH_PARKED',
          state: 'PUSH_PROVIDER_PARKED',
          attemptedAt: now,
          actualProviderDeliveryPerformed: false,
          deliveryTruth: false,
          providerBoundary: 'PARKED',
          providerEnvelope,
        };
        warnings.push('PUSH_PROVIDER_PARKED');
        auditTopic = 'notification.provider_parked';
      } else if (channel === 'SMS') {
        const adapter = new FoundationNotificationProviderAdapter(process.env.NOTIFICATION_SMS_PROVIDER_NAME || 'none', 'not_configured');
        const providerEnvelope = await adapter.send({ channel, correlationId: record.correlationId, causationId: record.causationId });
        attempt = {
          attemptId: randomUUID(),
          notificationId,
          providerType: 'SMS_PARKED',
          state: 'PROVIDER_NOT_CONFIGURED',
          attemptedAt: now,
          actualProviderDeliveryPerformed: false,
          deliveryTruth: false,
          providerBoundary: 'NOT_CONFIGURED',
          providerEnvelope,
        };
        warnings.push('SMS_PROVIDER_NOT_CONFIGURED');
        auditTopic = 'notification.delivery_failed';
      } else if (channel === 'IN_APP') {
        attempt = {
          attemptId: randomUUID(),
          notificationId,
          providerType: 'IN_APP',
          state: 'SANDBOX_DELIVERED',
          attemptedAt: now,
          actualProviderDeliveryPerformed: false,
          deliveryTruth: false,
          providerBoundary: 'LOCAL_ONLY'
        };
      } else if (channel === 'PANEL_TASK') {
        attempt = {
          attemptId: randomUUID(),
          notificationId,
          providerType: 'PANEL_TASK',
          state: 'SANDBOX_DELIVERED',
          attemptedAt: now,
          actualProviderDeliveryPerformed: false,
          deliveryTruth: false,
          providerBoundary: 'LOCAL_ONLY'
        };
      }

      if (attempt) {
        await repository.addDeliveryAttempt(attempt);
        record.deliveryAttempts.push(attempt);
        if (auditTopic) {
          await appendAuditAndOutbox(auditTopic, record, null, attempt, warnings);
        }
      }
    })();
    auditPromises.push(promise);
  }

  // Wait for all delivery attempts and their audit logs to be processed
  await Promise.all(auditPromises);

  if (warnings.length > 0) record.warnings = warnings;

  // Final Created Audit. Pass a serializable-safe object as afterState.
  await appendAuditAndOutbox('notification.created', record, null, { notificationId: record.notificationId, state: record.state }, warnings);

  return { success: true, record, warnings, ...notificationBoundary };
}

export async function listNotifications(query: NotificationListQuery): Promise<NotificationListResponse> {
  const repository = getNotificationRepository();
  const result = await repository.list(query);
  return result;
}

export async function listNotificationsForActor(actor: NotificationActorRef, query: NotificationListQuery): Promise<NotificationListResponse> {
  if (!actor.allowCrossActorAccess && !matchesNotificationActor(actor, query.actorType, query.actorId)) {
    return { items: [], unreadCount: 0, errors: ['NOTIFICATION_ACCESS_DENIED'] };
  }
  return listNotifications(query);
}

export async function getNotificationById(notificationId: string): Promise<NotificationRecord | undefined> {
  const repository = getNotificationRepository();
  const record = await repository.findById(notificationId);
  return record || undefined;
}

export async function getNotificationForActor(notificationId: string, actor: NotificationActorRef): Promise<NotificationRecord | undefined> {
  const record = await getNotificationById(notificationId);
  if (!record) return undefined;
  if (!actor.allowCrossActorAccess && !ownsNotification(record, actor)) {
    return undefined;
  }
  return record;
}

export async function markNotificationRead(command: MarkNotificationReadCommand): Promise<NotificationMutationResult> {
  const repository = getNotificationRepository();
  const record = await repository.findById(command.notificationId);

  if (!record) {
    return { success: false, errors: ['NOTIFICATION_NOT_FOUND'], ...notificationBoundary };
  }

  if (record.state === 'ARCHIVED') {
    return { success: true, record, warnings: ['NOTIFICATION_ARCHIVED'], ...notificationBoundary };
  }

  if (record.state === 'UNREAD') {
    const beforeState = { ...record };
    record.state = 'READ';
    const now = new Date().toISOString();
    record.readAt = now;
    await repository.updateState(record.notificationId, 'READ', now);
    const warnings: string[] = [];
    await appendAuditAndOutbox('notification.read', record, beforeState, record, warnings);
    if (warnings.length > 0) record.warnings = (record.warnings || []).concat(warnings);
  }

  return { success: true, record, ...notificationBoundary };
}

export async function markNotificationReadForActor(command: MarkNotificationReadCommand, actor: NotificationActorRef): Promise<NotificationMutationResult> {
  const record = await getNotificationById(command.notificationId);
  if (!record) {
    return { success: false, errors: ['NOTIFICATION_NOT_FOUND'], ...notificationBoundary };
  }
  if (!actor.allowCrossActorAccess && !ownsNotification(record, actor)) {
    return { success: false, errors: ['NOTIFICATION_ACCESS_DENIED'], ...notificationBoundary };
  }
  return markNotificationRead(command);
}

export async function archiveNotification(command: ArchiveNotificationCommand): Promise<NotificationMutationResult> {
  const repository = getNotificationRepository();
  const record = await repository.findById(command.notificationId);

  if (!record) {
    return { success: false, errors: ['NOTIFICATION_NOT_FOUND'], ...notificationBoundary };
  }

  if (record.state !== 'ARCHIVED') {
    const beforeState = { ...record };
    const warnings: string[] = [];
    if (record.priority === 'CRITICAL' || record.priority === 'MANDATORY') {
      warnings.push('CRITICAL_NOTIFICATION_ARCHIVED');
    }
    const now = new Date().toISOString();
    record.state = 'ARCHIVED';
    record.archivedAt = now;
    await repository.updateState(record.notificationId, 'ARCHIVED', now);
    await appendAuditAndOutbox('notification.archived', record, beforeState, record, warnings);
    return { success: true, record, warnings, ...notificationBoundary };
  }

  return { success: true, record, ...notificationBoundary };
}

export async function archiveNotificationForActor(command: ArchiveNotificationCommand, actor: NotificationActorRef): Promise<NotificationMutationResult> {
  const record = await getNotificationById(command.notificationId);
  if (!record) {
    return { success: false, errors: ['NOTIFICATION_NOT_FOUND'], ...notificationBoundary };
  }
  if (!actor.allowCrossActorAccess && !ownsNotification(record, actor)) {
    return { success: false, errors: ['NOTIFICATION_ACCESS_DENIED'], ...notificationBoundary };
  }
  return archiveNotification(command);
}

function ownsNotification(record: NotificationRecord, actor: NotificationActorRef): boolean {
  return matchesNotificationActor(actor, record.recipientActorType || record.actorType, record.recipientActorId || record.actorId);
}

function matchesNotificationActor(actor: NotificationActorRef, actorType: NotificationActorType, actorId: string): boolean {
  return actor.actorType === actorType && actor.actorId === actorId;
}

async function appendAuditAndOutbox(actionType: string, record: NotificationRecord, beforeState: any, afterState: any, warnings: string[]) {
  try {
    const { audit, outbox } = getAuditEventRepositories();
    const safeBeforeState = toJsonSafe(beforeState);
    const safeAfterState = toJsonSafe(afterState);
    const safeMetadata = toJsonSafe({
      schemaVersion: record.schemaVersion || 'v1',
      causationId: record.causationId,
      submittedByActorType: record.submittedByActorType,
      submittedByActorId: record.submittedByActorId,
      businessTruthMutated: false,
      ownerStateMutated: false,
      outboxDeliveryGuaranteed: false,
    });
    
    await audit.appendAuditLog({
      actorType: record.actorType,
      actorId: record.actorId,
      actionType,
      ownerService: 'notification',
      entityType: 'notification',
      entityId: record.notificationId,
      beforeState: safeBeforeState,
      afterState: safeAfterState,
      correlationId: record.correlationId,
      metadata: safeMetadata as Record<string, unknown>,
      idempotencyKey: record.idempotencyKey ? `${actionType}:${record.idempotencyKey}:${randomUUID()}` : undefined
    });

    await outbox.appendOutboxEvent({
      topic: actionType,
      payloadSchema: `${actionType}.v1`,
      payload: {
        notificationId: record.notificationId,
        actorId: record.actorId,
        actorType: record.actorType,
        recipientActorType: record.recipientActorType,
        recipientActorId: record.recipientActorId,
        submittedByActorType: record.submittedByActorType,
        submittedByActorId: record.submittedByActorId,
        schemaVersion: record.schemaVersion || 'v1',
        causationId: record.causationId,
        businessTruthMutated: false,
        ownerStateMutated: false,
        outboxDeliveryGuaranteed: false,
        data: safeAfterState
      },
      ownerService: 'notification',
      entityType: 'notification',
      entityId: record.notificationId,
      correlationId: record.correlationId,
      causationId: record.causationId,
      idempotencyKey: record.idempotencyKey ? `outbox:${actionType}:${record.idempotencyKey}:${randomUUID()}` : undefined
    });
  } catch (err) {
    console.warn('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE', err);
    if (!warnings.includes('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE')) {
      warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
    }
  }
}

function toJsonSafe(value: any, seen = new WeakSet<object>()): any {
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (seen.has(value)) {
    return '[Circular]';
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map(item => {
      const safeItem = toJsonSafe(item, seen);
      return safeItem === undefined ? null : safeItem;
    });
  }

  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    const safeChild = toJsonSafe(child, seen);
    if (safeChild !== undefined) {
      output[key] = safeChild;
    }
  }
  return output;
}
