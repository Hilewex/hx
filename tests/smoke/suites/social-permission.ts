import { SmokeRunner } from '../types';
import { getGuestHeaders, getCustomerHeaders, getCreatorHeaders, getAdminHeaders } from '../auth-utils';

export const socialPermissionSmoke: SmokeRunner = {
  name: 'social-permission',
  run: async (baseUrl: string) => {
    try {
      // Setup payload
      const storefrontId = `store-${Date.now()}`;
      const reviewPayload = { productTag: { productId: 'prod-1' }, rating: 5, title: 'Amazing', body: 'Really amazing product' };
      const qaQuestionPayload = { productTag: { productId: 'prod-1' }, body: 'How does this work?' };
      const qaAnswerPayload = { questionId: 'q-1', body: 'This works great.' };
      const followPayload = { target: { targetType: 'CREATOR_STOREFRONT', storefrontId } };
      const ugcPayload = { productTag: { productId: 'prod-1' }, media: [{ mediaId: 'ast-1', mediaType: 'IMAGE', simulationOnly: true }], caption: 'Great product!' };

      // 1. Review Create
      const guestReview = await fetch(`${baseUrl}/review/create`, { method: 'POST', headers: getGuestHeaders(), body: JSON.stringify(reviewPayload) });
      if (guestReview.status !== 401) return { result: 'FAIL', message: `Guest review create should be 401, got ${guestReview.status} ${await guestReview.text()}` };

      const creatorReview = await fetch(`${baseUrl}/review/create`, { method: 'POST', headers: getCreatorHeaders(), body: JSON.stringify(reviewPayload) });
      if (creatorReview.status !== 403) return { result: 'FAIL', message: `Creator review create should be 403, got ${creatorReview.status}` };

      const customerReview = await fetch(`${baseUrl}/review/create`, { method: 'POST', headers: getCustomerHeaders(), body: JSON.stringify(reviewPayload) });
      if (![200, 201, 400].includes(customerReview.status)) return { result: 'FAIL', message: `Customer review create should be success, got ${customerReview.status}` };

      // 2. Q&A Ask Question
      const guestQuestion = await fetch(`${baseUrl}/qa/question/create`, { method: 'POST', headers: getGuestHeaders(), body: JSON.stringify(qaQuestionPayload) });
      if (guestQuestion.status !== 401) return { result: 'FAIL', message: `Guest ask question should be 401, got ${guestQuestion.status}` };

      const creatorQuestion = await fetch(`${baseUrl}/qa/question/create`, { method: 'POST', headers: getCreatorHeaders(), body: JSON.stringify(qaQuestionPayload) });
      if (creatorQuestion.status !== 403) return { result: 'FAIL', message: `Creator ask question should be 403, got ${creatorQuestion.status}` };

      const customerQuestion = await fetch(`${baseUrl}/qa/question/create`, { method: 'POST', headers: getCustomerHeaders(), body: JSON.stringify(qaQuestionPayload) });
      if (![200, 201, 400, 404].includes(customerQuestion.status)) return { result: 'FAIL', message: `Customer ask question should be success, got ${customerQuestion.status}` };

      // 3. Q&A Answer Question
      const customerAnswer = await fetch(`${baseUrl}/qa/answer/create`, { method: 'POST', headers: getCustomerHeaders(), body: JSON.stringify(qaAnswerPayload) });
      if (customerAnswer.status !== 403) return { result: 'FAIL', message: `Customer answer question should be 403, got ${customerAnswer.status}` };

      const creatorAnswer = await fetch(`${baseUrl}/qa/answer/create`, { method: 'POST', headers: getCreatorHeaders(), body: JSON.stringify(qaAnswerPayload) });
      if (creatorAnswer.status !== 403) return { result: 'FAIL', message: `Creator answer question should be 403, got ${creatorAnswer.status}` };

      const adminAnswer = await fetch(`${baseUrl}/qa/answer/create`, { method: 'POST', headers: getAdminHeaders(), body: JSON.stringify(qaAnswerPayload) });
      if (![200, 201, 400, 404].includes(adminAnswer.status)) return { result: 'FAIL', message: `Admin answer question should be success or 404, got ${adminAnswer.status}` };

      // 4. Follow
      const guestFollow = await fetch(`${baseUrl}/follow/creator`, { method: 'POST', headers: getGuestHeaders(), body: JSON.stringify(followPayload) });
      if (guestFollow.status !== 401) return { result: 'FAIL', message: `Guest follow should be 401, got ${guestFollow.status}` };

      const creatorFollow = await fetch(`${baseUrl}/follow/creator`, { method: 'POST', headers: getCreatorHeaders(), body: JSON.stringify(followPayload) });
      if (creatorFollow.status !== 403) return { result: 'FAIL', message: `Creator follow should be 403, got ${creatorFollow.status}` };

      const adminFollow = await fetch(`${baseUrl}/follow/creator`, { method: 'POST', headers: getAdminHeaders(), body: JSON.stringify(followPayload) });
      if (adminFollow.status !== 403) return { result: 'FAIL', message: `Admin follow should be 403, got ${adminFollow.status}` };

      const customerFollow = await fetch(`${baseUrl}/follow/creator`, { method: 'POST', headers: getCustomerHeaders(), body: JSON.stringify(followPayload) });
      if (![200, 201, 400, 404].includes(customerFollow.status)) return { result: 'FAIL', message: `Customer follow should be success, got ${customerFollow.status}` };

      // 5. UGC Create
      const guestUgc = await fetch(`${baseUrl}/ugc/user-product-story/create`, { method: 'POST', headers: getGuestHeaders(), body: JSON.stringify(ugcPayload) });
      if (guestUgc.status !== 401) return { result: 'FAIL', message: `Guest UGC create should be 401, got ${guestUgc.status}` };

      const creatorUgc = await fetch(`${baseUrl}/ugc/user-product-story/create`, { method: 'POST', headers: getCreatorHeaders(), body: JSON.stringify(ugcPayload) });
      if (creatorUgc.status !== 403) return { result: 'FAIL', message: `Creator UGC create should be 403, got ${creatorUgc.status}` };

      const customerUgc = await fetch(`${baseUrl}/ugc/user-product-story/create`, { method: 'POST', headers: getCustomerHeaders(), body: JSON.stringify(ugcPayload) });
      if (![200, 201, 400, 404].includes(customerUgc.status)) return { result: 'FAIL', message: `Customer UGC create should be success, got ${customerUgc.status}` };

      return { result: 'PASS', message: 'All social permission scenarios verified' };
    } catch (error: any) {
      return { result: 'FAIL', message: error.message };
    }
  }
};
