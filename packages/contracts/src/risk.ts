export type RiskTargetType =
  | 'ACCOUNT'
  | 'CHECKOUT'
  | 'PAYMENT'
  | 'ORDER'
  | 'REFUND'
  | 'PAYOUT'
  | 'COUPON'
  | 'POINT'
  | 'INTERACTION'
  | 'REVIEW'
  | 'STORY'
  | 'STORE'
  | 'SUPPLIER'
  | 'CREATOR';

export type RiskSignalSource = RiskSource;

export type RiskDecisionStatus =
  | 'SIGNAL_RECORDED'
  | 'CASE_CREATED'
  | 'REVIEW_REQUIRED'
  | 'OWNER_HANDOFF_REQUIRED'
  | 'NO_ACTION_MONITOR'
  | 'ALREADY_PROCESSED'
  | 'REJECTED';

export type RiskSignalType =
  | 'ACCOUNT_VELOCITY'
  | 'COUPON_ABUSE'
  | 'POINT_ABUSE'
  | 'INTERACTION_ABUSE'
  | 'PAYMENT_ANOMALY'
  | 'REFUND_ABUSE'
  | 'MULTI_ACCOUNT_PATTERN'
  | 'STORE_MANIPULATION'
  | 'SUPPLIER_ANOMALY'
  | 'CREATOR_ABUSE'
  | 'MANUAL_REPORT';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RiskCaseStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'ADVISORY_HOLD_RECOMMENDED'
  | 'REVIEW_REQUIRED'
  | 'NO_ACTION'
  | 'ESCALATED'
  | 'CLOSED';

export type RiskDecision =
  | 'NO_ACTION'
  | 'MARK_REVIEW_REQUIRED'
  | 'RECOMMEND_HOLD'
  | 'RELEASE_RECOMMENDATION'
  | 'ESCALATE'
  | 'CLOSE';

export type RiskSource =
  | 'SYSTEM_RULE'
  | 'SUPPORT_ESCALATION'
  | 'MODERATION_ESCALATION'
  | 'PAYMENT_SIGNAL'
  | 'ORDER_SIGNAL'
  | 'REFUND_SIGNAL'
  | 'ADMIN_REVIEW'
  | 'FOUNDATION_SIMULATION';

export type RiskReasonCode =
  | 'SUSPICIOUS_VELOCITY'
  | 'COUPON_ABUSE'
  | 'POINT_ABUSE'
  | 'MULTI_ACCOUNT'
  | 'PAYMENT_ANOMALY'
  | 'REFUND_ABUSE'
  | 'BOT_LIKE_BEHAVIOR'
  | 'INTERACTION_MANIPULATION'
  | 'SUPPLIER_ANOMALY'
  | 'CREATOR_ABUSE'
  | 'UNKNOWN';

export interface RiskBoundaryFlags {
  riskSignalOnly: true;
  businessTruthMutated: false;
  ownerTruthMutatedByRisk: false;
  orderTruthMutated: false;
  paymentTruthMutated: false;
  payoutTruthMutated: false;
  financeTruthMutated: false;
  moderationTruthMutated: false;
  bffTruthMutated: false;
  uiTruthMutated: false;
}

export interface RiskScore {
  score: number;
  severity: RiskLevel;
  category: RiskSignalType;
  decisionStatus: RiskDecisionStatus;
  riskSignalOnly: true;
}

export interface RiskOwnerHandoffEvidence extends RiskBoundaryFlags {
  targetDomain: string;
  targetType: RiskTargetType;
  targetId: string;
  riskScore: RiskScore;
  severity: RiskLevel;
  reasonCode: RiskReasonCode;
  correlationId: string;
  idempotencyKey: string;
  decisionStatus: RiskDecisionStatus;
  handoffRequired: boolean;
  ownerHandoffRequired: boolean;
  ownerHandoffNotRequiredReason?: string;
  ownerDomainHandoff: string | null;
  auditEvidenceRequired: true;
  reasonCodeRequired: true;
  actorId?: string;
  systemActorId?: string;
  requestedAt: string;
  createdAt: string;
}

export interface RiskTargetRef {
  targetId: string;
  targetType: RiskTargetType;
}

export interface RiskSignal extends RiskBoundaryFlags {
  signalId: string;
  target: RiskTargetRef;
  type: RiskSignalType;
  level: RiskLevel;
  score: RiskScore;
  source: RiskSource;
  reasonCode: RiskReasonCode;
  correlationId: string;
  metadata?: Record<string, any>;
  idempotencyKey: string;
  actorId?: string;
  systemActorId?: string;
  requestedAt: string;
  createdAt: string;
  decisionStatus: RiskDecisionStatus;
  ownerHandoffRequired: boolean;
  ownerDomainHandoff: string | null;
  ownerHandoffEvidence: RiskOwnerHandoffEvidence;
  auditEvidenceRequired: true;
  reasonCodeRequired: true;

  riskTruthMutated: boolean;
  targetTruthMutated: boolean;
  refundTruthMutated: boolean;
}

export interface RiskCase extends RiskBoundaryFlags {
  caseId: string;
  target: RiskTargetRef;
  status: RiskCaseStatus;
  level: RiskLevel;
  score: RiskScore;
  source: RiskSource;
  decision?: RiskDecision;
  reasonCode: RiskReasonCode;
  correlationId: string;
  notes?: string;
  signals: string[]; // signal IDs
  idempotencyKey: string;
  actorId?: string;
  systemActorId?: string;
  requestedAt: string;
  createdAt: string;
  updatedAt: string;
  decisionStatus: RiskDecisionStatus;
  ownerHandoffRequired: boolean;
  ownerDomainHandoff: string | null;
  ownerHandoffEvidence: RiskOwnerHandoffEvidence;
  auditEvidenceRequired: true;
  reasonCodeRequired: true;

  riskTruthMutated: boolean;
  targetTruthMutated: boolean;
  refundTruthMutated: boolean;
}

export interface CreateRiskSignalCommand {
  target: RiskTargetRef;
  type: RiskSignalType;
  level: RiskLevel;
  source: RiskSource;
  reasonCode: RiskReasonCode;
  metadata?: Record<string, any>;
  idempotencyKey: string;
  correlationId: string;
  actorId?: string;
  systemActorId?: string;
  requestedAt?: string;
}

export interface CreateRiskCaseCommand {
  target: RiskTargetRef;
  level: RiskLevel;
  source: RiskSource;
  reasonCode: RiskReasonCode;
  signals?: string[];
  notes?: string;
  idempotencyKey: string;
  correlationId: string;
  actorId?: string;
  systemActorId?: string;
  requestedAt?: string;
}

export interface ReviewRiskCaseCommand {
  caseId: string;
  decision: RiskDecision;
  reasonCode: RiskReasonCode;
  notes?: string;
  reviewerId: string;
  correlationId: string;
  idempotencyKey: string;
  requestedAt?: string;
}

export interface RiskOperationalIntentRequest {
  caseId: string;
  kind: 'review' | 'escalation' | 'require-evidence' | 'recommend-payout-hold';
  makerActorId: string;
  checkerActorId?: string;
  reasonCode: string;
  evidenceRefs: string[];
  idempotencyKey: string;
  decision?: string;
  operationalIntentOnly: true;
  enforcementExecuted?: false;
  ownerMutationTruth?: false;
  payoutBlockedTruth?: false;
}

export interface OwnerDomainRiskReviewCommand extends ReviewRiskCaseCommand {
  ownerDomainInternalOnly?: true;
  operationalIntentOnly?: false;
  enforcementExecuted?: false;
  ownerMutationTruth?: true;
  payoutBlockedTruth?: false;
}

export interface LegacyRiskReviewCommandDeprecated extends ReviewRiskCaseCommand {
  deprecatedForOperationalWorkflow: true;
  replacementRoute: '/risk/intent';
  internalOnly: true;
  operationalIntentOnly: false;
  enforcementExecuted?: false;
  ownerMutationTruth?: true;
  payoutBlockedTruth?: false;
}

export interface GetRiskCaseQuery {
  caseId: string;
}

export interface ListRiskCasesQuery {
  targetId?: string;
  targetType?: RiskTargetType;
  status?: RiskCaseStatus;
  level?: RiskLevel;
  limit?: number;
  offset?: number;
}

export interface RiskMutationResult {
  success: boolean;
  caseId?: string;
  signalId?: string;
  decisionStatus?: RiskDecisionStatus;
  duplicate?: boolean;
  alreadyProcessed?: boolean;
  ownerHandoffEvidence?: RiskOwnerHandoffEvidence;
  auditEvidence?: Record<string, unknown>;
  score?: RiskScore;
  warnings?: string[];
}

export interface RiskReviewDecision extends RiskBoundaryFlags {
  caseId: string;
  decision: RiskDecision;
  decisionStatus: RiskDecisionStatus;
  reviewerId: string;
  reasonCode: RiskReasonCode;
  correlationId: string;
  idempotencyKey: string;
  requestedAt: string;
  ownerHandoffEvidence: RiskOwnerHandoffEvidence;
  auditEvidenceRequired: true;
  reasonCodeRequired: true;
}

export interface RiskCaseResponse {
  case: RiskCase;
}

export interface RiskCaseListResponse {
  cases: RiskCase[];
  total: number;
}

export interface RiskSignalResponse {
  signal: RiskSignal;
}

export interface RiskOperationalBoundaryFlags {
  moderationTruthMutated: false;
  riskTruthMutated: false;
  payoutBlockedTruth: false;
  enforcementExecuted: false;
  auditMutationTruth: false;
}

export interface RiskEvidenceProjection {
  evidenceId: string;
  evidenceTypeProjection: string;
  sourceProjection: string;
  summaryProjectionText: string;
  createdAtProjectionText: string;
  evidenceOwnerMutationTruth: false;
}

export interface RiskEscalationProjection {
  escalationStateProjection: 'none' | 'visible' | 'recommended' | 'required';
  escalationTargetProjection: string;
  visibilityText: string;
  escalationDecisionTruth: false;
}

export interface RiskPayoutHoldRecommendationProjection {
  recommendationStateProjection: 'not_applicable' | 'visible' | 'recommended';
  recommendationText: string;
  payoutBlockedTruth: false;
}

export interface RiskReviewQueueItemProjection {
  caseId: string;
  targetTypeProjection: string;
  targetIdProjection: string;
  riskLevelProjection: RiskLevel | 'UNAVAILABLE';
  scoreProjectionText: string;
  statusProjection: string;
  sourceProjection: string;
  relatedContextProjectionText: string;
  evidencePreviewText: string;
  escalation: RiskEscalationProjection;
  payoutHoldRecommendation: RiskPayoutHoldRecommendationProjection;
  detailHref: string;
  boundaryFlags: RiskOperationalBoundaryFlags;
  warnings?: string[];
}

export interface RiskReviewQueueProjection {
  items: RiskReviewQueueItemProjection[];
  totalProjection?: number;
  emptyState?: boolean;
  degradedStateText?: string;
  boundaryFlags: RiskOperationalBoundaryFlags;
  warnings?: string[];
}

export interface RiskReviewDetailProjection extends RiskReviewQueueItemProjection {
  fraudSignalProjectionText: string;
  relatedOrderStoreUserPostContextProjectionText: string;
  evidence: RiskEvidenceProjection[];
  auditEvidence: {
    requiredEvidenceRefs: string[];
    providedEvidenceRefs: string[];
    reasonCodeProjectionText: string;
    auditIntentPreview: string[];
    auditIntentRecordedProjection: boolean;
    auditIntentPersistedProjection: boolean;
    latestAuditIntentText?: string;
    auditMutationTruth: false;
  };
  makerChecker: {
    makerActorProjectionText: string;
    checkerActorProjectionText: string;
    workflowStateProjection: 'prepared' | 'checker_required' | 'checked' | 'rejected' | 'escalated' | 'owner_handoff_pending' | 'owner_handoff_ready';
    sameActorApprovalBlockedProjection: true;
    ownerHandoffRequiredProjection: true;
    makerCheckerTruth: false;
  };
  actionIntent: {
    reviewIntentAllowed: true;
    escalationIntentAllowed: true;
    requireEvidenceIntentAllowed: true;
    recommendPayoutHoldIntentAllowed: true;
    ownerCommandRequired: true;
    directExecutionAllowed: false;
    uiMutationTruth: false;
  };
}

export type RiskCommandIntentStatus =
  | 'maker_submitted'
  | 'checker_required'
  | 'checked_for_owner_handoff'
  | 'rejected_by_checker'
  | 'escalated'
  | 'evidence_required'
  | 'payout_hold_recommended'
  | 'validation_failed'
  | 'permission_denied'
  | 'owner_unavailable';

export interface RiskCommandIntentResultProjection {
  status: RiskCommandIntentStatus;
  message: string;
  idempotencyKey: string;
  workflowState?: 'prepared' | 'checker_required' | 'checked' | 'rejected' | 'escalated' | 'owner_handoff_pending' | 'owner_handoff_ready';
  auditIntentPersisted: boolean;
  boundaryFlags: RiskOperationalBoundaryFlags;
}
