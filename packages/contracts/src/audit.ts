export type AuditActionType = string;

export type AuditOutcome =
  | 'accepted'
  | 'completed'
  | 'rejected'
  | 'blocked'
  | 'failed'
  | 'under_review'
  | 'released'
  | 'reconciled'
  | 'duplicate_ignored';

export type AuditSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditActorRef {
  actorType: string;
  actorId: string;
  actorScope?: string;
  executionMode?: 'manual' | 'system' | 'provider' | 'scheduled' | 'reconciliation';
}

export interface AuditTargetRef {
  targetType: string;
  targetId: string;
  ownerService?: string;
  secondaryTargetType?: string;
  secondaryTargetId?: string;
}

export interface AuditLogRecord {
  auditId: string;
  actorType: string;
  actorId: string;
  targetType: string;
  targetId: string;
  ownerService: string;
  action: AuditActionType;
  outcome: AuditOutcome;
  severity: AuditSeverity;
  reasonCode?: string | null;
  correlationId?: string | null;
  causationId?: string | null;
  idempotencyKey?: string | null;
  metadata: Record<string, unknown>;
  occurredAt: string;
  auditTruth: true;
  businessTruthMutated: false;
  ownerStateMutated: false;
}

export interface AppendAuditLogCommand {
  auditId?: string;
  actor: AuditActorRef;
  target: AuditTargetRef;
  action: AuditActionType;
  outcome?: AuditOutcome;
  severity?: AuditSeverity;
  reasonCode?: string | null;
  correlationId?: string | null;
  causationId?: string | null;
  idempotencyKey?: string | null;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}
