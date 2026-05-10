import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { SmokeRunner } from '../types';
import {
  approveStoreStoryModerationResult,
  createStoreStory,
  listPublishedStoreStoriesForPublicStorefront,
  publishStoreStory,
  rejectStoreStoryModerationResult
} from '@hx/store-story';
import {
  approveReviewModerationResult,
  createReview,
  getProductRatingSummary,
  listReviews,
  rejectReviewModerationResult,
  updateReview
} from '@hx/review';
import {
  approveAnswerModerationResult,
  approveQuestionModerationResult,
  createQaAnswer,
  createQaQuestion,
  listQaQuestions,
  rejectAnswerModerationResult,
  rejectQuestionModerationResult
} from '@hx/question-answer';
import { listModerationCases } from '@hx/moderation';
import { StoreStoryErrorCode, StoreStoryStatus, StoreStoryType } from '@hx/contracts';
import { toggleInteraction } from '@hx/interaction';
import { followCreator } from '@hx/follow';

const expect = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

const hasBffPersistenceImport = () => {
  const serverDir = join(process.cwd(), 'apps', 'bff', 'src', 'server');
  return readdirSync(serverDir)
    .filter((name) => name.endsWith('.ts'))
    .some((name) => readFileSync(join(serverDir, name), 'utf8').includes('@hx/persistence'));
};

const findModerationCase = async (targetId: string, targetType: string) => {
  const cases = await listModerationCases({ targetType: targetType as any, limit: 100 as any });
  return cases.items.find((item) => item.target.targetId === targetId);
};

export const storyReviewQaVisibilityGuardSmoke: SmokeRunner = {
  name: 'story-review-qa-visibility-guard',
  run: async () => {
    try {
      const suffix = Date.now();

      const storefrontId = `story-visibility-store-${suffix}`;
      const pendingStory = await createStoreStory(storefrontId, {
        type: StoreStoryType.STORE_INTRO,
        mediaAssetId: `media-pending-${suffix}`,
        mediaVisibilityReady: true
      });
      expect(pendingStory.success && pendingStory.data?.status === StoreStoryStatus.DRAFT, 'Story create did not default to draft');
      expect(pendingStory.data?.moderationStatus === 'PENDING' && pendingStory.data?.visibilityState === 'NOT_VISIBLE', 'Story create did not default to pending/not visible');
      expect((await listPublishedStoreStoriesForPublicStorefront(storefrontId)).data?.length === 0, 'Pending story leaked to public feed');

      await rejectStoreStoryModerationResult(storefrontId, pendingStory.data!.id, 'Smoke reject');
      expect((await listPublishedStoreStoriesForPublicStorefront(storefrontId)).data?.length === 0, 'Rejected story leaked to public feed');

      const visibleStory = await createStoreStory(storefrontId, {
        type: StoreStoryType.STORE_INTRO,
        mediaAssetId: `media-approved-${suffix}`,
        mediaVisibilityReady: true
      });
      await approveStoreStoryModerationResult(storefrontId, visibleStory.data!.id);
      const publishVisible = await publishStoreStory(storefrontId, { storeStoryId: visibleStory.data!.id });
      expect(publishVisible.success && publishVisible.data?.visibilityState === 'VISIBLE', 'Approved story did not publish visible');
      const publicStories = await listPublishedStoreStoriesForPublicStorefront(storefrontId);
      expect(publicStories.data?.some((story) => story.id === visibleStory.data!.id) === true, 'Approved/published story not visible publicly');

      const mediaBlockedStory = await createStoreStory(storefrontId, {
        type: StoreStoryType.STORE_INTRO,
        mediaAssetId: `media-blocked-${suffix}`
      });
      await approveStoreStoryModerationResult(storefrontId, mediaBlockedStory.data!.id);
      const mediaBlockedPublish = await publishStoreStory(storefrontId, { storeStoryId: mediaBlockedStory.data!.id });
      expect(mediaBlockedPublish.success === false && mediaBlockedPublish.error?.code === StoreStoryErrorCode.MEDIA_NOT_VISIBILITY_READY, 'Media-not-approved story publish was not blocked');

      const noAutoStoryStorefrontId = `no-auto-story-${suffix}`;
      expect((await listPublishedStoreStoriesForPublicStorefront(noAutoStoryStorefrontId)).data?.length === 0, 'Delivered eligibility auto-created a story');

      const productId = `review-visibility-product-${suffix}`;
      expect((await listReviews({ productId })).items.length === 0, 'Delivered eligibility auto-created a review');
      const pendingReview = await createReview({
        actorId: `review-actor-${suffix}`,
        productTag: { productId, orderLineId: `order-line-${suffix}` },
        rating: 5,
        body: 'Smoke pending review',
        idempotencyKey: `review-pending-${suffix}`
      });
      expect(pendingReview.success && pendingReview.review?.moderationStatus === 'PENDING' && pendingReview.review.visibilityState === 'NOT_VISIBLE', 'Review create did not default to pending/not visible');
      expect((await listReviews({ productId })).items.length === 0, 'Pending review leaked to public list');
      expect((await getProductRatingSummary(productId)).activeRatingCount === 0, 'Pending review entered rating aggregate');

      await rejectReviewModerationResult(pendingReview.review!.reviewId, 'Smoke reject');
      expect((await listReviews({ productId })).items.length === 0, 'Rejected review leaked to public list');
      expect((await getProductRatingSummary(productId)).activeRatingCount === 0, 'Rejected review entered rating aggregate');

      const approvedReview = await createReview({
        actorId: `review-approved-actor-${suffix}`,
        productTag: { productId, orderLineId: `order-line-approved-${suffix}` },
        rating: 4,
        body: 'Smoke approved review',
        idempotencyKey: `review-approved-${suffix}`
      });
      await approveReviewModerationResult(approvedReview.review!.reviewId);
      const approvedSummary = await getProductRatingSummary(productId);
      expect(approvedSummary.activeRatingCount === 1 && approvedSummary.averageRating === 4, 'Approved visible review did not enter rating aggregate');

      const duplicateReview = await createReview({
        actorId: `review-approved-actor-${suffix}`,
        productTag: { productId, orderLineId: `order-line-approved-${suffix}` },
        rating: 3,
        body: 'Duplicate review',
        idempotencyKey: `review-duplicate-${suffix}`
      });
      expect(duplicateReview.success === false && duplicateReview.errors?.includes('REVIEW_ALREADY_EXISTS_FOR_PRODUCT'), 'Duplicate review was not blocked');
      const wrongActorUpdate = await updateReview({
        actorId: `wrong-review-actor-${suffix}`,
        reviewId: approvedReview.review!.reviewId,
        body: 'Wrong actor edit'
      });
      expect(wrongActorUpdate.success === false && wrongActorUpdate.errors?.includes('REVIEW_ACTOR_MISMATCH'), 'Wrong actor review update was not blocked');

      const qaProductId = `qa-visibility-product-${suffix}`;
      const pendingQuestion = await createQaQuestion({
        actorId: `qa-customer-${suffix}`,
        productTag: { productId: qaProductId },
        body: 'Will this product fit?',
        idempotencyKey: `qa-question-pending-${suffix}`
      });
      expect(Boolean(await findModerationCase(pendingQuestion.question!.questionId, 'QA_QUESTION')), 'Question moderation caseId missing');
      expect((await listQaQuestions({ productId: qaProductId })).items.length === 0, 'Pending question leaked to public list');

      await approveQuestionModerationResult(pendingQuestion.question!.questionId);
      expect((await listQaQuestions({ productId: qaProductId })).items.some((q) => q.questionId === pendingQuestion.question!.questionId), 'Approved question not visible publicly');

      const rejectedQuestion = await createQaQuestion({
        actorId: `qa-customer-rejected-${suffix}`,
        productTag: { productId: qaProductId },
        body: 'Rejected question body',
        idempotencyKey: `qa-question-rejected-${suffix}`
      });
      await rejectQuestionModerationResult(rejectedQuestion.question!.questionId, 'Smoke reject');
      expect(!(await listQaQuestions({ productId: qaProductId })).items.some((q) => q.questionId === rejectedQuestion.question!.questionId), 'Rejected question leaked to public list');

      const pendingAnswer = await createQaAnswer({
        questionId: pendingQuestion.question!.questionId,
        authorType: 'SUPPLIER',
        authorId: `supplier-${suffix}`,
        body: 'Pending answer body',
        idempotencyKey: `qa-answer-pending-${suffix}`
      });
      expect(Boolean(await findModerationCase(pendingAnswer.answer!.answerId, 'QA_ANSWER')), 'Answer moderation caseId missing');
      expect((await listQaQuestions({ productId: qaProductId })).items.find((q) => q.questionId === pendingQuestion.question!.questionId)?.answers.length === 0, 'Pending answer leaked publicly');

      await approveAnswerModerationResult(pendingAnswer.answer!.answerId);
      expect((await listQaQuestions({ productId: qaProductId })).items.find((q) => q.questionId === pendingQuestion.question!.questionId)?.answers.some((a) => a.answerId === pendingAnswer.answer!.answerId), 'Approved answer not visible publicly');

      const rejectedAnswer = await createQaAnswer({
        questionId: pendingQuestion.question!.questionId,
        authorType: 'SUPPLIER',
        authorId: `supplier-rejected-${suffix}`,
        body: 'Rejected answer body',
        idempotencyKey: `qa-answer-rejected-${suffix}`
      });
      await rejectAnswerModerationResult(rejectedAnswer.answer!.answerId, 'Smoke reject');
      expect(!(await listQaQuestions({ productId: qaProductId })).items.find((q) => q.questionId === pendingQuestion.question!.questionId)?.answers.some((a) => a.answerId === rejectedAnswer.answer!.answerId), 'Rejected answer leaked publicly');

      expect(!hasBffPersistenceImport(), 'BFF server imports @hx/persistence directly');

      const interactionTarget = { targetType: 'POST' as const, targetId: `visibility-regression-${suffix}`, targetVisibility: 'PENDING' as const };
      const blockedInteraction = await toggleInteraction({ actorId: `visibility-actor-${suffix}`, target: interactionTarget, actionType: 'LIKE' });
      expect(blockedInteraction.success === false && blockedInteraction.counterDelta === 0, 'Interaction idempotency visibility regression failed');

      const selfFollow = await followCreator({
        actorId: `self-follow-${suffix}`,
        target: { targetType: 'CREATOR_STOREFRONT', storefrontId: `self-follow-${suffix}`, creatorId: `self-follow-${suffix}` }
      });
      expect(selfFollow.success === false && selfFollow.reasonCode === 'SELF_FOLLOW_BLOCKED', 'Actor spoof/follow regression failed');

      return { result: 'PASS', message: 'Story, review, Q&A visibility guards and boundary regressions verified' };
    } catch (error: any) {
      return { result: 'FAIL', message: error.message };
    }
  }
};
