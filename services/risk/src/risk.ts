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
  RiskDecision
} from '@hx/contracts';
import { getRepository } from './repository';
import { getAuditEventRepositories } from '@hx/persistence';

function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
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

  if (command.idempotencyKey) {
    const existing = await repo.checkIdempotency(command.idempotencyKey);
    if (existing) {
      return { success: true, signalId: existing };
    }
  }

  const signalId = `rsig_${generateId()}`;
  const now = new Date().toISOString();

  const signal: RiskSignal = {
    signalId,
    target: command.target,
    type: command.type,
    level: command.level,
    source: command.source,
    reasonCode: command.reasonCode,
    metadata: command.metadata,
    idempotencyKey: command.idempotencyKey,
    createdAt: now,
    riskTruthMutated: true,
    targetTruthMutated: false,
    paymentTruthMutated: false,
    orderTruthMutated: false,
    refundTruthMutated: false,
    financeTruthMutated: false,
    moderationTruthMutated: false,
  };

  await repo.createSignal(signal);

  if (command.idempotencyKey) {
    await repo.saveIdempotency(command.idempotencyKey, signalId);
  }

  const warnings: string[] = [];
  try {
    await appendAuditEvent({
      eventId: `evt_${generateId()}`,
      eventType: 'RISK_SIGNAL_CREATED',
      entityId: signalId,
      entityType: 'RISK_SIGNAL',
      ownerService: 'risk',
      payload: signal,
      correlationId: command.correlationId || signalId,
    });
  } catch (err) {
    warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
  }

  return { success: true, signalId, warnings: warnings.length > 0 ? warnings : undefined };
}

export async function createRiskCase(command: CreateRiskCaseCommand): Promise<RiskMutationResult> {
  const repo = getRepository();

  if (command.idempotencyKey) {
    const existing = await repo.checkIdempotency(command.idempotencyKey);
    if (existing) {
      return { success: true, caseId: existing };
    }
  }

  const caseId = `rcas_${generateId()}`;
  const now = new Date().toISOString();

  const riskCase: RiskCase = {
    caseId,
    target: command.target,
    status: 'OPEN',
    level: command.level,
    source: command.source,
    reasonCode: command.reasonCode,
    signals: command.signals || [],
    notes: command.notes,
    idempotencyKey: command.idempotencyKey,
    createdAt: now,
    updatedAt: now,
    riskTruthMutated: true,
    targetTruthMutated: false,
    paymentTruthMutated: false,
    orderTruthMutated: false,
    refundTruthMutated: false,
    financeTruthMutated: false,
    moderationTruthMutated: false,
  };

  await repo.createCase(riskCase);

  if (command.idempotencyKey) {
    await repo.saveIdempotency(command.idempotencyKey, caseId);
  }

  const warnings: string[] = [];
  try {
    await appendAuditEvent({
      eventId: `evt_${generateId()}`,
      eventType: 'RISK_CASE_CREATED',
      entityId: caseId,
      entityType: 'RISK_CASE',
      ownerService: 'risk',
      payload: riskCase,
      correlationId: command.correlationId || caseId,
    });
  } catch (err) {
    warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
  }

  return { success: true, caseId, warnings: warnings.length > 0 ? warnings : undefined };
}

export async function reviewRiskCase(command: ReviewRiskCaseCommand): Promise<RiskMutationResult> {
  const repo = getRepository();
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

  const updates: Partial<RiskCase> = {
    status: newStatus,
    decision: command.decision,
    notes: command.notes ? `${riskCase.notes ? riskCase.notes + '\n' : ''}[${new Date().toISOString()}] ${command.notes}` : riskCase.notes,
    updatedAt: new Date().toISOString(),
  };

  await repo.updateCase(command.caseId, updates);

  const warnings: string[] = [];
  try {
    await appendAuditEvent({
      eventId: `evt_${generateId()}`,
      eventType: 'RISK_CASE_REVIEWED',
      entityId: command.caseId,
      entityType: 'RISK_CASE',
      ownerService: 'risk',
      payload: { caseId: command.caseId, decision: command.decision, newStatus, reviewerId: command.reviewerId },
      correlationId: command.correlationId || command.caseId,
    });
  } catch (err) {
    warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
  }

  return { success: true, caseId: command.caseId, warnings: warnings.length > 0 ? warnings : undefined };
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
    correlationId: params.correlationId,
    idempotencyKey: params.correlationId ? `internal_risk_${params.correlationId}` : undefined,
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
