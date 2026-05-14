import { SmokeRunner } from '../types';
import { issueDevAuthToken } from '../auth-utils';

type JsonObject = Record<string, any>;

const json = async (res: Response): Promise<JsonObject> => (await res.json()) as JsonObject;

const assertPendingDomainState = (
  domain: string,
  item: JsonObject,
  allowedInitialStatuses: string[],
) => {
  if (item.moderationStatus !== 'PENDING') {
    return `${domain} moderationStatus expected PENDING, got ${item.moderationStatus}`;
  }
  if (item.status === 'APPROVED' || item.status === 'REJECTED' || item.status === 'PUBLISHED') {
    return `${domain} status must not be directly visible/decided after create, got ${item.status}`;
  }
  if (!allowedInitialStatuses.includes(item.status)) {
    return `${domain} status expected one of ${allowedInitialStatuses.join(', ')}, got ${item.status}`;
  }
  return undefined;
};

export const moderationWorkflowSmoke: SmokeRunner = {
  name: 'moderation-workflow',
  run: async (baseUrl: string) => {
    try {
      const suffix = Date.now();
      const customerActorId = `smoke-mod-customer-${suffix}`;
      const creatorActorId = `smoke-mod-creator-${suffix}`;
      const storefrontId = `store-${suffix}`;
      const productId = `prod-mod-${suffix}`;
      const creatorToken = issueDevAuthToken(creatorActorId, 'CREATOR');
      const customerToken = issueDevAuthToken(customerActorId, 'CUSTOMER');
      const adminToken = issueDevAuthToken('admin-1', 'ADMIN');
      const operatorToken = issueDevAuthToken('operator-1', 'OPERATOR');

      const createCaseBody = {
        target: { targetType: 'STORE_POST', targetId: `arbitrary-${suffix}` },
        source: 'USER_REPORT',
        reasonCodes: ['UNKNOWN']
      };

      const guestCreateRes = await fetch(`${baseUrl}/moderation/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createCaseBody)
      });
      if (guestCreateRes.status !== 401) {
        return { result: 'FAIL', message: `Guest direct moderation create should be 401, got ${guestCreateRes.status}` };
      }

      const customerDirectRes = await fetch(`${baseUrl}/moderation/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify(createCaseBody)
      });
      if (customerDirectRes.status !== 403) {
        return { result: 'FAIL', message: `Customer direct moderation create should be 403, got ${customerDirectRes.status}` };
      }

      const creatorDirectRes = await fetch(`${baseUrl}/moderation/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${creatorToken}`
        },
        body: JSON.stringify(createCaseBody)
      });
      if (creatorDirectRes.status !== 403) {
        return { result: 'FAIL', message: `Creator direct moderation create should be 403, got ${creatorDirectRes.status}` };
      }

      const operatorDirectRes = await fetch(`${baseUrl}/moderation/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${operatorToken}`
        },
        body: JSON.stringify({
          target: { targetType: 'STORE_POST', targetId: `operator-arbitrary-${suffix}` },
          source: 'ADMIN_REVIEW',
          reasonCodes: ['UNKNOWN']
        })
      });
      if (!operatorDirectRes.ok) {
        return { result: 'FAIL', message: `Operator direct moderation create should be accepted, got ${operatorDirectRes.status}` };
      }

      // 1. Creator Post Create -> Should trigger moderation case
      const createPostRes = await fetch(`${baseUrl}/post/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${creatorToken}`
        },
        body: JSON.stringify({
          storefrontId,
          postType: 'ANNOUNCEMENT',
          title: 'Moderation Test Post',
          body: 'Content for moderation check'
        })
      });
      if (!createPostRes.ok) return { result: 'FAIL', message: `Post create failed: ${createPostRes.status}` };
      const postData = (await json(createPostRes)).data;
      const postId = postData.post.postId;
      const postStateError = assertPendingDomainState('Post', postData.post, ['SUBMITTED']);
      if (postStateError) return { result: 'FAIL', message: postStateError };

      // 2. Customer Review Create -> Should trigger moderation case
      const createReviewRes = await fetch(`${baseUrl}/review/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          productTag: { productId },
          rating: 4,
          title: 'Review Mod Test',
          body: 'Review content'
        })
      });
      if (!createReviewRes.ok) return { result: 'FAIL', message: `Review create failed: ${createReviewRes.status}` };
      const reviewData = (await json(createReviewRes)).data;
      const reviewId = reviewData.review.reviewId;
      const reviewStateError = assertPendingDomainState('Review', reviewData.review, ['SUBMITTED']);
      if (reviewStateError) return { result: 'FAIL', message: reviewStateError };

      // 3. Customer UGC Create -> Should trigger moderation case
      const createUgcRes = await fetch(`${baseUrl}/ugc/user-product-story/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          productTag: { productId },
          caption: 'UGC Mod Test',
          media: [{ mediaId: 'ast-mod-1', mediaType: 'IMAGE', simulationOnly: true }]
        })
      });
      if (!createUgcRes.ok) return { result: 'FAIL', message: `UGC create failed: ${createUgcRes.status}` };
      const ugcData = (await json(createUgcRes)).data;
      const ugcId = ugcData.ugc.ugcId;
      const ugcStateError = assertPendingDomainState('UGC', ugcData.ugc, ['SUBMITTED']);
      if (ugcStateError) return { result: 'FAIL', message: ugcStateError };

      // 4. Customer Q&A Question Create -> Should trigger moderation case
      const createQaRes = await fetch(`${baseUrl}/qa/question/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          productTag: { productId },
          body: 'QA Mod Test'
        })
      });
      if (!createQaRes.ok) return { result: 'FAIL', message: `QA create failed: ${createQaRes.status}` };
      const qaData = (await json(createQaRes)).data;
      const questionId = qaData.question.questionId;
      const qaStateError = assertPendingDomainState('QA question', qaData.question, ['SUBMITTED']);
      if (qaStateError) return { result: 'FAIL', message: qaStateError };

      // 5. Admin List Moderation Cases -> Check if cases are created
      // Wait a bit for async-like foundation (though it's direct in our implementation, adding retry logic)
      let cases: any[] = [];
      for (let i = 0; i < 3; i++) {
        const listCasesRes = await fetch(`${baseUrl}/moderation/list`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (!listCasesRes.ok) return { result: 'FAIL', message: `Moderation list failed: ${listCasesRes.status} (URL: ${baseUrl}/moderation/list)` };
        cases = (await json(listCasesRes)).data.items;
        if (cases.length >= 4) break;
        await new Promise(r => setTimeout(r, 500));
      }
      
      const postCase = cases.find((c: any) => c.target.targetId === postId);
      const reviewCase = cases.find((c: any) => c.target.targetId === reviewId);
      const ugcCase = cases.find((c: any) => c.target.targetId === ugcId);
      const qaCase = cases.find((c: any) => c.target.targetId === questionId);

      if (!postCase) return { result: 'FAIL', message: `Moderation case for Post not found. Available: ${cases.map(c => c.target.targetId).join(', ')}` };
      if (!reviewCase) return { result: 'FAIL', message: `Moderation case for Review not found. Available: ${cases.map(c => c.target.targetId).join(', ')}` };
      if (!ugcCase) return { result: 'FAIL', message: `Moderation case for UGC not found. Available: ${cases.map(c => c.target.targetId).join(', ')}` };
      if (!qaCase) return { result: 'FAIL', message: `Moderation case for QA not found. Available: ${cases.map(c => c.target.targetId).join(', ')}` };

      const expectedCases = [
        { label: 'Post', item: postCase, targetType: 'STORE_POST' },
        { label: 'Review', item: reviewCase, targetType: 'REVIEW' },
        { label: 'UGC', item: ugcCase, targetType: 'UGC' },
        { label: 'QA', item: qaCase, targetType: 'QA_QUESTION' },
      ];
      for (const expected of expectedCases) {
        if (expected.item.target.targetType !== expected.targetType) {
          return { result: 'FAIL', message: `${expected.label} targetType expected ${expected.targetType}, got ${expected.item.target.targetType}` };
        }
        if (expected.item.targetTruthMutated !== false) {
          return { result: 'FAIL', message: `${expected.label} case targetTruthMutated should be false` };
        }
      }

      // 6. Admin legacy review route must be isolated; operational flow uses intent only.
      const reviewCaseId = reviewCase.caseId;
      const legacyDecisionRes = await fetch(`${baseUrl}/moderation/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          caseId: reviewCaseId,
          decision: 'APPROVE',
          note: 'Looks good'
        })
      });
      if (legacyDecisionRes.status !== 403) {
        return { result: 'FAIL', message: `Admin legacy moderation review should be internal-only 403, got ${legacyDecisionRes.status}` };
      }

      const intentRes = await fetch(`${baseUrl}/moderation/intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          caseId: reviewCaseId,
          kind: 'review',
          decision: 'APPROVE',
          makerActorId: 'admin-1',
          checkerActorId: 'moderation-checker-1',
          reasonCode: 'POLICY_VIOLATION',
          evidenceRefs: [`review-case-${reviewCaseId}`],
          idempotencyKey: `mod-intent-${suffix}`
        })
      });
      if (!intentRes.ok) return { result: 'FAIL', message: `Moderation intent failed: ${intentRes.status}` };
      const intentData = (await json(intentRes)).data;
      if (intentData.accepted !== true || intentData.boundaryFlags?.enforcementExecuted !== false) {
        return { result: 'FAIL', message: 'Moderation intent must be accepted without enforcement execution' };
      }

      // Re-fetch cases to check status and truth flag. The current BFF route is exact-match for /moderation/get,
      // so list is used here to avoid relying on a query-string route that does not currently match.
      const updatedCasesRes = await fetch(`${baseUrl}/moderation/list`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (!updatedCasesRes.ok) return { result: 'FAIL', message: `Moderation list after review failed: ${updatedCasesRes.status}` };
      const updatedCases = (await json(updatedCasesRes)).data.items;
      const updatedCase = updatedCases.find((c: any) => c.caseId === reviewCaseId);
      if (!updatedCase) return { result: 'FAIL', message: 'Moderation case not found after intent' };
      if (updatedCase.status === 'APPROVED' || updatedCase.status === 'REJECTED' || updatedCase.status === 'RESTRICTED') {
        return { result: 'FAIL', message: `Operational intent must not owner-mutate case status, got ${updatedCase.status}` };
      }
      if (updatedCase.targetTruthMutated !== false) {
        return { result: 'FAIL', message: 'Boundary breach: targetTruthMutated is not false' };
      }

      // 7. Verify no domain owner handoff occurred from the operational intent.
      const reviewGetRes = await fetch(`${baseUrl}/review/${reviewId}`, {
        headers: { 'Authorization': `Bearer ${customerToken}` }
      });
      if (!reviewGetRes.ok) return { result: 'FAIL', message: `Review get failed: ${reviewGetRes.status}` };
      const theReview = (await json(reviewGetRes)).data.review;
      if (!theReview) return { result: 'FAIL', message: 'Created review not found while checking domain truth after moderation intent' };
      if (theReview.moderationStatus !== 'PENDING') {
        return { result: 'FAIL', message: `Operational intent must not approve review owner moderationStatus, got ${theReview.moderationStatus}` };
      }
      if (theReview.status !== 'SUBMITTED') {
        return { result: 'FAIL', message: `Operational intent must not approve review owner status, got ${theReview.status}` };
      }

      return { result: 'PASS', message: 'Moderation workflow, legacy review isolation, and operational intent boundary verified' };
    } catch (error: any) {
      return { result: 'FAIL', message: error.message };
    }
  }
};
