import { randomUUID } from 'node:crypto';
import { query } from './index';

export type JsonRecord = Record<string, unknown>;
export type OutboxEventStatus = 'pending' | 'published' | 'failed';

export interface AuditLogRecord {
  auditId: string;
  actorType: string;
  actorId: string;
  actionType: string;
  ownerService: string;
  entityType: string;
  entityId: string;
  beforeState?: unknown | null;
  afterState?: unknown | null;
  reason?: string | null;
  idempotencyKey?: string | null;
  correlationId?: string | null;
  metadata: JsonRecord;
  createdAt: string;
  auditTruth: true;
  businessTruthMutated: false;
  ownerStateMutated: false;
}

export interface AppendAuditLogInput {
  auditId?: string;
  actorType: string;
  actorId: string;
  actionType: string;
  ownerService: string;
  entityType: string;
  entityId: string;
  beforeState?: unknown | null;
  afterState?: unknown | null;
  reason?: string | null;
  idempotencyKey?: string | null;
  correlationId?: string | null;
  metadata?: JsonRecord;
  createdAt?: string;
}

export interface OutboxEventRecord {
  eventId: string;
  topic: string;
  payloadSchema: string;
  payload: JsonRecord;
  ownerService: string;
  entityType: string;
  entityId: string;
  occurredAt: string;
  status: OutboxEventStatus;
  retryCount: number;
  idempotencyKey?: string | null;
  correlationId?: string | null;
  causationId?: string | null;
  createdAt: string;
  updatedAt: string;
  outboxTruth: true;
  businessTruthMutated: false;
  ownerStateMutated: false;
  deliveryGuaranteed: false;
}

export interface AppendOutboxEventInput {
  eventId?: string;
  topic: string;
  payloadSchema: string;
  payload: JsonRecord;
  ownerService: string;
  entityType: string;
  entityId: string;
  occurredAt?: string;
  idempotencyKey?: string | null;
  correlationId?: string | null;
  causationId?: string | null;
}

export interface ListPendingOutboxEventsFilter {
  ownerService?: string;
  entityType?: string;
  entityId?: string;
}

export interface OutboxProducerPolicyInput {
  eventId?: string;
  topic: string;
  payloadSchema?: string;
  schemaVersion?: string;
  payload: JsonRecord;
  owner?: string;
  ownerService?: string;
  aggregateType?: string;
  aggregateId?: string;
  entityType?: string;
  entityId?: string;
  occurredAt?: string;
  idempotencyKey?: string | null;
  correlationId?: string | null;
  causationId?: string | null;
}

export interface AuditLogRepository {
  appendAuditLog(input: AppendAuditLogInput): Promise<AuditLogRecord>;
  getAuditLogById(auditId: string): Promise<AuditLogRecord | null>;
  listAuditLogsByEntity(ownerService: string, entityType: string, entityId: string): Promise<AuditLogRecord[]>;
}

export interface OutboxEventRepository {
  appendOutboxEvent(input: AppendOutboxEventInput): Promise<OutboxEventRecord>;
  getOutboxEventById(eventId: string): Promise<OutboxEventRecord | null>;
  listPendingOutboxEvents(limit?: number, filter?: ListPendingOutboxEventsFilter): Promise<OutboxEventRecord[]>;
  markOutboxEventPublished(eventId: string): Promise<OutboxEventRecord | null>;
  markOutboxEventFailed(eventId: string, failureMetadata?: JsonRecord | string | null): Promise<OutboxEventRecord | null>;
}

export interface AuditEventRepositories {
  audit: AuditLogRepository;
  outbox: OutboxEventRepository;
}

function nowIso() {
  return new Date().toISOString();
}

function makeAuditRecord(input: AppendAuditLogInput): AuditLogRecord {
  return {
    auditId: input.auditId || randomUUID(),
    actorType: input.actorType,
    actorId: input.actorId,
    actionType: input.actionType,
    ownerService: input.ownerService,
    entityType: input.entityType,
    entityId: input.entityId,
    beforeState: input.beforeState ?? null,
    afterState: input.afterState ?? null,
    reason: input.reason ?? null,
    idempotencyKey: input.idempotencyKey ?? null,
    correlationId: input.correlationId ?? null,
    metadata: input.metadata || {},
    createdAt: input.createdAt || nowIso(),
    auditTruth: true,
    businessTruthMutated: false,
    ownerStateMutated: false,
  };
}

function makeOutboxRecord(input: AppendOutboxEventInput): OutboxEventRecord {
  const timestamp = nowIso();
  return {
    eventId: input.eventId || randomUUID(),
    topic: input.topic,
    payloadSchema: input.payloadSchema,
    payload: input.causationId && !('causationId' in input.payload)
      ? { ...input.payload, causationId: input.causationId }
      : input.payload,
    ownerService: input.ownerService,
    entityType: input.entityType,
    entityId: input.entityId,
    occurredAt: input.occurredAt || timestamp,
    status: 'pending',
    retryCount: 0,
    idempotencyKey: input.idempotencyKey ?? null,
    correlationId: input.correlationId ?? null,
    causationId: input.causationId ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
    outboxTruth: true,
    businessTruthMutated: false,
    ownerStateMutated: false,
    deliveryGuaranteed: false,
  };
}

export function buildOutboxEventInput(input: OutboxProducerPolicyInput): AppendOutboxEventInput {
  const schemaVersion = input.schemaVersion || input.payloadSchema || 'v1';
  const ownerService = input.ownerService || input.owner;
  const entityType = input.entityType || input.aggregateType;
  const entityId = input.entityId || input.aggregateId;

  if (!ownerService) throw new Error('OUTBOX_OWNER_REQUIRED');
  if (!entityType) throw new Error('OUTBOX_AGGREGATE_TYPE_REQUIRED');
  if (!entityId) throw new Error('OUTBOX_AGGREGATE_ID_REQUIRED');

  return {
    eventId: input.eventId,
    topic: input.topic,
    payloadSchema: input.payloadSchema || `${input.topic}.${schemaVersion}`,
    payload: input.payload,
    ownerService,
    entityType,
    entityId,
    occurredAt: input.occurredAt,
    idempotencyKey: input.idempotencyKey,
    correlationId: input.correlationId,
    causationId: input.causationId,
  };
}

export const createOutboxEventInput = buildOutboxEventInput;
export const normalizeOutboxProducerInput = buildOutboxEventInput;

export class InMemoryAuditLogRepository implements AuditLogRepository {
  private logs = new Map<string, AuditLogRecord>();

  async appendAuditLog(input: AppendAuditLogInput): Promise<AuditLogRecord> {
    const record = makeAuditRecord(input);
    this.logs.set(record.auditId, record);
    return record;
  }

  async getAuditLogById(auditId: string): Promise<AuditLogRecord | null> {
    return this.logs.get(auditId) || null;
  }

  async listAuditLogsByEntity(ownerService: string, entityType: string, entityId: string): Promise<AuditLogRecord[]> {
    return Array.from(this.logs.values()).filter(log =>
      log.ownerService === ownerService &&
      log.entityType === entityType &&
      log.entityId === entityId
    );
  }
}

export class InMemoryOutboxEventRepository implements OutboxEventRepository {
  private events = new Map<string, OutboxEventRecord>();

  async appendOutboxEvent(input: AppendOutboxEventInput): Promise<OutboxEventRecord> {
    const record = makeOutboxRecord(input);
    if (record.idempotencyKey) {
      const existing = Array.from(this.events.values()).find(event => event.idempotencyKey === record.idempotencyKey);
      if (existing) return existing;
    }
    this.events.set(record.eventId, record);
    return record;
  }

  async getOutboxEventById(eventId: string): Promise<OutboxEventRecord | null> {
    return this.events.get(eventId) || null;
  }

  async listPendingOutboxEvents(limit = 100, filter: ListPendingOutboxEventsFilter = {}): Promise<OutboxEventRecord[]> {
    return Array.from(this.events.values())
      .filter(event => event.status === 'pending')
      .filter(event => !filter.ownerService || event.ownerService === filter.ownerService)
      .filter(event => !filter.entityType || event.entityType === filter.entityType)
      .filter(event => !filter.entityId || event.entityId === filter.entityId)
      .slice(0, limit);
  }

  async markOutboxEventPublished(eventId: string): Promise<OutboxEventRecord | null> {
    const event = this.events.get(eventId);
    if (!event) return null;
    const updated = { ...event, status: 'published' as const, updatedAt: nowIso() };
    this.events.set(eventId, updated);
    return updated;
  }

  async markOutboxEventFailed(eventId: string, failureMetadata: JsonRecord | string | null = null): Promise<OutboxEventRecord | null> {
    const event = this.events.get(eventId);
    if (!event) return null;
    const failurePayload = typeof failureMetadata === 'string'
      ? { reason: failureMetadata }
      : failureMetadata;
    const updated = {
      ...event,
      status: 'failed' as const,
      retryCount: event.retryCount + 1,
      payload: failurePayload ? { ...event.payload, outboxFailure: failurePayload } : event.payload,
      updatedAt: nowIso(),
    };
    this.events.set(eventId, updated);
    return updated;
  }
}

export class PostgresAuditLogRepository implements AuditLogRepository {
  async appendAuditLog(input: AppendAuditLogInput): Promise<AuditLogRecord> {
    const record = makeAuditRecord(input);
    const res = await query(
      `INSERT INTO audit_logs (
        audit_id, actor_type, actor_id, action_type, owner_service, entity_type, entity_id,
        before_state, after_state, reason, idempotency_key, correlation_id, metadata, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        record.auditId,
        record.actorType,
        record.actorId,
        record.actionType,
        record.ownerService,
        record.entityType,
        record.entityId,
        JSON.stringify(record.beforeState),
        JSON.stringify(record.afterState),
        record.reason,
        record.idempotencyKey,
        record.correlationId,
        JSON.stringify(record.metadata),
        record.createdAt,
      ]
    );
    return mapAuditRow(res.rows[0]);
  }

  async getAuditLogById(auditId: string): Promise<AuditLogRecord | null> {
    const res = await query('SELECT * FROM audit_logs WHERE audit_id = $1', [auditId]);
    if (!res.rowCount) return null;
    return mapAuditRow(res.rows[0]);
  }

  async listAuditLogsByEntity(ownerService: string, entityType: string, entityId: string): Promise<AuditLogRecord[]> {
    const res = await query(
      `SELECT * FROM audit_logs
       WHERE owner_service = $1 AND entity_type = $2 AND entity_id = $3
       ORDER BY created_at ASC`,
      [ownerService, entityType, entityId]
    );
    return res.rows.map(mapAuditRow);
  }
}

export class PostgresOutboxEventRepository implements OutboxEventRepository {
  async appendOutboxEvent(input: AppendOutboxEventInput): Promise<OutboxEventRecord> {
    const record = makeOutboxRecord(input);
    const res = await query(
      `INSERT INTO event_outbox (
        event_id, topic, payload_schema, payload, owner_service, entity_type, entity_id,
        occurred_at, status, retry_count, idempotency_key, correlation_id, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL
      DO UPDATE SET updated_at = event_outbox.updated_at
      RETURNING *`,
      [
        record.eventId,
        record.topic,
        record.payloadSchema,
        JSON.stringify(record.payload),
        record.ownerService,
        record.entityType,
        record.entityId,
        record.occurredAt,
        record.status,
        record.retryCount,
        record.idempotencyKey,
        record.correlationId,
        record.createdAt,
        record.updatedAt,
      ]
    );
    return mapOutboxRow(res.rows[0]);
  }

  async getOutboxEventById(eventId: string): Promise<OutboxEventRecord | null> {
    const res = await query('SELECT * FROM event_outbox WHERE event_id = $1', [eventId]);
    if (!res.rowCount) return null;
    return mapOutboxRow(res.rows[0]);
  }

  async listPendingOutboxEvents(limit = 100, filter: ListPendingOutboxEventsFilter = {}): Promise<OutboxEventRecord[]> {
    const res = await query(
      `SELECT * FROM event_outbox
       WHERE status = 'pending'
         AND ($2::text IS NULL OR owner_service = $2)
         AND ($3::text IS NULL OR entity_type = $3)
         AND ($4::text IS NULL OR entity_id = $4)
       ORDER BY occurred_at ASC
       LIMIT $1`,
      [limit, filter.ownerService ?? null, filter.entityType ?? null, filter.entityId ?? null]
    );
    return res.rows.map(mapOutboxRow);
  }

  async markOutboxEventPublished(eventId: string): Promise<OutboxEventRecord | null> {
    const res = await query(
      `UPDATE event_outbox
       SET status = 'published', updated_at = NOW()
       WHERE event_id = $1
       RETURNING *`,
      [eventId]
    );
    if (!res.rowCount) return null;
    return mapOutboxRow(res.rows[0]);
  }

  async markOutboxEventFailed(eventId: string, failureMetadata: JsonRecord | string | null = null): Promise<OutboxEventRecord | null> {
    const failurePayload = typeof failureMetadata === 'string'
      ? { reason: failureMetadata }
      : failureMetadata;
    const res = await query(
      `UPDATE event_outbox
       SET status = 'failed',
           retry_count = retry_count + 1,
           payload = CASE
             WHEN $2::jsonb IS NULL THEN payload
             ELSE payload || jsonb_build_object('outboxFailure', $2::jsonb)
           END,
           updated_at = NOW()
       WHERE event_id = $1
       RETURNING *`,
      [eventId, failurePayload ? JSON.stringify(failurePayload) : null]
    );
    if (!res.rowCount) return null;
    return mapOutboxRow(res.rows[0]);
  }
}

let auditEventRepositories: AuditEventRepositories | null = null;

export function getAuditEventRepositories(): AuditEventRepositories {
  if (auditEventRepositories) return auditEventRepositories;

  const mode = process.env.PERSISTENCE_MODE || 'memory';
  if (mode === 'postgres') {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for postgres persistence mode');
    }
    auditEventRepositories = {
      audit: new PostgresAuditLogRepository(),
      outbox: new PostgresOutboxEventRepository(),
    };
  } else {
    auditEventRepositories = {
      audit: new InMemoryAuditLogRepository(),
      outbox: new InMemoryOutboxEventRepository(),
    };
  }

  return auditEventRepositories;
}

export function resetAuditEventRepositories() {
  auditEventRepositories = null;
}

function mapAuditRow(row: any): AuditLogRecord {
  return {
    auditId: row.audit_id,
    actorType: row.actor_type,
    actorId: row.actor_id,
    actionType: row.action_type,
    ownerService: row.owner_service,
    entityType: row.entity_type,
    entityId: row.entity_id,
    beforeState: row.before_state,
    afterState: row.after_state,
    reason: row.reason,
    idempotencyKey: row.idempotency_key,
    correlationId: row.correlation_id,
    metadata: row.metadata || {},
    createdAt: new Date(row.created_at).toISOString(),
    auditTruth: true,
    businessTruthMutated: false,
    ownerStateMutated: false,
  };
}

function mapOutboxRow(row: any): OutboxEventRecord {
  return {
    eventId: row.event_id,
    topic: row.topic,
    payloadSchema: row.payload_schema,
    payload: row.payload || {},
    ownerService: row.owner_service,
    entityType: row.entity_type,
    entityId: row.entity_id,
    occurredAt: new Date(row.occurred_at).toISOString(),
    status: row.status,
    retryCount: Number(row.retry_count),
    idempotencyKey: row.idempotency_key,
    correlationId: row.correlation_id,
    causationId: row.payload?.causationId || row.payload?.metadata?.causationId || null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    outboxTruth: true,
    businessTruthMutated: false,
    ownerStateMutated: false,
    deliveryGuaranteed: false,
  };
}
