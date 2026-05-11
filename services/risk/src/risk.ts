import * as crypto from 'crypto';
import {
  CreateRiskSignalCommand,
  CreateRiskCaseCommand,
  ReviewRiskCaseCommand,
  GetRiskCaseQuery,
  ListRiskCasesQuery,
  RiskMutationResult,
  RiskCaseResponse,
  RiskCaseListResponse,
  RiskSignalResponse,
  RiskSignal,
  RiskCase,
  RiskCaseStatus,
  RiskDecision,
  RiskBoundaryFlags,
  RiskDecisionStatus,
  RiskLevel,
  RiskOwnerHandoffEvidence,
  RiskScore,
  RiskSignalType,
  RiskTargetType
} from '@hx/contracts';
import { getRepository } from './repository';
import { getAuditEventRepositories } from '@hx/persistence';

function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

class RiskValidationError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

const boundaryFlags: RiskBoundaryFlags = {
  riskSignalOnly: true,
  businessTruthMutated: false,
  ownerTruthMutatedByRisk: false,
  orderTruthMutated: false,
  paymentTruthMutated: false,
  payoutTruthMutated: false,
  financeTruthMutated: false,
  moderationTruthMutated: false,
  bffTruthMutated: false,
  uiTruthMutated: false,
};

function validateEvidenceFields(command: {
  reasonCode?: string;
  correlationId?: string;
  idempotencyKey?: string;
}) {
  if (!command.reasonCode) {
    throw new RiskValidationError('RISK_REASON_CODE_REQUIRED', 'reasonCode is required');
  }
  if (!command.correlationId) {
    throw new RiskValidationError('RISK_CORRELATION_ID_REQUIRED', 'correlationId is required');
  }
  if (!command.idempotencyKey) {
    throw new RiskValidationError('RISK_IDEMPOTENCY_KEY_REQUIRED', 'idempotencyKey is required');
  }
}

function buildRiskScore(level: RiskLevel, category: RiskSignalType): RiskScore {
  const scoreByLevel: Record<RiskLevel, number> = {
    LOW: 25,
    MEDIUM: 55,
    HIGH: 80,
    CRITICAL: 95,
  };

  return {
    score: scoreByLevel[level],
    severity: level,
    category,
    decisionStatus: decisionStatusForLevel(level),
    riskSignalOnly: true,
  };
}

function decisionStatusForLevel(level: RiskLevel): RiskDecisionStatus {
  if (level === 'LOW') return 'NO_ACTION_MONITOR';
  if (level === 'MEDIUM') return 'REVIEW_REQUIRED';
  return 'OWNER_HANDOFF_REQUIRED';
}

function ownerDomainForTarget(targetType: RiskTargetType): string | null {
  const ownerByTarget: Record<RiskTargetType, string | null> = {
    ACCOUNT: 'AUTH_ACCESS_OWNER',
    CHECKOUT: 'COMMERCE_OWNER',
    PAYMENT: 'PAYMENT_OWNER',
    ORDER: 'ORDER_OPERATIONS_OWNER',
    REFUND: 'FINANCE_REFUND_OWNER',
    PAYOUT: 'PAYOUT_OWNER',
    COUPON: 'COMMERCE_PROMOTION_OWNER',
    POINT: 'REWARD_POINT_OWNER',
    INTERACTION: 'SOCIAL_OWNER',
    REVIEW: 'MODERATION_OWNER',
    STORY: 'MODERATION_OWNER',
    STORE: 'CREATOR_LIFECYCLE_OWNER',
    SUPPLIER: 'SUPPLIER_LIFECYCLE_OWNER',
    CREATOR: 'CREATOR_LIFECYCLE_OWNER',
  };

  return ownerByTarget[targetType] ?? null;
}

function buildOwnerHandoffEvidence(input: {
  target: { targetType: RiskTargetType; targetId: string };
  score: RiskScore;
  reasonCode: any;
  correlationId: string;
  idempotencyKey: string;
  requestedAt: string;
  createdAt?: string;
  actorId?: string;
  systemActorId?: string;
  forceDecisionStatus?: RiskDecisionStatus;
}): RiskOwnerHandoffEvidence {
  const ownerDomainHandoff = ownerDomainForTarget(input.target.targetType);
  const decisionStatus = input.forceDecisionStatus || input.score.decisionStatus;
  const handoffRequired = decisionStatus === 'OWNER_HANDOFF_REQUIRED' || decisionStatus === 'REVIEW_REQUIRED';

  return {
    ...boundaryFlags,
    targetDomain: ownerDomainHandoff || 'NO_OWNER_HANDOFF',
    targetType: input.target.targetType,
    targetId: input.target.targetId,
    riskScore: input.score,
    severity: input.score.severity,
    reasonCode: input.reasonCode,
    correlationId: input.correlationId,
    idempotencyKey: input.idempotencyKey,
    decisionStatus,
    handoffRequired,
    ownerHandoffRequired: handoffRequired,
    ownerHandoffNotRequiredReason: handoffRequired ? undefined : 'LOW_RISK_MONITOR_ONLY',
    ownerDomainHandoff: handoffRequired ? ownerDomainHandoff : null,
    auditEvidenceRequired: true,
    reasonCodeRequired: true,
    actorId: input.actorId,
    systemActorId: input.systemActorId || 'risk-service',
    requestedAt: input.requestedAt,
    createdAt: input.createdAt || input.requestedAt,
  };
}

async function appendAuditEvent(params: any) {
  const repo = getAuditEventRepositories();
  await repo.audit.appendAuditLog({
    auditId: params.eventId,
    actionType: params.eventType,
    actorId: 'system',
    actorType: 'system',
    entityId: params.entityId,
    entityType: params.entityType,
    ownerService: params.ownerService,
    afterState: params.payload,
    correlationId: params.correlationId,
    metadata: {},
  });
}

export async function createRiskSignal(command: CreateRiskSignalCommand): Promise<RiskMutationResult> {
  const repo = getRepository();
  validateEvidenceFields(command);
  const requestedAt = command.requestedAt || new Date().toISOString();
  const score = buildRiskScore(command.level, command.type);
  const ownerHandoffEvidence = buildOwnerHandoffEvidence({
    target: command.target,
    score,
    reasonCode: command.reasonCode,
    correlationId: command.correlationId,
    idempotencyKey: command.idempotencyKey,
    requestedAt,
    actorId: command.actorId,
    systemActorId: command.systemActorId,
  });

  const existing = await repo.checkIdempotency(command.idempotencyKey);
  if (existing) {
    return {
      success: true,
      signalId: existing,
      decisionStatus: 'ALREADY_PROCESSED',
      duplicate: true,
      alreadyProcessed: true,
      ownerHandoffEvidence: {
        ...ownerHandoffEvidence,
        decisionStatus: 'ALREADY_PROCESSED',
        handoffRequired: false,
        ownerHandoffRequired: false,
        ownerHandoffNotRequiredReason: 'DUPLICATE_IDEMPOTENCY_KEY_ALREADY_PROCESSED',
        ownerDomainHandoff: null,
      },
      score,
    };
  }

  const signalId = `rsig_${generateId()}`;
  const now = new Date().toISOString();

  const signal: RiskSignal = {
    ...boundaryFlags,
    signalId,
    target: command.target,
    type: command.type,
    level: command.level,
    score,
    source: command.source,
    reasonCode: command.reasonCode,
    correlationId: command.correlationId,
    metadata: command.metadata,
    idempotencyKey: command.idempotencyKey,
    actorId: command.actorId,
    systemActorId: command.systemActorId || 'risk-service',
    requestedAt,
    createdAt: now,
    decisionStatus: score.decisionStatus,
    ownerHandoffRequired: ownerHandoffEvidence.ownerHandoffRequired,
    ownerDomainHandoff: ownerHandoffEvidence.ownerDomainHandoff,
    ownerHandoffEvidence,
    auditEvidenceRequired: true,
    reasonCodeRequired: true,
    riskTruthMutated: true,
    targetTruthMutated: false,
    refundTruthMutated: false,
  };

  await repo.createSignal(signal);

  await repo.saveIdempotency(command.idempotencyKey, signalId);

  const warnings: string[] = [];
  try {
    await appendAuditEvent({
      eventId: `evt_${generateId()}`,
      eventType: 'RISK_SIGNAL_CREATED',
      entityId: signalId,
      entityType: 'RISK_SIGNAL',
      ownerService: 'risk',
      payload: signal,
      correlationId: command.correlationId,
    });
  } catch (err) {
    warnings.push('AUDIT_EVENT_APPEND_FAILED_RISK_SIGNAL_ONLY');
  }

  return {
    success: true,
    signalId,
    decisionStatus: signal.decisionStatus,
    ownerHandoffEvidence,
    auditEvidence: {
      auditEvidenceRequired: true,
      eventType: 'RISK_SIGNAL_CREATED',
      businessTruthMutated: false,
      ownerTruthMutatedByRisk: false,
      correlationId: command.correlationId,
      idempotencyKey: command.idempotencyKey,
    },
    score,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

export async function createRiskCase(command: CreateRiskCaseCommand): Promise<RiskMutationResult> {
  const repo = getRepository();
  validateEvidenceFields(command);
  const requestedAt = command.requestedAt || new Date().toISOString();
  const score = buildRiskScore(command.level, 'MANUAL_REPORT');
  const ownerHandoffEvidence = buildOwnerHandoffEvidence({
    target: command.target,
    score,
    reasonCode: command.reasonCode,
    correlationId: command.correlationId,
    idempotencyKey: command.idempotencyKey,
    requestedAt,
    actorId: command.actorId,
    systemActorId: command.systemActorId,
    forceDecisionStatus: command.level === 'LOW' ? 'NO_ACTION_MONITOR' : 'REVIEW_REQUIRED',
  });

  const existing = await repo.checkIdempotency(command.idempotencyKey);
  if (existing) {
    return {
      success: true,
      caseId: existing,
      decisionStatus: 'ALREADY_PROCESSED',
      duplicate: true,
      alreadyProcessed: true,
      ownerHandoffEvidence: {
        ...ownerHandoffEvidence,
        decisionStatus: 'ALREADY_PROCESSED',
        handoffRequired: false,
        ownerHandoffRequired: false,
        ownerHandoffNotRequiredReason: 'DUPLICATE_IDEMPOTENCY_KEY_ALREADY_PROCESSED',
        ownerDomainHandoff: null,
      },
      score,
    };
  }

  const caseId = `rcas_${generateId()}`;
  const now = new Date().toISOString();

  const riskCase: RiskCase = {
    ...boundaryFlags,
    caseId,
    target: command.target,
    status: 'OPEN',
    level: command.level,
    score,
    source: command.source,
    reasonCode: command.reasonCode,
    correlationId: command.correlationId,
    signals: command.signals || [],
    notes: command.notes,
    idempotencyKey: command.idempotencyKey,
    actorId: command.actorId,
    systemActorId: command.systemActorId || 'risk-service',
    requestedAt,
    createdAt: now,
    updatedAt: now,
    decisionStatus: ownerHandoffEvidence.decisionStatus,
    ownerHandoffRequired: ownerHandoffEvidence.ownerHandoffRequired,
    ownerDomainHandoff: ownerHandoffEvidence.ownerDomainHandoff,
    ownerHandoffEvidence,
    auditEvidenceRequired: true,
    reasonCodeRequired: true,
    riskTruthMutated: true,
    targetTruthMutated: false,
    refundTruthMutated: false,
  };

  await repo.createCase(riskCase);

  await repo.saveIdempotency(command.idempotencyKey, caseId);

  const warnings: string[] = [];
  try {
    await appendAuditEvent({
      eventId: `evt_${generateId()}`,
      eventType: 'RISK_CASE_CREATED',
      entityId: caseId,
      entityType: 'RISK_CASE',
      ownerService: 'risk',
      payload: riskCase,
      correlationId: command.correlationId,
    });
  } catch (err) {
    warnings.push('AUDIT_EVENT_APPEND_FAILED_RISK_CASE_ONLY');
  }

  return {
    success: true,
    caseId,
    decisionStatus: riskCase.decisionStatus,
    ownerHandoffEvidence,
    auditEvidence: {
      auditEvidenceRequired: true,
      eventType: 'RISK_CASE_CREATED',
      businessTruthMutated: false,
      ownerTruthMutatedByRisk: false,
      correlationId: command.correlationId,
      idempotencyKey: command.idempotencyKey,
    },
    score,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

export async function reviewRiskCase(command: ReviewRiskCaseCommand): Promise<RiskMutationResult> {
  const repo = getRepository();
  validateEvidenceFields(command);

  const existingReview = await repo.checkIdempotency(command.idempotencyKey);
  if (existingReview) {
    return {
      success: true,
      caseId: command.caseId,
      decisionStatus: 'ALREADY_PROCESSED',
      duplicate: true,
      alreadyProcessed: true,
    };
  }

  const riskCase = await repo.getCase(command.caseId);

  if (!riskCase) {
    throw new Error('RISK_CASE_NOT_FOUND');
  }

  let newStatus: RiskCaseStatus = riskCase.status;

  switch (command.decision) {
    case 'NO_ACTION':
      newStatus = 'NO_ACTION';
      break;
    case 'MARK_REVIEW_REQUIRED':
      newStatus = 'REVIEW_REQUIRED';
      break;
    case 'RECOMMEND_HOLD':
      newStatus = 'ADVISORY_HOLD_RECOMMENDED';
      break;
    case 'RELEASE_RECOMMENDATION':
      newStatus = 'CLOSED';
      break;
    case 'ESCALATE':
      newStatus = 'ESCALATED';
      break;
    case 'CLOSE':
      newStatus = 'CLOSED';
      break;
  }

  const requestedAt = command.requestedAt || new Date().toISOString();
  const score = riskCase.score || buildRiskScore(riskCase.level, 'MANUAL_REPORT');
  const reviewDecisionStatus = mapReviewDecisionStatus(command.decision);
  const ownerHandoffEvidence = buildOwnerHandoffEvidence({
    target: riskCase.target,
    score,
    reasonCode: command.reasonCode,
    correlationId: command.correlationId,
    idempotencyKey: command.idempotencyKey,
    requestedAt,
    actorId: command.reviewerId,
    systemActorId: 'risk-service',
    forceDecisionStatus: reviewDecisionStatus,
  });

  const updates: Partial<RiskCase> = {
    status: newStatus,
    decision: command.decision,
    reasonCode: command.reasonCode,
    correlationId: command.correlationId,
    decisionStatus: reviewDecisionStatus,
    ownerHandoffRequired: ownerHandoffEvidence.ownerHandoffRequired,
    ownerDomainHandoff: ownerHandoffEvidence.ownerDomainHandoff,
    ownerHandoffEvidence,
    notes: command.notes ? `${riskCase.notes ? riskCase.notes + '\n' : ''}[${new Date().toISOString()}] ${command.notes}` : riskCase.notes,
    updatedAt: new Date().toISOString(),
  };

  await repo.updateCase(command.caseId, updates);
  await repo.saveIdempotency(command.idempotencyKey, command.caseId);

  const warnings: string[] = [];
  try {
    await appendAuditEvent({
      eventId: `evt_${generateId()}`,
      eventType: 'RISK_CASE_REVIEWED',
      entityId: command.caseId,
      entityType: 'RISK_CASE',
      ownerService: 'risk',
      payload: {
        caseId: command.caseId,
        decision: command.decision,
        newStatus,
        reviewerId: command.reviewerId,
        ownerHandoffEvidence,
        businessTruthMutated: false,
        ownerTruthMutatedByRisk: false,
      },
      correlationId: command.correlationId,
    });
  } catch (err) {
    warnings.push('AUDIT_EVENT_APPEND_FAILED_RISK_REVIEW_ONLY');
  }

  return {
    success: true,
    caseId: command.caseId,
    decisionStatus: reviewDecisionStatus,
    ownerHandoffEvidence,
    auditEvidence: {
      auditEvidenceRequired: true,
      eventType: 'RISK_CASE_REVIEWED',
      businessTruthMutated: false,
      ownerTruthMutatedByRisk: false,
      correlationId: command.correlationId,
      idempotencyKey: command.idempotencyKey,
    },
    score,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

function mapReviewDecisionStatus(decision: RiskDecision): RiskDecisionStatus {
  switch (decision) {
    case 'NO_ACTION':
      return 'NO_ACTION_MONITOR';
    case 'MARK_REVIEW_REQUIRED':
      return 'REVIEW_REQUIRED';
    case 'RECOMMEND_HOLD':
    case 'ESCALATE':
      return 'OWNER_HANDOFF_REQUIRED';
    case 'RELEASE_RECOMMENDATION':
    case 'CLOSE':
      return 'NO_ACTION_MONITOR';
  }
}

export async function createInternalRiskSignal(params: {
  targetId: string;
  targetType: any;
  type: any;
  level: any;
  source: any;
  reasonCode: any;
  metadata?: Record<string, any>;
  correlationId?: string;
}): Promise<RiskMutationResult> {
  const command: CreateRiskSignalCommand = {
    target: {
      targetId: params.targetId,
      targetType: params.targetType,
    },
    type: params.type,
    level: params.level,
    source: params.source,
    reasonCode: params.reasonCode,
    metadata: params.metadata,
    correlationId: params.correlationId || `internal_${params.targetType}_${params.targetId}`,
    idempotencyKey: params.correlationId ? `internal_risk_${params.correlationId}` : `internal_risk_${params.targetType}_${params.targetId}_${params.type}`,
    systemActorId: 'risk-service',
  };

  return createRiskSignal(command);
}

export async function getRiskCase(query: GetRiskCaseQuery): Promise<RiskCaseResponse> {
  const repo = getRepository();
  const riskCase = await repo.getCase(query.caseId);

  if (!riskCase) {
    throw new Error('RISK_CASE_NOT_FOUND');
  }

  return { case: riskCase };
}

export async function listRiskCases(query: ListRiskCasesQuery): Promise<RiskCaseListResponse> {
  const repo = getRepository();
  const result = await repo.listCases(query);
  return result;
}

export async function listRiskSignals(query: {
  targetId?: string;
  targetType?: any;
  limit?: number;
  offset?: number;
}): Promise<{ signals: RiskSignal[]; total: number }> {
  const repo = getRepository();
  const result = await repo.listSignals(query);
  return result;
}
