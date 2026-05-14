import type {
  AdminProtectedActionRequest,
  AdminProtectedActionResponse,
} from '@hx/contracts';
import type {
  AdminDashboardProjection,
  AdminFinanceOpsProjection,
  OperationalQueueDetailProjection,
  OperationalQueueProjection,
  AdminProductApprovalDetailProjection,
  AdminProductApprovalQueueProjection,
  PublicProjectionEnvelope,
  RefundCommandIntentResultProjection,
  RefundReviewCommand,
  RefundReviewDetailProjection,
  RefundReviewQueueProjection,
  ManualRefundEscalationCommand,
  ModerationCommandIntentResultProjection,
  ModerationReviewDetailProjection,
  ModerationReviewQueueProjection,
  RiskCommandIntentResultProjection,
  RiskReviewDetailProjection,
  RiskReviewQueueProjection,
} from '@hx/contracts';
import { readBffProjectionState } from './read';
import { createBffClient } from '../bff-client';

export type AdminDashboardReadProjection = AdminDashboardProjection;
export type AdminProductApprovalQueueReadProjection = AdminProductApprovalQueueProjection;
export type AdminProductApprovalDetailReadProjection = AdminProductApprovalDetailProjection;
export type AdminRefundReviewQueueReadProjection = RefundReviewQueueProjection;
export type AdminRefundReviewDetailReadProjection = RefundReviewDetailProjection;
export type AdminModerationReviewQueueReadProjection = ModerationReviewQueueProjection;
export type AdminModerationReviewDetailReadProjection = ModerationReviewDetailProjection;
export type AdminRiskReviewQueueReadProjection = RiskReviewQueueProjection;
export type AdminRiskReviewDetailReadProjection = RiskReviewDetailProjection;
export type AdminOperationalQueueReadProjection = OperationalQueueProjection;
export type AdminOperationalQueueDetailReadProjection = OperationalQueueDetailProjection;
export type AdminFinanceOpsReadProjection = AdminFinanceOpsProjection;

export function readAdminDashboardProjection(): Promise<PublicProjectionEnvelope<AdminDashboardReadProjection>> {
  return readBffProjectionState<AdminDashboardReadProjection>('/admin');
}

export function readAdminProductApprovalQueueProjection(): Promise<PublicProjectionEnvelope<AdminProductApprovalQueueReadProjection>> {
  return readBffProjectionState<AdminProductApprovalQueueReadProjection>('/admin/products');
}

export function readAdminProductApprovalDetailProjection(
  productId: string,
): Promise<PublicProjectionEnvelope<AdminProductApprovalDetailReadProjection>> {
  return readBffProjectionState<AdminProductApprovalDetailReadProjection>(`/admin/products/${encodeURIComponent(productId)}`);
}

export function readAdminRefundReviewQueueProjection(): Promise<PublicProjectionEnvelope<AdminRefundReviewQueueReadProjection>> {
  return readBffProjectionState<AdminRefundReviewQueueReadProjection>('/admin/refunds');
}

export function readAdminRefundReviewDetailProjection(
  refundId: string,
): Promise<PublicProjectionEnvelope<AdminRefundReviewDetailReadProjection>> {
  return readBffProjectionState<AdminRefundReviewDetailReadProjection>(`/admin/refunds/${encodeURIComponent(refundId)}`);
}

export function readAdminModerationReviewQueueProjection(): Promise<PublicProjectionEnvelope<AdminModerationReviewQueueReadProjection>> {
  return readBffProjectionState<AdminModerationReviewQueueReadProjection>('/admin/moderation');
}

export function readAdminModerationReviewDetailProjection(
  caseId: string,
): Promise<PublicProjectionEnvelope<AdminModerationReviewDetailReadProjection>> {
  return readBffProjectionState<AdminModerationReviewDetailReadProjection>(`/admin/moderation/${encodeURIComponent(caseId)}`);
}

export function readAdminRiskReviewQueueProjection(): Promise<PublicProjectionEnvelope<AdminRiskReviewQueueReadProjection>> {
  return readBffProjectionState<AdminRiskReviewQueueReadProjection>('/admin/risk');
}

export function readAdminRiskReviewDetailProjection(
  caseId: string,
): Promise<PublicProjectionEnvelope<AdminRiskReviewDetailReadProjection>> {
  return readBffProjectionState<AdminRiskReviewDetailReadProjection>(`/admin/risk/${encodeURIComponent(caseId)}`);
}

export function readAdminOperationalQueueProjection(): Promise<PublicProjectionEnvelope<AdminOperationalQueueReadProjection>> {
  return readBffProjectionState<AdminOperationalQueueReadProjection>('/admin/ops');
}

export function readAdminOperationalQueueDetailProjection(
  intentId: string,
): Promise<PublicProjectionEnvelope<AdminOperationalQueueDetailReadProjection>> {
  return readBffProjectionState<AdminOperationalQueueDetailReadProjection>(`/admin/ops/${encodeURIComponent(intentId)}`);
}

export function readAdminFinanceOpsProjection(): Promise<PublicProjectionEnvelope<AdminFinanceOpsReadProjection>> {
  return readBffProjectionState<AdminFinanceOpsReadProjection>('/admin/ops/finance');
}

type RefundIntentKind = 'review' | 'manual-escalation' | 'evidence-required';

export async function executeRefundCommandIntent(input: {
  kind: RefundIntentKind;
  refundId: string;
  reasonCode: string;
  evidenceRefs: string[];
}): Promise<RefundCommandIntentResultProjection> {
  const makerActorId = process.env.NEXT_PUBLIC_REFUND_OPS_ACTOR_ID || 'finance-admin-ui-actor';
  const checkerActorId = input.kind === 'review'
    ? process.env.NEXT_PUBLIC_REFUND_OPS_CHECKER_ACTOR_ID
    : undefined;
  const command = {
    refundId: input.refundId,
    reasonCode: input.reasonCode,
    evidenceRefs: input.evidenceRefs,
    idempotencyKey: `refund-${input.kind}-${input.refundId}-${Date.now()}`,
    makerActorId,
    checkerActorId,
    actorContext: {
      actorId: makerActorId,
      actorRole: 'FINANCE',
    },
    decision: input.kind === 'manual-escalation' ? 'ESCALATE' : input.kind === 'evidence-required' ? 'ESCALATE' : 'APPROVE_FOR_OWNER_REVIEW',
    escalationTarget: input.kind === 'manual-escalation' ? 'FINANCE' : undefined,
    note: input.kind === 'evidence-required' ? 'Evidence required intent only; no refund execution requested.' : 'Refund review command intent only.',
  } satisfies Partial<RefundReviewCommand & ManualRefundEscalationCommand> & { actorContext: { actorId: string; actorRole: string } };

  const path = input.kind === 'manual-escalation' ? '/refund/manual-escalation' : '/refund/review';
  const token = process.env.NEXT_PUBLIC_REFUND_OPS_AUTH_TOKEN;
  const client = createBffClient();
  const result = await client.post<typeof command, { data?: { reviewWorkflowState?: RefundCommandIntentResultProjection['reviewWorkflowState']; auditIntent?: { persisted?: boolean } } }>(path, command, {
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });

  const boundaryFlags = {
    refundExecutionTruth: false,
    settlementTruth: false,
    payoutTruth: false,
    providerRefundTruth: false,
    auditMutationTruth: false,
  } as const;

  if (!result.ok) {
    const status = result.status === 401 || result.status === 403
      ? 'permission_denied'
      : result.status === 400 || result.status === 422
        ? result.error.code.includes('EVIDENCE')
          ? 'evidence_required'
          : 'validation_failed'
        : 'owner_unavailable';

    return {
      status,
      message: result.error.message,
      idempotencyKey: command.idempotencyKey,
      auditIntentPersisted: false,
      boundaryFlags,
    };
  }

  const reviewWorkflowState = result.data.data?.reviewWorkflowState;
  const auditIntentPersisted = result.data.data?.auditIntent?.persisted === true;

  return {
    status: reviewWorkflowState === 'checker_required'
      ? 'checker_required'
      : reviewWorkflowState === 'checked'
        ? 'checked_for_owner_handoff'
        : reviewWorkflowState === 'rejected'
          ? 'rejected_by_checker'
          : reviewWorkflowState === 'escalated'
            ? 'escalated'
            : 'maker_submitted',
    message: auditIntentPersisted
      ? 'Maker-checker command intent recorded for audit outbox.'
      : 'Maker-checker command intent accepted; audit outbox persistence pending.',
    idempotencyKey: command.idempotencyKey,
    reviewWorkflowState,
    auditIntentPersisted,
    boundaryFlags,
  };
}

type OperationalIntentKind = 'review' | 'escalation' | 'require-evidence' | 'recommend-payout-hold';

export async function executeModerationCommandIntent(input: {
  kind: OperationalIntentKind;
  caseId: string;
  reasonCode: string;
  evidenceRefs: string[];
}): Promise<ModerationCommandIntentResultProjection> {
  const makerActorId = process.env.NEXT_PUBLIC_MODERATION_OPS_ACTOR_ID || 'moderation-admin-ui-actor';
  const checkerActorId = input.kind === 'review'
    ? process.env.NEXT_PUBLIC_MODERATION_OPS_CHECKER_ACTOR_ID
    : undefined;
  const command = {
    caseId: input.caseId,
    kind: input.kind,
    reasonCode: input.reasonCode,
    evidenceRefs: input.evidenceRefs,
    idempotencyKey: `moderation-${input.kind}-${input.caseId}-${Date.now()}`,
    makerActorId,
    checkerActorId,
    decision: input.kind === 'escalation' ? 'ESCALATE' : 'PREPARE_FOR_CHECKER',
  };
  const token = process.env.NEXT_PUBLIC_MODERATION_OPS_AUTH_TOKEN;
  const client = createBffClient();
  const result = await client.post<typeof command, { data?: ModerationCommandIntentResultProjection }>('/moderation/intent', command, {
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });

  if (!result.ok) {
    return {
      status: result.status === 401 || result.status === 403
        ? 'permission_denied'
        : result.status === 400 || result.status === 422
          ? result.error.code.includes('EVIDENCE') ? 'evidence_required' : 'validation_failed'
          : 'owner_unavailable',
      message: result.error.message,
      idempotencyKey: command.idempotencyKey,
      auditIntentPersisted: false,
      boundaryFlags: {
        moderationTruthMutated: false,
        riskTruthMutated: false,
        payoutBlockedTruth: false,
        enforcementExecuted: false,
        auditMutationTruth: false,
      },
    };
  }

  return result.data.data ?? {
    status: 'owner_unavailable',
    message: 'Moderation intent response missing projection payload.',
    idempotencyKey: command.idempotencyKey,
    auditIntentPersisted: false,
    boundaryFlags: {
      moderationTruthMutated: false,
      riskTruthMutated: false,
      payoutBlockedTruth: false,
      enforcementExecuted: false,
      auditMutationTruth: false,
    },
  };
}

export async function executeRiskCommandIntent(input: {
  kind: OperationalIntentKind;
  caseId: string;
  reasonCode: string;
  evidenceRefs: string[];
}): Promise<RiskCommandIntentResultProjection> {
  const makerActorId = process.env.NEXT_PUBLIC_RISK_OPS_ACTOR_ID || 'risk-admin-ui-actor';
  const checkerActorId = input.kind === 'review'
    ? process.env.NEXT_PUBLIC_RISK_OPS_CHECKER_ACTOR_ID
    : undefined;
  const command = {
    caseId: input.caseId,
    kind: input.kind,
    reasonCode: input.reasonCode,
    evidenceRefs: input.evidenceRefs,
    idempotencyKey: `risk-${input.kind}-${input.caseId}-${Date.now()}`,
    makerActorId,
    checkerActorId,
    decision: input.kind === 'escalation' ? 'ESCALATE' : 'PREPARE_FOR_CHECKER',
  };
  const token = process.env.NEXT_PUBLIC_RISK_OPS_AUTH_TOKEN;
  const client = createBffClient();
  const result = await client.post<typeof command, { data?: RiskCommandIntentResultProjection }>('/risk/intent', command, {
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });

  if (!result.ok) {
    return {
      status: result.status === 401 || result.status === 403
        ? 'permission_denied'
        : result.status === 400 || result.status === 422
          ? result.error.code.includes('EVIDENCE') ? 'evidence_required' : 'validation_failed'
          : 'owner_unavailable',
      message: result.error.message,
      idempotencyKey: command.idempotencyKey,
      auditIntentPersisted: false,
      boundaryFlags: {
        moderationTruthMutated: false,
        riskTruthMutated: false,
        payoutBlockedTruth: false,
        enforcementExecuted: false,
        auditMutationTruth: false,
      },
    };
  }

  return result.data.data ?? {
    status: 'owner_unavailable',
    message: 'Risk intent response missing projection payload.',
    idempotencyKey: command.idempotencyKey,
    auditIntentPersisted: false,
    boundaryFlags: {
      moderationTruthMutated: false,
      riskTruthMutated: false,
      payoutBlockedTruth: false,
      enforcementExecuted: false,
      auditMutationTruth: false,
    },
  };
}


export async function executeAdminProtectedAction(
  request: AdminProtectedActionRequest
): Promise<AdminProtectedActionResponse> {
  const url = process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:3001';
  
  try {
    const response = await fetch(`${url}/admin/execute-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return {
        success: false,
        handoffStatus: 'OWNER_UNAVAILABLE',
        error: `BFF error: ${response.status}`,
        evidence: {
          actorId: request.actorId,
          actionType: request.actionType,
          targetType: request.targetType,
          targetId: request.targetId,
          reasonCode: request.reasonCode,
          correlationId: request.correlationId,
          idempotencyKey: request.idempotencyKey,
          decision: 'PENDING_OWNER_DOMAIN',
          adminDirectWrite: false,
          ownerCommandRequired: true,
          ownerTruthMutatedByAdmin: false,
          bffTruthMutated: false,
          uiTruthMutated: false,
          auditEvidenceRequired: false,
          reasonCodeRequired: true,
          permissionChecked: false,
          ownerScopeChecked: false,
          businessTruthMutated: false,
          ownerDomainHandoff: 'OWNER_UNAVAILABLE'
        }
      };
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      handoffStatus: 'OWNER_UNAVAILABLE',
      error: 'Network or client error',
      evidence: {
          actorId: request.actorId,
          actionType: request.actionType,
          targetType: request.targetType,
          targetId: request.targetId,
          reasonCode: request.reasonCode,
          correlationId: request.correlationId,
          idempotencyKey: request.idempotencyKey,
          decision: 'PENDING_OWNER_DOMAIN',
          adminDirectWrite: false,
          ownerCommandRequired: true,
          ownerTruthMutatedByAdmin: false,
          bffTruthMutated: false,
          uiTruthMutated: false,
          auditEvidenceRequired: false,
          reasonCodeRequired: true,
          permissionChecked: false,
          ownerScopeChecked: false,
          businessTruthMutated: false,
          ownerDomainHandoff: 'OWNER_UNAVAILABLE'
      }
    };
  }
}
