import { 
  ReviewRecord, 
  CreateReviewCommand, 
  UpdateReviewCommand, 
  ReviewListQuery, 
  ReviewTransitionCommand,
  ApplyReviewReturnImpactCommand,
  ReviewMutationResult,
  ReviewRatingSummary,
  ReviewRatingDistribution,
  ReviewStatus,
  ReviewVisibilityState,
  ReviewTrustState,
  ReviewEligibilityState,
  ReviewRatingValue
} from '@hx/contracts';
import { derivePurchaseEligibility, toReviewEligibilitySnapshot } from './eligibility';

interface ReviewStore {
  reviews: Map<string, ReviewRecord>;
  reviewIdempotency: Map<string, string>;
  actorProductIndex: Map<string, string>;
}

const getReviewStore = (): ReviewStore => {
  const root = globalThis as any;
  if (!root.__reviewStore) {
    root.__reviewStore = {
      reviews: new Map(),
      reviewIdempotency: new Map(),
      actorProductIndex: new Map()
    };
  }
  return root.__reviewStore;
};

export const getProductRatingSummary = async (productId: string): Promise<ReviewRatingSummary> => {
  const store = getReviewStore();
  const reviews = Array.from(store.reviews.values()).filter(r => r.productTag.productId === productId);
  
  const activeReviews = reviews.filter(r => 
    r.status === 'APPROVED' && 
    r.visibilityState === 'VISIBLE' && 
    r.trustMetadata.ratingImpactActive
  );

  const approvedVisibleReviews = reviews.filter(r => 
    r.status === 'APPROVED' && 
    r.visibilityState === 'VISIBLE'
  );

  const distribution: ReviewRatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;

  activeReviews.forEach(r => {
    distribution[r.rating]++;
    totalRating += r.rating;
  });

  const activeRatingCount = activeReviews.length;
  const averageRating = activeRatingCount > 0 ? parseFloat((totalRating / activeRatingCount).toFixed(1)) : 0;

  return {
    productId,
    averageRating,
    reviewCount: approvedVisibleReviews.length,
    ratingDistribution: distribution,
    activeRatingCount,
    lastCalculatedAt: new Date().toISOString()
  };
};

export const createReview = async (command: CreateReviewCommand): Promise<ReviewMutationResult> => {
  const store = getReviewStore();

  if (!command.actorId) return { success: false, errors: ['ACTOR_REQUIRED'] };
  if (!command.productTag?.productId) return { success: false, errors: ['REVIEW_PRODUCT_TAG_REQUIRED'] };
  if (command.rating === undefined || command.rating === null) return { success: false, errors: ['REVIEW_RATING_REQUIRED'] };
  if (command.rating < 1 || command.rating > 5) return { success: false, errors: ['REVIEW_RATING_INVALID'] };
  if (!command.body) return { success: false, errors: ['REVIEW_BODY_REQUIRED'] };
  
  if (command.body.length < 5) return { success: false, errors: ['REVIEW_BODY_TOO_SHORT'] };
  if (command.body.length > 1000) return { success: false, errors: ['REVIEW_BODY_TOO_LONG'] };
  if (command.title && command.title.length > 120) return { success: false, errors: ['REVIEW_TITLE_TOO_LONG'] };

  if (command.idempotencyKey && store.reviewIdempotency.has(command.idempotencyKey)) {
    const existingId = store.reviewIdempotency.get(command.idempotencyKey)!;
    return { success: true, review: store.reviews.get(existingId) };
  }

  const actorProductKey = `${command.actorId}:${command.productTag.productId}`;
  if (store.actorProductIndex.has(actorProductKey)) {
    return { success: false, errors: ['REVIEW_ALREADY_EXISTS_FOR_PRODUCT'] };
  }

  const decision = await derivePurchaseEligibility(command.actorId, command.productTag);
  const warnings: string[] = [...decision.warnings];
  if (command.eligibilitySnapshot?.deliveredConfirmed) {
    warnings.push('REQUEST_BODY_ELIGIBILITY_SNAPSHOT_IGNORED');
  }
  const eligibility = toReviewEligibilitySnapshot(command.actorId, command.productTag.productId, decision);

  if (!decision.eligible) {
    return {
      success: false,
      errors: ['REVIEW_NOT_ELIGIBLE', decision.reason || 'ELIGIBILITY_DENIED'],
      warnings
    };
  }

  const reviewId = `rev_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const review: ReviewRecord = {
    reviewId,
    actorId: command.actorId,
    productTag: command.productTag,
    rating: command.rating,
    title: command.title,
    body: command.body,
    status: 'SUBMITTED',
    moderationStatus: 'PENDING',
    visibilityState: 'NOT_VISIBLE',
    trustState: 'VERIFIED_PURCHASE',
    eligibilitySnapshot: eligibility,
    trustMetadata: {
      verifiedPurchaseLabelVisible: true,
      ratingImpactActive: false, // Initially false until approved
      returnedProductTrustImpact: false,
      anonymizationRecommended: false,
      moderationCanHide: true
    },
    editCount: 0,
    maxEditCount: 3,
    createdAt: now,
    updatedAt: now,
    submittedAt: now,
    idempotencyKey: command.idempotencyKey,
    ugcStory: false,
    storePost: false,
    supportProcess: false,
    qnaProcess: false,
    replyThreadEnabled: false,
    errors: [],
    warnings
  };

  store.reviews.set(reviewId, review);
  store.actorProductIndex.set(actorProductKey, reviewId);
  if (command.idempotencyKey) store.reviewIdempotency.set(command.idempotencyKey, reviewId);

  return { success: true, review, warnings };
};

export const updateReview = async (command: UpdateReviewCommand): Promise<ReviewMutationResult> => {
  const store = getReviewStore();
  const review = store.reviews.get(command.reviewId);

  if (!review) return { success: false, errors: ['REVIEW_NOT_FOUND'] };
  if (review.actorId !== command.actorId) return { success: false, errors: ['REVIEW_ACTOR_MISMATCH'] };
  if (review.status === 'ARCHIVED' || review.status === 'WITHDRAWN') return { success: false, errors: ['REVIEW_NOT_EDITABLE'] };
  if (review.editCount >= 3) return { success: false, errors: ['REVIEW_EDIT_LIMIT_EXCEEDED'] };

  if (command.rating !== undefined) {
    if (command.rating < 1 || command.rating > 5) return { success: false, errors: ['REVIEW_RATING_INVALID'] };
    review.rating = command.rating;
  }

  if (command.body !== undefined) {
    if (command.body.length < 5) return { success: false, errors: ['REVIEW_BODY_TOO_SHORT'] };
    if (command.body.length > 1000) return { success: false, errors: ['REVIEW_BODY_TOO_LONG'] };
    review.body = command.body;
  }

  if (command.title !== undefined) {
    if (command.title.length > 120) return { success: false, errors: ['REVIEW_TITLE_TOO_LONG'] };
    review.title = command.title;
  }

  const now = new Date().toISOString();
  review.editCount++;
  review.updatedAt = now;
  review.status = 'SUBMITTED';
  review.moderationStatus = 'PENDING';
  review.visibilityState = 'NOT_VISIBLE';
  review.trustMetadata.ratingImpactActive = false;

  const ratingSummary = await getProductRatingSummary(review.productTag.productId);
  return { success: true, review, ratingSummary };
};

export const listReviews = async (query: ReviewListQuery) => {
  const store = getReviewStore();
  let items = Array.from(store.reviews.values());

  if (query.productId) items = items.filter(r => r.productTag.productId === query.productId);
  if (query.actorId) items = items.filter(r => r.actorId === query.actorId);
  if (query.status) items = items.filter(r => r.status === query.status);
  if (query.visibilityState) items = items.filter(r => r.visibilityState === query.visibilityState);

  items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  let ratingSummary: ReviewRatingSummary | undefined;
  if (query.productId) {
    ratingSummary = await getProductRatingSummary(query.productId);
  }

  return { items, ratingSummary };
};

export const getReviewById = async (reviewId: string) => {
  return getReviewStore().reviews.get(reviewId);
};

export const transitionReview = async (command: ReviewTransitionCommand): Promise<ReviewMutationResult> => {
  const store = getReviewStore();
  const review = store.reviews.get(command.reviewId);

  if (!review) return { success: false, errors: ['REVIEW_NOT_FOUND'] };

  const currentStatus = review.status;
  const targetStatus = command.targetStatus;

  const allowedTransitions: Record<ReviewStatus, ReviewStatus[]> = {
    'SUBMITTED': ['UNDER_REVIEW'],
    'UNDER_REVIEW': ['APPROVED', 'REJECTED'],
    'APPROVED': ['HIDDEN', 'WITHDRAWN', 'ARCHIVED'],
    'REJECTED': ['ARCHIVED'],
    'HIDDEN': ['APPROVED', 'ARCHIVED'],
    'WITHDRAWN': ['ARCHIVED'],
    'ARCHIVED': []
  };

  if (!allowedTransitions[currentStatus]?.includes(targetStatus)) {
    return { success: false, errors: ['INVALID_TRANSITION'], review };
  }

  const now = new Date().toISOString();
  review.status = targetStatus;
  review.updatedAt = now;

  if (targetStatus === 'APPROVED') {
    review.moderationStatus = 'APPROVED';
    review.visibilityState = 'VISIBLE';
    review.approvedAt = now;
    // Apply rating impact only if it's verified purchase and not returned
    if (review.trustState === 'VERIFIED_PURCHASE' && !review.trustMetadata.returnedProductTrustImpact) {
      review.trustMetadata.ratingImpactActive = true;
    } else {
      review.trustMetadata.ratingImpactActive = false;
    }
  } else if (targetStatus === 'REJECTED') {
    review.moderationStatus = 'REJECTED';
    review.visibilityState = 'NOT_VISIBLE';
    review.rejectedAt = now;
    review.rejectionReason = command.note || 'REJECTED_BY_MODERATION';
    review.trustMetadata.ratingImpactActive = false;
  } else if (targetStatus === 'HIDDEN') {
    review.visibilityState = 'HIDDEN_BY_MODERATION';
    review.hiddenAt = now;
    review.trustMetadata.ratingImpactActive = false;
  } else if (targetStatus === 'WITHDRAWN') {
    review.visibilityState = 'WITHDRAWN_BY_USER';
    review.withdrawnAt = now;
    review.trustMetadata.ratingImpactActive = false;
  } else if (targetStatus === 'ARCHIVED') {
    review.visibilityState = 'ARCHIVED';
    review.archivedAt = now;
    review.trustMetadata.ratingImpactActive = false;
  }

  const ratingSummary = await getProductRatingSummary(review.productTag.productId);
  return { success: true, review, ratingSummary };
};

export const applyReviewReturnImpact = async (command: ApplyReviewReturnImpactCommand): Promise<ReviewMutationResult> => {
  const store = getReviewStore();
  const review = store.reviews.get(command.reviewId);

  if (!review) return { success: false, errors: ['REVIEW_NOT_FOUND'] };
  if (command.actorId && review.actorId !== command.actorId) return { success: false, errors: ['REVIEW_ACTOR_MISMATCH'] };

  const now = new Date().toISOString();
  review.trustState = 'TRUST_REDUCED_AFTER_RETURN';
  review.trustMetadata.verifiedPurchaseLabelVisible = false;
  review.trustMetadata.ratingImpactActive = false;
  review.trustMetadata.returnedProductTrustImpact = true;
  review.trustMetadata.anonymizationRecommended = command.anonymizationRecommended ?? true;
  review.returnImpactAppliedAt = now;
  review.updatedAt = now;

  const ratingSummary = await getProductRatingSummary(review.productTag.productId);
  return { success: true, review, ratingSummary };
};
