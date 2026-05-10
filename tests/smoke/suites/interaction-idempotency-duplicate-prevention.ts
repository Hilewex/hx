import { SmokeRunner } from '../types';
import {
  getInteractionCounterSummary,
  recordShareInteraction,
  removeInteraction,
  toggleInteraction
} from '@hx/interaction';
import { followCreator, unfollowCreator } from '@hx/follow';
import { InteractionTargetRef } from '@hx/contracts';

const expect = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

export const interactionIdempotencyDuplicatePreventionSmoke: SmokeRunner = {
  name: 'interaction-idempotency-duplicate-prevention',
  run: async () => {
    try {
      const suffix = Date.now();
      const actorId = `smoke-int-actor-${suffix}`;
      const target: InteractionTargetRef = {
        targetType: 'POST',
        targetId: `smoke-post-${suffix}`,
        targetVisibility: 'PUBLIC'
      };

      const firstLike = await toggleInteraction({ actorId, target, actionType: 'LIKE' });
      expect(firstLike.success && firstLike.applied === true && firstLike.counterDelta === 1, 'First like did not apply with delta 1');
      expect(firstLike.interaction?.contentTruthMutated === false, 'Interaction mutated content truth');

      const duplicateLike = await toggleInteraction({ actorId, target, actionType: 'LIKE' });
      expect(duplicateLike.success && duplicateLike.idempotentReplay === true && duplicateLike.counterDelta === 0, 'Duplicate like was not idempotent delta 0');
      expect(duplicateLike.counters?.likeCount === 1, 'Duplicate like inflated like count');

      const unlike = await removeInteraction({ actorId, target, actionType: 'LIKE' });
      expect(unlike.success && unlike.applied === true && unlike.counterDelta === -1, 'Unlike existing did not apply with delta -1');

      const unlikeAgain = await removeInteraction({ actorId, target, actionType: 'LIKE' });
      expect(unlikeAgain.success && unlikeAgain.idempotentReplay === true && unlikeAgain.counterDelta === 0, 'Unlike non-existing was not idempotent delta 0');

      const firstSave = await toggleInteraction({ actorId, target, actionType: 'SAVE' });
      expect(firstSave.success && firstSave.counterDelta === 1, 'First save did not apply with delta 1');

      const duplicateSave = await toggleInteraction({ actorId, target, actionType: 'SAVE' });
      expect(duplicateSave.success && duplicateSave.idempotentReplay === true && duplicateSave.counterDelta === 0, 'Duplicate save was not idempotent delta 0');
      expect(duplicateSave.counters?.saveCount === 1, 'Duplicate save inflated save count');

      const firstShare = await recordShareInteraction({ actorId, target });
      expect(firstShare.success && firstShare.counterDelta === 1, 'First share did not apply with delta 1');

      const duplicateShare = await recordShareInteraction({ actorId, target });
      expect(duplicateShare.success && duplicateShare.idempotentReplay === true && duplicateShare.counterDelta === 0, 'Duplicate share was not idempotent delta 0');
      expect(duplicateShare.counters?.shareCount === 1, 'Duplicate share inflated share count');

      for (const targetVisibility of ['PENDING', 'REJECTED', 'HIDDEN', 'REMOVED', undefined] as const) {
        const blockedTarget: InteractionTargetRef = {
          targetType: 'POST',
          targetId: `blocked-${targetVisibility || 'unknown'}-${suffix}`,
          ...(targetVisibility ? { targetVisibility } : {})
        };
        const blocked = await toggleInteraction({ actorId, target: blockedTarget, actionType: 'LIKE' });
        expect(blocked.success === false && blocked.counterDelta === 0 && blocked.targetVisibilityAccepted === false, `${targetVisibility || 'UNKNOWN'} target was not blocked`);
      }

      const counters = await getInteractionCounterSummary(target.targetType, target.targetId);
      expect(counters.likeCount === 0 && counters.saveCount === 1 && counters.shareCount === 1, 'Final interaction counters are not deterministic');
      expect(target.targetVisibility === 'PUBLIC', 'Interaction mutated target visibility input');

      const followTarget = {
        targetType: 'CREATOR_STOREFRONT' as const,
        storefrontId: `store-${suffix}`,
        creatorId: `creator-${suffix}`
      };

      const firstFollow = await followCreator({ actorId, target: followTarget });
      expect(firstFollow.success && firstFollow.applied === true && firstFollow.counterDelta === 1, 'First follow did not apply with delta 1');
      expect(firstFollow.follow?.postTruthMutated === false && firstFollow.follow?.interactionTruthMutated === false, 'Follow mutated content or interaction truth');

      const duplicateFollow = await followCreator({ actorId, target: followTarget });
      expect(duplicateFollow.success && duplicateFollow.idempotentReplay === true && duplicateFollow.counterDelta === 0, 'Duplicate follow was not idempotent delta 0');

      const unfollow = await unfollowCreator({ actorId, target: { storefrontId: followTarget.storefrontId } });
      expect(unfollow.success && unfollow.applied === true && unfollow.counterDelta === -1, 'Unfollow existing did not apply with delta -1');

      const unfollowAgain = await unfollowCreator({ actorId, target: { storefrontId: followTarget.storefrontId } });
      expect(unfollowAgain.success && unfollowAgain.idempotentReplay === true && unfollowAgain.counterDelta === 0, 'Unfollow non-existing was not idempotent delta 0');

      const selfFollow = await followCreator({
        actorId,
        target: { targetType: 'CREATOR_STOREFRONT', storefrontId: actorId, creatorId: actorId }
      });
      expect(selfFollow.success === false && selfFollow.reasonCode === 'SELF_FOLLOW_BLOCKED', 'Self-follow was not blocked');

      return { result: 'PASS', message: 'Interaction and follow idempotency duplicate prevention verified' };
    } catch (error: any) {
      return { result: 'FAIL', message: error.message };
    }
  }
};
