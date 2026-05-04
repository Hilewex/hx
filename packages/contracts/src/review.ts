export type ReviewStatus = 
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'HIDDEN'
  | 'ARCHIVED';

export type ReviewModerationStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export type ReviewVisibilityState = 
  | 'NOT_VISIBLE'
  | 'VISIBLE'
  | 'HIDDEN_BY_MODERATION'
  | 'WITHDRAWN_BY_USER'
  | 'ARCHIVED';

export type ReviewTrustState = 
  | 'VERIFIED_PURCHASE'
  | 'TRUST_IMPACT_PENDING'
  | 'TRUST_REDUCED_AFTER_RETURN'
  | 'UNVERIFIED';

export type ReviewEligibilityState = 
  | 'REQUIRES_CHECK'
  | 'ELIGIBLE'
  | 'NOT_ELIGIBLE'
  | 'UNKNOWN';

export type ReviewRatingValue = 1 | 2 | 3 | 4 | 5;

export interface ReviewProductTag {
  productId: string;
  storefrontId?: string;
  orderId?: string;
  orderLineId?: string;
}

export interface ReviewEligibilitySnapshot {
  actorId: string;
  productId: string;
  orderId?: string;
  orderLineId?: string;
  deliveredRequired: true;
  deliveredConfirmed: boolean;
  eligibilityState: ReviewEligibilityState;
  reason?: string;
}

export interface ReviewTrustMetadata {
  verifiedPurchaseLabelVisible: boolean;
  ratingImpactActive: boolean;
  returnedProductTrustImpact: boolean;
  anonymizationRecommended: boolean;
  moderationCanHide: true;
}

export interface ReviewRecord {
  reviewId: string;
  actorId: string;
  productTag: ReviewProductTag;
  rating: ReviewRatingValue;
  title?: string;
  body: string;
  status: ReviewStatus;
  moderationStatus: ReviewModerationStatus;
  visibilityState: ReviewVisibilityState;
  trustState: ReviewTrustState;
  eligibilitySnapshot: ReviewEligibilitySnapshot;
  trustMetadata: ReviewTrustMetadata;
  editCount: number;
  maxEditCount: 3;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  withdrawnAt?: string;
  hiddenAt?: string;
  archivedAt?: string;
  returnImpactAppliedAt?: string;
  idempotencyKey?: string;
  ugcStory: false;
  storePost: false;
  supportProcess: false;
  qnaProcess: false;
  replyThreadEnabled: false;
  errors: string[];
  warnings: string[];
}

export interface ReviewRatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface ReviewRatingSummary {
  productId: string;
  averageRating: number;
  reviewCount: number;
  ratingDistribution: ReviewRatingDistribution;
  activeRatingCount: number;
  lastCalculatedAt: string;
  warnings?: string[];
}

export interface CreateReviewCommand {
  actorId: string;
  productTag: ReviewProductTag;
  rating: ReviewRatingValue;
  title?: string;
  body: string;
  eligibilitySnapshot?: ReviewEligibilitySnapshot;
  idempotencyKey?: string;
}

export interface UpdateReviewCommand {
  reviewId: string;
  actorId: string;
  rating?: ReviewRatingValue;
  title?: string;
  body?: string;
  note?: string;
}

export interface ReviewListQuery {
  productId?: string;
  actorId?: string;
  status?: ReviewStatus;
  visibilityState?: ReviewVisibilityState;
  includeInactiveRatingImpact?: boolean;
  limit?: number;
  cursor?: string;
}

export interface ReviewListResponse {
  items: ReviewRecord[];
  ratingSummary?: ReviewRatingSummary;
  nextCursor?: string;
  warnings?: string[];
}

export interface ReviewTransitionCommand {
  reviewId: string;
  targetStatus: ReviewStatus;
  actorType?: string;
  actorId?: string;
  reasonCode?: string;
  note?: string;
}

export interface ApplyReviewReturnImpactCommand {
  reviewId: string;
  actorId?: string;
  reasonCode?: string;
  anonymizationRecommended?: boolean;
}

export interface ReviewMutationResult {
  success: boolean;
  review?: ReviewRecord;
  ratingSummary?: ReviewRatingSummary;
  errors?: string[];
  warnings?: string[];
}
