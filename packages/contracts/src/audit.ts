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

export interface PanelAuditActor {
  actorId: string;
  actorRole: string;
}

export type PanelProtectedActionType = string;

export interface PanelAuditBoundaryFlags {
  bffTruthMutated: false;
  uiTruthMutated: false;
  businessTruthMutated: false;
  ownerTruthMutatedByPanel: false;
}

export type PanelAuditResultStatus = 'ACCEPTED' | 'REJECTED' | 'PENDING_OWNER_DOMAIN' | 'DUPLICATE_IDEMPOTENCY_KEY';

export interface PanelProtectedActionAuditEvidence extends PanelAuditBoundaryFlags {
  actorId: string;
  actorRole: string;
  actionType: PanelProtectedActionType;
  targetType: string;
  targetId: string;
  reasonCode: string;
  correlationId: string;
  idempotencyKey: string;
  requestedAt: string;
  decision: string;
  resultStatus: PanelAuditResultStatus;
  ownerDomainHandoff: string | null;
  auditRequired: true;
  auditEvidenceRequired: true;
  reasonCodeRequired: true;
  permissionChecked: boolean;
}

export type PanelMakerCheckerActionType =
  | 'MODERATION_DECISION_APPROVAL'
  | 'PAYOUT_HOLD_RELEASE_APPROVAL'
  | 'FINANCE_CORRECTION_APPROVAL'
  | 'HIGH_RISK_ADMIN_ACTION_APPROVAL'
  | 'SUPPORT_ESCALATION_APPROVAL';

export interface PanelMakerCheckerRequirement {
  actionType: PanelMakerCheckerActionType;
  targetType: string;
  targetId: string;
  makerActorId: string;
  checkerActorId: string;
  checkerActorRole: string;
  reasonCode: string;
  correlationId: string;
  idempotencyKey: string;
  requestedAt: string;
  ownerDomainHandoff: string;
}

export interface PanelMakerCheckerDecision extends PanelAuditBoundaryFlags {
  success: boolean;
  actionType: PanelMakerCheckerActionType;
  targetType: string;
  targetId: string;
  makerActorId: string;
  checkerActorId: string;
  checkerActorRole: string;
  reasonCode: string;
  correlationId: string;
  idempotencyKey: string;
  requestedAt: string;
  decision: 'APPROVED_FOR_OWNER_HANDOFF' | 'REJECTED' | 'DUPLICATE_IDEMPOTENCY_KEY';
  resultStatus: PanelAuditResultStatus;
  ownerDomainHandoff: string | null;
  auditRequired: true;
  auditEvidenceRequired: true;
  reasonCodeRequired: true;
  permissionChecked: boolean;
  sameActorBlocked: boolean;
  error?: string;
}

export interface PanelAuditDecisionResult {
  success: boolean;
  evidence: PanelProtectedActionAuditEvidence;
  error?: string;
}

const processedPanelMakerCheckerKeys = new Set<string>();

export function buildPanelProtectedActionAuditEvidence(input: {
  actorId: string;
  actorRole?: string;
  actionType: string;
  targetType: string;
  targetId: string;
  reasonCode: string;
  correlationId: string;
  idempotencyKey: string;
  requestedAt?: string;
  decision: string;
  ownerDomainHandoff?: string | null;
  permissionChecked?: boolean;
}): PanelProtectedActionAuditEvidence {
  return {
    actorId: input.actorId,
    actorRole: input.actorRole || 'UNKNOWN',
    actionType: input.actionType,
    targetType: input.targetType,
    targetId: input.targetId,
    reasonCode: input.reasonCode,
    correlationId: input.correlationId,
    idempotencyKey: input.idempotencyKey,
    requestedAt: input.requestedAt || new Date().toISOString(),
    decision: input.decision,
    resultStatus: mapPanelAuditResultStatus(input.decision),
    ownerDomainHandoff: input.ownerDomainHandoff ?? null,
    auditRequired: true,
    auditEvidenceRequired: true,
    reasonCodeRequired: true,
    permissionChecked: input.permissionChecked ?? false,
    bffTruthMutated: false,
    uiTruthMutated: false,
    businessTruthMutated: false,
    ownerTruthMutatedByPanel: false
  };
}

export function validatePanelMakerCheckerDecision(req: Partial<PanelMakerCheckerRequirement>): PanelMakerCheckerDecision {
  const requiredError = validatePanelMakerCheckerRequiredFields(req);
  if (requiredError) {
    return createPanelMakerCheckerDecision(req, {
      success: false,
      decision: 'REJECTED',
      resultStatus: 'REJECTED',
      permissionChecked: false,
      sameActorBlocked: false,
      error: requiredError
    });
  }

  const fullReq = req as PanelMakerCheckerRequirement;
  if (fullReq.makerActorId === fullReq.checkerActorId) {
    return createPanelMakerCheckerDecision(fullReq, {
      success: false,
      decision: 'REJECTED',
      resultStatus: 'REJECTED',
      permissionChecked: true,
      sameActorBlocked: true,
      error: 'MAKER_CHECKER_SAME_ACTOR_FORBIDDEN'
    });
  }

  if (processedPanelMakerCheckerKeys.has(fullReq.idempotencyKey)) {
    return createPanelMakerCheckerDecision(fullReq, {
      success: false,
      decision: 'DUPLICATE_IDEMPOTENCY_KEY',
      resultStatus: 'DUPLICATE_IDEMPOTENCY_KEY',
      permissionChecked: true,
      sameActorBlocked: true,
      reasonCode: 'ALREADY_PROCESSED',
      error: 'Duplicate idempotency key'
    });
  }

  processedPanelMakerCheckerKeys.add(fullReq.idempotencyKey);

  return createPanelMakerCheckerDecision(fullReq, {
    success: true,
    decision: 'APPROVED_FOR_OWNER_HANDOFF',
    resultStatus: 'PENDING_OWNER_DOMAIN',
    permissionChecked: true,
    sameActorBlocked: true
  });
}

function validatePanelMakerCheckerRequiredFields(req: Partial<PanelMakerCheckerRequirement>): string | null {
  if (!req.actionType) return 'Missing actionType';
  if (!req.targetType || !req.targetId) return 'Missing target';
  if (!req.makerActorId || !req.checkerActorId || !req.checkerActorRole) return 'Missing maker/checker actor';
  if (!req.reasonCode) return 'Missing reasonCode';
  if (!req.correlationId) return 'Missing correlationId';
  if (!req.idempotencyKey) return 'Missing idempotencyKey';
  if (!req.requestedAt) return 'Missing requestedAt';
  if (!req.ownerDomainHandoff) return 'Missing ownerDomainHandoff';
  return null;
}

function createPanelMakerCheckerDecision(
  req: Partial<PanelMakerCheckerRequirement>,
  overrides: {
    success: boolean;
    decision: PanelMakerCheckerDecision['decision'];
    resultStatus: PanelAuditResultStatus;
    permissionChecked: boolean;
    sameActorBlocked: boolean;
    reasonCode?: string;
    error?: string;
  }
): PanelMakerCheckerDecision {
  return {
    success: overrides.success,
    actionType: req.actionType || 'HIGH_RISK_ADMIN_ACTION_APPROVAL',
    targetType: req.targetType || 'UNKNOWN',
    targetId: req.targetId || 'UNKNOWN',
    makerActorId: req.makerActorId || 'UNKNOWN',
    checkerActorId: req.checkerActorId || 'UNKNOWN',
    checkerActorRole: req.checkerActorRole || 'UNKNOWN',
    reasonCode: overrides.reasonCode || req.reasonCode || 'MISSING_REASON_CODE',
    correlationId: req.correlationId || 'UNKNOWN',
    idempotencyKey: req.idempotencyKey || 'UNKNOWN',
    requestedAt: req.requestedAt || 'UNKNOWN',
    decision: overrides.decision,
    resultStatus: overrides.resultStatus,
    ownerDomainHandoff: req.ownerDomainHandoff || null,
    auditRequired: true,
    auditEvidenceRequired: true,
    reasonCodeRequired: true,
    permissionChecked: overrides.permissionChecked,
    sameActorBlocked: overrides.sameActorBlocked,
    bffTruthMutated: false,
    uiTruthMutated: false,
    businessTruthMutated: false,
    ownerTruthMutatedByPanel: false,
    error: overrides.error
  };
}

function mapPanelAuditResultStatus(decision: string): PanelAuditResultStatus {
  if (decision === 'DUPLICATE_IDEMPOTENCY_KEY') return 'DUPLICATE_IDEMPOTENCY_KEY';
  if (decision === 'REJECTED') return 'REJECTED';
  if (decision === 'APPROVED') return 'ACCEPTED';
  return 'PENDING_OWNER_DOMAIN';
}
