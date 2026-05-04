import { SmokeRunner } from '../types';
import { issueDevAuthToken } from '../auth-utils';

type JsonObject = Record<string, any>;

const json = async (res: Response): Promise<JsonObject> => (await res.json()) as JsonObject;

export const socialModerationSmoke: SmokeRunner = {
  name: 'social-moderation',
  run: async (baseUrl: string) => {
    try {
      const suffix = Date.now();
      const customerActorId = `smoke-soc-mod-customer-${suffix}`;
      const creatorActorId = `smoke-soc-mod-creator-${suffix}`;
      const storefrontId = `store-${suffix}`;
      const productId = `prod-soc-mod-${suffix}`;
      const creatorToken = issueDevAuthToken(creatorActorId, 'CREATOR');
      const customerToken = issueDevAuthToken(customerActorId, 'CUSTOMER');
      const adminToken = issueDevAuthToken('admin-1', 'ADMIN');

      // Helper to find a case
      const findCase = async (targetId: string) => {
        const res = await fetch(`${baseUrl}/moderation/list`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const cases = (await json(res)).data.items;
        return cases.find((c: any) => c.target.targetId === targetId);
      };

      // Helper to approve/reject
      const moderate = async (caseId: string, decision: 'APPROVE' | 'REJECT') => {
        await fetch(`${baseUrl}/moderation/review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({ caseId, decision, note: `Smoke ${decision}` })
        });
      };

      // 1. Post Flow
      const createPostRes = await fetch(`${baseUrl}/post/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${creatorToken}`
        },
        body: JSON.stringify({ storefrontId, postType: 'ANNOUNCEMENT', title: 'Mod Post', body: 'Body' })
      });
      const postId = (await json(createPostRes)).data.post.postId;

      // Public list should not show it
      const postList1 = (await json(await fetch(`${baseUrl}/post/list?storefrontId=${storefrontId}`))).data.items;
      if (postList1.some((p: any) => p.postId === postId)) return { result: 'FAIL', message: 'Pending Post visible in public list' };

      // Approve it
      const postCase = await findCase(postId);
      await moderate(postCase.caseId, 'APPROVE');

      // Public list should show it
      const postList2 = (await json(await fetch(`${baseUrl}/post/list?storefrontId=${storefrontId}`))).data.items;
      if (!postList2.some((p: any) => p.postId === postId)) return { result: 'FAIL', message: 'Approved Post not visible in public list' };

      // 2. Review Flow
      const createReviewRes = await fetch(`${baseUrl}/review/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({ productTag: { productId }, rating: 5, body: 'Review' })
      });
      const reviewId = (await json(createReviewRes)).data.review.reviewId;

      // Public list should not show it
      const revList1 = (await json(await fetch(`${baseUrl}/review/list?productId=${productId}`))).data.items;
      if (revList1.some((r: any) => r.reviewId === reviewId)) return { result: 'FAIL', message: 'Pending Review visible in public list' };

      // Reject it
      const reviewCase = await findCase(reviewId);
      await moderate(reviewCase.caseId, 'REJECT');

      // Public list should still not show it
      const revList2 = (await json(await fetch(`${baseUrl}/review/list?productId=${productId}`))).data.items;
      if (revList2.some((r: any) => r.reviewId === reviewId)) return { result: 'FAIL', message: 'Rejected Review visible in public list' };

      // 3. UGC Flow
      const createUgcRes = await fetch(`${baseUrl}/ugc/user-product-story/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({ productTag: { productId }, caption: 'UGC', media: [{ mediaId: 'm1', mediaType: 'IMAGE', simulationOnly: true }] })
      });
      const ugcId = (await json(createUgcRes)).data.ugc.ugcId;

      // Public list should not show it
      const ugcList1 = (await json(await fetch(`${baseUrl}/ugc/list?productId=${productId}`))).data.items;
      if (ugcList1.some((u: any) => u.ugcId === ugcId)) return { result: 'FAIL', message: 'Pending UGC visible in public list' };

      // Approve it
      const ugcCase = await findCase(ugcId);
      await moderate(ugcCase.caseId, 'APPROVE');

      // Public list should show it
      const ugcList2 = (await json(await fetch(`${baseUrl}/ugc/list?productId=${productId}`))).data.items;
      if (!ugcList2.some((u: any) => u.ugcId === ugcId)) return { result: 'FAIL', message: 'Approved UGC not visible in public list' };

      // 4. Q&A Flow
      const createQaRes = await fetch(`${baseUrl}/qa/question/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({ productTag: { productId }, body: 'Question' })
      });
      const questionId = (await json(createQaRes)).data.question.questionId;

      // Public list should not show it
      const qaList1 = (await json(await fetch(`${baseUrl}/qa/question/list?productId=${productId}`))).data.items;
      if (qaList1.some((q: any) => q.questionId === questionId)) return { result: 'FAIL', message: 'Pending Question visible in public list' };

      // Reject it
      const qaCase = await findCase(questionId);
      await moderate(qaCase.caseId, 'REJECT');

      // Public list should still not show it
      const qaList2 = (await json(await fetch(`${baseUrl}/qa/question/list?productId=${productId}`))).data.items;
      if (qaList2.some((q: any) => q.questionId === questionId)) return { result: 'FAIL', message: 'Rejected Question visible in public list' };

      return { result: 'PASS', message: 'Social moderation enforcement verified' };
    } catch (error: any) {
      return { result: 'FAIL', message: error.message };
    }
  }
};
