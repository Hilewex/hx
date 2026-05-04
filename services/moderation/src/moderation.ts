import { 
  ModerationCase, 
  ModerationSnapshot, 
  CreateModerationCaseCommand, 
  ReviewModerationCaseCommand, 
  GetModerationCaseQuery, 
  ListModerationCasesQuery,
  ModerationMutationResult,
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

const config = parseConfig(moderationPersistenceSchema);

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

export const reviewModerationCase = async (command: ReviewModerationCaseCommand): Promise<ModerationMutationResult> => {
  const { caseId, decision, note } = command;
  const existingCase = await repository.getById(caseId);

  if (!existingCase) {
    throw new Error('MODERATION_CASE_NOT_FOUND');
  }

  let newStatus: ModerationCaseStatus = existingCase.status;
  const now = new Date().toISOString();

  // Transition Logic
  switch (decision) {
    case 'APPROVE':
      newStatus = 'APPROVED';
      break;
    case 'REJECT':
      newStatus = 'REJECTED';
      break;
    case 'RESTRICT_VISIBILITY':
    case 'HIDE':
    case 'ARCHIVE':
      newStatus = 'RESTRICTED';
      break;
    case 'ESCALATE':
      newStatus = 'UNDER_REVIEW';
      break;
    case 'NO_ACTION':
      newStatus = 'CLOSED';
      break;
  }

  const updatedCase: ModerationCase = {
    ...existingCase,
    status: newStatus,
    decision,
    decisionNote: note,
    updatedAt: now,
    reviewedAt: now,
    closedAt: ['APPROVED', 'REJECTED', 'CLOSED'].includes(newStatus) ? now : undefined,
  };

  await repository.update(updatedCase);

  const warnings = ['TARGET_TRUTH_NOT_MUTATED', 'HUMAN_REVIEW_QUEUE_NOT_CONFIGURED'];
  try {
    const auditEvent = getAuditEventRepositories();
    await auditEvent.audit.appendAuditLog({
      actorType: 'REVIEWER',
      actorId: 'system',
      actionType: 'moderation.case_reviewed',
      ownerService: 'moderation',
      entityType: 'moderation_case',
      entityId: caseId,
      beforeState: existingCase,
      afterState: updatedCase,
      reason: note,
      correlationId: caseId,
      metadata: {
        decision,
        target: updatedCase.target,
        targetTruthMutated: false,
      },
    });
    await auditEvent.outbox.appendOutboxEvent({
      topic: 'moderation.case_reviewed',
      payloadSchema: 'moderation.case_reviewed.v1',
      payload: {
        caseId,
        decision,
        status: updatedCase.status,
        target: updatedCase.target,
        targetTruthMutated: false,
      },
      ownerService: 'moderation',
      entityType: 'moderation_case',
      entityId: caseId,
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
