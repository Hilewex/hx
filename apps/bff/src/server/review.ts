import { 
  createReview, 
  updateReview, 
  listReviews, 
  getReviewById, 
  transitionReview, 
  applyReviewReturnImpact, 
  getProductRatingSummary 
} from '@hx/review';
import * as response from './response';
import { requireSocialCustomerActor } from './guards';

const mapErrorToResponse = (error: string, data: any): response.BffResponse => {
  switch (error) {
    case 'REVIEW_NOT_FOUND': return response.notFound('REVIEW_NOT_FOUND', 'Review not found');
    case 'REVIEW_ACTOR_MISMATCH': return response.forbidden('REVIEW_ACTOR_MISMATCH', 'Actor mismatch');
    case 'ACTOR_REQUIRED':
    case 'REVIEW_PRODUCT_TAG_REQUIRED':
    case 'REVIEW_RATING_REQUIRED':
    case 'REVIEW_RATING_INVALID':
    case 'REVIEW_BODY_REQUIRED':
    case 'REVIEW_BODY_TOO_SHORT':
    case 'REVIEW_BODY_TOO_LONG':
    case 'REVIEW_TITLE_TOO_LONG':
    case 'REVIEW_ALREADY_EXISTS_FOR_PRODUCT':
    case 'REVIEW_EDIT_LIMIT_EXCEEDED':
    case 'REVIEW_NOT_ELIGIBLE':
    case 'INVALID_TRANSITION':
      return response.badRequest(error, 'Validation error');
    default: return response.internalError();
  }
};

export const handleCreateReview = async (context: any, body: any) => {
  const guard = requireSocialCustomerActor(context);
  if (!guard.allowed) return guard.response;

  try {
    const result = await createReview({ ...body, actorId: context.actorId });
    if (!result.success) {
      return mapErrorToResponse(result.errors?.[0] || 'FAILED', result);
    }
    return response.created(result);
  } catch (error: any) {
    console.error('[BFF] handleCreateReview error:', error?.stack || error);
    return response.internalError();
  }
};

export const handleUpdateReview = async (context: any, body: any) => {
  const guard = requireSocialCustomerActor(context);
  if (!guard.allowed) return guard.response;

  const result = await updateReview({ ...body, actorId: context.actorId });
  
  if (!result.success) {
    return mapErrorToResponse(result.errors?.[0] || 'FAILED', result);
  }
  return response.ok(result);
};

export const handleListReviews = async (context: any, query: any) => {
  const result = await listReviews(query);
  return response.ok(result);
};

export const handleGetReview = async (context: any, reviewId: string) => {
  const review = await getReviewById(reviewId);
  if (!review) return response.notFound('REVIEW_NOT_FOUND', 'Review not found');
  return response.ok({ success: true, review });
};

export const handleTransitionReview = async (context: any, body: any) => {
  const result = await transitionReview(body);
  if (!result.success) {
    return mapErrorToResponse(result.errors?.[0] || 'FAILED', result);
  }
  return response.ok(result);
};

export const handleApplyReviewReturnImpact = async (context: any, body: any) => {
  const guard = requireSocialCustomerActor(context);
  if (!guard.allowed) return guard.response;

  const result = await applyReviewReturnImpact({ ...body, actorId: context.actorId });
  
  if (!result.success) {
    return mapErrorToResponse(result.errors?.[0] || 'FAILED', result);
  }
  return response.ok(result);
};

export const handleGetProductRatingSummary = async (context: any, productId: string) => {
  const result = await getProductRatingSummary(productId);
  return response.ok({ success: true, ratingSummary: result });
};
