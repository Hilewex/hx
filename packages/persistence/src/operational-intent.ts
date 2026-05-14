import { randomUUID, createHash } from 'node:crypto';
import { query } from './index';

export type OperationalIntentDomain = 'refund' | 'moderation' | 'risk' | 'fraud';
export type OperationalWorkflowState =
  | 'prepared'
  | 'checker_required'
  | 'checked'
  | 'rejected'
  | 'escalated'
  | 'owner_handoff_pending'
  | 'owner_handoff_ready';
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

function nowIso() {
  return new Date().toISOString();
}

function fingerprint(input: RecordOperationalIntentInput): string {
  return createHash('sha256')
    .update(JSON.stringify({
      domain: input.domain,
      targetId: input.targetId,
      actionType: input.actionType,
      makerActorId: input.makerActorId,
      checkerActorId: input.checkerActorId ?? null,
      workflowState: input.workflowState,
      reasonCode: input.reasonCode,
      evidenceRefs: input.evidenceRefs,
      boundaryFlags: input.boundaryFlags,
      actorId: input.actorId,
      makerCheckerContext: input.makerCheckerContext,
    }))
    .digest('hex');
}

function buildRecords(input: RecordOperationalIntentInput) {
  const timestamp = nowIso();
  const intent: OperationalIntentRecord = {
    intentId: input.intentId || randomUUID(),
    domain: input.domain,
    targetId: input.targetId,
    actionType: input.actionType,
    makerActorId: input.makerActorId,
    checkerActorId: input.checkerActorId ?? null,
    workflowState: input.workflowState,
    reasonCode: input.reasonCode,
    evidenceRefs: input.evidenceRefs,
    idempotencyKey: input.idempotencyKey,
    boundaryFlags: input.boundaryFlags,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const auditOutbox: AuditIntentOutboxRecord = {
    outboxId: randomUUID(),
    intentId: intent.intentId,
    domain: input.domain,
    targetId: input.targetId,
    actorId: input.actorId,
    actionType: input.actionType,
    reasonCode: input.reasonCode,
    evidenceRefs: input.evidenceRefs,
    makerCheckerContext: input.makerCheckerContext,
    idempotencyKey: input.idempotencyKey,
    deliveryState: 'pending',
    retryCount: 0,
    nextRetryAt: null,
    lastError: null,
    deadLetterReason: null,
    lastDeliveryAttemptAt: null,
    leaseOwner: null,
    leaseUntil: null,
    claimedAt: null,
    processingStartedAt: null,
    createdAt: timestamp,
    deliveredAt: null,
  };
  return { intent, auditOutbox, inputFingerprint: fingerprint(input) };
}

export class InMemoryOperationalIntentRepository implements OperationalIntentRepository {
  private intents = new Map<string, OperationalIntentRecord>();
  private intentFingerprints = new Map<string, string>();
  private auditOutbox = new Map<string, AuditIntentOutboxRecord>();

  async recordIntentWithAuditOutbox(input: RecordOperationalIntentInput): Promise<OperationalIntentRecordResult> {
    const existing = this.intents.get(input.idempotencyKey);
    if (existing) {
      const existingAudit = this.auditOutbox.get(input.idempotencyKey);
      const inputFingerprint = fingerprint(input);
      if (this.intentFingerprints.get(input.idempotencyKey) !== inputFingerprint) {
        throw new Error('OPERATIONAL_INTENT_IDEMPOTENCY_CONFLICT');
      }
      if (!existingAudit) throw new Error('OPERATIONAL_AUDIT_OUTBOX_MISSING');
      return { intent: existing, auditOutbox: existingAudit, idempotentReplay: true, persisted: true };
    }

    const records = buildRecords(input);
    this.intents.set(input.idempotencyKey, records.intent);
    this.intentFingerprints.set(input.idempotencyKey, records.inputFingerprint);
    this.auditOutbox.set(input.idempotencyKey, records.auditOutbox);
    return { intent: records.intent, auditOutbox: records.auditOutbox, idempotentReplay: false, persisted: true };
  }

  async listIntents(input: {
    domains?: OperationalIntentDomain[];
    workflowState?: OperationalWorkflowState;
    limit?: number;
  } = {}): Promise<OperationalIntentRecord[]> {
    const domains = input.domains?.length ? new Set(input.domains) : null;
    const limit = input.limit ?? 100;
    return Array.from(this.intents.values())
      .filter((intent) => !domains || domains.has(intent.domain))
      .filter((intent) => !input.workflowState || intent.workflowState === input.workflowState)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit);
  }

  async getIntentById(intentId: string): Promise<OperationalIntentRecord | null> {
    return Array.from(this.intents.values()).find((intent) => intent.intentId === intentId) ?? null;
  }

  async getIntentByIdempotencyKey(idempotencyKey: string): Promise<OperationalIntentRecord | null> {
    return this.intents.get(idempotencyKey) ?? null;
  }

  async getAuditOutboxByIdempotencyKey(idempotencyKey: string): Promise<AuditIntentOutboxRecord | null> {
    return this.auditOutbox.get(idempotencyKey) ?? null;
  }

  async getAuditOutboxByIntentId(intentId: string): Promise<AuditIntentOutboxRecord | null> {
    return Array.from(this.auditOutbox.values()).find((outbox) => outbox.intentId === intentId) ?? null;
  }

  async getLatestIntentByTarget(domain: OperationalIntentDomain, targetId: string): Promise<OperationalIntentRecord | null> {
    return (Array.from(this.intents.values())
      .reverse()
      .filter((intent) => intent.domain === domain && intent.targetId === targetId))[0] ?? null;
  }

  async getLatestAuditOutboxByTarget(domain: OperationalIntentDomain, targetId: string): Promise<AuditIntentOutboxRecord | null> {
    return (Array.from(this.auditOutbox.values())
      .reverse()
      .filter((outbox) => outbox.domain === domain && outbox.targetId === targetId))[0] ?? null;
  }

  async listDeliverableAuditOutbox(input: {
    limit?: number;
    now?: Date;
    states?: AuditIntentDeliveryState[];
  } = {}): Promise<AuditIntentOutboxRecord[]> {
    const states = new Set(input.states ?? ['pending', 'failed']);
    const now = input.now ?? new Date();
    return Array.from(this.auditOutbox.values())
      .filter((outbox) => states.has(outbox.deliveryState))
      .filter((outbox) => !outbox.nextRetryAt || new Date(outbox.nextRetryAt).getTime() <= now.getTime())
      .filter((outbox) => !outbox.leaseUntil || new Date(outbox.leaseUntil).getTime() <= now.getTime())
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, input.limit ?? 50);
  }

  async claimAuditOutboxLease(outboxId: string, input: {
    leaseOwner: string;
    leaseUntil: Date;
    now?: Date;
  }): Promise<AuditIntentOutboxRecord | null> {
    const now = input.now ?? new Date();
    const entry = Array.from(this.auditOutbox.entries()).find(([, outbox]) => outbox.outboxId === outboxId);
    if (!entry) return null;
    const [, outbox] = entry;
    if (!['pending', 'failed'].includes(outbox.deliveryState)) return null;
    if (outbox.nextRetryAt && new Date(outbox.nextRetryAt).getTime() > now.getTime()) return null;
    if (outbox.leaseUntil && new Date(outbox.leaseUntil).getTime() > now.getTime()) return null;
    return this.updateOutboxById(outboxId, {
      leaseOwner: input.leaseOwner,
      leaseUntil: input.leaseUntil.toISOString(),
      claimedAt: now.toISOString(),
    });
  }

  async releaseAuditOutboxLease(outboxId: string, leaseOwner: string): Promise<AuditIntentOutboxRecord | null> {
    const entry = Array.from(this.auditOutbox.entries()).find(([, outbox]) => outbox.outboxId === outboxId);
    if (!entry || entry[1].leaseOwner !== leaseOwner) return null;
    return this.updateOutboxById(outboxId, {
      leaseOwner: null,
      leaseUntil: null,
    });
  }

  async markAuditOutboxProcessing(outboxId: string, attemptedAt: Date = new Date()): Promise<AuditIntentOutboxRecord | null> {
    return this.updateOutboxById(outboxId, {
      deliveryState: 'processing',
      lastDeliveryAttemptAt: attemptedAt.toISOString(),
      processingStartedAt: attemptedAt.toISOString(),
      lastError: null,
    });
  }

  async markAuditOutboxDelivered(outboxId: string, deliveredAt: Date = new Date()): Promise<AuditIntentOutboxRecord | null> {
    return this.updateOutboxById(outboxId, {
      deliveryState: 'delivered',
      deliveredAt: deliveredAt.toISOString(),
      nextRetryAt: null,
      lastError: null,
      deadLetterReason: null,
      lastDeliveryAttemptAt: deliveredAt.toISOString(),
      leaseOwner: null,
      leaseUntil: null,
    });
  }

  async markAuditOutboxFailed(outboxId: string, input: {
    lastError: string;
    retryCount: number;
    nextRetryAt?: Date | null;
  }): Promise<AuditIntentOutboxRecord | null> {
    return this.updateOutboxById(outboxId, {
      deliveryState: 'failed',
      retryCount: input.retryCount,
      nextRetryAt: input.nextRetryAt ? input.nextRetryAt.toISOString() : null,
      lastError: input.lastError,
      deadLetterReason: null,
      leaseOwner: null,
      leaseUntil: null,
    });
  }

  async markAuditOutboxDeadLetter(outboxId: string, input: {
    deadLetterReason: string;
    lastError?: string | null;
    retryCount: number;
  }): Promise<AuditIntentOutboxRecord | null> {
    return this.updateOutboxById(outboxId, {
      deliveryState: 'dead_letter',
      retryCount: input.retryCount,
      nextRetryAt: null,
      lastError: input.lastError ?? input.deadLetterReason,
      deadLetterReason: input.deadLetterReason,
      leaseOwner: null,
      leaseUntil: null,
    });
  }

  private updateOutboxById(outboxId: string, patch: Partial<AuditIntentOutboxRecord>): AuditIntentOutboxRecord | null {
    const entry = Array.from(this.auditOutbox.entries()).find(([, outbox]) => outbox.outboxId === outboxId);
    if (!entry) return null;
    const [key, outbox] = entry;
    const updated = { ...outbox, ...patch };
    this.auditOutbox.set(key, updated);
    return updated;
  }
}

export class PostgresOperationalIntentRepository implements OperationalIntentRepository {
  async recordIntentWithAuditOutbox(input: RecordOperationalIntentInput): Promise<OperationalIntentRecordResult> {
    const records = buildRecords(input);
    const existing = await this.getIntentByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      const res = await query('SELECT input_fingerprint FROM operational_intents WHERE idempotency_key = $1', [input.idempotencyKey]);
      if (res.rows[0]?.input_fingerprint !== records.inputFingerprint) {
        throw new Error('OPERATIONAL_INTENT_IDEMPOTENCY_CONFLICT');
      }
      const existingAudit = await this.getAuditOutboxByIdempotencyKey(input.idempotencyKey);
      if (!existingAudit) throw new Error('OPERATIONAL_AUDIT_OUTBOX_MISSING');
      return { intent: existing, auditOutbox: existingAudit, idempotentReplay: true, persisted: true };
    }

    const intentRes = await query(
      `INSERT INTO operational_intents (
        intent_id, domain, target_id, action_type, maker_actor_id, checker_actor_id,
        workflow_state, reason_code, evidence_refs, idempotency_key, boundary_flags,
        input_fingerprint, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        records.intent.intentId,
        records.intent.domain,
        records.intent.targetId,
        records.intent.actionType,
        records.intent.makerActorId,
        records.intent.checkerActorId,
        records.intent.workflowState,
        records.intent.reasonCode,
        records.intent.evidenceRefs,
        records.intent.idempotencyKey,
        JSON.stringify(records.intent.boundaryFlags),
        records.inputFingerprint,
        records.intent.createdAt,
        records.intent.updatedAt,
      ],
    );
    const outboxRes = await query(
      `INSERT INTO operational_audit_intent_outbox (
        outbox_id, intent_id, domain, target_id, actor_id, action_type, reason_code,
        evidence_refs, maker_checker_context, idempotency_key, delivery_state, retry_count,
        next_retry_at, last_error, dead_letter_reason, last_delivery_attempt_at,
        lease_owner, lease_until, claimed_at, processing_started_at, created_at, delivered_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        records.auditOutbox.outboxId,
        records.auditOutbox.intentId,
        records.auditOutbox.domain,
        records.auditOutbox.targetId,
        records.auditOutbox.actorId,
        records.auditOutbox.actionType,
        records.auditOutbox.reasonCode,
        records.auditOutbox.evidenceRefs,
        JSON.stringify(records.auditOutbox.makerCheckerContext),
        records.auditOutbox.idempotencyKey,
        records.auditOutbox.deliveryState,
        records.auditOutbox.retryCount,
        records.auditOutbox.nextRetryAt,
        records.auditOutbox.lastError,
        records.auditOutbox.deadLetterReason,
        records.auditOutbox.lastDeliveryAttemptAt,
        records.auditOutbox.leaseOwner,
        records.auditOutbox.leaseUntil,
        records.auditOutbox.claimedAt,
        records.auditOutbox.processingStartedAt,
        records.auditOutbox.createdAt,
        records.auditOutbox.deliveredAt,
      ],
    );
    return {
      intent: mapIntentRow(intentRes.rows[0]),
      auditOutbox: mapAuditOutboxRow(outboxRes.rows[0]),
      idempotentReplay: false,
      persisted: true,
    };
  }

  async listIntents(input: {
    domains?: OperationalIntentDomain[];
    workflowState?: OperationalWorkflowState;
    limit?: number;
  } = {}): Promise<OperationalIntentRecord[]> {
    const domains = input.domains?.length ? input.domains : ['refund', 'moderation', 'risk', 'fraud'];
    const values: unknown[] = [domains, input.limit ?? 100];
    let where = 'WHERE domain = ANY($1)';
    if (input.workflowState) {
      values.push(input.workflowState);
      where += ` AND workflow_state = $${values.length}`;
    }
    const res = await query(
      `SELECT * FROM operational_intents
       ${where}
       ORDER BY updated_at DESC
       LIMIT $2`,
      values,
    );
    return res.rows.map(mapIntentRow);
  }

  async getIntentById(intentId: string): Promise<OperationalIntentRecord | null> {
    const res = await query('SELECT * FROM operational_intents WHERE intent_id = $1', [intentId]);
    return res.rowCount ? mapIntentRow(res.rows[0]) : null;
  }

  async getIntentByIdempotencyKey(idempotencyKey: string): Promise<OperationalIntentRecord | null> {
    const res = await query('SELECT * FROM operational_intents WHERE idempotency_key = $1', [idempotencyKey]);
    return res.rowCount ? mapIntentRow(res.rows[0]) : null;
  }

  async getAuditOutboxByIdempotencyKey(idempotencyKey: string): Promise<AuditIntentOutboxRecord | null> {
    const res = await query('SELECT * FROM operational_audit_intent_outbox WHERE idempotency_key = $1', [idempotencyKey]);
    return res.rowCount ? mapAuditOutboxRow(res.rows[0]) : null;
  }

  async getAuditOutboxByIntentId(intentId: string): Promise<AuditIntentOutboxRecord | null> {
    const res = await query('SELECT * FROM operational_audit_intent_outbox WHERE intent_id = $1 ORDER BY created_at DESC LIMIT 1', [intentId]);
    return res.rowCount ? mapAuditOutboxRow(res.rows[0]) : null;
  }

  async getLatestIntentByTarget(domain: OperationalIntentDomain, targetId: string): Promise<OperationalIntentRecord | null> {
    const res = await query(
      `SELECT * FROM operational_intents
       WHERE domain = $1 AND target_id = $2
       ORDER BY updated_at DESC
       LIMIT 1`,
      [domain, targetId],
    );
    return res.rowCount ? mapIntentRow(res.rows[0]) : null;
  }

  async getLatestAuditOutboxByTarget(domain: OperationalIntentDomain, targetId: string): Promise<AuditIntentOutboxRecord | null> {
    const res = await query(
      `SELECT * FROM operational_audit_intent_outbox
       WHERE domain = $1 AND target_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [domain, targetId],
    );
    return res.rowCount ? mapAuditOutboxRow(res.rows[0]) : null;
  }

  async listDeliverableAuditOutbox(input: {
    limit?: number;
    now?: Date;
    states?: AuditIntentDeliveryState[];
  } = {}): Promise<AuditIntentOutboxRecord[]> {
    const states = input.states ?? ['pending', 'failed'];
    const res = await query(
      `SELECT * FROM operational_audit_intent_outbox
       WHERE delivery_state = ANY($1)
         AND (next_retry_at IS NULL OR next_retry_at <= $2)
         AND (lease_until IS NULL OR lease_until <= $2)
       ORDER BY created_at ASC
       LIMIT $3`,
      [states, (input.now ?? new Date()).toISOString(), input.limit ?? 50],
    );
    return res.rows.map(mapAuditOutboxRow);
  }

  async claimAuditOutboxLease(outboxId: string, input: {
    leaseOwner: string;
    leaseUntil: Date;
    now?: Date;
  }): Promise<AuditIntentOutboxRecord | null> {
    const now = input.now ?? new Date();
    const res = await query(
      `UPDATE operational_audit_intent_outbox
       SET lease_owner = $2,
           lease_until = $3,
           claimed_at = $4
       WHERE outbox_id = $1
         AND delivery_state = ANY($5)
         AND (next_retry_at IS NULL OR next_retry_at <= $4)
         AND (lease_until IS NULL OR lease_until <= $4)
       RETURNING *`,
      [outboxId, input.leaseOwner, input.leaseUntil.toISOString(), now.toISOString(), ['pending', 'failed']],
    );
    return res.rowCount ? mapAuditOutboxRow(res.rows[0]) : null;
  }

  async releaseAuditOutboxLease(outboxId: string, leaseOwner: string): Promise<AuditIntentOutboxRecord | null> {
    const res = await query(
      `UPDATE operational_audit_intent_outbox
       SET lease_owner = NULL,
           lease_until = NULL
       WHERE outbox_id = $1
         AND lease_owner = $2
       RETURNING *`,
      [outboxId, leaseOwner],
    );
    return res.rowCount ? mapAuditOutboxRow(res.rows[0]) : null;
  }

  async markAuditOutboxProcessing(outboxId: string, attemptedAt: Date = new Date()): Promise<AuditIntentOutboxRecord | null> {
    const res = await query(
      `UPDATE operational_audit_intent_outbox
       SET delivery_state = 'processing',
           last_delivery_attempt_at = $2,
           processing_started_at = $2,
           last_error = NULL
       WHERE outbox_id = $1
       RETURNING *`,
      [outboxId, attemptedAt.toISOString()],
    );
    return res.rowCount ? mapAuditOutboxRow(res.rows[0]) : null;
  }

  async markAuditOutboxDelivered(outboxId: string, deliveredAt: Date = new Date()): Promise<AuditIntentOutboxRecord | null> {
    const res = await query(
      `UPDATE operational_audit_intent_outbox
       SET delivery_state = 'delivered',
           delivered_at = $2,
           next_retry_at = NULL,
           last_error = NULL,
           dead_letter_reason = NULL,
           last_delivery_attempt_at = $2,
           lease_owner = NULL,
           lease_until = NULL
       WHERE outbox_id = $1
       RETURNING *`,
      [outboxId, deliveredAt.toISOString()],
    );
    return res.rowCount ? mapAuditOutboxRow(res.rows[0]) : null;
  }

  async markAuditOutboxFailed(outboxId: string, input: {
    lastError: string;
    retryCount: number;
    nextRetryAt?: Date | null;
  }): Promise<AuditIntentOutboxRecord | null> {
    const res = await query(
      `UPDATE operational_audit_intent_outbox
       SET delivery_state = 'failed',
           retry_count = $2,
           next_retry_at = $3,
           last_error = $4,
           dead_letter_reason = NULL,
           lease_owner = NULL,
           lease_until = NULL
       WHERE outbox_id = $1
       RETURNING *`,
      [outboxId, input.retryCount, input.nextRetryAt ? input.nextRetryAt.toISOString() : null, input.lastError],
    );
    return res.rowCount ? mapAuditOutboxRow(res.rows[0]) : null;
  }

  async markAuditOutboxDeadLetter(outboxId: string, input: {
    deadLetterReason: string;
    lastError?: string | null;
    retryCount: number;
  }): Promise<AuditIntentOutboxRecord | null> {
    const res = await query(
      `UPDATE operational_audit_intent_outbox
       SET delivery_state = 'dead_letter',
           retry_count = $2,
           next_retry_at = NULL,
           last_error = $3,
           dead_letter_reason = $4,
           lease_owner = NULL,
           lease_until = NULL
       WHERE outbox_id = $1
       RETURNING *`,
      [outboxId, input.retryCount, input.lastError ?? input.deadLetterReason, input.deadLetterReason],
    );
    return res.rowCount ? mapAuditOutboxRow(res.rows[0]) : null;
  }
}

let operationalIntentRepository: OperationalIntentRepository | null = null;

export function getOperationalIntentRepository(): OperationalIntentRepository {
  if (operationalIntentRepository) return operationalIntentRepository;
  operationalIntentRepository = process.env.PERSISTENCE_MODE === 'postgres'
    ? new PostgresOperationalIntentRepository()
    : new InMemoryOperationalIntentRepository();
  return operationalIntentRepository;
}

export async function recordOperationalIntent(input: RecordOperationalIntentInput): Promise<OperationalIntentRecordResult> {
  return getOperationalIntentRepository().recordIntentWithAuditOutbox(input);
}

export async function listOperationalIntents(input?: {
  domains?: OperationalIntentDomain[];
  workflowState?: OperationalWorkflowState;
  limit?: number;
}) {
  return getOperationalIntentRepository().listIntents(input);
}

export async function getOperationalIntentById(intentId: string) {
  return getOperationalIntentRepository().getIntentById(intentId);
}

export async function getOperationalAuditOutboxByIntentId(intentId: string) {
  return getOperationalIntentRepository().getAuditOutboxByIntentId(intentId);
}

export async function getLatestOperationalIntentByTarget(domain: OperationalIntentDomain, targetId: string) {
  return getOperationalIntentRepository().getLatestIntentByTarget(domain, targetId);
}

export async function getLatestOperationalAuditOutboxByTarget(domain: OperationalIntentDomain, targetId: string) {
  return getOperationalIntentRepository().getLatestAuditOutboxByTarget(domain, targetId);
}

export async function listDeliverableOperationalAuditOutbox(input?: {
  limit?: number;
  now?: Date;
  states?: AuditIntentDeliveryState[];
}) {
  return getOperationalIntentRepository().listDeliverableAuditOutbox(input);
}

export async function claimOperationalAuditOutboxLease(outboxId: string, input: {
  leaseOwner: string;
  leaseUntil: Date;
  now?: Date;
}) {
  return getOperationalIntentRepository().claimAuditOutboxLease(outboxId, input);
}

export async function releaseOperationalAuditOutboxLease(outboxId: string, leaseOwner: string) {
  return getOperationalIntentRepository().releaseAuditOutboxLease(outboxId, leaseOwner);
}

export async function markOperationalAuditOutboxProcessing(outboxId: string, attemptedAt?: Date) {
  return getOperationalIntentRepository().markAuditOutboxProcessing(outboxId, attemptedAt);
}

export async function markOperationalAuditOutboxDelivered(outboxId: string, deliveredAt?: Date) {
  return getOperationalIntentRepository().markAuditOutboxDelivered(outboxId, deliveredAt);
}

export async function markOperationalAuditOutboxFailed(outboxId: string, input: {
  lastError: string;
  retryCount: number;
  nextRetryAt?: Date | null;
}) {
  return getOperationalIntentRepository().markAuditOutboxFailed(outboxId, input);
}

export async function markOperationalAuditOutboxDeadLetter(outboxId: string, input: {
  deadLetterReason: string;
  lastError?: string | null;
  retryCount: number;
}) {
  return getOperationalIntentRepository().markAuditOutboxDeadLetter(outboxId, input);
}

export function resetOperationalIntentRepository() {
  operationalIntentRepository = null;
}

function mapIntentRow(row: any): OperationalIntentRecord {
  return {
    intentId: row.intent_id,
    domain: row.domain,
    targetId: row.target_id,
    actionType: row.action_type,
    makerActorId: row.maker_actor_id,
    checkerActorId: row.checker_actor_id,
    workflowState: row.workflow_state,
    reasonCode: row.reason_code,
    evidenceRefs: row.evidence_refs ?? [],
    idempotencyKey: row.idempotency_key,
    boundaryFlags: row.boundary_flags ?? {},
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function mapAuditOutboxRow(row: any): AuditIntentOutboxRecord {
  return {
    outboxId: row.outbox_id,
    intentId: row.intent_id,
    domain: row.domain,
    targetId: row.target_id,
    actorId: row.actor_id,
    actionType: row.action_type,
    reasonCode: row.reason_code,
    evidenceRefs: row.evidence_refs ?? [],
    makerCheckerContext: row.maker_checker_context ?? {},
    idempotencyKey: row.idempotency_key,
    deliveryState: row.delivery_state,
    retryCount: Number(row.retry_count ?? 0),
    nextRetryAt: row.next_retry_at ? new Date(row.next_retry_at).toISOString() : null,
    lastError: row.last_error ?? null,
    deadLetterReason: row.dead_letter_reason ?? null,
    lastDeliveryAttemptAt: row.last_delivery_attempt_at ? new Date(row.last_delivery_attempt_at).toISOString() : null,
    leaseOwner: row.lease_owner ?? null,
    leaseUntil: row.lease_until ? new Date(row.lease_until).toISOString() : null,
    claimedAt: row.claimed_at ? new Date(row.claimed_at).toISOString() : null,
    processingStartedAt: row.processing_started_at ? new Date(row.processing_started_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    deliveredAt: row.delivered_at ? new Date(row.delivered_at).toISOString() : null,
  };
}
