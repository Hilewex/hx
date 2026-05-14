export type AdminActor = {
  actorId: string;
  actorRole: string;
};

export type AdminActionType =
  | 'SUSPEND_CREATOR_REQUEST'
  | 'SUPPLIER_REVIEW_REQUEST'
  | 'MODERATION_REVIEW_REQUEST'
  | 'PAYOUT_HOLD_REQUEST'
  | 'CATALOG_VISIBILITY_REVIEW_REQUEST'
  | 'APPROVE_PRODUCT_HANDOFF'
  | 'REJECT_PRODUCT_HANDOFF'
  | 'REQUEST_REVISION_HANDOFF'
  | 'REQUIRE_EVIDENCE_HANDOFF';

export interface AdminProtectedActionRequest {
  actorId: string;
  actorRole: string;
  actionType: AdminActionType;
  targetType: string;
  targetId: string;
  reasonCode: string;
  correlationId: string;
  idempotencyKey: string;
  requestedAt: string;
  scopeId?: string;
  ownerId?: string;
  metadata?: Record<string, unknown>;
}

export type AdminOwnerHandoffStatus =
  | 'ACCEPTED_FOR_OWNER_HANDOFF'
  | 'VALIDATION_FAILED'
  | 'PERMISSION_DENIED'
  | 'EVIDENCE_REQUIRED'
  | 'OWNER_UNAVAILABLE';

export interface AdminProtectedActionResponse {
  success: boolean;
  handoffStatus: AdminOwnerHandoffStatus;
  evidence: AdminProtectedActionEvidence;
  error?: string;
  auditIntent?: {
    intentId: string;
    persisted: false;
    message: string;
  };
}

export interface AdminProtectedActionEvidence {
  actorId: string;
  actionType: AdminActionType;
  targetType: string;
  targetId: string;
  reasonCode: string;
  correlationId: string;
  idempotencyKey: string;
  decision: 'APPROVED' | 'REJECTED' | 'PENDING_OWNER_DOMAIN';
  adminDirectWrite: boolean;
  ownerCommandRequired: boolean;
  ownerTruthMutatedByAdmin: boolean;
  bffTruthMutated: boolean;
  uiTruthMutated: boolean;
  auditEvidenceRequired: boolean;
  reasonCodeRequired: boolean;
  permissionChecked: boolean;
  ownerScopeChecked: boolean;
  businessTruthMutated: boolean;
  ownerDomainHandoff: string | null;
}

export type AdminActionResult = {
  success: boolean;
  evidence: AdminProtectedActionEvidence;
  error?: string;
};

export type AdminPermissionCode = 'ADMIN_WRITE' | 'ADMIN_READ' | 'MODERATOR' | 'SUPER_ADMIN';

export type AdminProjectionScopeStatus = 'PROJECTED' | 'DEGRADED' | 'UNAVAILABLE';

export interface AdminOpsContextProjection {
  actorId: string;
  roleProjection: string;
  opsScopeStatus: AdminProjectionScopeStatus;
  authenticatedProjection: boolean;
}

export interface AdminOpsSummaryProjection {
  productApprovalQueueText: string;
  moderationRiskQueueText: string;
  supportOpsText: string;
  financeOpsText: string;
  auditEvidenceText: string;
}

export interface AdminProductApprovalQueueItemProjection {
  productId: string;
  reviewReference: string;
  title: string;
  supplierNameProjection: string;
  storeContextProjection: string;
  submittedAtProjectionText: string;
  reviewStatusProjection: string;
  riskSignalProjectionText: string;
  moderationSignalProjectionText: string;
  evidenceRequiredProjectionText: string;
  detailHref: string;
  productSubmittedTruth: false;
  productApprovalTruth: false;
  productActivationTruth: false;
  activeSellableTruth: false;
  riskDecisionTruth: false;
  moderationDecisionTruth: false;
  supplierOwnershipTruth: false;
}

export interface AdminProductApprovalQueueProjection {
  items: AdminProductApprovalQueueItemProjection[];
  totalProjection?: number;
  emptyState?: boolean;
  degradedStateText?: string;
  warnings?: string[];
}

export interface AdminProductSubmittedFieldProjection {
  label: string;
  valueProjectionText: string;
}

export interface AdminProductMediaProjection {
  mediaId: string;
  label: string;
  statusProjectionText: string;
  mediaTruth: false;
  rawProviderPayloadIncluded: false;
}

export interface AdminProductApprovalChecklistItemProjection {
  checklistId: string;
  label: string;
  statusProjectionText: string;
  requiredEvidenceProjectionText?: string;
  ownerDecisionTruth: false;
}

export interface AdminAuditEvidenceProjection {
  requiredEvidence: string[];
  missingEvidenceWarnings: string[];
  auditTrailPreview: string[];
  actorReasonPlaceholderText: string;
  auditVisibleTruth: false;
  auditOwnerMutationTruth: false;
  evidenceOwnerMutationTruth: false;
}

export interface AdminOwnerCommandHandoffProjection {
  approvePlaceholderText: string;
  rejectPlaceholderText: string;
  requestRevisionPlaceholderText: string;
  requireEvidencePlaceholderText: string;
  ownerCommandRequired: true;
  directWriteAllowed: false;
  uiMutationTruth: false;
}

export interface AdminProductApprovalDetailProjection {
  productId: string;
  reviewReference: string;
  title: string;
  supplierContextProjectionText: string;
  creatorContextProjectionText?: string;
  categoryTaxonomyProjectionText: string;
  priceSubmittedProjectionText: string;
  stockSubmittedProjectionText: string;
  reviewStatusProjection: string;
  riskSignalProjectionText: string;
  moderationSignalProjectionText: string;
  submittedFields: AdminProductSubmittedFieldProjection[];
  media: AdminProductMediaProjection[];
  checklist: AdminProductApprovalChecklistItemProjection[];
  auditEvidence: AdminAuditEvidenceProjection;
  actionHandoff: AdminOwnerCommandHandoffProjection;
  degradedStateText?: string;
  warnings?: string[];
  productSubmittedTruth: false;
  productApprovalTruth: false;
  productActivationTruth: false;
  activeSellableTruth: false;
  riskDecisionTruth: false;
  moderationDecisionTruth: false;
  supplierOwnershipTruth: false;
  creatorOwnershipTruth: false;
}

export interface AdminScopeGuidanceProjection {
  surfaceOnlyProjection: true;
  actionsRequireOwnerCommand: true;
  scopeOutsideActionBlockedText: string;
  boundaryTexts: string[];
}

export interface AdminBoundaryFlags {
  directWriteTruth: false;
  productApprovalTruth: false;
  productActivationTruth: false;
  activeSellableTruth: false;
  moderationDecisionTruth: false;
  riskDecisionTruth: false;
  supplierCreatorOwnershipTruth: false;
  auditEvidenceMutationTruth: false;
  privateCustomerDataIncluded: false;
  rawProviderPayloadIncluded: false;
  persistenceInternalsIncluded: false;
}

export interface AdminDashboardProjection {
  context: AdminOpsContextProjection;
  opsSummary: AdminOpsSummaryProjection;
  productQueue: AdminProductApprovalQueueProjection;
  moderationRiskQueuePlaceholderText: string;
  supportFinanceOpsPlaceholderText: string;
  auditEvidenceSummaryPlaceholderText: string;
  degradedStateText?: string;
  scopeGuidance: AdminScopeGuidanceProjection;
  boundaryFlags: AdminBoundaryFlags;
  warnings?: string[];
}

export type OperationalQueueDomain = 'refund' | 'moderation' | 'risk';

export type OperationalQueueWorkflowState =
  | 'prepared'
  | 'checker_required'
  | 'checked'
  | 'rejected'
  | 'escalated'
  | 'owner_handoff_pending'
  | 'owner_handoff_ready';

export type OperationalQueuePriority = 'low' | 'medium' | 'high' | 'critical';

export type OperationalQueueSlaState = 'normal' | 'at_risk' | 'overdue' | 'escalated';

export type OperationalQueueEscalationState = 'none' | 'visible' | 'recommended' | 'escalated';

export type OperationalQueueAuditDeliveryState =
  | 'pending'
  | 'processing'
  | 'delivered'
  | 'failed'
  | 'dead_letter'
  | 'unavailable';

export interface OperationalQueueBoundaryFlags {
  ownerTruthMutated: false;
  enforcementExecuted: false;
  payoutBlockedTruth: false;
  refundExecutionTruth: false;
  auditMutationTruth: false;
}

export interface OperationalPriorityProjection {
  priority: OperationalQueuePriority;
  priorityText: string;
  projectionOnly: true;
}

export interface OperationalSlaProjection {
  state: OperationalQueueSlaState;
  ageMinutesProjection: number;
  targetMinutesProjection: number;
  projectionText: string;
  enforcementTriggered: false;
}

export interface OperationalEscalationProjection {
  state: OperationalQueueEscalationState;
  targetProjection?: string;
  visibilityText: string;
  escalationDecisionTruth: false;
}

export interface OperationalAuditStatusProjection {
  deliveryState: OperationalQueueAuditDeliveryState;
  outboxId?: string;
  deliveredAt?: string | null;
  retryCount: number;
  nextRetryAt?: string | null;
  lastError?: string | null;
  deadLetterReason?: string | null;
  lastDeliveryAttemptAt?: string | null;
  leaseOwner?: string | null;
  leaseUntil?: string | null;
  claimedAt?: string | null;
  processingStartedAt?: string | null;
  leaseState?: 'unleased' | 'claimed' | 'expired' | 'released' | 'unavailable';
  processingAgeSeconds?: number | null;
  projectionText: string;
  auditMutationTruth: false;
}

export interface OperationalDeliveryAttemptProjection {
  outboxId: string;
  attemptedAt: string;
  attemptState: 'handoff_simulated' | 'owner_accepted' | 'queued_for_owner' | 'retry_scheduled' | 'dead_lettered';
  retryCount: number;
  lastError?: string | null;
  leaseOwner?: string | null;
  leaseState?: 'unleased' | 'claimed' | 'expired' | 'released' | 'unavailable';
  projectionOnly: true;
  enforcementExecuted: false;
  ownerTruthMutated: false;
  payoutBlockedTruth: false;
  refundExecutionTruth: false;
}

export interface OperationalOutboxDeliveryProjection {
  outboxId: string;
  intentId: string;
  deliveryState: OperationalQueueAuditDeliveryState;
  retryCount: number;
  nextRetryAt?: string | null;
  lastError?: string | null;
  deadLetterReason?: string | null;
  lastDeliveryAttemptAt?: string | null;
  deliveredAt?: string | null;
  leaseOwner?: string | null;
  leaseUntil?: string | null;
  claimedAt?: string | null;
  processingStartedAt?: string | null;
  leaseState?: 'unleased' | 'claimed' | 'expired' | 'released' | 'unavailable';
  processingAgeSeconds?: number | null;
  attempts: OperationalDeliveryAttemptProjection[];
  projectionOnly: true;
  enforcementExecuted: false;
  ownerTruthMutated: false;
  payoutBlockedTruth: false;
  refundExecutionTruth: false;
}

export interface OperationalQueueMakerCheckerSummaryProjection {
  makerActorId: string;
  checkerActorId?: string | null;
  summaryText: string;
  makerCheckerTruth: false;
}

export interface OperationalQueueItemProjection {
  intentId: string;
  domain: OperationalQueueDomain;
  targetId: string;
  actionType: string;
  workflowState: OperationalQueueWorkflowState;
  makerCheckerSummary: OperationalQueueMakerCheckerSummaryProjection;
  reasonCode: string;
  evidenceCount: number;
  priority: OperationalPriorityProjection;
  sla: OperationalSlaProjection;
  escalation: OperationalEscalationProjection;
  auditStatus: OperationalAuditStatusProjection;
  detailHref: string;
  createdAt: string;
  updatedAt: string;
  boundaryFlags: OperationalQueueBoundaryFlags;
  warnings?: string[];
}

export interface OperationalQueueProjection {
  items: OperationalQueueItemProjection[];
  totalProjection: number;
  filters: {
    domain: OperationalQueueDomain | 'all';
    workflowState?: OperationalQueueWorkflowState | 'all';
    priority?: OperationalQueuePriority | 'all';
    search?: string;
  };
  emptyState?: boolean;
  degradedStateText?: string;
  boundaryFlags: OperationalQueueBoundaryFlags;
  warnings?: string[];
}

export interface OperationalQueueDetailProjection extends OperationalQueueItemProjection {
  auditOutboxProjection: OperationalAuditStatusProjection;
  deliveryLifecycleProjection?: OperationalOutboxDeliveryProjection;
  projectionNotes: string[];
}

export interface FinanceOpsBoundaryFlags {
  projectionOnly: true;
  settlementTruthMutated: false;
  payoutTruthMutated: false;
  ledgerTruthMutated: false;
  financeCorrectionTruthMutated: false;
  providerPayoutExecuted: false;
  enforcementExecuted: false;
}

export interface FinanceOpsItemProjection {
  id: string;
  status: string;
  target: string;
  amountText?: string;
  reasonText: string;
  updatedAt?: string;
  flags: string[];
}

export interface FinanceOpsGroupProjection {
  groupId: string;
  title: string;
  totalProjection: number;
  emptyState: boolean;
  items: FinanceOpsItemProjection[];
  degradedStateText?: string;
}

export interface AdminFinanceOpsProjection {
  settlement: FinanceOpsGroupProjection[];
  payout: FinanceOpsGroupProjection[];
  financeCorrection: FinanceOpsGroupProjection[];
  ledger: FinanceOpsGroupProjection;
  reconciliation: FinanceOpsGroupProjection;
  payoutBatchSummary: {
    totalProjection: number;
    blockedOrFailedProjection: number;
    providerExecutionPerformed: false;
  };
  boundaryFlags: FinanceOpsBoundaryFlags;
  emptyState: boolean;
  degradedStateText: string;
  warnings: string[];
}

export interface PayoutCandidateReviewProjection {
  payoutCandidateId: string;
  partyType: string;
  partyId: string;
  amountText: string;
  currency: string;
  sourceRefs: string[];
  blockingReasons: string[];
  warnings: string[];
  reviewStatus: string;
  reviewRequiredReason: string;
  signalSummary: string;
  groupedSourceCount: number;
  blockedByOps: boolean;
  boundaryFlags: {
    payoutExecuted: false;
    providerInstructionCreated: false;
    ledgerEntryCreated: false;
  };
  projectionOnly: true;
}

export interface PayoutCandidateReviewQueueProjection {
  items: PayoutCandidateReviewProjection[];
  totalProjection: number;
  emptyState: boolean;
  degradedStateText: string;
  warnings: string[];
  boundaryFlags: FinanceOpsBoundaryFlags;
}
