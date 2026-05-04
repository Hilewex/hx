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
  ReviewRatingValue,
  CreateModerationCaseCommand
} from '@hx/contracts';
import { createModerationCase } from '@hx/moderation';
import { createInternalRiskSignal } from '@hx/risk';

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

  if (command.idempotencyKey && store.reviewIdempotency.has(command.idempotencyKey)) {
    const existingId = store.reviewIdempotency.get(command.idempotencyKey)!;
    return { success: true, review: store.reviews.get(existingId) };
  }

  const actorProductKey = `${command.actorId}:${command.productTag.productId}`;
  if (store.actorProductIndex.has(actorProductKey)) {
    // ABUSE SIGNAL: Duplicate review attempt
    try {
      await createInternalRiskSignal({
        targetId: command.actorId!,
        targetType: 'CUSTOMER',
        type: 'SOCIAL_ABUSE',
        level: 'LOW',
        source: 'REVIEW_SERVICE',
        reasonCode: 'DUPLICATE_REVIEW_ATTEMPT',
        metadata: { productId: command.productTag.productId },
        correlationId: command.idempotencyKey
      });
    } catch (e) {
      console.error('[ReviewService] Risk signal failed:', e);
    }
    return { success: false, errors: ['REVIEW_ALREADY_EXISTS_FOR_PRODUCT'] };
  }

  const reviewId = `rev_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  // Foundation: Assume eligible or simple check if needed. 
  // In this package, we keep it simple to restore foundation.
  const review: ReviewRecord = {
    reviewId,
    actorId: command.actorId!,
    productTag: command.productTag,
    rating: command.rating,
    title: command.title,
    body: command.body,
    status: 'SUBMITTED',
    moderationStatus: 'PENDING',
    visibilityState: 'NOT_VISIBLE',
    trustState: 'VERIFIED_PURCHASE',
    eligibilitySnapshot: {
      actorId: command.actorId!,
      productId: command.productTag.productId,
      deliveredRequired: true,
      deliveredConfirmed: true,
      eligibilityState: 'ELIGIBLE',
      reason: 'FOUNDATION_RESTORED',
      orderId: 'sim_order_123'
    },
    trustMetadata: {
      verifiedPurchaseLabelVisible: true,
      ratingImpactActive: false,
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
    warnings: []
  };

  store.reviews.set(reviewId, review);
  store.actorProductIndex.set(actorProductKey, reviewId);
  if (command.idempotencyKey) store.reviewIdempotency.set(command.idempotencyKey, reviewId);

  console.log(`[ReviewService] Review ${reviewId} stored in-memory`);

  // Trigger moderation case creation
  try {
    const modCommand: CreateModerationCaseCommand = {
      target: {
        targetType: 'REVIEW',
        targetId: reviewId,
        ownerActorId: review.actorId,
        productId: review.productTag.productId
      },
      source: 'SYSTEM_RULE',
      riskLevel: 'LOW',
      reasonCodes: ['UNKNOWN'],
      contentText: `${review.title}\n${review.body}`,
      idempotencyKey: command.idempotencyKey ? `mod_review_${command.idempotencyKey}` : undefined
    };
    await createModerationCase(modCommand);
    console.log(`[ReviewService] Moderation case creation triggered for ${reviewId}`);
  } catch (error) {
    console.error('[ReviewService] Failed to create moderation case:', error);
  }

  return { success: true, review };
};

export const approveReviewModerationResult = async (reviewId: string): Promise<ReviewMutationResult> => {
  const store = getReviewStore();
  const review = store.reviews.get(reviewId);
  if (!review) return { success: false, errors: ['REVIEW_NOT_FOUND'] };

  const now = new Date().toISOString();
  review.moderationStatus = 'APPROVED';
  review.status = 'APPROVED';
  review.visibilityState = 'VISIBLE';
  review.approvedAt = now;
  review.updatedAt = now;
  review.trustMetadata.ratingImpactActive = true;

  const ratingSummary = await getProductRatingSummary(review.productTag.productId);
  return { success: true, review, ratingSummary };
};

export const rejectReviewModerationResult = async (reviewId: string, reason?: string): Promise<ReviewMutationResult> => {
  const store = getReviewStore();
  const review = store.reviews.get(reviewId);
  if (!review) return { success: false, errors: ['REVIEW_NOT_FOUND'] };

  const now = new Date().toISOString();
  review.moderationStatus = 'REJECTED';
  review.status = 'REJECTED';
  review.visibilityState = 'NOT_VISIBLE';
  review.rejectedAt = now;
  review.updatedAt = now;
  review.rejectionReason = reason || 'REJECTED_BY_MODERATION';
  review.trustMetadata.ratingImpactActive = false;

  const ratingSummary = await getProductRatingSummary(review.productTag.productId);
  return { success: true, review, ratingSummary };
};

export const updateReview = async (command: UpdateReviewCommand): Promise<ReviewMutationResult> => {
  const store = getReviewStore();
  const review = store.reviews.get(command.reviewId);

  if (!review) return { success: false, errors: ['REVIEW_NOT_FOUND'] };
  if (review.actorId !== command.actorId) return { success: false, errors: ['REVIEW_ACTOR_MISMATCH'] };
  if (review.editCount >= 3) {
    // ABUSE SIGNAL: Review edit limit exceeded
    try {
      await createInternalRiskSignal({
        targetId: command.actorId!,
        targetType: 'CUSTOMER',
        type: 'SOCIAL_ABUSE',
        level: 'LOW',
        source: 'REVIEW_SERVICE',
        reasonCode: 'REVIEW_EDIT_LIMIT_EXCEEDED_ATTEMPT',
        metadata: { reviewId: command.reviewId, editCount: review.editCount },
        correlationId: `edit_limit_${command.reviewId}_${review.editCount}`
      });
    } catch (e) {
      console.error('[ReviewService] Risk signal failed:', e);
    }
    return { success: false, errors: ['REVIEW_EDIT_LIMIT_EXCEEDED'] };
  }

  if (command.rating !== undefined) review.rating = command.rating;
  if (command.body !== undefined) review.body = command.body;
  if (command.title !== undefined) review.title = command.title;

  const now = new Date().toISOString();
  review.editCount++;
  review.updatedAt = now;
  review.status = 'SUBMITTED';
  review.moderationStatus = 'PENDING';
  review.visibilityState = 'NOT_VISIBLE';

  const ratingSummary = await getProductRatingSummary(review.productTag.productId);
  return { success: true, review, ratingSummary };
};

export const listReviews = async (query: ReviewListQuery) => {
  const store = getReviewStore();
  let items = Array.from(store.reviews.values());

  // Public Visibility Guard
  if (query.productId) items = items.filter(r => r.productTag.productId === query.productId);
  if (query.actorId) items = items.filter(r => r.actorId === query.actorId);
  
  if (query.status) {
    items = items.filter(r => r.status === query.status);
  } else {
    // Default public: only APPROVED
    items = items.filter(r => r.status === 'APPROVED');
  }

  // Extra guard for visibility state and moderation
  const isPublic = !query.status || query.status === 'APPROVED';
  if (isPublic) {
    items = items.filter(r => r.visibilityState === 'VISIBLE' && r.moderationStatus === 'APPROVED');
  }

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
    'SUBMITTED': ['UNDER_REVIEW', 'ARCHIVED'],
    'UNDER_REVIEW': ['APPROVED', 'REJECTED', 'ARCHIVED'],
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
    // review.moderationStatus = 'APPROVED'; // HANDENING-06A: Domain should not set approved/rejected directly
    review.visibilityState = 'VISIBLE';
    review.approvedAt = now;
    review.trustMetadata.ratingImpactActive = true;
  } else if (targetStatus === 'REJECTED') {
    // review.moderationStatus = 'REJECTED'; // HANDENING-06A: Domain should not set approved/rejected directly
    review.visibilityState = 'NOT_VISIBLE';
    review.rejectedAt = now;
  }

  const ratingSummary = await getProductRatingSummary(review.productTag.productId);
  return { success: true, review, ratingSummary };
};

export const applyReviewReturnImpact = async (command: ApplyReviewReturnImpactCommand): Promise<ReviewMutationResult> => {
  const store = getReviewStore();
  const review = store.reviews.get(command.reviewId);

  if (!review) return { success: false, errors: ['REVIEW_NOT_FOUND'] };

  const now = new Date().toISOString();
  review.trustState = 'TRUST_REDUCED_AFTER_RETURN';
  review.trustMetadata.ratingImpactActive = false;
  review.trustMetadata.returnedProductTrustImpact = true;
  review.updatedAt = now;

  const ratingSummary = await getProductRatingSummary(review.productTag.productId);
  return { success: true, review, ratingSummary };
};
