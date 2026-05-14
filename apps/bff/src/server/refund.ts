import { 
  createRefundFromCancelReturn, 
  getLatestRefundAuditIntentOutbox,
  getLatestRefundOperationalIntent,
  getRefundDetail,
  recordRefundOperationalIntent,
  resetRefundOperationalIntentPersistenceForTesting,
} from '@hx/refund';
import {
  ActorContext,
  RefundOperationalBoundaryFlags,
  RefundReviewDetailProjection,
  RefundReviewQueueItemProjection,
  RefundReviewQueueProjection,
  RefundReviewWorkflowState,
  RefundResponse,
  RefundState,
} from '@hx/contracts';
import { requireRefundOperationalRole } from './guards';
import * as response from './response';

type RefundOperationalAction =
  | 'REFUND_PROCESS'
  | 'REFUND_TRANSITION'
  | 'REFUND_REVIEW'
  | 'REFUND_MANUAL_ESCALATION';

type RefundAuditIntent = {
  intentId: string;
  persisted: boolean;
  actor: {
    actorId: string;
    actorRole: ActorContext['role'];
  };
  action: RefundOperationalAction;
  reason: string | null;
  evidence: string[];
  makerCheckerContext: {
    makerActorId: string;
    checkerActorId?: string;
    reviewWorkflowState: RefundReviewWorkflowState;
    sameActorApprovalBlocked: true;
  };
  timestamp: string;
  target: {
    targetType: 'REFUND';
    targetId: string;
  };
  idempotencyKey: string;
  boundary: {
    settlementMutated: false;
    payoutMutated: false;
    providerRefundExecuted: false;
    completedRefundTruthCreated: false;
    auditPersisted: false;
  };
};

const completedRefundStates: RefundState[] = ['SUCCEEDED'];
const refundOperationalBoundaryFlags: RefundOperationalBoundaryFlags = {
  refundExecutionTruth: false,
  settlementTruth: false,
  payoutTruth: false,
  providerRefundTruth: false,
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

function requireRefundPermission(context: ActorContext) {
  const guard = requireRefundOperationalRole(context);
  if (!guard.allowed) return guard.response;
  if (!context.isAuthenticated || !context.actorId) {
    return response.unauthorized('REFUND_ACTOR_CONTEXT_REQUIRED', 'Authenticated actor context is required');
  }
  return null;
}

function validateIdempotencyPresence(idempotencyKey: string | undefined) {
  if (!idempotencyKey) {
    return response.badRequest('REFUND_IDEMPOTENCY_KEY_REQUIRED', 'idempotencyKey is required');
  }
  return null;
}

function validateReasonEvidence(input: {
  action: RefundOperationalAction;
  reasonCode?: string;
  evidenceRefs: string[];
  targetState?: RefundState;
  forcedTransition?: boolean;
}) {
  const requiresReason =
    input.action === 'REFUND_MANUAL_ESCALATION' ||
    input.action === 'REFUND_REVIEW' ||
    input.forcedTransition === true ||
    input.targetState === 'FAILED' ||
    input.targetState === 'CANCELLED' ||
    input.targetState === 'RECONCILIATION_REQUIRED';

  if (requiresReason && !input.reasonCode) {
    return response.badRequest('REFUND_REASON_CODE_REQUIRED', 'reasonCode is required for this refund operational action');
  }

  if ((requiresReason || input.action === 'REFUND_PROCESS') && input.evidenceRefs.length === 0) {
    return response.badRequest('REFUND_EVIDENCE_REFS_REQUIRED', 'evidenceRefs are required for this refund operational action');
  }

  return null;
}

function buildAuditIntent(input: {
  context: ActorContext;
  action: RefundOperationalAction;
  refundId: string;
  reasonCode?: string;
  evidenceRefs: string[];
  idempotencyKey: string;
  makerCheckerContext?: RefundAuditIntent['makerCheckerContext'];
}): RefundAuditIntent {
  if (!input.context.isAuthenticated) {
    throw new Error('REFUND_ACTOR_CONTEXT_REQUIRED');
  }
  return {
    intentId: `refund-audit-intent-${Date.now()}`,
    persisted: false,
    actor: {
      actorId: input.context.actorId,
      actorRole: input.context.role,
    },
    action: input.action,
    reason: input.reasonCode ?? null,
    evidence: input.evidenceRefs,
    makerCheckerContext: input.makerCheckerContext ?? {
      makerActorId: (input.context as { actorId: string }).actorId,
      reviewWorkflowState: 'prepared',
      sameActorApprovalBlocked: true,
    },
    timestamp: new Date().toISOString(),
    target: {
      targetType: 'REFUND',
      targetId: input.refundId,
    },
    idempotencyKey: input.idempotencyKey,
    boundary: {
      settlementMutated: false,
      payoutMutated: false,
      providerRefundExecuted: false,
      completedRefundTruthCreated: false,
      auditPersisted: false,
    },
  };
}

function normalizeMakerActorId(context: ActorContext, value: unknown): string | undefined {
  const makerActorId = normalizeText(value);
  if (!makerActorId) return undefined;
  const authenticatedActorId = 'actorId' in context ? context.actorId : undefined;
  return makerActorId === authenticatedActorId ? makerActorId : undefined;
}

async function persistRefundOperationalIntent(input: {
  context: ActorContext;
  action: RefundOperationalAction;
  refundId: string;
  reasonCode: string;
  evidenceRefs: string[];
  idempotencyKey: string;
  makerActorId: string;
  checkerActorId?: string;
  workflowState: RefundReviewWorkflowState;
}) {
  const makerCheckerContext = {
    makerActorId: input.makerActorId,
    checkerActorId: input.checkerActorId,
    reviewWorkflowState: input.workflowState,
    sameActorApprovalBlocked: true as const,
  };
  const persisted = await recordRefundOperationalIntent({
    targetId: input.refundId,
    actionType: input.action,
    makerActorId: input.makerActorId,
    checkerActorId: input.checkerActorId,
    workflowState: input.workflowState,
    reasonCode: input.reasonCode,
    evidenceRefs: input.evidenceRefs,
    idempotencyKey: input.idempotencyKey,
    boundaryFlags: { ...refundOperationalBoundaryFlags },
    actorId: 'actorId' in input.context ? input.context.actorId : input.makerActorId,
    makerCheckerContext,
  });

  const auditIntent: RefundAuditIntent = {
    intentId: persisted.intent.intentId,
    persisted: true,
    actor: {
      actorId: 'actorId' in input.context ? input.context.actorId : input.makerActorId,
      actorRole: input.context.role,
    },
    action: input.action,
    reason: input.reasonCode,
    evidence: input.evidenceRefs,
    makerCheckerContext,
    timestamp: persisted.auditOutbox.createdAt,
    target: {
      targetType: 'REFUND',
      targetId: input.refundId,
    },
    idempotencyKey: input.idempotencyKey,
    boundary: {
      settlementMutated: false,
      payoutMutated: false,
      providerRefundExecuted: false,
      completedRefundTruthCreated: false,
      auditPersisted: false,
    },
  };

  return { persisted, auditIntent };
}

function deriveReviewWorkflowState(input: {
  action: RefundOperationalAction;
  decision?: string;
  checkerActorId?: string;
}): RefundReviewWorkflowState {
  if (input.action === 'REFUND_MANUAL_ESCALATION' || input.decision === 'ESCALATE' || input.decision === 'MANUAL_OVERRIDE') {
    return 'escalated';
  }
  if (input.decision === 'REJECT') return 'rejected';
  if (input.checkerActorId) return 'checked';
  return 'checker_required';
}

export async function handleCreateRefundFromCancelReturn(context: any, body: any) {
  const result = await createRefundFromCancelReturn(body);
  if (result.errors.includes('CANCEL_RETURN_REQUEST_NOT_FOUND')) {
    return response.notFound('CANCEL_RETURN_REQUEST_NOT_FOUND', 'Cancel/return request not found');
  }
  if (result.errors.length > 0) {
    return response.unprocessable('REFUND_CREATION_FAILED', result.errors.join(', '));
  }
  return response.created(result);
}

export async function handleGetRefundDetail(context: any, refundId: string) {
  const result = await getRefundDetail(refundId);
  if (!result) {
    return response.notFound('REFUND_NOT_FOUND', 'Refund not found');
  }
  return response.ok(result);
}

export async function handleGetRefundReviewQueueProjection(context: any, query: Record<string, string>) {
  const warnings = ['REFUND_REVIEW_QUEUE_OWNER_LIST_FOUNDATION_STATIC'];
  const requestedRefundId = normalizeText(query.refundId);
  const items: RefundReviewQueueItemProjection[] = [];

  if (requestedRefundId) {
    const refund = await getRefundDetail(requestedRefundId);
    items.push(await toRefundReviewQueueItem(refund, requestedRefundId, warnings));
  } else {
    items.push(await toRefundReviewQueueItem(undefined, 'refund-review-projection-placeholder', warnings));
  }

  const projection: RefundReviewQueueProjection = {
    items,
    totalProjection: items.length,
    degradedStateText: 'Refund review queue list persistence is not wired in this foundation; items are projection-safe review candidates only.',
    boundaryFlags: refundOperationalBoundaryFlags,
    warnings,
  };

  return response.ok(projection);
}

export async function handleGetRefundReviewDetailProjection(context: any, refundId: string) {
  const refund = await getRefundDetail(refundId);
  const warnings = refund ? ['REFUND_REVIEW_DETAIL_PROJECTION_SAFE'] : ['REFUND_DETAIL_OWNER_RECORD_UNAVAILABLE'];
  const item = await toRefundReviewQueueItem(refund, refundId, warnings);
  const lines = refund?.lines.map((line) => ({
    refundLineId: line.refundLineId,
    orderLineId: line.orderLineId,
    productId: line.productId,
    quantityProjectionText: `${line.quantity} unit projection`,
    amountProjectionText: `${line.amount.toFixed(2)} ${line.currency}`,
    refundLineTruth: false as const,
  })) ?? [
    {
      refundLineId: 'refund-line-projection-placeholder',
      orderLineId: 'order-line-projection-unavailable',
      productId: 'product-projection-unavailable',
      quantityProjectionText: 'Quantity waits for refund owner projection',
      amountProjectionText: 'Amount waits for refund owner projection',
      refundLineTruth: false as const,
    },
  ];

  const projection: RefundReviewDetailProjection = {
    ...item,
    lines,
    paymentContextProjectionText: refund?.paymentSummary.originalPaymentId
      ? 'Original payment reference is visible as projection context only.'
      : 'Original payment reference is unavailable in the projection.',
    settlementContextProjectionText: refund?.settlementImpactSummary.settlementAdjustmentRequired
      ? 'Settlement impact requires separate owner review projection.'
      : 'Settlement impact projection does not mutate settlement.',
    payoutContextProjectionText: refund?.payoutImpactSummary.payoutAdjustmentRequired
      ? 'Payout impact requires separate owner review projection.'
      : 'Payout impact projection does not mutate payout.',
    providerContextProjectionText: refund?.paymentSummary.simulationOnly
      ? 'Provider context is simulation/projection only.'
      : 'Provider context is not exposed as execution proof.',
    actionIntent: {
      reviewIntentAllowed: true,
      manualEscalationIntentAllowed: true,
      evidenceRequiredIntentAllowed: true,
      ownerCommandRequired: true,
      directExecutionAllowed: false,
      uiMutationTruth: false,
    },
  };

  return response.ok(projection);
}

async function toRefundReviewQueueItem(
  refund: RefundResponse | undefined,
  refundId: string,
  warnings: string[],
): Promise<RefundReviewQueueItemProjection> {
  const currency = refund?.amountSummary.currency ?? 'TRY';
  const amountProjectionText = refund
    ? `${refund.amountSummary.approvedAmount.toFixed(2)} ${currency} approved projection`
    : 'Amount projection unavailable';
  const evidenceWarnings = refund?.warnings ?? warnings;
  const workflow = await getLatestRefundOperationalIntent(refundId);
  const latestAuditIntent = await getLatestRefundAuditIntentOutbox(refundId);

  return {
    refundId,
    cancelReturnRequestId: refund?.cancelReturnRequestId ?? 'cancel-return-projection-unavailable',
    sourceTypeProjection: refund?.sourceType ?? 'UNKNOWN',
    statusProjection: refund?.state ?? 'UNAVAILABLE',
    amountProjectionText,
    reasonPreviewText: refund?.errors.length ? refund.errors.join(', ') : 'Reason waits for review command intent.',
    evidencePreviewText: evidenceWarnings.length ? evidenceWarnings.join(', ') : 'Evidence refs are required for command intent.',
    riskContextProjectionText: 'Risk context is a projection and does not approve or block this refund.',
    supportContextProjectionText: 'Support context is visible for review only; issue resolution is not inferred.',
    orderContextProjectionText: 'Order context projection does not create payment, refund, settlement, or payout truth.',
    escalation: {
      escalationStateProjection: refund?.state === 'RECONCILIATION_REQUIRED' || !refund ? 'manual_escalation_visible' : 'recommended',
      escalationTargetProjection: 'FINANCE',
      visibilityText: 'Manual escalation is visible as operational intent, not as owner state mutation.',
      escalationDecisionTruth: false,
    },
    auditEvidence: {
      requiredEvidenceRefs: ['refund-review-note', 'order-or-support-reference'],
      providedEvidenceRefs: workflow?.evidenceRefs ?? [],
      reasonCodeProjectionText: workflow?.reasonCode ?? 'reasonCode is required for review and escalation intents.',
      auditIntentPreview: [
        'actor context required',
        'makerActorId required',
        'checkerActorId required for checked/rejected owner handoff',
        'same actor checker approval blocked',
        'reasonCode required',
        'evidenceRefs required',
        'idempotencyKey required',
      ],
      missingEvidenceWarnings: evidenceWarnings,
      auditIntentRecordedProjection: Boolean(latestAuditIntent),
      auditIntentPersistedProjection: Boolean(latestAuditIntent),
      latestAuditIntentText: latestAuditIntent
        ? `${latestAuditIntent.actionType} ${workflow?.workflowState ?? 'prepared'} audit ${latestAuditIntent.deliveryState} at ${latestAuditIntent.createdAt}`
        : 'Audit intent pending.',
      auditMutationTruth: false,
    },
    makerChecker: {
      makerActorProjectionText: workflow?.makerActorId
        ? `Maker submitted by ${workflow.makerActorId}.`
        : 'Maker actor must match authenticated command context.',
      checkerActorProjectionText: workflow?.checkerActorId
        ? `Checker recorded as ${workflow.checkerActorId}.`
        : 'Checker required before owner handoff can be treated as checked.',
      reviewWorkflowStateProjection: workflow?.workflowState ?? 'prepared',
      sameActorApprovalBlockedProjection: true,
      latestDecisionProjectionText: workflow?.actionType ?? 'No maker-checker decision recorded.',
      dualApprovalRequiredProjection: true,
      ownerStateMachineReady: true,
      makerCheckerTruth: false,
    },
    detailHref: `/admin/refunds/${encodeURIComponent(refundId)}`,
    boundaryFlags: refundOperationalBoundaryFlags,
    warnings,
  };
}

export async function handleProcessRefund(context: any, body: any) {
  const permissionError = requireRefundPermission(context);
  if (permissionError) return permissionError;

  const refundId = normalizeText(body?.refundId);
  const idempotencyKey = normalizeText(body?.idempotencyKey);
  const reasonCode = normalizeText(body?.reasonCode);
  const evidenceRefs = normalizeEvidenceRefs(body?.evidenceRefs);

  if (!refundId) return response.badRequest('REFUND_ID_REQUIRED', 'refundId is required');
  const idempotencyError = validateIdempotencyPresence(idempotencyKey);
  if (idempotencyError) return idempotencyError;
  const evidenceError = validateReasonEvidence({ action: 'REFUND_PROCESS', reasonCode, evidenceRefs });
  if (evidenceError) return evidenceError;

  const refund = await getRefundDetail(refundId);
  if (!refund) return response.notFound('REFUND_NOT_FOUND', 'Refund not found');
  if (completedRefundStates.includes(refund.state)) {
    return response.conflict('REFUND_COMPLETED_TRUTH_BLOCKED', 'Completed refund truth cannot be produced or replayed by the BFF operational command surface');
  }

  let persistedIntent;
  try {
    persistedIntent = await persistRefundOperationalIntent({
      context,
      action: 'REFUND_PROCESS',
      refundId,
      reasonCode: reasonCode ?? 'REFUND_PROCESS_REVIEW',
      evidenceRefs,
      idempotencyKey: idempotencyKey!,
      makerActorId: 'actorId' in context ? context.actorId : 'unknown-refund-actor',
      workflowState: 'owner_handoff_pending',
    });
  } catch (error: any) {
    if (error.message === 'OPERATIONAL_INTENT_IDEMPOTENCY_CONFLICT') {
      return response.conflict('REFUND_IDEMPOTENCY_CONFLICT', 'Same idempotency key was reused with a different refund operational payload');
    }
    throw error;
  }

  return response.ok({
    accepted: true,
    commandStatus: 'ACCEPTED_FOR_REFUND_OWNER_REVIEW',
    refundId,
    idempotencyKey,
    auditIntent: persistedIntent.auditIntent,
    idempotentReplay: persistedIntent.persisted.idempotentReplay,
    boundary: persistedIntent.auditIntent.boundary,
  });
}

export async function handleTransitionRefund(context: any, body: any) {
  const permissionError = requireRefundPermission(context);
  if (permissionError) return permissionError;

  const refundId = normalizeText(body?.refundId);
  const targetState = normalizeText(body?.targetState) as RefundState | undefined;
  const idempotencyKey = normalizeText(body?.idempotencyKey);
  const reasonCode = normalizeText(body?.reasonCode);
  const evidenceRefs = normalizeEvidenceRefs(body?.evidenceRefs);
  const forcedTransition = body?.forcedTransition === true || body?.manualOverride === true;

  if (!refundId) return response.badRequest('REFUND_ID_REQUIRED', 'refundId is required');
  if (!targetState) return response.badRequest('REFUND_TARGET_STATE_REQUIRED', 'targetState is required');
  if (completedRefundStates.includes(targetState)) {
    return response.badRequest('REFUND_COMPLETED_TRUTH_BLOCKED', 'BFF refund transition cannot create completed refund truth');
  }
  const idempotencyError = validateIdempotencyPresence(idempotencyKey);
  if (idempotencyError) return idempotencyError;
  const evidenceError = validateReasonEvidence({
    action: 'REFUND_TRANSITION',
    reasonCode,
    evidenceRefs,
    targetState,
    forcedTransition,
  });
  if (evidenceError) return evidenceError;

  const refund = await getRefundDetail(refundId);
  if (!refund) return response.notFound('REFUND_NOT_FOUND', 'Refund not found');

  let persistedIntent;
  try {
    persistedIntent = await persistRefundOperationalIntent({
      context,
      action: 'REFUND_TRANSITION',
      refundId,
      reasonCode: reasonCode ?? `TARGET_${targetState}`,
      evidenceRefs,
      idempotencyKey: idempotencyKey!,
      makerActorId: 'actorId' in context ? context.actorId : 'unknown-refund-actor',
      workflowState: 'owner_handoff_pending',
    });
  } catch (error: any) {
    if (error.message === 'OPERATIONAL_INTENT_IDEMPOTENCY_CONFLICT') {
      return response.conflict('REFUND_IDEMPOTENCY_CONFLICT', 'Same idempotency key was reused with a different refund operational payload');
    }
    throw error;
  }
  return response.ok({
    success: true,
    accepted: true,
    commandStatus: 'ACCEPTED_FOR_REFUND_OWNER_REVIEW',
    refundId,
    idempotencyKey,
    auditIntent: persistedIntent.auditIntent,
    idempotentReplay: persistedIntent.persisted.idempotentReplay,
    boundary: persistedIntent.auditIntent.boundary,
  });
}

export async function handleReviewRefund(context: any, body: any) {
  return handleRefundAuditOnlyCommand(context, body, 'REFUND_REVIEW');
}

export async function handleManualRefundEscalation(context: any, body: any) {
  return handleRefundAuditOnlyCommand(context, body, 'REFUND_MANUAL_ESCALATION');
}

async function handleRefundAuditOnlyCommand(context: ActorContext, body: any, action: RefundOperationalAction) {
  const permissionError = requireRefundPermission(context);
  if (permissionError) return permissionError;

  const refundId = normalizeText(body?.refundId);
  const idempotencyKey = normalizeText(body?.idempotencyKey);
  const makerActorId = normalizeMakerActorId(context, body?.makerActorId);
  const checkerActorId = normalizeText(body?.checkerActorId);
  const reasonCode = normalizeText(body?.reasonCode);
  const evidenceRefs = normalizeEvidenceRefs(body?.evidenceRefs);
  const decision = normalizeText(body?.decision);

  if (!refundId) return response.badRequest('REFUND_ID_REQUIRED', 'refundId is required');
  const idempotencyError = validateIdempotencyPresence(idempotencyKey);
  if (idempotencyError) return idempotencyError;
  if (!makerActorId) {
    return response.badRequest('REFUND_MAKER_ACTOR_ID_REQUIRED', 'makerActorId must match the authenticated actor');
  }
  if (checkerActorId && checkerActorId === makerActorId) {
    return response.forbidden('REFUND_CHECKER_SELF_APPROVAL_FORBIDDEN', 'Maker cannot approve their own prepared refund decision as checker');
  }
  const evidenceError = validateReasonEvidence({ action, reasonCode, evidenceRefs });
  if (evidenceError) return evidenceError;

  const refund = await getRefundDetail(refundId);
  if (!refund) return response.notFound('REFUND_NOT_FOUND', 'Refund not found');

  const reviewWorkflowState = deriveReviewWorkflowState({ action, decision, checkerActorId });
  let persistedIntent;
  try {
    persistedIntent = await persistRefundOperationalIntent({
      context,
      action,
      refundId,
      reasonCode: reasonCode!,
      evidenceRefs,
      idempotencyKey: idempotencyKey!,
      makerActorId,
      checkerActorId,
      workflowState: reviewWorkflowState,
    });
  } catch (error: any) {
    if (error.message === 'OPERATIONAL_INTENT_IDEMPOTENCY_CONFLICT') {
      return response.conflict('REFUND_IDEMPOTENCY_CONFLICT', 'Same idempotency key was reused with a different refund operational payload');
    }
    throw error;
  }

  return response.ok({
    accepted: true,
    commandStatus:
      reviewWorkflowState === 'checker_required'
        ? 'CHECKER_REQUIRED'
        : reviewWorkflowState === 'checked'
          ? 'CHECKED_FOR_OWNER_HANDOFF'
          : reviewWorkflowState === 'rejected'
            ? 'REJECTED_BY_CHECKER'
            : reviewWorkflowState === 'escalated'
              ? 'ESCALATED'
              : 'MAKER_SUBMITTED',
    reviewWorkflowState,
    refundId,
    idempotencyKey,
    auditIntent: persistedIntent.auditIntent,
    auditOutboxDeliveryState: persistedIntent.persisted.auditOutbox.deliveryState,
    idempotentReplay: persistedIntent.persisted.idempotentReplay,
    boundary: persistedIntent.auditIntent.boundary,
  });
}

export function resetRefundOperationalIdempotencyForTesting() {
  resetRefundOperationalIntentPersistenceForTesting();
}
