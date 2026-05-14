export type OperationalIntentDomain = 'refund' | 'moderation' | 'risk' | 'fraud';
export type OperationalWorkflowState = 'prepared' | 'checker_required' | 'checked' | 'rejected' | 'escalated' | 'owner_handoff_pending' | 'owner_handoff_ready';
export type AuditIntentDeliveryState = 'pending' | 'processing' | 'delivered' | 'failed' | 'dead_letter';
export type OperationalIntentJsonRecord = Record<string, unknown>;
export interface OperationalIntentRecord {
    intentId: string;
    domain: OperationalIntentDomain;
    targetId: string;
    actionType: string;
    makerActorId: string;
    checkerActorId?: string | null;
    workflowState: OperationalWorkflowState;
    reasonCode: string;
    evidenceRefs: string[];
    idempotencyKey: string;
    boundaryFlags: OperationalIntentJsonRecord;
    createdAt: string;
    updatedAt: string;
}
export interface AuditIntentOutboxRecord {
    outboxId: string;
    intentId: string;
    domain: OperationalIntentDomain;
    targetId: string;
    actorId: string;
    actionType: string;
    reasonCode: string;
    evidenceRefs: string[];
    makerCheckerContext: OperationalIntentJsonRecord;
    idempotencyKey: string;
    deliveryState: AuditIntentDeliveryState;
    retryCount: number;
    nextRetryAt?: string | null;
    lastError?: string | null;
    deadLetterReason?: string | null;
    lastDeliveryAttemptAt?: string | null;
    leaseOwner?: string | null;
    leaseUntil?: string | null;
    claimedAt?: string | null;
    processingStartedAt?: string | null;
    createdAt: string;
    deliveredAt?: string | null;
}
export interface RecordOperationalIntentInput {
    intentId?: string;
    domain: OperationalIntentDomain;
    targetId: string;
    actionType: string;
    makerActorId: string;
    checkerActorId?: string | null;
    workflowState: OperationalWorkflowState;
    reasonCode: string;
    evidenceRefs: string[];
    idempotencyKey: string;
    boundaryFlags: OperationalIntentJsonRecord;
    actorId: string;
    makerCheckerContext: OperationalIntentJsonRecord;
}
export interface OperationalIntentRecordResult {
    intent: OperationalIntentRecord;
    auditOutbox: AuditIntentOutboxRecord;
    idempotentReplay: boolean;
    persisted: true;
}
export interface OperationalIntentRepository {
    recordIntentWithAuditOutbox(input: RecordOperationalIntentInput): Promise<OperationalIntentRecordResult>;
    listIntents(input?: {
        domains?: OperationalIntentDomain[];
        workflowState?: OperationalWorkflowState;
        limit?: number;
    }): Promise<OperationalIntentRecord[]>;
    getIntentById(intentId: string): Promise<OperationalIntentRecord | null>;
    getIntentByIdempotencyKey(idempotencyKey: string): Promise<OperationalIntentRecord | null>;
    getAuditOutboxByIdempotencyKey(idempotencyKey: string): Promise<AuditIntentOutboxRecord | null>;
    getAuditOutboxByIntentId(intentId: string): Promise<AuditIntentOutboxRecord | null>;
    getLatestIntentByTarget(domain: OperationalIntentDomain, targetId: string): Promise<OperationalIntentRecord | null>;
    getLatestAuditOutboxByTarget(domain: OperationalIntentDomain, targetId: string): Promise<AuditIntentOutboxRecord | null>;
    listDeliverableAuditOutbox(input?: {
        limit?: number;
        now?: Date;
        states?: AuditIntentDeliveryState[];
    }): Promise<AuditIntentOutboxRecord[]>;
    claimAuditOutboxLease(outboxId: string, input: {
        leaseOwner: string;
        leaseUntil: Date;
        now?: Date;
    }): Promise<AuditIntentOutboxRecord | null>;
    releaseAuditOutboxLease(outboxId: string, leaseOwner: string): Promise<AuditIntentOutboxRecord | null>;
    markAuditOutboxProcessing(outboxId: string, attemptedAt?: Date): Promise<AuditIntentOutboxRecord | null>;
    markAuditOutboxDelivered(outboxId: string, deliveredAt?: Date): Promise<AuditIntentOutboxRecord | null>;
    markAuditOutboxFailed(outboxId: string, input: {
        lastError: string;
        retryCount: number;
        nextRetryAt?: Date | null;
    }): Promise<AuditIntentOutboxRecord | null>;
    markAuditOutboxDeadLetter(outboxId: string, input: {
        deadLetterReason: string;
        lastError?: string | null;
        retryCount: number;
    }): Promise<AuditIntentOutboxRecord | null>;
}
export declare class InMemoryOperationalIntentRepository implements OperationalIntentRepository {
    private intents;
    private intentFingerprints;
    private auditOutbox;
    recordIntentWithAuditOutbox(input: RecordOperationalIntentInput): Promise<OperationalIntentRecordResult>;
    listIntents(input?: {
        domains?: OperationalIntentDomain[];
        workflowState?: OperationalWorkflowState;
        limit?: number;
    }): Promise<OperationalIntentRecord[]>;
    getIntentById(intentId: string): Promise<OperationalIntentRecord | null>;
    getIntentByIdempotencyKey(idempotencyKey: string): Promise<OperationalIntentRecord | null>;
    getAuditOutboxByIdempotencyKey(idempotencyKey: string): Promise<AuditIntentOutboxRecord | null>;
    getAuditOutboxByIntentId(intentId: string): Promise<AuditIntentOutboxRecord | null>;
    getLatestIntentByTarget(domain: OperationalIntentDomain, targetId: string): Promise<OperationalIntentRecord | null>;
    getLatestAuditOutboxByTarget(domain: OperationalIntentDomain, targetId: string): Promise<AuditIntentOutboxRecord | null>;
    listDeliverableAuditOutbox(input?: {
        limit?: number;
        now?: Date;
        states?: AuditIntentDeliveryState[];
    }): Promise<AuditIntentOutboxRecord[]>;
    claimAuditOutboxLease(outboxId: string, input: {
        leaseOwner: string;
        leaseUntil: Date;
        now?: Date;
    }): Promise<AuditIntentOutboxRecord | null>;
    releaseAuditOutboxLease(outboxId: string, leaseOwner: string): Promise<AuditIntentOutboxRecord | null>;
    markAuditOutboxProcessing(outboxId: string, attemptedAt?: Date): Promise<AuditIntentOutboxRecord | null>;
    markAuditOutboxDelivered(outboxId: string, deliveredAt?: Date): Promise<AuditIntentOutboxRecord | null>;
    markAuditOutboxFailed(outboxId: string, input: {
        lastError: string;
        retryCount: number;
        nextRetryAt?: Date | null;
    }): Promise<AuditIntentOutboxRecord | null>;
    markAuditOutboxDeadLetter(outboxId: string, input: {
        deadLetterReason: string;
        lastError?: string | null;
        retryCount: number;
    }): Promise<AuditIntentOutboxRecord | null>;
}
export declare class PostgresOperationalIntentRepository implements OperationalIntentRepository {
    recordIntentWithAuditOutbox(input: RecordOperationalIntentInput): Promise<OperationalIntentRecordResult>;
    listIntents(input?: {
        domains?: OperationalIntentDomain[];
        workflowState?: OperationalWorkflowState;
        limit?: number;
    }): Promise<OperationalIntentRecord[]>;
    getIntentById(intentId: string): Promise<OperationalIntentRecord | null>;
    getIntentByIdempotencyKey(idempotencyKey: string): Promise<OperationalIntentRecord | null>;
    getAuditOutboxByIdempotencyKey(idempotencyKey: string): Promise<AuditIntentOutboxRecord | null>;
    getAuditOutboxByIntentId(intentId: string): Promise<AuditIntentOutboxRecord | null>;
    getLatestIntentByTarget(domain: OperationalIntentDomain, targetId: string): Promise<OperationalIntentRecord | null>;
    getLatestAuditOutboxByTarget(domain: OperationalIntentDomain, targetId: string): Promise<AuditIntentOutboxRecord | null>;
    listDeliverableAuditOutbox(input?: {
        limit?: number;
        now?: Date;
        states?: AuditIntentDeliveryState[];
    }): Promise<AuditIntentOutboxRecord[]>;
    claimAuditOutboxLease(outboxId: string, input: {
        leaseOwner: string;
        leaseUntil: Date;
        now?: Date;
    }): Promise<AuditIntentOutboxRecord | null>;
    releaseAuditOutboxLease(outboxId: string, leaseOwner: string): Promise<AuditIntentOutboxRecord | null>;
    markAuditOutboxProcessing(outboxId: string, attemptedAt?: Date): Promise<AuditIntentOutboxRecord | null>;
    markAuditOutboxDelivered(outboxId: string, deliveredAt?: Date): Promise<AuditIntentOutboxRecord | null>;
    markAuditOutboxFailed(outboxId: string, input: {
        lastError: string;
        retryCount: number;
        nextRetryAt?: Date | null;
    }): Promise<AuditIntentOutboxRecord | null>;
    markAuditOutboxDeadLetter(outboxId: string, input: {
        deadLetterReason: string;
        lastError?: string | null;
        retryCount: number;
    }): Promise<AuditIntentOutboxRecord | null>;
}
export declare function getOperationalIntentRepository(): OperationalIntentRepository;
export declare function recordOperationalIntent(input: RecordOperationalIntentInput): Promise<OperationalIntentRecordResult>;
export declare function listOperationalIntents(input?: {
    domains?: OperationalIntentDomain[];
    workflowState?: OperationalWorkflowState;
    limit?: number;
}): Promise<OperationalIntentRecord[]>;
export declare function getOperationalIntentById(intentId: string): Promise<OperationalIntentRecord | null>;
export declare function getOperationalAuditOutboxByIntentId(intentId: string): Promise<AuditIntentOutboxRecord | null>;
export declare function getLatestOperationalIntentByTarget(domain: OperationalIntentDomain, targetId: string): Promise<OperationalIntentRecord | null>;
export declare function getLatestOperationalAuditOutboxByTarget(domain: OperationalIntentDomain, targetId: string): Promise<AuditIntentOutboxRecord | null>;
export declare function listDeliverableOperationalAuditOutbox(input?: {
    limit?: number;
    now?: Date;
    states?: AuditIntentDeliveryState[];
}): Promise<AuditIntentOutboxRecord[]>;
export declare function claimOperationalAuditOutboxLease(outboxId: string, input: {
    leaseOwner: string;
    leaseUntil: Date;
    now?: Date;
}): Promise<AuditIntentOutboxRecord | null>;
export declare function releaseOperationalAuditOutboxLease(outboxId: string, leaseOwner: string): Promise<AuditIntentOutboxRecord | null>;
export declare function markOperationalAuditOutboxProcessing(outboxId: string, attemptedAt?: Date): Promise<AuditIntentOutboxRecord | null>;
export declare function markOperationalAuditOutboxDelivered(outboxId: string, deliveredAt?: Date): Promise<AuditIntentOutboxRecord | null>;
export declare function markOperationalAuditOutboxFailed(outboxId: string, input: {
    lastError: string;
    retryCount: number;
    nextRetryAt?: Date | null;
}): Promise<AuditIntentOutboxRecord | null>;
export declare function markOperationalAuditOutboxDeadLetter(outboxId: string, input: {
    deadLetterReason: string;
    lastError?: string | null;
    retryCount: number;
}): Promise<AuditIntentOutboxRecord | null>;
export declare function resetOperationalIntentRepository(): void;
