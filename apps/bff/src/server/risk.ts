import {
  CreateRiskSignalCommand,
  CreateRiskCaseCommand,
  OwnerDomainRiskReviewCommand,
  GetRiskCaseQuery,
  ListRiskCasesQuery,
  ActorContext,
  RiskCase,
  RiskCommandIntentResultProjection,
  RiskEvidenceProjection,
  RiskOperationalBoundaryFlags,
  RiskReviewDetailProjection,
  RiskReviewQueueItemProjection,
  RiskReviewQueueProjection,
} from '@hx/contracts';
import {
  createRiskSignal,
  createRiskCase,
  getLatestRiskAuditIntentOutbox,
  getLatestRiskOperationalIntent,
  reviewRiskCase,
  getRiskCase,
  listRiskCases,
  listRiskSignals,
  recordRiskOperationalIntent,
  resetRiskOperationalIntentPersistenceForTesting,
} from '@hx/risk';
import * as response from './response';
import { requireRiskOperator, requireInternalService } from './guards';

type RiskIntentKind = 'review' | 'escalation' | 'require-evidence' | 'recommend-payout-hold';
type RiskWorkflowState = 'prepared' | 'checker_required' | 'checked' | 'rejected' | 'escalated' | 'owner_handoff_pending' | 'owner_handoff_ready';

type RiskAuditIntent = {
  intentId: string;
  persisted: boolean;
  actor: {
    actorId: string;
    actorRole: ActorContext['role'];
  };
  action: RiskIntentKind;
  target: {
    targetType: 'RISK_CASE';
    targetId: string;
  };
  reasonCode: string;
  evidenceRefs: string[];
  makerCheckerContext: {
    makerActorId: string;
    checkerActorId?: string;
    workflowState: RiskWorkflowState;
    sameActorApprovalBlocked: true;
  };
  idempotencyKey: string;
  timestamp: string;
  boundaryFlags: RiskOperationalBoundaryFlags;
};

const riskOperationalBoundaryFlags: RiskOperationalBoundaryFlags = {
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

function requireRiskPermission(context: ActorContext) {
  const guard = requireRiskOperator(context);
  if (!guard.allowed) return guard.response;
  if (!context.isAuthenticated || !context.actorId) {
    return response.unauthorized('RISK_ACTOR_CONTEXT_REQUIRED', 'Authenticated risk actor context is required');
  }
  return null;
}

function validateRiskIntentIdempotencyPresence(idempotencyKey: string | undefined) {
  if (!idempotencyKey) {
    return response.badRequest('RISK_IDEMPOTENCY_KEY_REQUIRED', 'idempotencyKey is required');
  }
  return null;
}

function normalizeMakerActorId(context: ActorContext, value: unknown): string | undefined {
  const makerActorId = normalizeText(value);
  if (!makerActorId) return undefined;
  const authenticatedActorId = 'actorId' in context ? context.actorId : undefined;
  return makerActorId === authenticatedActorId ? makerActorId : undefined;
}

function deriveRiskWorkflowState(input: { kind: RiskIntentKind; checkerActorId?: string; decision?: string }): RiskWorkflowState {
  if (input.kind === 'escalation' || input.decision === 'ESCALATE') return 'escalated';
  if (input.decision === 'REJECT') return 'rejected';
  if (input.checkerActorId) return 'checked';
  return 'checker_required';
}

export async function handleCreateRiskSignal(req: any) {
  const context = req.context;
  const guardResult = requireRiskOperator(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const command: CreateRiskSignalCommand = req.body;
    if (!command.target?.targetId || !command.target?.targetType || !command.type) {
      return response.badRequest('REQUEST_MISSING_FIELD', 'Missing required fields for risk signal');
    }
    const evidenceError = validateRiskEvidence(command);
    if (evidenceError) return evidenceError;
    const result = await createRiskSignal(command);
    return response.created(result);
  } catch (error: any) {
    if (error?.code?.startsWith('RISK_')) {
      return response.badRequest(error.code, error.message);
    }
    return response.internalError('RISK_SIGNAL_FAILED', 'Failed to create risk signal');
  }
}

export async function handleListRiskSignals(req: any) {
  const context = req.context;
  const guardResult = requireRiskOperator(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const query = {
      targetId: req.query.targetId as string,
      targetType: req.query.targetType as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };
    const result = await listRiskSignals(query);
    return response.ok(result);
  } catch (error: any) {
    return response.internalError('RISK_SIGNAL_LIST_FAILED', 'Failed to list risk signals');
  }
}

export async function handleCreateRiskCase(req: any) {
  const context = req.context;
  const guardResult = requireRiskOperator(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const command: CreateRiskCaseCommand = req.body;
    if (!command.target?.targetId || !command.target?.targetType || !command.level) {
      return response.badRequest('REQUEST_MISSING_FIELD', 'Missing required fields for risk case');
    }
    const evidenceError = validateRiskEvidence(command);
    if (evidenceError) return evidenceError;
    const result = await createRiskCase(command);
    return response.created(result);
  } catch (error: any) {
    if (error?.code?.startsWith('RISK_')) {
      return response.badRequest(error.code, error.message);
    }
    return response.internalError('RISK_CASE_CREATION_FAILED', 'Failed to create risk case');
  }
}

export async function handleReviewRiskCase(req: any) {
  const context = req.context;
  const guardResult = requireInternalService(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const command: OwnerDomainRiskReviewCommand = req.body;
    if (!command.caseId || !command.reviewerId || !command.decision) {
      return response.badRequest('REQUEST_MISSING_FIELD', 'Missing required fields for risk review');
    }
    const evidenceError = validateRiskEvidence(command);
    if (evidenceError) return evidenceError;
    const result = await reviewRiskCase(command);
    return response.ok({
      ...result,
      routeClassification: 'owner-domain internal route',
      deprecatedForOperationalWorkflow: true,
      internalOnly: true,
      operationalIntentOnly: false,
      ownerMutationTruth: true,
      enforcementExecuted: false,
      payoutBlockedTruth: false,
      warning: 'Deprecated for admin operational workflow; use /risk/intent for projection-safe review intent.',
    }, {
      routeClassification: 'owner-domain internal route',
      deprecatedForOperationalWorkflow: true,
      replacementRoute: '/risk/intent',
    });
  } catch (error: any) {
    if (error?.code?.startsWith('RISK_')) {
      return response.badRequest(error.code, error.message);
    }
    if (response.isNotFoundError(error)) {
      return response.notFound('RISK_CASE_NOT_FOUND', 'Risk case not found for review');
    }
    return response.internalError('RISK_REVIEW_FAILED', 'Failed to review risk case');
  }
}

function validateRiskEvidence(command: {
  reasonCode?: string;
  correlationId?: string;
  idempotencyKey?: string;
}) {
  if (!command.reasonCode) {
    return response.badRequest('RISK_REASON_CODE_REQUIRED', 'reasonCode is required');
  }
  if (!command.correlationId) {
    return response.badRequest('RISK_CORRELATION_ID_REQUIRED', 'correlationId is required');
  }
  if (!command.idempotencyKey) {
    return response.badRequest('RISK_IDEMPOTENCY_KEY_REQUIRED', 'idempotencyKey is required');
  }
  return null;
}

export async function handleGetRiskCase(req: any) {
  const context = req.context;
  const guardResult = requireRiskOperator(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const caseId = req.query.caseId as string;
    if (!caseId) {
      return response.badRequest('REQUEST_MISSING_FIELD', 'caseId is required');
    }
    const query: GetRiskCaseQuery = { caseId };
    const result = await getRiskCase(query);
    if (!result) {
      return response.notFound('RESOURCE_NOT_FOUND', 'Risk case not found');
    }
    return response.ok(result);
  } catch (error: any) {
    if (response.isNotFoundError(error)) {
      return response.notFound('RESOURCE_NOT_FOUND', 'Risk case not found');
    }
    return response.internalError('RISK_GET_FAILED', 'Failed to retrieve risk case');
  }
}

export async function handleListRiskCases(req: any) {
  const context = req.context;
  const guardResult = requireRiskOperator(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const query: ListRiskCasesQuery = {
      targetId: req.query.targetId as string,
      targetType: req.query.targetType as any,
      status: req.query.status as any,
      level: req.query.level as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };
    const result = await listRiskCases(query);
    return response.ok(result);
  } catch (error: any) {
    return response.internalError('RISK_LIST_FAILED', 'Failed to list risk cases');
  }
}

export async function handleGetRiskReviewQueueProjection(context: ActorContext, query: Record<string, string>) {
  const permissionError = requireRiskPermission(context);
  if (permissionError) return permissionError;

  const warnings = ['RISK_REVIEW_QUEUE_PROJECTION_SAFE'];
  const caseId = normalizeText(query.caseId);
  const items: RiskReviewQueueItemProjection[] = [];

  if (caseId) {
    try {
      const result = await getRiskCase({ caseId });
      items.push(await toRiskReviewQueueItem(result.case, warnings));
    } catch {
      items.push(await toRiskReviewQueueItem(undefined, warnings, caseId));
    }
  } else {
    const result = await listRiskCases({ limit: query.limit ? Number(query.limit) : 25 });
    if (result.cases.length > 0) {
      items.push(...await Promise.all(result.cases.map((item) => toRiskReviewQueueItem(item, warnings))));
    } else {
      items.push(await toRiskReviewQueueItem(undefined, ['RISK_OWNER_QUEUE_EMPTY_FOUNDATION_PLACEHOLDER']));
    }
  }

  const projection: RiskReviewQueueProjection = {
    items,
    totalProjection: items.length,
    degradedStateText: 'Risk review queue is projection-safe; payout holds, fraud confirmation, blocking, and penalties are not executed.',
    boundaryFlags: riskOperationalBoundaryFlags,
    warnings,
  };

  return response.ok(projection);
}

export async function handleGetRiskReviewDetailProjection(context: ActorContext, caseId: string) {
  const permissionError = requireRiskPermission(context);
  if (permissionError) return permissionError;

  let riskCase: RiskCase | undefined;
  const warnings = ['RISK_REVIEW_DETAIL_PROJECTION_SAFE'];
  try {
    riskCase = (await getRiskCase({ caseId })).case;
  } catch {
    warnings.push('RISK_CASE_OWNER_RECORD_UNAVAILABLE');
  }

  const item = await toRiskReviewQueueItem(riskCase, warnings, caseId);
  const workflow = await getLatestRiskOperationalIntent(item.caseId);
  const latestAudit = await getLatestRiskAuditIntentOutbox(item.caseId);

  const projection: RiskReviewDetailProjection = {
    ...item,
    fraudSignalProjectionText: riskCase?.signals.length
      ? `${riskCase.signals.length} linked signal projection(s); fraud is not confirmed.`
      : 'Fraud signal projection unavailable; fraud is not confirmed.',
    relatedOrderStoreUserPostContextProjectionText: buildRiskRelatedContext(riskCase),
    evidence: toRiskEvidenceProjection(riskCase),
    auditEvidence: {
      requiredEvidenceRefs: ['risk-review-note', 'risk-signal-reference', 'target-owner-reference'],
      providedEvidenceRefs: workflow?.evidenceRefs ?? [],
      reasonCodeProjectionText: workflow?.reasonCode ?? riskCase?.reasonCode ?? 'reasonCode is required for risk intent.',
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

export async function handleRiskCommandIntent(context: ActorContext, body: any) {
  const permissionError = requireRiskPermission(context);
  if (permissionError) return permissionError;

  const caseId = normalizeText(body?.caseId);
  const kind = normalizeText(body?.kind) as RiskIntentKind | undefined;
  const idempotencyKey = normalizeText(body?.idempotencyKey);
  const makerActorId = normalizeMakerActorId(context, body?.makerActorId);
  const checkerActorId = normalizeText(body?.checkerActorId);
  const reasonCode = normalizeText(body?.reasonCode);
  const evidenceRefs = normalizeEvidenceRefs(body?.evidenceRefs);
  const decision = normalizeText(body?.decision);

  if (!caseId) return response.badRequest('RISK_CASE_ID_REQUIRED', 'caseId is required');
  if (!kind || !['review', 'escalation', 'require-evidence', 'recommend-payout-hold'].includes(kind)) {
    return response.badRequest('RISK_INTENT_KIND_INVALID', 'A valid risk intent kind is required');
  }
  const idempotencyError = validateRiskIntentIdempotencyPresence(idempotencyKey);
  if (idempotencyError) return idempotencyError;
  if (!makerActorId) {
    return response.badRequest('RISK_MAKER_ACTOR_ID_REQUIRED', 'makerActorId must match the authenticated actor');
  }
  if (checkerActorId && checkerActorId === makerActorId) {
    return response.forbidden('RISK_CHECKER_SELF_APPROVAL_FORBIDDEN', 'Maker cannot approve their own risk intent as checker');
  }
  if (!reasonCode) return response.badRequest('RISK_REASON_CODE_REQUIRED', 'reasonCode is required');
  if (evidenceRefs.length === 0) return response.badRequest('RISK_EVIDENCE_REFS_REQUIRED', 'evidenceRefs are required');

  const workflowState = deriveRiskWorkflowState({ kind, checkerActorId, decision });
  const makerCheckerContext = {
      makerActorId,
      checkerActorId,
      workflowState,
      sameActorApprovalBlocked: true,
  } as const;
  let persistedIntent;
  try {
    persistedIntent = await recordRiskOperationalIntent({
      targetId: caseId,
      actionType: kind,
      makerActorId,
      checkerActorId,
      workflowState,
      reasonCode,
      evidenceRefs,
      idempotencyKey: idempotencyKey!,
      boundaryFlags: { ...riskOperationalBoundaryFlags },
      actorId: 'actorId' in context ? context.actorId : makerActorId,
      makerCheckerContext,
    });
  } catch (error: any) {
    if (error.message === 'OPERATIONAL_INTENT_IDEMPOTENCY_CONFLICT') {
      return response.conflict('RISK_IDEMPOTENCY_CONFLICT', 'Same idempotency key was reused with a different risk operational payload');
    }
    throw error;
  }

  const auditIntent: RiskAuditIntent = {
    intentId: persistedIntent.intent.intentId,
    persisted: true,
    actor: {
      actorId: 'actorId' in context ? context.actorId : makerActorId,
      actorRole: context.role,
    },
    action: kind,
    target: {
      targetType: 'RISK_CASE',
      targetId: caseId,
    },
    reasonCode,
    evidenceRefs,
    makerCheckerContext,
    idempotencyKey: idempotencyKey!,
    timestamp: persistedIntent.auditOutbox.createdAt,
    boundaryFlags: riskOperationalBoundaryFlags,
  };

  const result: RiskCommandIntentResultProjection = {
    status: kind === 'recommend-payout-hold'
      ? 'payout_hold_recommended'
      : workflowState === 'checker_required'
        ? 'checker_required'
        : workflowState === 'checked'
          ? 'checked_for_owner_handoff'
          : workflowState === 'rejected'
            ? 'rejected_by_checker'
            : workflowState === 'escalated'
              ? 'escalated'
              : 'maker_submitted',
    message: 'Risk command intent recorded without payout hold, blocking, fraud confirmation, or enforcement execution.',
    idempotencyKey: idempotencyKey!,
    workflowState,
    auditIntentPersisted: true,
    boundaryFlags: riskOperationalBoundaryFlags,
  };

  return response.ok({
    accepted: true,
    ...result,
    auditIntent,
    auditOutboxDeliveryState: persistedIntent.auditOutbox.deliveryState,
    idempotentReplay: persistedIntent.idempotentReplay,
  });
}

async function toRiskReviewQueueItem(
  riskCase: RiskCase | undefined,
  warnings: string[],
  fallbackCaseId = 'risk-review-projection-placeholder',
): Promise<RiskReviewQueueItemProjection> {
  const caseId = riskCase?.caseId ?? fallbackCaseId;
  const targetType = riskCase?.target.targetType ?? 'UNAVAILABLE';
  const targetId = riskCase?.target.targetId ?? 'target-projection-unavailable';
  const isPayoutRelated = targetType === 'PAYOUT' || targetType === 'SUPPLIER' || targetType === 'CREATOR' || targetType === 'STORE';

  return {
    caseId,
    targetTypeProjection: targetType,
    targetIdProjection: targetId,
    riskLevelProjection: riskCase?.level ?? 'UNAVAILABLE',
    scoreProjectionText: riskCase?.score ? `${riskCase.score.score} ${riskCase.score.severity} projection` : 'Risk score projection unavailable',
    statusProjection: riskCase?.status ?? 'UNAVAILABLE',
    sourceProjection: riskCase?.source ?? 'FOUNDATION_PROJECTION',
    relatedContextProjectionText: buildRiskRelatedContext(riskCase),
    evidencePreviewText: riskCase?.signals.length
      ? `${riskCase.signals.length} linked signal reference(s) visible.`
      : 'Evidence waits for risk owner projection or command evidenceRefs.',
    escalation: {
      escalationStateProjection: riskCase?.level === 'CRITICAL' ? 'recommended' : riskCase ? 'visible' : 'required',
      escalationTargetProjection: 'RISK_OWNER',
      visibilityText: 'Escalation is visible as operational intent, not fraud confirmation or blocking.',
      escalationDecisionTruth: false,
    },
    payoutHoldRecommendation: {
      recommendationStateProjection: isPayoutRelated && (riskCase?.level === 'HIGH' || riskCase?.level === 'CRITICAL') ? 'recommended' : 'visible',
      recommendationText: 'Payout hold is recommendation-only; payout blocked truth is not created by BFF or UI.',
      payoutBlockedTruth: false,
    },
    detailHref: `/admin/risk/${encodeURIComponent(caseId)}`,
    boundaryFlags: riskOperationalBoundaryFlags,
    warnings,
  };
}

function toRiskEvidenceProjection(riskCase: RiskCase | undefined): RiskEvidenceProjection[] {
  if (!riskCase) return [];
  const signalEvidence = riskCase.signals.map((signalId) => ({
    evidenceId: signalId,
    evidenceTypeProjection: 'RISK_SIGNAL_REFERENCE',
    sourceProjection: riskCase.source,
    summaryProjectionText: 'Linked risk signal reference projection. Fraud is not confirmed.',
    createdAtProjectionText: riskCase.createdAt,
    evidenceOwnerMutationTruth: false as const,
  }));

  return signalEvidence.length > 0
    ? signalEvidence
    : [{
        evidenceId: riskCase.caseId,
        evidenceTypeProjection: 'RISK_CASE_CONTEXT',
        sourceProjection: riskCase.source,
        summaryProjectionText: riskCase.notes ?? 'Risk case context projection available.',
        createdAtProjectionText: riskCase.createdAt,
        evidenceOwnerMutationTruth: false,
      }];
}

function buildRiskRelatedContext(riskCase: RiskCase | undefined): string {
  if (!riskCase) {
    return 'Related order, store, user, payout, or post context waits for risk owner projection.';
  }
  return [
    `Target ${riskCase.target.targetType}:${riskCase.target.targetId}`,
    riskCase.ownerDomainHandoff ? `owner handoff ${riskCase.ownerDomainHandoff}` : 'owner handoff not required in projection',
    `decision status ${riskCase.decisionStatus}`,
    'fraud not confirmed',
  ].join('. ');
}

export function resetRiskOperationalIntentForTesting() {
  resetRiskOperationalIntentPersistenceForTesting();
}
