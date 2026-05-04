import { config } from '../config';

const BFF_URL = config.NEXT_PUBLIC_BFF_URL || 'http://localhost:3000';

async function callBff(path: string, method: string, body?: any) {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(`${BFF_URL}${path}`, options);
  return res.json();
}

export async function simulateReviewFlow() {
  console.log('\n--- P22 REVIEW FOUNDATION SIMULATION START ---');

  // SCENARIO-1 — Create review without actor
  console.log('\n[Scenario 1] Create review without actor:');
  const res1 = await callBff('/review/create', 'POST', {
    productTag: { productId: 'p_valid' },
    rating: 5,
    body: 'Great product!'
  });
  console.log('Result:', JSON.stringify(res1));

  // SCENARIO-2 — Create review without product tag
  console.log('\n[Scenario 2] Create review without product tag:');
  const res2 = await callBff('/review/create', 'POST', {
    actorId: 'u_1',
    rating: 5,
    body: 'Great product!'
  });
  console.log('Result:', JSON.stringify(res2));

  // SCENARIO-3 — Create review invalid rating
  console.log('\n[Scenario 3] Create review invalid rating (rating: 6):');
  const res3 = await callBff('/review/create', 'POST', {
    actorId: 'u_1',
    productTag: { productId: 'p_valid' },
    rating: 6,
    body: 'Great product!'
  });
  console.log('Result:', JSON.stringify(res3));

  // SCENARIO-4 — Create review without delivery context
  console.log('\n[Scenario 4] Create review without delivery context:');
  const res4 = await callBff('/review/create', 'POST', {
    actorId: 'u_no_delivery',
    productTag: { productId: 'p_no_delivery' },
    rating: 4,
    body: 'Waiting for delivery check.'
  });
  console.log('Result (Eligibility State):', res4.review?.eligibilitySnapshot?.eligibilityState);
  console.log('Warnings:', res4.warnings);

  // SCENARIO-5 — Create eligible review
  console.log('\n[Scenario 5] Create eligible review:');
  const res5 = await callBff('/review/create', 'POST', {
    actorId: 'u_1',
    productTag: { productId: 'p_1', orderId: 'o_1', orderLineId: 'ol_1' },
    rating: 5,
    body: 'Verified purchase review.',
    eligibilitySnapshot: {
      actorId: 'u_1',
      productId: 'p_1',
      deliveredRequired: true,
      deliveredConfirmed: true,
      eligibilityState: 'ELIGIBLE'
    }
  });
  const reviewId = res5.review?.reviewId;
  console.log('Created Review ID:', reviewId);
  console.log('Trust State:', res5.review?.trustState);

  // SCENARIO-6 — Duplicate actor+product review
  console.log('\n[Scenario 6] Duplicate actor+product review:');
  const res6 = await callBff('/review/create', 'POST', {
    actorId: 'u_1',
    productTag: { productId: 'p_1' },
    rating: 3,
    body: 'Trying to review again.'
  });
  console.log('Result:', JSON.stringify(res6));

  // SCENARIO-7 — Transition happy path
  console.log('\n[Scenario 7] Transition happy path (SUBMITTED -> UNDER_REVIEW -> APPROVED):');
  await callBff('/review/transition', 'POST', { reviewId, targetStatus: 'UNDER_REVIEW' });
  const res7 = await callBff('/review/transition', 'POST', { reviewId, targetStatus: 'APPROVED' });
  console.log('Final Status:', res7.review?.status);
  console.log('Visibility:', res7.review?.visibilityState);
  console.log('Rating Impact Active:', res7.review?.trustMetadata?.ratingImpactActive);
  console.log('Rating Summary Active Count:', res7.ratingSummary?.activeRatingCount);

  // SCENARIO-8 — Update review within edit limit
  console.log('\n[Scenario 8] Update review within edit limit:');
  const res8 = await callBff('/review/update', 'POST', {
    reviewId,
    actorId: 'u_1',
    rating: 4,
    body: 'Updated body within limit.'
  });
  console.log('Edit Count:', res8.review?.editCount);
  console.log('Status after update:', res8.review?.status);
  console.log('Rating Impact Active after update:', res8.review?.trustMetadata?.ratingImpactActive);

  // SCENARIO-9 — Edit limit exceeded
  console.log('\n[Scenario 9] Edit limit exceeded:');
  // Currently editCount is 1. Let's do 2 more successful updates then 1 failing.
  await callBff('/review/update', 'POST', { reviewId, actorId: 'u_1', body: 'Update 2' });
  await callBff('/review/update', 'POST', { reviewId, actorId: 'u_1', body: 'Update 3' });
  const res9 = await callBff('/review/update', 'POST', { reviewId, actorId: 'u_1', body: 'Update 4' });
  console.log('4th Update Result:', JSON.stringify(res9));

  // Approve again for next scenarios
  await callBff('/review/transition', 'POST', { reviewId, targetStatus: 'UNDER_REVIEW' });
  await callBff('/review/transition', 'POST', { reviewId, targetStatus: 'APPROVED' });

  // SCENARIO-10 — Withdraw review
  console.log('\n[Scenario 10] Withdraw review:');
  const res10 = await callBff('/review/transition', 'POST', { reviewId, targetStatus: 'WITHDRAWN' });
  console.log('Visibility State:', res10.review?.visibilityState);
  console.log('Rating Impact Active:', res10.review?.trustMetadata?.ratingImpactActive);

  // Bring back to approved for scenario 11
  await callBff('/review/transition', 'POST', { reviewId: res4.review.reviewId, targetStatus: 'UNDER_REVIEW' });
  await callBff('/review/transition', 'POST', { reviewId: res4.review.reviewId, targetStatus: 'APPROVED' });
  // Note: res4 review was not eligible (verifiedPurchase=false), so ratingImpactActive will be false even if approved.
  // Let's use a new eligible approved review.
  const eligibleReview2Res = await callBff('/review/create', 'POST', {
    actorId: 'u_2',
    productTag: { productId: 'p_1' },
    rating: 5,
    body: 'Another verified purchase.',
    eligibilitySnapshot: { actorId: 'u_2', productId: 'p_1', deliveredRequired: true, deliveredConfirmed: true, eligibilityState: 'ELIGIBLE' }
  });
  const reviewId2 = eligibleReview2Res.review.reviewId;
  await callBff('/review/transition', 'POST', { reviewId: reviewId2, targetStatus: 'UNDER_REVIEW' });
  await callBff('/review/transition', 'POST', { reviewId: reviewId2, targetStatus: 'APPROVED' });

  // SCENARIO-11 — Return impact
  console.log('\n[Scenario 11] Return impact:');
  const res11 = await callBff('/review/return-impact', 'POST', { reviewId: reviewId2, actorId: 'u_2' });
  console.log('Trust State after return:', res11.review?.trustState);
  console.log('Rating Impact Active after return:', res11.review?.trustMetadata?.ratingImpactActive);
  console.log('Verified Label Visible:', res11.review?.trustMetadata?.verifiedPurchaseLabelVisible);

  // SCENARIO-12 — Invalid transition
  console.log('\n[Scenario 12] Invalid transition (SUBMITTED -> APPROVED direct):');
  const newReviewRes = await callBff('/review/create', 'POST', {
    actorId: 'u_3',
    productTag: { productId: 'p_2' },
    rating: 5,
    body: 'New review for testing transition.'
  });
  const res12 = await callBff('/review/transition', 'POST', { reviewId: newReviewRes.review.reviewId, targetStatus: 'APPROVED' });
  console.log('Result:', JSON.stringify(res12));

  // SCENARIO-13 — Unknown review
  console.log('\n[Scenario 13] Unknown review:');
  const res13 = await callBff('/review/unknown_id', 'GET');
  console.log('Result:', JSON.stringify(res13));

  // SCENARIO-14 — Product rating summary
  console.log('\n[Scenario 14] Product rating summary for p_1:');
  const res14 = await callBff('/rating/product/p_1', 'GET');
  console.log('Rating Summary:', JSON.stringify(res14.ratingSummary));

  console.log('\n--- P22 REVIEW FOUNDATION SIMULATION END ---');
}
