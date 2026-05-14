import type {
  AdminFinanceOpsProjection,
  FinanceOpsBoundaryFlags,
  FinanceOpsGroupProjection,
  FinanceOpsItemProjection,
  LedgerEntry,
  OperationalAuditStatusProjection,
  OperationalEscalationProjection,
  OperationalOutboxDeliveryProjection,
  OperationalPriorityProjection,
  OperationalQueueBoundaryFlags,
  OperationalQueueDetailProjection,
  OperationalQueueDomain,
  OperationalQueueItemProjection,
  OperationalQueuePriority,
  OperationalQueueProjection,
  OperationalQueueSlaState,
  OperationalQueueWorkflowState,
  OperationalSlaProjection,
  PayoutCandidate,
  PayoutCandidateReviewProjection,
  PayoutCandidateReviewQueueProjection,
} from '@hx/contracts';
import { getLedgerEntries } from '@hx/finance';
import { listFinanceCorrections } from '@hx/finance-correction';
import { listPayoutBatches, listPayoutCandidates, listPayoutItems } from '@hx/payout';
import { listSettlementLines } from '@hx/settlement';
import {
  getOperationalAuditOutboxByIntentId,
  getOperationalIntentById,
  listOperationalIntents,
  type AuditIntentOutboxRecord,
  type OperationalIntentRecord,
} from '@hx/persistence';

export const opsBoundaryFlags: OperationalQueueBoundaryFlags = {
  ownerTruthMutated: false,
  enforcementExecuted: false,
  payoutBlockedTruth: false,
  refundExecutionTruth: false,
  auditMutationTruth: false,
};

export const queueDomains: OperationalQueueDomain[] = ['refund', 'moderation', 'risk'];
export const workflowStates: OperationalQueueWorkflowState[] = [
  'prepared',
  'checker_required',
  'checked',
  'rejected',
  'escalated',
  'owner_handoff_pending',
  'owner_handoff_ready',
];
export const priorities: OperationalQueuePriority[] = ['low', 'medium', 'high', 'critical'];

const financeOpsBoundaryFlags: FinanceOpsBoundaryFlags = {
  projectionOnly: true,
  settlementTruthMutated: false,
  payoutTruthMutated: false,
  ledgerTruthMutated: false,
  financeCorrectionTruthMutated: false,
  providerPayoutExecuted: false,
  enforcementExecuted: false,
};

export async function buildOperationalQueueProjection(input: {
  domain: OperationalQueueDomain | 'all';
  workflowState: OperationalQueueWorkflowState | 'all';
  priority: OperationalQueuePriority | 'all';
  search?: string;
  limit: number;
}): Promise<OperationalQueueProjection> {
  const intents = await listOperationalIntents({
    domains: input.domain === 'all' ? queueDomains : [input.domain],
    workflowState: input.workflowState === 'all' ? undefined : input.workflowState,
    limit: input.limit,
  });

  const items = (await Promise.all(intents.map(toOperationalQueueItem)))
    .filter((item) => input.priority === 'all' || item.priority.priority === input.priority)
    .filter((item) => matchesSearch(item, input.search));

  return {
    items,
    totalProjection: items.length,
    filters: {
      domain: input.domain,
      workflowState: input.workflowState,
      priority: input.priority,
      search: input.search,
    },
    emptyState: items.length === 0,
    degradedStateText: 'Operational queue is a read projection over refund, moderation, and risk intents; no owner truth or enforcement is produced.',
    boundaryFlags: opsBoundaryFlags,
    warnings: ['OPERATIONAL_QUEUE_PROJECTION_ONLY', 'SLA_PRIORITY_ESCALATION_VISIBILITY_ONLY'],
  };
}

export async function buildOperationalQueueDetailProjection(intentId: string): Promise<OperationalQueueDetailProjection | null> {
  const intent = await getOperationalIntentById(intentId);
  if (!intent || !queueDomains.includes(intent.domain as OperationalQueueDomain)) return null;

  const item = await toOperationalQueueItem(intent);
  return {
    ...item,
    auditOutboxProjection: item.auditStatus,
    ...(item.auditStatus.outboxId ? { deliveryLifecycleProjection: deriveDeliveryLifecycle(item.auditStatus, intent.intentId) } : {}),
    projectionNotes: [
      'Queue detail reads operational intent and audit outbox projection only.',
      'Delivery lifecycle and retry fields are visibility-only and do not represent owner-domain truth.',
      'Lease fields are worker coordination projection only and do not represent final owner-domain state.',
      'SLA, priority, and escalation are calculated for visibility only.',
      'No finance, payout, enforcement, fraud, settlement, or provider mutation is performed.',
    ],
  };
}

export async function buildFinanceOpsProjection(): Promise<AdminFinanceOpsProjection> {
  const [settlementReview, settlementBlocked, payoutRequested, payoutBlocked, payoutFailed, payoutRetry, payoutCandidateReviewQueue, correctionsCreated, correctionsUnderReview, ledgerEntries] = await Promise.all([
    listSettlementLines({ status: 'PENDING', limit: 25 }),
    listSettlementLines({ status: 'BLOCKED', limit: 25 }),
    listPayoutItems({ status: 'PENDING_EXECUTION', limit: 25 }),
    listPayoutItems({ status: 'ON_HOLD', limit: 25 }),
    listPayoutItems({ status: 'FAILED', limit: 25 }),
    listPayoutItems({ status: 'FAILED', limit: 25 }),
    listPayoutCandidateReviewQueue(),
    listFinanceCorrections({ status: 'CREATED', limit: 25 }),
    listFinanceCorrections({ status: 'UNDER_REVIEW', limit: 25 }),
    getLedgerEntries({}),
  ]);
  const payoutBatches = await listPayoutBatches({ limit: 25 });

  const settlementGroups: FinanceOpsGroupProjection[] = [
    group('settlement_review', 'Settlement review', settlementReview.settlementLines.length, settlementReview.settlementLines.map((line) => ({
      id: line.settlementLineId,
      status: line.status,
      target: line.orderId,
      amountText: `${line.amountSummary.currency} ${line.amountSummary.netAmount}`,
      reasonText: line.reasonCode,
      updatedAt: line.updatedAt,
      flags: [
        line.impactSummary.payoutBlocked ? 'payout blocked by settlement projection' : 'payout not blocked by settlement projection',
        line.impactSummary.financeCorrectionPending ? 'finance correction pending' : 'finance correction not pending',
      ],
    }))),
    group('settlement_blocked', 'Settlement blocked', settlementBlocked.settlementLines.length, settlementBlocked.settlementLines.map((line) => ({
      id: line.settlementLineId,
      status: line.status,
      target: line.orderId,
      amountText: `${line.amountSummary.currency} ${line.amountSummary.netAmount}`,
      reasonText: line.reasonCode,
      updatedAt: line.updatedAt,
      flags: ['blocked visibility only', line.impactSummary.riskHoldActive ? 'risk hold active' : 'risk hold not active'],
    }))),
  ];

  const payoutRetryItems = payoutRetry.payoutItems.filter((item) => item.executionSummary.retryRequired);
  const payoutGroups: FinanceOpsGroupProjection[] = [
    group('payout_candidate_review', 'Payout candidate review queue', payoutCandidateReviewQueue.totalProjection, payoutCandidateReviewQueue.items.map(toPayoutCandidateOpsItem)),
    group('payout_requested', 'Payout requested', payoutRequested.payoutItems.length, payoutRequested.payoutItems.map((item) => toPayoutOpsItem(item.payoutItemId, item.status, item.updatedAt, `${item.beneficiaryType}:${item.beneficiaryId ?? 'unknown'}`, item.amountSummary.payableAmount, item.amountSummary.currency, item.holdReasonCode ?? 'provider execution not performed'))),
    group('payout_blocked', 'Payout blocked / hold', payoutBlocked.payoutItems.length, payoutBlocked.payoutItems.map((item) => toPayoutOpsItem(item.payoutItemId, item.status, item.updatedAt, `${item.beneficiaryType}:${item.beneficiaryId ?? 'unknown'}`, item.amountSummary.heldAmount, item.amountSummary.currency, item.holdReasonCode ?? 'hold reason unavailable'))),
    group('payout_failed', 'Payout failed', payoutFailed.payoutItems.length, payoutFailed.payoutItems.map((item) => toPayoutOpsItem(item.payoutItemId, item.status, item.updatedAt, `${item.beneficiaryType}:${item.beneficiaryId ?? 'unknown'}`, item.amountSummary.payableAmount, item.amountSummary.currency, item.executionSummary.failureReason ?? 'failure reason unavailable'))),
    group('payout_retry_required', 'Payout retry required', payoutRetryItems.length, payoutRetryItems.map((item) => toPayoutOpsItem(item.payoutItemId, item.status, item.updatedAt, `${item.beneficiaryType}:${item.beneficiaryId ?? 'unknown'}`, item.amountSummary.payableAmount, item.amountSummary.currency, item.executionSummary.failureReason ?? 'retry required'))),
  ];

  const correctionGroups: FinanceOpsGroupProjection[] = [
    group('finance_correction_created', 'Finance correction created', correctionsCreated.corrections.length, correctionsCreated.corrections.map((correction) => ({
      id: correction.correctionId,
      status: correction.status,
      target: `${correction.target.targetType}:${correction.target.targetId}`,
      amountText: correction.amountSummary.deltaAmount === undefined ? correction.amountSummary.currency : `${correction.amountSummary.currency} ${correction.amountSummary.deltaAmount}`,
      reasonText: correction.reasonCode,
      updatedAt: correction.updatedAt,
      flags: [correction.severity, correction.impactSummary.advisoryOnly ? 'advisory only' : 'non-advisory flag unavailable'],
    }))),
    group('finance_correction_under_review', 'Finance correction under review', correctionsUnderReview.corrections.length, correctionsUnderReview.corrections.map((correction) => ({
      id: correction.correctionId,
      status: correction.status,
      target: `${correction.target.targetType}:${correction.target.targetId}`,
      amountText: correction.amountSummary.deltaAmount === undefined ? correction.amountSummary.currency : `${correction.amountSummary.currency} ${correction.amountSummary.deltaAmount}`,
      reasonText: correction.reasonCode,
      updatedAt: correction.updatedAt,
      flags: [correction.severity, 'review visibility only'],
    }))),
  ];

  return {
    settlement: settlementGroups,
    payout: payoutGroups,
    financeCorrection: correctionGroups,
    ledger: {
      groupId: 'ledger_read_model',
      title: 'Finance ledger read model',
      totalProjection: ledgerEntries.length,
      emptyState: ledgerEntries.length === 0,
      items: ledgerEntries.slice(0, 25).map(toLedgerOpsItem),
      degradedStateText: 'Ledger projection uses the existing foundation read model only; append behavior is not exposed in this cockpit.',
    },
    reconciliation: {
      groupId: 'reconciliation_visibility',
      title: 'Reconciliation visibility',
      totalProjection: 0,
      emptyState: true,
      items: [],
      degradedStateText: 'Payment reconciliation task data is payment-owner specific; no generic settlement or payout reconciliation truth is inferred.',
    },
    payoutBatchSummary: {
      totalProjection: payoutBatches.total,
      blockedOrFailedProjection: payoutBatches.batches.filter((batch) => batch.status === 'FAILED' || batch.status === 'PARTIALLY_FAILED').length,
      providerExecutionPerformed: false,
    },
    boundaryFlags: financeOpsBoundaryFlags,
    emptyState: [...settlementGroups, ...payoutGroups, ...correctionGroups].every((item) => item.totalProjection === 0) && ledgerEntries.length === 0,
    degradedStateText: 'Finance ops cockpit is read-only and projection-only. It does not finalize settlement, execute payout, append ledger entries, or apply corrections.',
    warnings: [
      'FINANCE_OPS_PROJECTION_ONLY',
      'SETTLEMENT_FINALIZE_NOT_EXECUTED',
      'PAYOUT_PROVIDER_EXECUTION_NOT_EXECUTED',
      'LEDGER_APPEND_NOT_EXPOSED',
      'FINANCE_CORRECTION_APPLY_NOT_EXECUTED',
    ],
  };
}

export async function listPayoutCandidateReviewQueue(): Promise<PayoutCandidateReviewQueueProjection> {
  const list = await listPayoutCandidates();
  const items = list.candidates
    .filter(candidate => candidate.reviewRequired || candidate.reviewStatus === 'REVIEW_BLOCKED' || candidate.blockedByOps === true)
    .map(toPayoutCandidateReviewProjection);

  return {
    items,
    totalProjection: items.length,
    emptyState: items.length === 0,
    degradedStateText: 'Payout candidate review queue is read-only. It does not create payout batches, provider instructions, payment instructions, ledger entries, or settlement finalization.',
    warnings: ['PAYOUT_CANDIDATE_REVIEW_VISIBILITY_ONLY', 'MAKER_CHECKER_PREPARATION_ONLY'],
    boundaryFlags: financeOpsBoundaryFlags,
  };
}

export async function readPayoutCandidateReviewProjection(
  payoutCandidateId: string,
): Promise<PayoutCandidateReviewProjection | null> {
  const list = await listPayoutCandidates();
  const candidate = list.candidates.find(item => item.payoutCandidateId === payoutCandidateId);
  return candidate ? toPayoutCandidateReviewProjection(candidate) : null;
}

async function toOperationalQueueItem(intent: OperationalIntentRecord): Promise<OperationalQueueItemProjection> {
  const auditOutbox = await getOperationalAuditOutboxByIntentId(intent.intentId);
  const priority = derivePriority(intent);
  const sla = deriveSla(intent, priority.priority);
  const escalation = deriveEscalation(intent, sla.state);

  return {
    intentId: intent.intentId,
    domain: intent.domain as OperationalQueueDomain,
    targetId: intent.targetId,
    actionType: intent.actionType,
    workflowState: intent.workflowState as OperationalQueueWorkflowState,
    makerCheckerSummary: {
      makerActorId: intent.makerActorId,
      checkerActorId: intent.checkerActorId ?? null,
      summaryText: intent.checkerActorId
        ? `Maker ${intent.makerActorId}; checker ${intent.checkerActorId}.`
        : `Maker ${intent.makerActorId}; checker pending.`,
      makerCheckerTruth: false,
    },
    reasonCode: intent.reasonCode,
    evidenceCount: intent.evidenceRefs.length,
    priority,
    sla,
    escalation,
    auditStatus: deriveAuditStatus(auditOutbox),
    detailHref: `/admin/ops/${encodeURIComponent(intent.intentId)}`,
    createdAt: intent.createdAt,
    updatedAt: intent.updatedAt,
    boundaryFlags: opsBoundaryFlags,
    warnings: ['OWNER_MUTATION_NOT_EXECUTED', 'AUDIT_OUTBOX_READ_ONLY'],
  };
}

function derivePriority(intent: OperationalIntentRecord): OperationalPriorityProjection {
  const reason = intent.reasonCode.toUpperCase();
  const action = intent.actionType.toUpperCase();
  const priority: OperationalQueuePriority =
    intent.workflowState === 'escalated' || reason.includes('CRITICAL') || action.includes('ESCALATION')
      ? 'critical'
      : reason.includes('PAYOUT') || reason.includes('FRAUD') || action.includes('HOLD')
        ? 'high'
        : intent.workflowState === 'checker_required'
          ? 'medium'
          : 'low';

  return {
    priority,
    priorityText: `${priority} priority projection; it does not trigger enforcement.`,
    projectionOnly: true,
  };
}

function deriveSla(intent: OperationalIntentRecord, priority: OperationalQueuePriority): OperationalSlaProjection {
  const ageMinutesProjection = Math.max(0, Math.floor((Date.now() - new Date(intent.createdAt).getTime()) / 60_000));
  const targetMinutesProjection = priority === 'critical' ? 60 : priority === 'high' ? 240 : priority === 'medium' ? 720 : 1440;
  const atRiskThreshold = Math.floor(targetMinutesProjection * 0.75);
  const state: OperationalQueueSlaState =
    intent.workflowState === 'escalated'
      ? 'escalated'
      : ageMinutesProjection >= targetMinutesProjection
        ? 'overdue'
        : ageMinutesProjection >= atRiskThreshold
          ? 'at_risk'
          : 'normal';

  return {
    state,
    ageMinutesProjection,
    targetMinutesProjection,
    projectionText: `${state} SLA projection (${ageMinutesProjection}/${targetMinutesProjection} minutes).`,
    enforcementTriggered: false,
  };
}

function deriveEscalation(intent: OperationalIntentRecord, slaState: OperationalQueueSlaState): OperationalEscalationProjection {
  const state: OperationalEscalationProjection['state'] =
    intent.workflowState === 'escalated'
      ? 'escalated'
      : slaState === 'overdue' || slaState === 'at_risk'
        ? 'recommended'
        : intent.workflowState === 'checker_required'
          ? 'visible'
          : 'none';

  return {
    state,
    targetProjection: intent.domain === 'refund' ? 'FINANCE' : intent.domain === 'moderation' ? 'MODERATION_OWNER' : 'RISK_OWNER',
    visibilityText: 'Escalation visibility is projection-only and does not mutate owner state.',
    escalationDecisionTruth: false,
  };
}

function deriveAuditStatus(auditOutbox: AuditIntentOutboxRecord | null): OperationalAuditStatusProjection {
  if (!auditOutbox) {
    return {
      deliveryState: 'unavailable',
      retryCount: 0,
      projectionText: 'Audit outbox projection unavailable.',
      auditMutationTruth: false,
    };
  }

  return {
    deliveryState: auditOutbox.deliveryState,
    outboxId: auditOutbox.outboxId,
    deliveredAt: auditOutbox.deliveredAt ?? null,
    retryCount: auditOutbox.retryCount,
    nextRetryAt: auditOutbox.nextRetryAt ?? null,
    lastError: auditOutbox.lastError ?? null,
    deadLetterReason: auditOutbox.deadLetterReason ?? null,
    lastDeliveryAttemptAt: auditOutbox.lastDeliveryAttemptAt ?? null,
    leaseOwner: auditOutbox.leaseOwner ?? null,
    leaseUntil: auditOutbox.leaseUntil ?? null,
    claimedAt: auditOutbox.claimedAt ?? null,
    processingStartedAt: auditOutbox.processingStartedAt ?? null,
    leaseState: deriveLeaseState(auditOutbox),
    processingAgeSeconds: deriveProcessingAgeSeconds(auditOutbox),
    projectionText: `Audit outbox ${auditOutbox.deliveryState}; retry count ${auditOutbox.retryCount}; lease ${deriveLeaseState(auditOutbox)}; read-only projection.`,
    auditMutationTruth: false,
  };
}

function deriveDeliveryLifecycle(
  auditStatus: OperationalAuditStatusProjection,
  intentId: string,
): OperationalOutboxDeliveryProjection | undefined {
  if (!auditStatus.outboxId) return undefined;

  return {
    outboxId: auditStatus.outboxId,
    intentId,
    deliveryState: auditStatus.deliveryState,
    retryCount: auditStatus.retryCount,
    nextRetryAt: auditStatus.nextRetryAt ?? null,
    lastError: auditStatus.lastError ?? null,
    deadLetterReason: auditStatus.deadLetterReason ?? null,
    lastDeliveryAttemptAt: auditStatus.lastDeliveryAttemptAt ?? null,
    deliveredAt: auditStatus.deliveredAt ?? null,
    leaseOwner: auditStatus.leaseOwner ?? null,
    leaseUntil: auditStatus.leaseUntil ?? null,
    claimedAt: auditStatus.claimedAt ?? null,
    processingStartedAt: auditStatus.processingStartedAt ?? null,
    leaseState: auditStatus.leaseState ?? 'unavailable',
    processingAgeSeconds: auditStatus.processingAgeSeconds ?? null,
    attempts: auditStatus.lastDeliveryAttemptAt
      ? [{
          outboxId: auditStatus.outboxId,
          attemptedAt: auditStatus.lastDeliveryAttemptAt,
          attemptState: auditStatus.deliveryState === 'dead_letter'
            ? 'dead_lettered'
            : auditStatus.deliveryState === 'failed'
              ? 'retry_scheduled'
              : auditStatus.deliveryState === 'delivered'
                ? 'owner_accepted'
                : 'handoff_simulated',
          retryCount: auditStatus.retryCount,
          lastError: auditStatus.lastError ?? null,
          leaseOwner: auditStatus.leaseOwner ?? null,
          leaseState: auditStatus.leaseState ?? 'unavailable',
          projectionOnly: true,
          enforcementExecuted: false,
          ownerTruthMutated: false,
          payoutBlockedTruth: false,
          refundExecutionTruth: false,
        }]
      : [],
    projectionOnly: true,
    enforcementExecuted: false,
    ownerTruthMutated: false,
    payoutBlockedTruth: false,
    refundExecutionTruth: false,
  };
}

function deriveLeaseState(
  auditOutbox: Pick<AuditIntentOutboxRecord, 'leaseOwner' | 'leaseUntil' | 'deliveryState'>,
): 'unleased' | 'claimed' | 'expired' | 'released' {
  if (!auditOutbox.leaseOwner || !auditOutbox.leaseUntil) {
    return auditOutbox.deliveryState === 'processing' ? 'released' : 'unleased';
  }
  return new Date(auditOutbox.leaseUntil).getTime() <= Date.now() ? 'expired' : 'claimed';
}

function deriveProcessingAgeSeconds(
  auditOutbox: Pick<AuditIntentOutboxRecord, 'processingStartedAt'>,
): number | null {
  if (!auditOutbox.processingStartedAt) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(auditOutbox.processingStartedAt).getTime()) / 1000));
}

function matchesSearch(item: OperationalQueueItemProjection, search: string | undefined): boolean {
  if (!search) return true;
  const needle = search.toLowerCase();
  return [
    item.intentId,
    item.domain,
    item.targetId,
    item.actionType,
    item.workflowState,
    item.reasonCode,
    item.makerCheckerSummary.makerActorId,
    item.makerCheckerSummary.checkerActorId ?? '',
  ].some((value) => value.toLowerCase().includes(needle));
}

function group(groupId: string, title: string, totalProjection: number, items: FinanceOpsItemProjection[]): FinanceOpsGroupProjection {
  return {
    groupId,
    title,
    totalProjection,
    emptyState: totalProjection === 0,
    items: items.slice(0, 25),
  };
}

function toPayoutOpsItem(
  id: string,
  status: string,
  updatedAt: string,
  target: string,
  amount: number,
  currency: string,
  reasonText: string,
): FinanceOpsItemProjection {
  return {
    id,
    status,
    target,
    amountText: `${currency} ${amount}`,
    reasonText,
    updatedAt,
    flags: ['provider execution not performed', 'payment instruction not created'],
  };
}

function toPayoutCandidateReviewProjection(candidate: PayoutCandidate): PayoutCandidateReviewProjection {
  const groupedSourceCount = candidate.sourcePayableIds.length + candidate.sourceEarningIds.length;
  const reviewReason = candidate.reviewReasonCodes.filter(code => code !== 'REVIEW_NOT_REQUIRED').join(', ')
    || (candidate.reviewRequired ? 'review required' : 'review pending');

  return {
    payoutCandidateId: candidate.payoutCandidateId,
    partyType: candidate.partyType,
    partyId: candidate.partyId,
    amountText: `${candidate.currency} ${candidate.totalAmount}`,
    currency: candidate.currency,
    sourceRefs: candidate.sourceRefs.map(ref => `${ref.sourceType}:${ref.sourceId}`),
    blockingReasons: [...candidate.blockingReasons],
    warnings: [...candidate.warnings],
    reviewStatus: candidate.reviewStatus,
    reviewRequiredReason: reviewReason,
    signalSummary: [
      candidate.blockedByOps ? 'blocked by ops' : 'not blocked by ops',
      candidate.reviewRequired ? 'review required' : 'review pending',
      `${groupedSourceCount} grouped source(s)`,
    ].join('; '),
    groupedSourceCount,
    blockedByOps: candidate.blockedByOps === true,
    boundaryFlags: candidate.boundaryFlags,
    projectionOnly: true,
  };
}

function toPayoutCandidateOpsItem(item: PayoutCandidateReviewProjection): FinanceOpsItemProjection {
  return {
    id: item.payoutCandidateId,
    status: item.reviewStatus,
    target: `${item.partyType}:${item.partyId}`,
    amountText: item.amountText,
    reasonText: item.reviewRequiredReason,
    updatedAt: undefined,
    flags: [
      item.signalSummary,
      item.blockedByOps ? 'ops blocked' : 'ops block not active',
      'candidate projection only',
      'provider instruction not created',
      'ledger entry not created',
    ],
  };
}

function toLedgerOpsItem(entry: LedgerEntry): FinanceOpsItemProjection {
  return {
    id: entry.ledgerEntryId,
    status: entry.entryType,
    target: `${entry.sourceType}:${entry.sourceId}`,
    amountText: `${entry.currency} ${entry.amount}`,
    reasonText: `${entry.direction}. immutable=${entry.immutable ? 'true' : 'false'}`,
    updatedAt: entry.createdAt,
    flags: ['read-only ledger projection', 'append not exposed'],
  };
}
