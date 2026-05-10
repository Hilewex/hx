import { SmokeRunner } from '../types';
import { issueDevAuthToken } from '../auth-utils';

export const socialSmoke: SmokeRunner = {
  name: 'social',
  run: async (baseUrl: string) => {
    try {
      const actorId = `smoke-social-${Date.now()}`;
      const storefrontId = `store-${Date.now()}`;
      const creatorToken = issueDevAuthToken(actorId, 'CREATOR');
      const customerToken = issueDevAuthToken(actorId, 'CUSTOMER');
      const adminToken = issueDevAuthToken('admin-1', 'ADMIN');

      const approveModerationCase = async (targetId: string, targetType?: string) => {
        const params = new URLSearchParams({ limit: '100' });
        if (targetType) params.set('targetType', targetType);
        const listRes = await fetch(`${baseUrl}/moderation/list?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (!listRes.ok) {
          return `GET /moderation/list failed: ${listRes.status}`;
        }
        const cases = (await listRes.json()).data?.items || [];
        const moderationCase = cases.find((item: any) => item.target?.targetId === targetId);
        if (!moderationCase?.caseId) {
          return `Moderation case not found for target ${targetId}`;
        }
        const reviewRes = await fetch(`${baseUrl}/moderation/review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({ caseId: moderationCase.caseId, decision: 'APPROVE', note: 'Smoke approve' })
        });
        if (!reviewRes.ok) {
          return `POST /moderation/review failed: ${reviewRes.status}`;
        }
        return undefined;
      };

      // 1. Post Creation
      const createPostRes = await fetch(`${baseUrl}/post/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${creatorToken}`
        },
        body: JSON.stringify({
          storefrontId,
          postType: 'ANNOUNCEMENT',
          title: 'Smoke Test Post',
          body: 'This is a smoke test post content',
          visibility: 'FOLLOWERS_ONLY'
        })
      });

      if (!createPostRes.ok) {
        return { result: 'FAIL', message: `POST /post/create failed: ${createPostRes.status} ${await createPostRes.text()}` };
      }
      const postData: any = await createPostRes.json();
      const postId = postData.data?.post?.postId;
      if (!postId) return { result: 'FAIL', message: `POST /post/create missing postId: ${JSON.stringify(postData)}` };

      const approvePostError = await approveModerationCase(postId, 'STORE_POST');
      if (approvePostError) return { result: 'FAIL', message: approvePostError };

      // 2. UGC Creation
      const createUgcRes = await fetch(`${baseUrl}/ugc/user-product-story/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          productTag: { productId: 'prod-1' },
          media: [{ mediaId: 'ast-1', mediaType: 'IMAGE', simulationOnly: true }],
          caption: 'Great product!'
        })
      });
      if (!createUgcRes.ok) return { result: 'FAIL', message: `POST /ugc/user-product-story/create failed: ${createUgcRes.status}` };

      // 3. Follow Feed
      // First follow the store
      await fetch(`${baseUrl}/follow/creator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          target: { targetType: 'CREATOR_STOREFRONT', storefrontId }
        })
      });

      const feedRes = await fetch(`${baseUrl}/feed/following`, {
        headers: {
          'Authorization': `Bearer ${customerToken}`
        }
      });
      if (!feedRes.ok) return { result: 'FAIL', message: `GET /feed/following failed: ${feedRes.status}` };
      const feedData: any = await feedRes.json();
      
      const hasPost = feedData.data?.items?.some((item: any) => item.postId === postId);
      if (!hasPost) return { result: 'FAIL', message: 'Post not found in follow feed' };

      // 4. Review
      const createReviewRes = await fetch(`${baseUrl}/review/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          productTag: { productId: 'prod-1' },
          rating: 5,
          title: 'Amazing',
          body: 'Really amazing product'
        })
      });
      if (!createReviewRes.ok) return { result: 'FAIL', message: `POST /review/create failed: ${createReviewRes.status}` };

      // 5. QA
      const createQaRes = await fetch(`${baseUrl}/qa/question/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          productTag: { productId: 'prod-1' },
          body: 'How does this work?'
        })
      });
      if (!createQaRes.ok) return { result: 'FAIL', message: `POST /qa/question/create failed: ${createQaRes.status}` };

      return { result: 'PASS', message: 'All social domain operations verified' };
    } catch (error: any) {
      return { result: 'FAIL', message: error.message };
    }
  }
};
