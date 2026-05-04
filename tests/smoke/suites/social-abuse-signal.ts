import { SmokeRunner } from '../types';
import { getCustomerHeaders, getCreatorHeaders, getAdminHeaders, issueDevAuthToken } from '../auth-utils';

export const socialAbuseSignalSmoke: SmokeRunner = {
  name: 'social-abuse-signal',
  run: async (baseUrl: string) => {
    const results: string[] = [];
    const actorId = `cust_abuse_${Date.now()}`;
    const creatorId = `creator_abuse_${Date.now()}`;
    const storefrontId = `store_abuse_${Date.now()}`;
    const productId = `prod_abuse_${Date.now()}`;

    const customerHeaders = getCustomerHeaders(actorId);
    const creatorHeaders = getCreatorHeaders(creatorId);
    const riskOperatorHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${issueDevAuthToken('risk-op-1', 'ADMIN')}`
    };

    try {
      // 1. Review Abuse: Duplicate review attempt
      const reviewBody = {
        productTag: { productId, storefrontId, categoryId: 'cat1' },
        rating: 5,
        title: 'Great product',
        body: 'Love it!'
      };

      // First attempt
      await fetch(`${baseUrl}/review/create`, {
        method: 'POST',
        headers: customerHeaders,
        body: JSON.stringify(reviewBody)
      });

      // Second attempt (duplicate)
      const resDuplicateReview = await fetch(`${baseUrl}/review/create`, {
        method: 'POST',
        headers: customerHeaders,
        body: JSON.stringify(reviewBody)
      });

      if (resDuplicateReview.status === 400) {
        results.push('PASS: Duplicate review blocked');
      } else {
        results.push(`FAIL: Duplicate review not blocked (status: ${resDuplicateReview.status})`);
      }

      // Check Risk Signal for Review
      const resReviewSignal = await fetch(`${baseUrl}/risk/signal/list?targetId=${actorId}&targetType=CUSTOMER`, {
        headers: riskOperatorHeaders
      });
      const reviewSignals = (await resReviewSignal.json()).data;
      const hasReviewSignal = reviewSignals.signals?.some((s: any) => s.reasonCode === 'DUPLICATE_REVIEW_ATTEMPT');
      
      if (hasReviewSignal) {
        results.push('PASS: Risk signal for duplicate review found');
      } else {
        results.push('FAIL: Risk signal for duplicate review NOT found');
      }

      // 2. Follow Abuse: Repeated follow attempt
      const followBody = {
        target: { targetType: 'CREATOR_STOREFRONT', storefrontId }
      };

      // First follow
      await fetch(`${baseUrl}/follow/creator`, {
        method: 'POST',
        headers: customerHeaders,
        body: JSON.stringify(followBody)
      });

      // Repeated follow
      await fetch(`${baseUrl}/follow/creator`, {
        method: 'POST',
        headers: customerHeaders,
        body: JSON.stringify(followBody)
      });

      // Check Risk Signal for Follow
      const resFollowSignal = await fetch(`${baseUrl}/risk/signal/list?targetId=${actorId}&targetType=CUSTOMER`, {
        headers: riskOperatorHeaders
      });
      const followSignals = (await resFollowSignal.json()).data;
      const hasFollowSignal = followSignals.signals?.some((s: any) => s.reasonCode === 'REPEATED_FOLLOW_ATTEMPT');

      if (hasFollowSignal) {
        results.push('PASS: Risk signal for repeated follow found');
      } else {
        results.push('FAIL: Risk signal for repeated follow NOT found');
      }

      // 3. Post Abuse: Spam-like content
      const postBody = {
        storefrontId,
        postType: 'ANNOUNCEMENT',
        title: 'Spam Post Title',
        body: 'This is a spam body content'
      };

      await fetch(`${baseUrl}/post/create`, {
        method: 'POST',
        headers: creatorHeaders,
        body: JSON.stringify(postBody)
      });

      // Check Risk Signal for Post
      const resPostSignal = await fetch(`${baseUrl}/risk/signal/list?targetId=${creatorId}&targetType=CREATOR`, {
        headers: riskOperatorHeaders
      });
      const postSignals = (await resPostSignal.json()).data;
      const hasPostSignal = postSignals.signals?.some((s: any) => s.reasonCode === 'SPAM_LIKE_CONTENT');

      if (hasPostSignal) {
        results.push('PASS: Risk signal for spam post found');
      } else {
        results.push('FAIL: Risk signal for spam post NOT found');
      }

      // 4. UGC Abuse: Spam-like content
      const ugcBody = {
        productTag: { productId, storefrontId },
        caption: 'Spam UGC caption'
      };

      await fetch(`${baseUrl}/ugc/user-product-story/create`, {
        method: 'POST',
        headers: customerHeaders,
        body: JSON.stringify(ugcBody)
      });

      // Check Risk Signal for UGC
      const resUgcSignal = await fetch(`${baseUrl}/risk/signal/list?targetId=${actorId}&targetType=CUSTOMER`, {
        headers: riskOperatorHeaders
      });
      const ugcSignals = (await resUgcSignal.json()).data;
      const hasUgcSignal = ugcSignals.signals?.some((s: any) => s.reasonCode === 'SPAM_LIKE_CONTENT');

      if (hasUgcSignal) {
        results.push('PASS: Risk signal for spam UGC found');
      } else {
        results.push('FAIL: Risk signal for spam UGC NOT found');
      }

      // 5. Q&A Abuse: Repeated question
      const qaBody = {
        productTag: { productId, storefrontId },
        body: 'Is this product good?'
      };

      // First question
      await fetch(`${baseUrl}/qa/question/create`, {
        method: 'POST',
        headers: customerHeaders,
        body: JSON.stringify(qaBody)
      });

      // Repeated question
      await fetch(`${baseUrl}/qa/question/create`, {
        method: 'POST',
        headers: customerHeaders,
        body: JSON.stringify(qaBody)
      });

      // Check Risk Signal for Q&A
      const resQaSignal = await fetch(`${baseUrl}/risk/signal/list?targetId=${actorId}&targetType=CUSTOMER`, {
        headers: riskOperatorHeaders
      });
      const qaSignals = (await resQaSignal.json()).data;
      const hasQaSignal = qaSignals.signals?.some((s: any) => s.reasonCode === 'REPEATED_QUESTION_ATTEMPT');

      if (hasQaSignal) {
        results.push('PASS: Risk signal for repeated Q&A found');
      } else {
        results.push('FAIL: Risk signal for repeated Q&A NOT found');
      }

      // 6. targetTruthMutated validation
      const allSignals = [...reviewSignals.signals, ...followSignals.signals, ...postSignals.signals, ...ugcSignals.signals, ...qaSignals.signals];
      const mutatedTruth = allSignals.some((s: any) => s.targetTruthMutated === true);
      
      if (!mutatedTruth) {
          results.push('PASS: targetTruthMutated=false verified for all signals');
      } else {
          results.push('FAIL: Some signals have targetTruthMutated=true');
      }

      const allPassed = results.every(r => r.startsWith('PASS'));
      return {
        result: allPassed ? 'PASS' : 'FAIL',
        message: results.join(' | ')
      };

    } catch (e: any) {
      return { result: 'FAIL', message: `Test error: ${e.message}` };
    }
  }
};
