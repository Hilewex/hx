export type AdminActor = {
  actorId: string;
  actorRole: string;
};

export type AdminActionType =
  | 'SUSPEND_CREATOR_REQUEST'
  | 'SUPPLIER_REVIEW_REQUEST'
  | 'MODERATION_REVIEW_REQUEST'
  | 'PAYOUT_HOLD_REQUEST'
  | 'CATALOG_VISIBILITY_REVIEW_REQUEST';

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
