export type UgcContentType = 'USER_PRODUCT_STORY';

export type UgcContentStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'HIDDEN' | 'ARCHIVED';

export type UgcModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type UgcVisibilityState = 'NOT_VISIBLE' | 'VISIBLE' | 'HIDDEN_BY_MODERATION' | 'HIDDEN_BY_RETURN_TRUST_IMPACT' | 'ARCHIVED';

export type UgcTrustState = 'VERIFIED_PURCHASE' | 'TRUST_IMPACT_PENDING' | 'TRUST_REDUCED_AFTER_RETURN' | 'UNVERIFIED';

export type UgcEligibilityState = 'REQUIRES_CHECK' | 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'UNKNOWN';

export type UgcMediaType = 'IMAGE' | 'VIDEO';

export interface UgcMediaRef {
  mediaId: string;
  mediaType: UgcMediaType;
  url?: string;
  thumbnailUrl?: string;
  simulationOnly: true;
}

export interface UgcProductTag {
  productId: string;
  storefrontId?: string;
  orderId?: string;
  orderLineId?: string;
}

export interface UgcEligibilitySnapshot {
  actorId: string;
  productId: string;
  orderId?: string;
  orderLineId?: string;
  deliveredRequired: true;
  deliveredConfirmed: boolean;
  eligibilityState: UgcEligibilityState;
  reason?: string;
}

export interface UgcTrustMetadata {
  verifiedPurchaseLabelVisible: boolean;
  returnedProductTrustImpact: boolean;
  ratingImpactLinked: false;
  autoDeleteOnReturn: false;
  moderationCanHide: true;
}

export interface UgcRecord {
  ugcId: string;
  actorId: string;
  contentType: UgcContentType;
  status: UgcContentStatus;
  moderationStatus: UgcModerationStatus;
  visibilityState: UgcVisibilityState;
  trustState: UgcTrustState;
  productTag: UgcProductTag;
  eligibilitySnapshot: UgcEligibilitySnapshot;
  trustMetadata: UgcTrustMetadata;
  media: UgcMediaRef[];
  caption?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  hiddenAt?: string;
  archivedAt?: string;
  idempotencyKey?: string;
  creatorPost: false;
  supportProcess: false;
  qnaProcess: false;
  errors?: string[];
  warnings?: string[];
}

export interface CreateUserProductStoryCommand {
  actorId: string;
  productTag: UgcProductTag;
  media: UgcMediaRef[];
  caption?: string;
  eligibilitySnapshot?: UgcEligibilitySnapshot;
  idempotencyKey?: string;
}

export interface UgcListQuery {
  actorId?: string;
  productId?: string;
  storefrontId?: string;
  status?: UgcContentStatus;
  visibilityState?: UgcVisibilityState;
  limit?: number;
  cursor?: string;
}

export interface UgcListResponse {
  items: UgcRecord[];
  nextCursor?: string;
  warnings?: string[];
}

export interface UgcTransitionCommand {
  ugcId: string;
  targetStatus: UgcContentStatus;
  actorType?: string;
  actorId?: string;
  reasonCode?: string;
  note?: string;
}

export interface UgcMutationResult {
  success: boolean;
  ugc?: UgcRecord;
  errors?: string[];
  warnings?: string[];
}
