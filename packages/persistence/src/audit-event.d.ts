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
export declare function buildOutboxEventInput(input: OutboxProducerPolicyInput): AppendOutboxEventInput;
export declare const createOutboxEventInput: typeof buildOutboxEventInput;
export declare const normalizeOutboxProducerInput: typeof buildOutboxEventInput;
export declare class InMemoryAuditLogRepository implements AuditLogRepository {
    private logs;
    appendAuditLog(input: AppendAuditLogInput): Promise<AuditLogRecord>;
    getAuditLogById(auditId: string): Promise<AuditLogRecord | null>;
    listAuditLogsByEntity(ownerService: string, entityType: string, entityId: string): Promise<AuditLogRecord[]>;
}
export declare class InMemoryOutboxEventRepository implements OutboxEventRepository {
    private events;
    appendOutboxEvent(input: AppendOutboxEventInput): Promise<OutboxEventRecord>;
    getOutboxEventById(eventId: string): Promise<OutboxEventRecord | null>;
    listPendingOutboxEvents(limit?: number, filter?: ListPendingOutboxEventsFilter): Promise<OutboxEventRecord[]>;
    markOutboxEventPublished(eventId: string): Promise<OutboxEventRecord | null>;
    markOutboxEventFailed(eventId: string, failureMetadata?: JsonRecord | string | null): Promise<OutboxEventRecord | null>;
}
export declare class PostgresAuditLogRepository implements AuditLogRepository {
    appendAuditLog(input: AppendAuditLogInput): Promise<AuditLogRecord>;
    getAuditLogById(auditId: string): Promise<AuditLogRecord | null>;
    listAuditLogsByEntity(ownerService: string, entityType: string, entityId: string): Promise<AuditLogRecord[]>;
}
export declare class PostgresOutboxEventRepository implements OutboxEventRepository {
    appendOutboxEvent(input: AppendOutboxEventInput): Promise<OutboxEventRecord>;
    getOutboxEventById(eventId: string): Promise<OutboxEventRecord | null>;
    listPendingOutboxEvents(limit?: number, filter?: ListPendingOutboxEventsFilter): Promise<OutboxEventRecord[]>;
    markOutboxEventPublished(eventId: string): Promise<OutboxEventRecord | null>;
    markOutboxEventFailed(eventId: string, failureMetadata?: JsonRecord | string | null): Promise<OutboxEventRecord | null>;
}
export declare function getAuditEventRepositories(): AuditEventRepositories;
export declare function resetAuditEventRepositories(): void;
//# sourceMappingURL=audit-event.d.ts.map