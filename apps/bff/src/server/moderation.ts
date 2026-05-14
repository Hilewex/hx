import { 
  createModerationCase, 
  getLatestModerationAuditIntentOutbox,
  getLatestModerationOperationalIntent,
  reviewModerationCase, 
  getModerationCase, 
  listModerationCases,
  recordModerationOperationalIntent,
  resetModerationOperationalIntentPersistenceForTesting,
} from '@hx/moderation';
import {
  ActorContext,
  ModerationCase,
  ModerationCommandIntentResultProjection,
  ModerationDecisionEvidence,
  ModerationEvidenceProjection,
  ModerationOperationalBoundaryFlags,
  ModerationReviewDetailProjection,
  ModerationReviewQueueItemProjection,
  ModerationReviewQueueProjection,
  OwnerDomainReviewCommand,
} from '@hx/contracts';
import * as response from './response';
import { requireModerationOperator, requireAdminOrOperator, requireInternalService } from './guards';

type ModerationIntentKind = 'review' | 'escalation' | 'require-evidence' | 'recommend-payout-hold';
type ModerationWorkflowState = 'prepared' | 'checker_required' | 'checked' | 'rejected' | 'escalated' | 'owner_handoff_pending' | 'owner_handoff_ready';

type ModerationAuditIntent = {
  intentId: string;
  persisted: boolean;
  actor: {
    actorId: string;
    actorRole: ActorContext['role'];
  };
  action: ModerationIntentKind;
  target: {
    targetType: 'MODERATION_CASE';
    targetId: string;
  };
  reasonCode: string;
  evidenceRefs: string[];
  makerCheckerContext: {
    makerActorId: string;
    checkerActorId?: string;
    workflowState: ModerationWorkflowState;
    sameActorApprovalBlocked: true;
  };
  idempotencyKey: string;
  timestamp: string;
  boundaryFlags: ModerationOperationalBoundaryFlags;
};

const moderationOperationalBoundaryFlags: ModerationOperationalBoundaryFlags = {
  moderationTruthMutated: false,
  riskTruthMutated: false,
  payoutBlockedTruth: false,
  enforcementExecuted: false,
  auditMutationTruth: false,
};

function normalizeText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeEvidenceRefs(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
    : [];
}

function requireModerationPermission(context: ActorContext) {
  const guard = requireModerationOperator(context);
  if (!guard.allowed) return guard.response;
  if (!context.isAuthenticated || !context.actorId) {
    return response.unauthorized('MODERATION_ACTOR_CONTEXT_REQUIRED', 'Authenticated moderation actor context is required');
  }
  return null;
}

function validateModerationIntentIdempotencyPresence(idempotencyKey: string | undefined) {
  if (!idempotencyKey) {
    return response.badRequest('MODERATION_IDEMPOTENCY_KEY_REQUIRED', 'idempotencyKey is required');
  }
  return null;
}

function normalizeMakerActorId(context: ActorContext, value: unknown): string | undefined {
  const makerActorId = normalizeText(value);
  if (!makerActorId) return undefined;
  const authenticatedActorId = 'actorId' in context ? context.actorId : undefined;
  return makerActorId === authenticatedActorId ? makerActorId : undefined;
}

function deriveModerationWorkflowState(input: { kind: ModerationIntentKind; checkerActorId?: string; decision?: string }): ModerationWorkflowState {
  if (input.kind === 'escalation' || input.decision === 'ESCALATE') return 'escalated';
  if (input.decision === 'REJECT') return 'rejected';
  if (input.checkerActorId) return 'checked';
  return 'checker_required';
}

export const handleCreateModerationCase = async (context: any, body: any) => {
  const authCheck = requireAdminOrOperator(context);
  if (!authCheck.allowed) return authCheck.response;

  try {
    if (!body.target || !body.source) {
      return response.badRequest('MISSING_FIELDS', 'Missing target or source');
    }
    const result = await createModerationCase(body);
    return response.created(result);
  } catch (error: any) {
    return response.internalError();
  }
};

export const handleReviewModerationCase = async (context: any, body: any) => {
  const guardResult = requireInternalService(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    if (!body.caseId || !body.decision) {
      return response.badRequest('MISSING_FIELDS', 'Missing caseId or decision');
    }
    const caseResponseBeforeDecision = await getModerationCase({ caseId: body.caseId });
    const caseBeforeDecision = caseResponseBeforeDecision?.data;
    const actorId = context.actorId;
    const actorType = context.role;
    const decisionCommand: OwnerDomainReviewCommand = {
      ...body,
      actor: {
        actorId,
        actorType,
        role: context.role,
      },
      reasonCode: body.reasonCode || 'UNKNOWN',
      evidence: Array.isArray(body.evidence) && body.evidence.length > 0
        ? body.evidence
        : [{
            evidenceId: `bff_mod_evidence_${Date.now()}`,
            evidenceType: 'MODERATOR_NOTE',
            sourceType: 'BFF_CONTEXT',
            sourceId: body.caseId,
            summary: body.note || body.reasonCode || 'Moderation decision submitted through protected BFF route',
            createdAt: new Date().toISOString(),
          }],
      makerCheckerContext: body.makerCheckerContext || {
        checkerActorId: actorId,
        submittedByActorId: caseBeforeDecision?.target?.ownerActorId,
        requiresSeparateChecker: true,
      },
      ownerHandoffCreated: false,
    };
    const result = await reviewModerationCase(decisionCommand);

    return response.ok({
      ...result,
      routeClassification: 'owner-domain internal route',
      deprecatedForOperationalWorkflow: true,
      internalOnly: true,
      operationalIntentOnly: false,
      ownerMutationTruth: true,
      enforcementExecuted: false,
      warning: 'Deprecated for admin operational workflow; use /moderation/intent for projection-safe review intent.',
    }, {
      routeClassification: 'owner-domain internal route',
      deprecatedForOperationalWorkflow: true,
      replacementRoute: '/moderation/intent',
    });
  } catch (error: any) {
    if (error.message === 'MODERATION_CASE_NOT_FOUND') {
      return response.notFound('MODERATION_CASE_NOT_FOUND', 'Moderation case not found');
    }
    if (error.message === 'MODERATION_DECISION_IDEMPOTENCY_CONFLICT') {
      return response.conflict('MODERATION_DECISION_IDEMPOTENCY_CONFLICT', 'Same idempotency key was reused with a different moderation decision payload');
    }
    if (
      error.message === 'MODERATION_DECISION_ACTOR_REQUIRED' ||
      error.message === 'MODERATION_DECISION_REASON_REQUIRED' ||
      error.message === 'MODERATION_DECISION_EVIDENCE_REQUIRED' ||
      error.message === 'MODERATION_MAKER_CHECKER_SAME_ACTOR_FORBIDDEN'
    ) {
      return response.badRequest(error.message, 'Moderation decision failed validation');
    }
    return response.internalError();
  }
};

export const handleGetModerationCase = async (context: any, query: any) => {
  const guardResult = requireModerationOperator(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    if (!query.caseId) {
      return response.badRequest('MISSING_CASE_ID', 'Missing caseId');
    }
    const result = await getModerationCase({ caseId: query.caseId });
    return response.ok(result);
  } catch (error: any) {
    if (error.message === 'MODERATION_CASE_NOT_FOUND') {
      return response.notFound('MODERATION_CASE_NOT_FOUND', 'Moderation case not found');
    }
    return response.internalError();
  }
};

export const handleListModerationCases = async (context: any, query: any) => {
  const guardResult = requireModerationOperator(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const result = await listModerationCases(query);
    return response.ok(result);
  } catch (error: any) {
    return response.internalError();
  }
};

export async function handleGetModerationReviewQueueProjection(context: ActorContext, query: Record<string, string>) {
  const permissionError = requireModerationPermission(context);
  if (permissionError) return permissionError;

  const warnings = ['MODERATION_REVIEW_QUEUE_PROJECTION_SAFE'];
  const caseId = normalizeText(query.caseId);
  const items: ModerationReviewQueueItemProjection[] = [];

  if (caseId) {
    try {
      const result = await getModerationCase({ caseId });
      items.push(await toModerationReviewQueueItem(result.data, warnings));
    } catch {
      items.push(await toModerationReviewQueueItem(undefined, warnings, caseId));
    }
  } else {
    const result = await listModerationCases({ limit: query.limit ? Number(query.limit) : 25 });
    if (result.items.length > 0) {
      items.push(...await Promise.all(result.items.map((item) => toModerationReviewQueueItem(item, warnings))));
    } else {
      items.push(await toModerationReviewQueueItem(undefined, ['MODERATION_OWNER_QUEUE_EMPTY_FOUNDATION_PLACEHOLDER']));
    }
  }

  const projection: ModerationReviewQueueProjection = {
    items,
    totalProjection: items.length,
    degradedStateText: 'Moderation review queue is projection-safe; it does not execute content visibility, account, store, or payout enforcement.',
    boundaryFlags: moderationOperationalBoundaryFlags,
    warnings,
  };

  return response.ok(projection);
}

export async function handleGetModerationReviewDetailProjection(context: ActorContext, caseId: string) {
  const permissionError = requireModerationPermission(context);
  if (permissionError) return permissionError;

  let moderationCase: ModerationCase | undefined;
  const warnings = ['MODERATION_REVIEW_DETAIL_PROJECTION_SAFE'];
  try {
    moderationCase = (await getModerationCase({ caseId })).data;
  } catch {
    warnings.push('MODERATION_CASE_OWNER_RECORD_UNAVAILABLE');
  }

  const item = await toModerationReviewQueueItem(moderationCase, warnings, caseId);
  const latestSnapshot = moderationCase?.snapshots[moderationCase.snapshots.length - 1];
  const evidence = toModerationEvidenceProjection(moderationCase);
  const workflow = await getLatestModerationOperationalIntent(item.caseId);
  const latestAudit = await getLatestModerationAuditIntentOutbox(item.caseId);

  const projection: ModerationReviewDetailProjection = {
    ...item,
    contentPreviewProjectionText: latestSnapshot?.contentText
      ? `${latestSnapshot.contentText.slice(0, 160)}${latestSnapshot.contentText.length > 160 ? '...' : ''}`
      : 'Content preview waits for moderation owner projection.',
    relatedOrderStoreUserPostContextProjectionText: buildModerationRelatedContext(moderationCase),
    evidence,
    auditEvidence: {
      requiredEvidenceRefs: ['moderation-review-note', 'policy-reference', 'target-snapshot-reference'],
      providedEvidenceRefs: workflow?.evidenceRefs ?? [],
      reasonCodeProjectionText: workflow?.reasonCode ?? moderationCase?.reasonCodes.join(', ') ?? 'reasonCode is required for moderation intent.',
      auditIntentPreview: [
        'actor context required',
        'makerActorId must match authenticated actor',
        'checkerActorId cannot match makerActorId',
        'reasonCode required',
        'evidenceRefs required',
        'idempotencyKey required',
      ],
      auditIntentRecordedProjection: Boolean(latestAudit),
      auditIntentPersistedProjection: Boolean(latestAudit),
      latestAuditIntentText: latestAudit
        ? `${latestAudit.actionType} ${workflow?.workflowState ?? 'prepared'} audit ${latestAudit.deliveryState} at ${latestAudit.createdAt}`
        : 'Audit intent pending.',
      auditMutationTruth: false,
    },
    makerChecker: {
      makerActorProjectionText: workflow?.makerActorId
        ? `Maker submitted by ${workflow.makerActorId}.`
        : 'Maker actor must match authenticated command context.',
      checkerActorProjectionText: workflow?.checkerActorId
        ? `Checker recorded as ${workflow.checkerActorId}.`
        : 'Checker is required before owner handoff can be treated as checked.',
      workflowStateProjection: workflow?.workflowState ?? 'prepared',
      sameActorApprovalBlockedProjection: true,
      ownerHandoffRequiredProjection: true,
      makerCheckerTruth: false,
    },
    actionIntent: {
      reviewIntentAllowed: true,
      escalationIntentAllowed: true,
      requireEvidenceIntentAllowed: true,
      recommendPayoutHoldIntentAllowed: true,
      ownerCommandRequired: true,
      directExecutionAllowed: false,
      uiMutationTruth: false,
    },
  };

  return response.ok(projection);
}

export async function handleModerationCommandIntent(context: ActorContext, body: any) {
  const permissionError = requireModerationPermission(context);
  if (permissionError) return permissionError;

  const caseId = normalizeText(body?.caseId);
  const kind = normalizeText(body?.kind) as ModerationIntentKind | undefined;
  const idempotencyKey = normalizeText(body?.idempotencyKey);
  const makerActorId = normalizeMakerActorId(context, body?.makerActorId);
  const checkerActorId = normalizeText(body?.checkerActorId);
  const reasonCode = normalizeText(body?.reasonCode);
  const evidenceRefs = normalizeEvidenceRefs(body?.evidenceRefs);
  const decision = normalizeText(body?.decision);

  if (!caseId) return response.badRequest('MODERATION_CASE_ID_REQUIRED', 'caseId is required');
  if (!kind || !['review', 'escalation', 'require-evidence', 'recommend-payout-hold'].includes(kind)) {
    return response.badRequest('MODERATION_INTENT_KIND_INVALID', 'A valid moderation intent kind is required');
  }
  const idempotencyError = validateModerationIntentIdempotencyPresence(idempotencyKey);
  if (idempotencyError) return idempotencyError;
  if (!makerActorId) {
    return response.badRequest('MODERATION_MAKER_ACTOR_ID_REQUIRED', 'makerActorId must match the authenticated actor');
  }
  if (checkerActorId && checkerActorId === makerActorId) {
    return response.forbidden('MODERATION_CHECKER_SELF_APPROVAL_FORBIDDEN', 'Maker cannot approve their own moderation intent as checker');
  }
  if (!reasonCode) return response.badRequest('MODERATION_REASON_CODE_REQUIRED', 'reasonCode is required');
  if (evidenceRefs.length === 0) return response.badRequest('MODERATION_EVIDENCE_REFS_REQUIRED', 'evidenceRefs are required');

  const workflowState = deriveModerationWorkflowState({ kind, checkerActorId, decision });
  const makerCheckerContext = {
      makerActorId,
      checkerActorId,
      workflowState,
      sameActorApprovalBlocked: true,
  } as const;
  let persistedIntent;
  try {
    persistedIntent = await recordModerationOperationalIntent({
      targetId: caseId,
      actionType: kind,
      makerActorId,
      checkerActorId,
      workflowState,
      reasonCode,
      evidenceRefs,
      idempotencyKey: idempotencyKey!,
      boundaryFlags: { ...moderationOperationalBoundaryFlags },
      actorId: 'actorId' in context ? context.actorId : makerActorId,
      makerCheckerContext,
    });
  } catch (error: any) {
    if (error.message === 'OPERATIONAL_INTENT_IDEMPOTENCY_CONFLICT') {
      return response.conflict('MODERATION_IDEMPOTENCY_CONFLICT', 'Same idempotency key was reused with a different moderation operational payload');
    }
    throw error;
  }

  const auditIntent: ModerationAuditIntent = {
    intentId: persistedIntent.intent.intentId,
    persisted: true,
    actor: {
      actorId: 'actorId' in context ? context.actorId : makerActorId,
      actorRole: context.role,
    },
    action: kind,
    target: {
      targetType: 'MODERATION_CASE',
      targetId: caseId,
    },
    reasonCode,
    evidenceRefs,
    makerCheckerContext,
    idempotencyKey: idempotencyKey!,
    timestamp: persistedIntent.auditOutbox.createdAt,
    boundaryFlags: moderationOperationalBoundaryFlags,
  };

  const result: ModerationCommandIntentResultProjection = {
    status: workflowState === 'checker_required'
      ? 'checker_required'
      : workflowState === 'checked'
        ? 'checked_for_owner_handoff'
        : workflowState === 'rejected'
          ? 'rejected_by_checker'
          : workflowState === 'escalated'
            ? 'escalated'
            : 'maker_submitted',
    message: 'Moderation command intent recorded without enforcement execution.',
    idempotencyKey: idempotencyKey!,
    workflowState,
    auditIntentPersisted: true,
    boundaryFlags: moderationOperationalBoundaryFlags,
  };

  return response.ok({
    accepted: true,
    ...result,
    auditIntent,
    auditOutboxDeliveryState: persistedIntent.auditOutbox.deliveryState,
    idempotentReplay: persistedIntent.idempotentReplay,
  });
}

async function toModerationReviewQueueItem(
  moderationCase: ModerationCase | undefined,
  warnings: string[],
  fallbackCaseId = 'moderation-review-projection-placeholder',
): Promise<ModerationReviewQueueItemProjection> {
  const caseId = moderationCase?.caseId ?? fallbackCaseId;
  const targetType = moderationCase?.target.targetType ?? 'UNAVAILABLE';
  const targetId = moderationCase?.target.targetId ?? 'target-projection-unavailable';
  const isPayoutRelated = targetType === 'STOREFRONT_PROFILE' || targetType === 'STORE_POST';

  return {
    caseId,
    targetTypeProjection: targetType,
    targetIdProjection: targetId,
    severityProjection: moderationCase?.riskLevel ?? 'UNAVAILABLE',
    statusProjection: moderationCase?.status ?? 'UNAVAILABLE',
    sourceProjection: moderationCase?.source ?? 'FOUNDATION_PROJECTION',
    relatedContextProjectionText: buildModerationRelatedContext(moderationCase),
    evidencePreviewText: moderationCase?.snapshots.length
      ? `${moderationCase.snapshots.length} moderation snapshot projection available.`
      : 'Evidence waits for moderation owner projection or command evidenceRefs.',
    escalation: {
      escalationStateProjection: moderationCase?.riskLevel === 'CRITICAL' ? 'recommended' : moderationCase ? 'visible' : 'required',
      escalationTargetProjection: 'MODERATION_OWNER',
      visibilityText: 'Escalation is visible as operational intent, not final moderation enforcement.',
      escalationDecisionTruth: false,
    },
    payoutHoldRecommendation: {
      recommendationStateProjection: isPayoutRelated && moderationCase?.riskLevel === 'CRITICAL' ? 'recommended' : 'not_applicable',
      recommendationText: isPayoutRelated
        ? 'Payout hold can be recommended for owner review only; payout is not blocked here.'
        : 'Payout hold recommendation is not applicable to this moderation target projection.',
      payoutBlockedTruth: false,
    },
    detailHref: `/admin/moderation/${encodeURIComponent(caseId)}`,
    boundaryFlags: moderationOperationalBoundaryFlags,
    warnings,
  };
}

function toModerationEvidenceProjection(moderationCase: ModerationCase | undefined): ModerationEvidenceProjection[] {
  const decisionEvidence: ModerationDecisionEvidence[] = moderationCase?.decisions?.flatMap((decision) => decision.evidence) ?? [];
  if (decisionEvidence.length > 0) {
    return decisionEvidence.map((item) => ({
      evidenceId: item.evidenceId,
      evidenceTypeProjection: item.evidenceType,
      sourceProjection: `${item.sourceType}:${item.sourceId}`,
      summaryProjectionText: item.summary ?? 'Evidence summary projection unavailable.',
      createdAtProjectionText: item.createdAt,
      evidenceOwnerMutationTruth: false,
    }));
  }

  return (moderationCase?.snapshots ?? []).map((snapshot) => ({
    evidenceId: snapshot.snapshotId,
    evidenceTypeProjection: 'MODERATION_SNAPSHOT',
    sourceProjection: snapshot.source,
    summaryProjectionText: snapshot.contentText ?? snapshot.mediaAssetIds?.join(', ') ?? 'Snapshot evidence projection available.',
    createdAtProjectionText: snapshot.createdAt,
    evidenceOwnerMutationTruth: false,
  }));
}

function buildModerationRelatedContext(moderationCase: ModerationCase | undefined): string {
  if (!moderationCase) {
    return 'Related order, store, user, or post context waits for moderation owner projection.';
  }
  const target = moderationCase.target;
  return [
    `Target ${target.targetType}:${target.targetId}`,
    target.ownerActorId ? `owner ${target.ownerActorId}` : 'owner projection unavailable',
    target.storefrontId ? `storefront ${target.storefrontId}` : 'storefront projection unavailable',
    target.productId ? `product ${target.productId}` : 'product projection unavailable',
  ].join('. ');
}

export function resetModerationOperationalIntentForTesting() {
  resetModerationOperationalIntentPersistenceForTesting();
}
