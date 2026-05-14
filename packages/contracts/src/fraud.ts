export type FraudTargetType =
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

export type FraudSignalType =
  | 'ACCOUNT_TAKEOVER_SUSPECTED'
  | 'PAYMENT_FRAUD_PATTERN'
  | 'ORDER_FRAUD_PATTERN'
  | 'PAYOUT_ABUSE_PATTERN'
  | 'COUPON_ABUSE_PATTERN'
  | 'REFUND_ABUSE_PATTERN'
  | 'POINT_ABUSE_PATTERN'
  | 'INTERACTION_FRAUD_PATTERN'
  | 'SUPPLIER_FRAUD_PATTERN'
  | 'CREATOR_FRAUD_PATTERN'
  | 'MANUAL_FRAUD_REPORT';

export type FraudSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type FraudDecisionStatus =
  | 'FRAUD_SIGNAL_RECORDED'
  | 'FRAUD_CASE_CREATED'
  | 'FRAUD_REVIEW_REQUIRED'
  | 'FRAUD_OWNER_HANDOFF_REQUIRED'
  | 'FRAUD_FALSE_POSITIVE_REVIEW_REQUIRED'
  | 'FRAUD_NO_ACTION_MONITOR'
  | 'FRAUD_ALREADY_PROCESSED'
  | 'FRAUD_REJECTED';

export type FraudReviewDecision =
  | 'FRAUD_NO_ACTION'
  | 'FRAUD_MARK_REVIEW_REQUIRED'
  | 'FRAUD_RECOMMEND_OWNER_ACTION'
  | 'FRAUD_MARK_FALSE_POSITIVE_REVIEW_REQUIRED'
  | 'FRAUD_ESCALATE'
  | 'FRAUD_CLOSE';

export type FraudReviewCaseStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'OWNER_HANDOFF_RECOMMENDED'
  | 'FALSE_POSITIVE_REVIEW_REQUIRED'
  | 'NO_ACTION'
  | 'ESCALATED'
  | 'CLOSED';

export type FraudSignalSource =
  | 'FRAUD_RULE'
  | 'RISK_SIGNAL_REFERENCE'
  | 'PAYMENT_SIGNAL'
  | 'ORDER_SIGNAL'
  | 'PAYOUT_SIGNAL'
  | 'SUPPORT_ESCALATION'
  | 'MODERATION_ESCALATION'
  | 'ADMIN_REVIEW'
  | 'FOUNDATION_SIMULATION';

export type FraudReasonCode =
  | 'ACCOUNT_TAKEOVER'
  | 'PAYMENT_FRAUD'
  | 'ORDER_FRAUD'
  | 'PAYOUT_ABUSE'
  | 'COUPON_ABUSE'
  | 'REFUND_ABUSE'
  | 'POINT_ABUSE'
  | 'INTERACTION_FRAUD'
  | 'SUPPLIER_FRAUD'
  | 'CREATOR_FRAUD'
  | 'FALSE_POSITIVE_APPEAL'
  | 'UNKNOWN';

export interface FraudTargetRef {
  targetId: string;
  targetType: FraudTargetType;
}

export interface FraudBoundaryFlags {
  fraudSignalOnly: true;
  businessTruthMutated: false;
  ownerTruthMutatedByFraud: false;
  orderTruthMutated: false;
  paymentTruthMutated: false;
  payoutTruthMutated: false;
  financeTruthMutated: false;
  moderationTruthMutated: false;
  bffTruthMutated: false;
  uiTruthMutated: false;
}

export interface FraudOwnerHandoffEvidence extends FraudBoundaryFlags {
  targetDomain: string;
  targetType: FraudTargetType;
  targetId: string;
  fraudSeverity: FraudSeverity;
  fraudSignalType: FraudSignalType;
  reasonCode: FraudReasonCode;
  correlationId: string;
  idempotencyKey: string;
  decisionStatus: FraudDecisionStatus;
  handoffRequired: boolean;
  ownerHandoffRequired: boolean;
  ownerHandoffNotRequiredReason?: string;
  ownerDomainHandoff: string | null;
  falsePositiveReviewAvailable: true;
  auditEvidenceRequired: true;
  reasonCodeRequired: true;
  actorId?: string;
  systemActorId?: string;
  requestedAt: string;
  createdAt: string;
  riskSignalReferenceId?: string;
}

export interface FraudSignal extends FraudBoundaryFlags {
  fraudSignalId: string;
  target: FraudTargetRef;
  signalType: FraudSignalType;
  severity: FraudSeverity;
  source: FraudSignalSource;
  reasonCode: FraudReasonCode;
  correlationId: string;
  idempotencyKey: string;
  actorId?: string;
  systemActorId?: string;
  requestedAt: string;
  createdAt: string;
  metadata?: Record<string, any>;
  riskSignalReferenceId?: string;
  decisionStatus: FraudDecisionStatus;
  ownerHandoffRequired: boolean;
  ownerDomainHandoff: string | null;
  ownerHandoffEvidence: FraudOwnerHandoffEvidence;
  falsePositiveReviewAvailable: true;
  auditEvidenceRequired: true;
  reasonCodeRequired: true;
  fraudTruthMutated: boolean;
  targetTruthMutated: false;
}

export interface FraudReviewCase extends FraudBoundaryFlags {
  fraudCaseId: string;
  target: FraudTargetRef;
  status: FraudReviewCaseStatus;
  severity: FraudSeverity;
  source: FraudSignalSource;
  signalType: FraudSignalType;
  decision?: FraudReviewDecision;
  reasonCode: FraudReasonCode;
  correlationId: string;
  idempotencyKey: string;
  actorId?: string;
  systemActorId?: string;
  requestedAt: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  fraudSignals: string[];
  riskSignalReferenceId?: string;
  decisionStatus: FraudDecisionStatus;
  ownerHandoffRequired: boolean;
  ownerDomainHandoff: string | null;
  ownerHandoffEvidence: FraudOwnerHandoffEvidence;
  falsePositiveReviewAvailable: true;
  auditEvidenceRequired: true;
  reasonCodeRequired: true;
  fraudTruthMutated: boolean;
  targetTruthMutated: false;
}

export interface FraudFalsePositiveReview extends FraudBoundaryFlags {
  falsePositiveReviewId: string;
  fraudCaseId: string;
  requestedByActorId?: string;
  systemActorId?: string;
  reasonCode: FraudReasonCode;
  correlationId: string;
  idempotencyKey: string;
  requestedAt: string;
  createdAt: string;
  notes?: string;
  decisionStatus: FraudDecisionStatus;
  ownerHandoffEvidence: FraudOwnerHandoffEvidence;
  falsePositiveReviewAvailable: true;
  ownerTruthRestoredByFraud: false;
  auditEvidenceRequired: true;
  reasonCodeRequired: true;
}

export interface CreateFraudSignalCommand {
  target: FraudTargetRef;
  signalType: FraudSignalType;
  severity: FraudSeverity;
  source: FraudSignalSource;
  reasonCode: FraudReasonCode;
  correlationId: string;
  idempotencyKey: string;
  actorId?: string;
  systemActorId?: string;
  requestedAt?: string;
  metadata?: Record<string, any>;
  riskSignalReferenceId?: string;
}

export interface CreateFraudReviewCaseCommand {
  target: FraudTargetRef;
  severity: FraudSeverity;
  source: FraudSignalSource;
  signalType: FraudSignalType;
  reasonCode: FraudReasonCode;
  correlationId: string;
  idempotencyKey: string;
  actorId?: string;
  systemActorId?: string;
  requestedAt?: string;
  notes?: string;
  fraudSignals?: string[];
  riskSignalReferenceId?: string;
}

export interface ReviewFraudCaseCommand {
  fraudCaseId: string;
  decision: FraudReviewDecision;
  reviewerId: string;
  reasonCode: FraudReasonCode;
  correlationId: string;
  idempotencyKey: string;
  requestedAt?: string;
  notes?: string;
}

export interface OwnerDomainFraudReviewCommand extends ReviewFraudCaseCommand {
  ownerDomainInternalOnly?: true;
  deprecatedForOperationalWorkflow?: true;
  operationalIntentOnly?: false;
  enforcementExecuted?: false;
  ownerMutationTruth?: true;
  payoutBlockedTruth?: false;
}

export interface LegacyFraudReviewCommandDeprecated extends ReviewFraudCaseCommand {
  deprecatedForOperationalWorkflow: true;
  internalOnly: true;
  operationalIntentOnly: false;
  enforcementExecuted?: false;
  ownerMutationTruth?: true;
  payoutBlockedTruth?: false;
}

export interface CreateFraudFalsePositiveReviewCommand {
  fraudCaseId: string;
  requestedByActorId?: string;
  systemActorId?: string;
  reasonCode: FraudReasonCode;
  correlationId: string;
  idempotencyKey: string;
  requestedAt?: string;
  notes?: string;
}

export interface FraudMutationResult {
  success: boolean;
  fraudSignalId?: string;
  fraudCaseId?: string;
  falsePositiveReviewId?: string;
  decisionStatus?: FraudDecisionStatus;
  duplicate?: boolean;
  alreadyProcessed?: boolean;
  ownerHandoffEvidence?: FraudOwnerHandoffEvidence;
  auditEvidence?: Record<string, unknown>;
  warnings?: string[];
}
