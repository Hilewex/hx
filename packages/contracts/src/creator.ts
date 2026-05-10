export type CreatorActor = {
  actorId: string;
  actorRole: 'CREATOR';
  creatorId: string;
};

export type CreatorActionType =
  | 'UPDATE_STOREFRONT_PROFILE_REQUEST'
  | 'REORDER_STOREFRONT_PRODUCT_REQUEST'
  | 'REQUEST_PRODUCT_MEDIA_REVIEW'
  | 'REQUEST_STORE_CONTENT_REVIEW'
  | 'REQUEST_PRODUCT_VISIBILITY_REVIEW'
  | 'REQUEST_CREATOR_PRICE_WITHIN_ALLOWED_RANGE';

export type CreatorActionTargetType =
  | 'STOREFRONT'
  | 'STOREFRONT_PRODUCT'
  | 'PRODUCT_MEDIA'
  | 'STORE_CONTENT'
  | 'PRODUCT_VISIBILITY'
  | 'CREATOR_PRICE';

export type CreatorPermissionCode =
  | 'CAN_MANAGE_STOREFRONT'
  | 'CAN_REORDER_STOREFRONT_PRODUCTS'
  | 'CAN_REQUEST_PRODUCT_MEDIA_REVIEW'
  | 'CAN_REQUEST_STORE_CONTENT_REVIEW'
  | 'CAN_REQUEST_PRODUCT_VISIBILITY_REVIEW'
  | 'CAN_REQUEST_CREATOR_PRICE_WITHIN_ALLOWED_RANGE';

export interface CreatorScope {
  ownerId: string;
  creatorId: string;
  storefrontId: string;
  scopeId: string;
}

export interface CreatorActionTarget {
  targetType: CreatorActionTargetType;
  targetId: string;
}

export interface CreatorProtectedActionRequest extends CreatorScope, CreatorActionTarget {
  actorId: string;
  actorRole: string;
  actionType: CreatorActionType;
  reasonCode: string;
  correlationId: string;
  idempotencyKey: string;
  requestedAt: string;
  permissionCode?: CreatorPermissionCode;
  metadata?: Record<string, string | number | boolean | null>;
}

export type CreatorActionDecision =
  | 'REJECTED'
  | 'PENDING_OWNER_DOMAIN'
  | 'DUPLICATE_IDEMPOTENCY_KEY';

export interface CreatorProtectedActionEvidence {
  actorId: string;
  creatorId: string;
  storefrontId: string;
  scopeId: string;
  ownerId: string;
  actionType: CreatorActionType;
  targetType: CreatorActionTargetType;
  targetId: string;
  reasonCode: string;
  correlationId: string;
  idempotencyKey: string;
  decision: CreatorActionDecision;
  permissionCode: CreatorPermissionCode | null;
  ownerDomainHandoff: string | null;
  auditRequired: boolean;
  creatorDirectWrite: false;
  ownerTruthMutatedByCreator: false;
  productTruthMutated: false;
  priceTruthMutated: false;
  stockTruthMutated: false;
  mediaTruthMutated: false;
  financeTruthMutated: false;
  payoutTruthMutated: false;
  bffTruthMutated: false;
  uiTruthMutated: false;
  actorSpoofingBlocked: boolean;
  storefrontScopeChecked: boolean;
  ownerScopeChecked: boolean;
  auditEvidenceRequired: true;
  reasonCodeRequired: true;
  permissionChecked: boolean;
  businessTruthMutated: false;
}

export type CreatorActionResult = {
  success: boolean;
  evidence: CreatorProtectedActionEvidence;
  error?: string;
};
