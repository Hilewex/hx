import * as crypto from 'crypto';
import {
  CreateFraudFalsePositiveReviewCommand,
  CreateFraudReviewCaseCommand,
  CreateFraudSignalCommand,
  FraudBoundaryFlags,
  FraudDecisionStatus,
  FraudFalsePositiveReview,
  FraudMutationResult,
  FraudOwnerHandoffEvidence,
  FraudReviewCase,
  FraudReviewCaseStatus,
  FraudReviewDecision,
  FraudSeverity,
  FraudSignal,
  FraudSignalType,
  FraudTargetType,
  ReviewFraudCaseCommand
} from '@hx/contracts';
import { getAuditEventRepositories } from '@hx/persistence';

function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

class FraudValidationError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

const signals = new Map<string, FraudSignal>();
const cases = new Map<string, FraudReviewCase>();
const falsePositiveReviews = new Map<string, FraudFalsePositiveReview>();
const idempotency = new Map<string, string>();

const boundaryFlags: FraudBoundaryFlags = {
  fraudSignalOnly: true,
  businessTruthMutated: false,
  ownerTruthMutatedByFraud: false,
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
    throw new FraudValidationError('FRAUD_REASON_CODE_REQUIRED', 'reasonCode is required');
  }
  if (!command.correlationId) {
    throw new FraudValidationError('FRAUD_CORRELATION_ID_REQUIRED', 'correlationId is required');
  }
  if (!command.idempotencyKey) {
    throw new FraudValidationError('FRAUD_IDEMPOTENCY_KEY_REQUIRED', 'idempotencyKey is required');
  }
}

function decisionStatusForSeverity(severity: FraudSeverity): FraudDecisionStatus {
  if (severity === 'LOW') return 'FRAUD_NO_ACTION_MONITOR';
  if (severity === 'MEDIUM') return 'FRAUD_REVIEW_REQUIRED';
  return 'FRAUD_OWNER_HANDOFF_REQUIRED';
}

function ownerDomainForTarget(targetType: FraudTargetType): string | null {
  const ownerByTarget: Record<FraudTargetType, string | null> = {
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
  target: { targetType: FraudTargetType; targetId: string };
  fraudSeverity: FraudSeverity;
  fraudSignalType: FraudSignalType;
  reasonCode: any;
  correlationId: string;
  idempotencyKey: string;
  requestedAt: string;
  createdAt?: string;
  actorId?: string;
  systemActorId?: string;
  riskSignalReferenceId?: string;
  forceDecisionStatus?: FraudDecisionStatus;
}): FraudOwnerHandoffEvidence {
  const ownerDomainHandoff = ownerDomainForTarget(input.target.targetType);
  const decisionStatus = input.forceDecisionStatus || decisionStatusForSeverity(input.fraudSeverity);
  const handoffRequired =
    decisionStatus === 'FRAUD_OWNER_HANDOFF_REQUIRED' ||
    decisionStatus === 'FRAUD_REVIEW_REQUIRED' ||
    decisionStatus === 'FRAUD_FALSE_POSITIVE_REVIEW_REQUIRED';

  return {
    ...boundaryFlags,
    targetDomain: ownerDomainHandoff || 'NO_OWNER_HANDOFF',
    targetType: input.target.targetType,
    targetId: input.target.targetId,
    fraudSeverity: input.fraudSeverity,
    fraudSignalType: input.fraudSignalType,
    reasonCode: input.reasonCode,
    correlationId: input.correlationId,
    idempotencyKey: input.idempotencyKey,
    decisionStatus,
    handoffRequired,
    ownerHandoffRequired: handoffRequired,
    ownerHandoffNotRequiredReason: handoffRequired ? undefined : 'LOW_FRAUD_SIGNAL_MONITOR_ONLY',
    ownerDomainHandoff: handoffRequired ? ownerDomainHandoff : null,
    falsePositiveReviewAvailable: true,
    auditEvidenceRequired: true,
    reasonCodeRequired: true,
    actorId: input.actorId,
    systemActorId: input.systemActorId || 'fraud-service',
    requestedAt: input.requestedAt,
    createdAt: input.createdAt || input.requestedAt,
    riskSignalReferenceId: input.riskSignalReferenceId,
  };
}

function duplicateResult(existingId: string, evidence: FraudOwnerHandoffEvidence): FraudMutationResult {
  return {
    success: true,
    fraudSignalId: existingId.startsWith('fsig_') ? existingId : undefined,
    fraudCaseId: existingId.startsWith('fcas_') ? existingId : undefined,
    falsePositiveReviewId: existingId.startsWith('ffpr_') ? existingId : undefined,
    decisionStatus: 'FRAUD_ALREADY_PROCESSED',
    duplicate: true,
    alreadyProcessed: true,
    ownerHandoffEvidence: {
      ...evidence,
      decisionStatus: 'FRAUD_ALREADY_PROCESSED',
      handoffRequired: false,
      ownerHandoffRequired: false,
      ownerHandoffNotRequiredReason: 'DUPLICATE_IDEMPOTENCY_KEY_ALREADY_PROCESSED',
      ownerDomainHandoff: null,
    },
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
    ownerService: 'fraud',
    afterState: params.payload,
    correlationId: params.correlationId,
    metadata: {},
  });
}

export async function createFraudSignal(command: CreateFraudSignalCommand): Promise<FraudMutationResult> {
  validateEvidenceFields(command);
  const requestedAt = command.requestedAt || new Date().toISOString();
  const evidence = buildOwnerHandoffEvidence({
    target: command.target,
    fraudSeverity: command.severity,
    fraudSignalType: command.signalType,
    reasonCode: command.reasonCode,
    correlationId: command.correlationId,
    idempotencyKey: command.idempotencyKey,
    requestedAt,
    actorId: command.actorId,
    systemActorId: command.systemActorId,
    riskSignalReferenceId: command.riskSignalReferenceId,
  });

  const existing = idempotency.get(command.idempotencyKey);
  if (existing) return duplicateResult(existing, evidence);

  const fraudSignalId = `fsig_${generateId()}`;
  const now = new Date().toISOString();
  const signal: FraudSignal = {
    ...boundaryFlags,
    fraudSignalId,
    target: command.target,
    signalType: command.signalType,
    severity: command.severity,
    source: command.source,
    reasonCode: command.reasonCode,
    correlationId: command.correlationId,
    idempotencyKey: command.idempotencyKey,
    actorId: command.actorId,
    systemActorId: command.systemActorId || 'fraud-service',
    requestedAt,
    createdAt: now,
    metadata: command.metadata,
    riskSignalReferenceId: command.riskSignalReferenceId,
    decisionStatus: evidence.decisionStatus,
    ownerHandoffRequired: evidence.ownerHandoffRequired,
    ownerDomainHandoff: evidence.ownerDomainHandoff,
    ownerHandoffEvidence: evidence,
    falsePositiveReviewAvailable: true,
    auditEvidenceRequired: true,
    reasonCodeRequired: true,
    fraudTruthMutated: true,
    targetTruthMutated: false,
  };

  signals.set(fraudSignalId, signal);
  idempotency.set(command.idempotencyKey, fraudSignalId);

  const warnings: string[] = [];
  try {
    await appendAuditEvent({
      eventId: `evt_${generateId()}`,
      eventType: 'FRAUD_SIGNAL_CREATED',
      entityId: fraudSignalId,
      entityType: 'FRAUD_SIGNAL',
      payload: signal,
      correlationId: command.correlationId,
    });
  } catch {
    warnings.push('AUDIT_EVENT_APPEND_FAILED_FRAUD_SIGNAL_ONLY');
  }

  return {
    success: true,
    fraudSignalId,
    decisionStatus: signal.decisionStatus,
    ownerHandoffEvidence: evidence,
    auditEvidence: {
      auditEvidenceRequired: true,
      eventType: 'FRAUD_SIGNAL_CREATED',
      businessTruthMutated: false,
      ownerTruthMutatedByFraud: false,
      correlationId: command.correlationId,
      idempotencyKey: command.idempotencyKey,
    },
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

export async function createFraudReviewCase(command: CreateFraudReviewCaseCommand): Promise<FraudMutationResult> {
  validateEvidenceFields(command);
  const requestedAt = command.requestedAt || new Date().toISOString();
  const evidence = buildOwnerHandoffEvidence({
    target: command.target,
    fraudSeverity: command.severity,
    fraudSignalType: command.signalType,
    reasonCode: command.reasonCode,
    correlationId: command.correlationId,
    idempotencyKey: command.idempotencyKey,
    requestedAt,
    actorId: command.actorId,
    systemActorId: command.systemActorId,
    riskSignalReferenceId: command.riskSignalReferenceId,
    forceDecisionStatus: command.severity === 'LOW' ? 'FRAUD_NO_ACTION_MONITOR' : 'FRAUD_REVIEW_REQUIRED',
  });

  const existing = idempotency.get(command.idempotencyKey);
  if (existing) return duplicateResult(existing, evidence);

  const fraudCaseId = `fcas_${generateId()}`;
  const now = new Date().toISOString();
  const fraudCase: FraudReviewCase = {
    ...boundaryFlags,
    fraudCaseId,
    target: command.target,
    status: 'OPEN',
    severity: command.severity,
    source: command.source,
    signalType: command.signalType,
    reasonCode: command.reasonCode,
    correlationId: command.correlationId,
    idempotencyKey: command.idempotencyKey,
    actorId: command.actorId,
    systemActorId: command.systemActorId || 'fraud-service',
    requestedAt,
    createdAt: now,
    updatedAt: now,
    notes: command.notes,
    fraudSignals: command.fraudSignals || [],
    riskSignalReferenceId: command.riskSignalReferenceId,
    decisionStatus: evidence.decisionStatus,
    ownerHandoffRequired: evidence.ownerHandoffRequired,
    ownerDomainHandoff: evidence.ownerDomainHandoff,
    ownerHandoffEvidence: evidence,
    falsePositiveReviewAvailable: true,
    auditEvidenceRequired: true,
    reasonCodeRequired: true,
    fraudTruthMutated: true,
    targetTruthMutated: false,
  };

  cases.set(fraudCaseId, fraudCase);
  idempotency.set(command.idempotencyKey, fraudCaseId);

  const warnings: string[] = [];
  try {
    await appendAuditEvent({
      eventId: `evt_${generateId()}`,
      eventType: 'FRAUD_CASE_CREATED',
      entityId: fraudCaseId,
      entityType: 'FRAUD_REVIEW_CASE',
      payload: fraudCase,
      correlationId: command.correlationId,
    });
  } catch {
    warnings.push('AUDIT_EVENT_APPEND_FAILED_FRAUD_CASE_ONLY');
  }

  return {
    success: true,
    fraudCaseId,
    decisionStatus: fraudCase.decisionStatus,
    ownerHandoffEvidence: evidence,
    auditEvidence: {
      auditEvidenceRequired: true,
      eventType: 'FRAUD_CASE_CREATED',
      businessTruthMutated: false,
      ownerTruthMutatedByFraud: false,
      correlationId: command.correlationId,
      idempotencyKey: command.idempotencyKey,
    },
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

export async function reviewFraudCase(command: ReviewFraudCaseCommand): Promise<FraudMutationResult> {
  validateEvidenceFields(command);
  const fraudCase = cases.get(command.fraudCaseId);
  if (!fraudCase) {
    throw new FraudValidationError('FRAUD_CASE_NOT_FOUND', 'Fraud case not found');
  }

  const requestedAt = command.requestedAt || new Date().toISOString();
  const decisionStatus = decisionStatusForReview(command.decision);
  const evidence = buildOwnerHandoffEvidence({
    target: fraudCase.target,
    fraudSeverity: fraudCase.severity,
    fraudSignalType: fraudCase.signalType,
    reasonCode: command.reasonCode,
    correlationId: command.correlationId,
    idempotencyKey: command.idempotencyKey,
    requestedAt,
    actorId: command.reviewerId,
    systemActorId: 'fraud-service',
    riskSignalReferenceId: fraudCase.riskSignalReferenceId,
    forceDecisionStatus: decisionStatus,
  });

  const existing = idempotency.get(command.idempotencyKey);
  if (existing) return duplicateResult(existing, evidence);

  fraudCase.decision = command.decision;
  fraudCase.status = statusForReviewDecision(command.decision);
  fraudCase.updatedAt = new Date().toISOString();
  fraudCase.decisionStatus = decisionStatus;
  fraudCase.ownerHandoffRequired = evidence.ownerHandoffRequired;
  fraudCase.ownerDomainHandoff = evidence.ownerDomainHandoff;
  fraudCase.ownerHandoffEvidence = evidence;
  cases.set(fraudCase.fraudCaseId, fraudCase);
  idempotency.set(command.idempotencyKey, fraudCase.fraudCaseId);

  const warnings: string[] = [];
  try {
    await appendAuditEvent({
      eventId: `evt_${generateId()}`,
      eventType: 'FRAUD_CASE_REVIEWED',
      entityId: fraudCase.fraudCaseId,
      entityType: 'FRAUD_REVIEW_CASE',
      payload: { command, evidence },
      correlationId: command.correlationId,
    });
  } catch {
    warnings.push('AUDIT_EVENT_APPEND_FAILED_FRAUD_REVIEW_ONLY');
  }

  return {
    success: true,
    fraudCaseId: fraudCase.fraudCaseId,
    decisionStatus,
    ownerHandoffEvidence: evidence,
    auditEvidence: {
      auditEvidenceRequired: true,
      eventType: 'FRAUD_CASE_REVIEWED',
      businessTruthMutated: false,
      ownerTruthMutatedByFraud: false,
      correlationId: command.correlationId,
      idempotencyKey: command.idempotencyKey,
    },
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

export async function createFraudFalsePositiveReview(command: CreateFraudFalsePositiveReviewCommand): Promise<FraudMutationResult> {
  validateEvidenceFields(command);
  const fraudCase = cases.get(command.fraudCaseId);
  if (!fraudCase) {
    throw new FraudValidationError('FRAUD_CASE_NOT_FOUND', 'Fraud case not found');
  }

  const requestedAt = command.requestedAt || new Date().toISOString();
  const evidence = buildOwnerHandoffEvidence({
    target: fraudCase.target,
    fraudSeverity: fraudCase.severity,
    fraudSignalType: fraudCase.signalType,
    reasonCode: command.reasonCode,
    correlationId: command.correlationId,
    idempotencyKey: command.idempotencyKey,
    requestedAt,
    actorId: command.requestedByActorId,
    systemActorId: command.systemActorId || 'fraud-service',
    riskSignalReferenceId: fraudCase.riskSignalReferenceId,
    forceDecisionStatus: 'FRAUD_FALSE_POSITIVE_REVIEW_REQUIRED',
  });

  const existing = idempotency.get(command.idempotencyKey);
  if (existing) return duplicateResult(existing, evidence);

  const falsePositiveReviewId = `ffpr_${generateId()}`;
  const now = new Date().toISOString();
  const falsePositiveReview: FraudFalsePositiveReview = {
    ...boundaryFlags,
    falsePositiveReviewId,
    fraudCaseId: command.fraudCaseId,
    requestedByActorId: command.requestedByActorId,
    systemActorId: command.systemActorId || 'fraud-service',
    reasonCode: command.reasonCode,
    correlationId: command.correlationId,
    idempotencyKey: command.idempotencyKey,
    requestedAt,
    createdAt: now,
    notes: command.notes,
    decisionStatus: 'FRAUD_FALSE_POSITIVE_REVIEW_REQUIRED',
    ownerHandoffEvidence: evidence,
    falsePositiveReviewAvailable: true,
    ownerTruthRestoredByFraud: false,
    auditEvidenceRequired: true,
    reasonCodeRequired: true,
  };

  falsePositiveReviews.set(falsePositiveReviewId, falsePositiveReview);
  idempotency.set(command.idempotencyKey, falsePositiveReviewId);

  const warnings: string[] = [];
  try {
    await appendAuditEvent({
      eventId: `evt_${generateId()}`,
      eventType: 'FRAUD_FALSE_POSITIVE_REVIEW_REQUESTED',
      entityId: falsePositiveReviewId,
      entityType: 'FRAUD_FALSE_POSITIVE_REVIEW',
      payload: falsePositiveReview,
      correlationId: command.correlationId,
    });
  } catch {
    warnings.push('AUDIT_EVENT_APPEND_FAILED_FRAUD_FALSE_POSITIVE_REVIEW_ONLY');
  }

  return {
    success: true,
    falsePositiveReviewId,
    fraudCaseId: command.fraudCaseId,
    decisionStatus: 'FRAUD_FALSE_POSITIVE_REVIEW_REQUIRED',
    ownerHandoffEvidence: evidence,
    auditEvidence: {
      auditEvidenceRequired: true,
      eventType: 'FRAUD_FALSE_POSITIVE_REVIEW_REQUESTED',
      businessTruthMutated: false,
      ownerTruthMutatedByFraud: false,
      ownerTruthRestoredByFraud: false,
      correlationId: command.correlationId,
      idempotencyKey: command.idempotencyKey,
    },
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

function decisionStatusForReview(decision: FraudReviewDecision): FraudDecisionStatus {
  if (decision === 'FRAUD_NO_ACTION' || decision === 'FRAUD_CLOSE') return 'FRAUD_NO_ACTION_MONITOR';
  if (decision === 'FRAUD_MARK_FALSE_POSITIVE_REVIEW_REQUIRED') return 'FRAUD_FALSE_POSITIVE_REVIEW_REQUIRED';
  if (decision === 'FRAUD_RECOMMEND_OWNER_ACTION' || decision === 'FRAUD_ESCALATE') {
    return 'FRAUD_OWNER_HANDOFF_REQUIRED';
  }
  return 'FRAUD_REVIEW_REQUIRED';
}

function statusForReviewDecision(decision: FraudReviewDecision): FraudReviewCaseStatus {
  if (decision === 'FRAUD_NO_ACTION') return 'NO_ACTION';
  if (decision === 'FRAUD_MARK_FALSE_POSITIVE_REVIEW_REQUIRED') return 'FALSE_POSITIVE_REVIEW_REQUIRED';
  if (decision === 'FRAUD_RECOMMEND_OWNER_ACTION') return 'OWNER_HANDOFF_RECOMMENDED';
  if (decision === 'FRAUD_ESCALATE') return 'ESCALATED';
  if (decision === 'FRAUD_CLOSE') return 'CLOSED';
  return 'UNDER_REVIEW';
}
