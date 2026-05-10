import { 
  ModerationCase, 
  ModerationSnapshot, 
  CreateModerationCaseCommand, 
  ReviewModerationCaseCommand, 
  GetModerationCaseQuery, 
  ListModerationCasesQuery,
  ModerationMutationResult,
  ModerationDecisionResult,
  ModerationDecisionRecord,
  ModerationDecisionEvidence,
  ModerationCaseResponse,
  ModerationCaseListResponse,
  ModerationCaseStatus
} from '@hx/contracts';
import { IModerationRepository } from './repository/interface';
import { PostgresModerationRepository } from './repository/postgres';
import { InMemoryModerationRepository } from './repository/in-memory';
import { getAuditEventRepositories } from '@hx/persistence';
import { parseConfig, createServiceConfig } from '@hx/config';
import { z } from 'zod';

const moderationPersistenceSchema = createServiceConfig({
  PERSISTENCE_MODE: z.enum(['postgres', 'memory']).default('memory'),
  DATABASE_URL: z.string().url().optional(),
});

const config = parseConfig(moderationPersistenceSchema, process.env);

// Repository instance selection based on explicit config
// In-memory is allowed for foundation/local but should be explicit
if (config.PERSISTENCE_MODE === 'postgres' && !config.DATABASE_URL) {
  throw new Error('PERSISTENCE_MODE is postgres but DATABASE_URL is missing. Silent fallback forbidden.');
}

const repository: IModerationRepository = config.PERSISTENCE_MODE === 'postgres'
  ? new PostgresModerationRepository() 
  : new InMemoryModerationRepository();

/**
 * Mevcut createModerationSnapshot fonksiyonu - Geriye dönük uyumluluk için korundu.
 */
export const createModerationSnapshot = (input: { targetType: string; targetId: string; content: string }) => {
  console.log(`[Moderation] Legacy snapshot created for ${input.targetType}: ${input.targetId}`);
  return {
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };
};

const decisionStatusByType = (decision: string, currentStatus: ModerationCaseStatus): ModerationCaseStatus => {
  switch (decision) {
    case 'APPROVE':
      return 'APPROVED';
    case 'REJECT':
      return 'REJECTED';
    case 'RESTRICT_VISIBILITY':
    case 'HIDE':
    case 'REMOVE':
    case 'ARCHIVE':
      return 'RESTRICTED';
    case 'ESCALATE':
      return 'UNDER_REVIEW';
    case 'NO_ACTION':
      return 'CLOSED';
    default:
      return currentStatus;
  }
};

const stableStringify = (value: any): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
};

const buildDecisionFingerprint = (command: ReviewModerationCaseCommand): string => stableStringify({
  caseId: command.caseId,
  decision: command.decision,
  note: command.note || '',
  actor: command.actor,
  reasonCode: command.reasonCode,
  evidence: command.evidence || [],
  makerCheckerContext: command.makerCheckerContext,
});

const validateDecisionCommand = (command: ReviewModerationCaseCommand) => {
  if (!command.actor?.actorId || !command.actor?.actorType) {
    throw new Error('MODERATION_DECISION_ACTOR_REQUIRED');
  }
  if (!command.reasonCode) {
    throw new Error('MODERATION_DECISION_REASON_REQUIRED');
  }
  if (!command.evidence || command.evidence.length === 0) {
    throw new Error('MODERATION_DECISION_EVIDENCE_REQUIRED');
  }
  const makerChecker = command.makerCheckerContext;
  if (makerChecker?.requiresSeparateChecker) {
    const checkerActorId = makerChecker.checkerActorId || command.actor.actorId;
    const conflictingActors = [
      makerChecker.makerActorId,
      makerChecker.submittedByActorId,
    ].filter(Boolean);
    if (conflictingActors.includes(checkerActorId)) {
      throw new Error('MODERATION_MAKER_CHECKER_SAME_ACTOR_FORBIDDEN');
    }
  }
};

const normalizeDecisionEvidence = (evidence: ModerationDecisionEvidence[] | undefined, now: string): ModerationDecisionEvidence[] => {
  return (evidence || []).map((item) => ({
    ...item,
    evidenceId: item.evidenceId,
    evidenceType: item.evidenceType,
    sourceType: item.sourceType,
    sourceId: item.sourceId,
    createdAt: item.createdAt || now,
  }));
};

export const createModerationCase = async (command: CreateModerationCaseCommand): Promise<ModerationMutationResult> => {
  const { target, source, riskLevel = 'LOW', reasonCodes = [], contentText, mediaAssetIds, idempotencyKey } = command;

  console.log(`[ModerationService] createModerationCase request: ${target.targetType}:${target.targetId} from ${source}`);
  
  if (idempotencyKey) {
    const existingId = await repository.findByIdempotencyKey(idempotencyKey);
    if (existingId) {
      return { success: true, caseId: existingId };
    }
  }

  if (!target || !target.targetType || !target.targetId || !source) {
    throw new Error('MISSING_REQUIRED_FIELDS');
  }

  const finalReasonCodes = reasonCodes.length > 0 ? reasonCodes : ['UNKNOWN' as any];
  const caseId = `mod_case_${Math.random().toString(36).substr(2, 9)}`;
  const snapshotId = `mod_snap_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const snapshot: ModerationSnapshot = {
    snapshotId,
    target,
    contentText,
    mediaAssetIds,
    source,
    riskLevel,
    createdAt: now,
    moderationTruth: true,
    targetTruthMutated: false,
    mediaTruthMutated: false,
    supportTruthMutated: false,
  };

  const newCase: ModerationCase = {
    caseId,
    target,
    status: 'OPEN',
    source,
    riskLevel,
    reasonCodes: finalReasonCodes,
    snapshots: [snapshot],
    createdAt: now,
    updatedAt: now,
    moderationTruth: true,
    targetTruthMutated: false,
    postTruthMutated: false,
    ugcTruthMutated: false,
    storyTruthMutated: false,
    reviewTruthMutated: false,
    qaTruthMutated: false,
    interactionTruthMutated: false,
  };

  await repository.create(newCase, contentText, mediaAssetIds);
  console.log(`[Moderation] Case ${caseId} created for ${target.targetType}:${target.targetId}`);
  
  if (idempotencyKey) {
    await repository.saveIdempotencyKey(idempotencyKey, caseId);
  }

  const warnings = ['ENFORCEMENT_PIPELINE_NOT_CONFIGURED'];
  try {
    const auditEvent = getAuditEventRepositories();
    await auditEvent.audit.appendAuditLog({
      actorType: source,
      actorId: target.ownerActorId || 'system',
      actionType: 'moderation.case_created',
      ownerService: 'moderation',
      entityType: 'moderation_case',
      entityId: caseId,
      afterState: newCase,
      reason: finalReasonCodes.join(','),
      idempotencyKey,
      correlationId: caseId,
      metadata: {
        target,
        targetTruthMutated: false,
      },
    });
    await auditEvent.outbox.appendOutboxEvent({
      topic: 'moderation.case_created',
      payloadSchema: 'moderation.case_created.v1',
      payload: {
        caseId,
        target,
        status: newCase.status,
        riskLevel,
        reasonCodes: finalReasonCodes,
        targetTruthMutated: false,
      },
      ownerService: 'moderation',
      entityType: 'moderation_case',
      entityId: caseId,
      idempotencyKey: idempotencyKey ? `event:${idempotencyKey}` : undefined,
      correlationId: caseId,
    });
  } catch (error) {
    warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
  }

  return { 
    success: true, 
    caseId, 
    warnings,
  };
};

export const reviewModerationCase = async (command: ReviewModerationCaseCommand): Promise<ModerationDecisionResult> => {
  const { caseId, decision, note } = command;
  validateDecisionCommand(command);

  if (command.idempotencyKey) {
    const fingerprint = buildDecisionFingerprint(command);
    const existing = await repository.findDecisionByIdempotencyKey(command.idempotencyKey);
    if (existing) {
      if (existing.fingerprint !== fingerprint) {
        throw new Error('MODERATION_DECISION_IDEMPOTENCY_CONFLICT');
      }
      return existing.result;
    }
  }

  const existingCase = await repository.getById(caseId);

  if (!existingCase) {
    throw new Error('MODERATION_CASE_NOT_FOUND');
  }

  const now = new Date().toISOString();
  const decisionId = `mod_dec_${Math.random().toString(36).substr(2, 9)}`;
  const newStatus = decisionStatusByType(decision, existingCase.status);
  const evidence = normalizeDecisionEvidence(command.evidence, now);
  const makerCheckerEnforced = command.makerCheckerContext?.requiresSeparateChecker === true;
  const decisionRecord: ModerationDecisionRecord = {
    decisionId,
    caseId,
    decisionType: decision,
    actor: command.actor!,
    reasonCode: command.reasonCode!,
    evidence,
    makerCheckerContext: command.makerCheckerContext,
    createdAt: now,
    auditRecorded: false,
    evidenceRecorded: evidence.length > 0,
    ownerHandoffCreated: command.ownerHandoffCreated === true,
    visibilityTruthMutatedByBff: false,
    makerCheckerEnforced,
  };

  const updatedCase: ModerationCase = {
    ...existingCase,
    status: newStatus,
    decision,
    decisionNote: note,
    decisions: [...(existingCase.decisions || []), decisionRecord],
    updatedAt: now,
    reviewedAt: now,
    closedAt: ['APPROVED', 'REJECTED', 'CLOSED'].includes(newStatus) ? now : undefined,
  };

  await repository.update(updatedCase);

  const warnings = ['TARGET_TRUTH_NOT_MUTATED', 'HUMAN_REVIEW_QUEUE_NOT_CONFIGURED'];
  let auditRecorded = false;
  try {
    const auditEvent = getAuditEventRepositories();
    await auditEvent.audit.appendAuditLog({
      actorType: command.actor!.actorType,
      actorId: command.actor!.actorId,
      actionType: 'moderation.case_reviewed',
      ownerService: 'moderation',
      entityType: 'moderation_case',
      entityId: caseId,
      beforeState: existingCase,
      afterState: updatedCase,
      reason: command.reasonCode,
      idempotencyKey: command.idempotencyKey,
      correlationId: caseId,
      metadata: {
        decisionId,
        decision,
        decisionActor: command.actor,
        evidence,
        makerCheckerContext: command.makerCheckerContext,
        target: updatedCase.target,
        targetTruthMutated: false,
        visibilityTruthMutatedByBff: false,
      },
    });
    await auditEvent.outbox.appendOutboxEvent({
      topic: 'moderation.case_reviewed',
      payloadSchema: 'moderation.case_reviewed.v1',
      payload: {
        decisionId,
        caseId,
        decision,
        actorId: command.actor!.actorId,
        reasonCode: command.reasonCode,
        evidenceRecorded: evidence.length > 0,
        status: updatedCase.status,
        target: updatedCase.target,
        targetTruthMutated: false,
        visibilityTruthMutatedByBff: false,
      },
      ownerService: 'moderation',
      entityType: 'moderation_case',
      entityId: caseId,
      idempotencyKey: command.idempotencyKey ? `event:${command.idempotencyKey}` : undefined,
      correlationId: caseId,
    });
    auditRecorded = true;
  } catch (error) {
    warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
  }

  const result: ModerationDecisionResult = {
    success: true,
    caseId,
    decisionId,
    decisionType: decision,
    actorId: command.actor!.actorId,
    reasonCode: command.reasonCode!,
    evidenceRecorded: evidence.length > 0,
    auditRecorded,
    ownerHandoffCreated: command.ownerHandoffCreated === true,
    visibilityTruthMutatedByBff: false,
    makerCheckerEnforced,
    warnings,
  };

  if (command.idempotencyKey) {
    await repository.saveDecisionIdempotencyKey(command.idempotencyKey, buildDecisionFingerprint(command), result);
  }

  return result;
};

export const getModerationCase = async (query: GetModerationCaseQuery): Promise<ModerationCaseResponse> => {
  const mCase = await repository.getById(query.caseId);
  if (!mCase) {
    throw new Error('MODERATION_CASE_NOT_FOUND');
  }
  return { data: mCase };
};

export const listModerationCases = async (query: ListModerationCasesQuery): Promise<ModerationCaseListResponse> => {
  const items = await repository.list(query);

  return {
    items,
    warnings: ['SUPPORT_ESCALATION_FOUNDATION_ONLY']
  };
};
