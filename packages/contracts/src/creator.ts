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

export type CreatorProjectionStatus =
  | 'PROJECTED'
  | 'NOT_CONFIGURED'
  | 'PENDING_REVIEW'
  | 'HIDDEN_BY_PROJECTION'
  | 'DEGRADED'
  | 'UNAVAILABLE';

export type CreatorProductProjectionState =
  | 'LISTED_PROJECTION'
  | 'HIDDEN_PROJECTION'
  | 'PENDING_REVIEW_PROJECTION'
  | 'UNAVAILABLE_PROJECTION';

export type CreatorContentProjectionKind = 'STORY' | 'POST' | 'MEDIA';

export type CreatorContentProjectionState =
  | 'DRAFT_PROJECTION'
  | 'PENDING_REVIEW_PROJECTION'
  | 'PUBLISHED_PROJECTION'
  | 'HIDDEN_PROJECTION'
  | 'MEDIA_DEGRADED_PROJECTION';

export interface CreatorContextProjection {
  actorId?: string;
  creatorId?: string;
  storefrontId?: string;
  authenticatedProjection: boolean;
  storefrontOwnerVerifiedProjection?: boolean;
  scopeStatus: CreatorProjectionStatus;
  warnings?: string[];
}

export interface CreatorStorefrontProfileProjection {
  storefrontId?: string;
  displayName?: string;
  slug?: string;
  bio?: string;
  avatarMediaLabel?: string;
  bannerMediaLabel?: string;
  visibilityProjection: CreatorProjectionStatus;
  profileConfiguredProjection: boolean;
  warnings?: string[];
}

export interface CreatorStorefrontStatusProjection {
  status: CreatorProjectionStatus;
  statusText: string;
  visibilityText: string;
  warnings?: string[];
}

export interface CreatorProductManagementItemProjection {
  storefrontProductId: string;
  productId: string;
  title: string;
  contextText?: string;
  displayOrderProjection?: number;
  listedStateProjection: CreatorProductProjectionState;
  activeSellableTruth: false;
  priceTruth: false;
  stockTruth: false;
  warnings?: string[];
}

export interface CreatorProductManagementProjection {
  items: CreatorProductManagementItemProjection[];
  totalProjection?: number;
  emptyState?: boolean;
  warnings?: string[];
}

export interface CreatorContentManagementItemProjection {
  contentId: string;
  kind: CreatorContentProjectionKind;
  title: string;
  statusProjection: CreatorContentProjectionState;
  moderationStatusText?: string;
  publicVisibleTruth: false;
  publishTruth: false;
  moderationDecisionTruth: false;
  mediaProcessingTruth: false;
  warnings?: string[];
}

export interface CreatorContentManagementProjection {
  items: CreatorContentManagementItemProjection[];
  emptyState?: boolean;
  warnings?: string[];
}

export interface CreatorScopeGuidanceProjection {
  surfaceOnlyProjection: true;
  actionsRequireOwnerCommand: true;
  scopeOutsideActionBlockedText: string;
  boundaryTexts: string[];
}

export interface CreatorBoundaryFlagsProjection {
  creatorOwnershipTruth: false;
  permissionTruth: false;
  productBindingTruth: false;
  productAvailabilityTruth: false;
  priceTruth: false;
  stockTruth: false;
  mediaPublishTruth: false;
  moderationDecisionTruth: false;
  payoutSettlementTruth: false;
}

export interface CreatorManagementProjection {
  context: CreatorContextProjection;
  storefront: CreatorStorefrontProfileProjection;
  storefrontStatus: CreatorStorefrontStatusProjection;
  products: CreatorProductManagementProjection;
  content: CreatorContentManagementProjection;
  scopeGuidance: CreatorScopeGuidanceProjection;
  boundaryFlags: CreatorBoundaryFlagsProjection;
  warnings?: string[];
}
