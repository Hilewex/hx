import { 
  CreateUserProductStoryCommand, 
  UgcMutationResult, 
  UgcListResponse,
  UgcTransitionCommand
} from '@hx/contracts';

const BFF_URL = 'http://localhost:54112';

export async function simulateUgcFlow() {
  console.log('\n--- P21 UGC Simulation ---');

  // SCENARIO-1 - Create user product story without product tag
  const res1 = await fetch(`${BFF_URL}/ugc/user-product-story/create`, {
    method: 'POST',
    body: JSON.stringify({
      actorId: 'u_1',
      media: [{ mediaId: 'm_1', mediaType: 'IMAGE', simulationOnly: true }]
    } as Partial<CreateUserProductStoryCommand>)
  }).then(r => r.json());
  console.log('Scenario 1 (No Product Tag):', !res1.success && res1.errors.includes('UGC_PRODUCT_TAG_REQUIRED') ? 'SUCCESS (Rejected)' : 'FAILED');

  // SCENARIO-2 - Create user product story without order context
  const res2 = await fetch(`${BFF_URL}/ugc/user-product-story/create`, {
    method: 'POST',
    body: JSON.stringify({
      actorId: 'u_1',
      productTag: { productId: 'p_valid' },
      media: [{ mediaId: 'm_1', mediaType: 'IMAGE', simulationOnly: true }],
      caption: 'Harika ürün!',
      idempotencyKey: 'idemp_ugc_1'
    } as CreateUserProductStoryCommand)
  }).then(r => r.json());
  console.log('Scenario 2 (No Order Context):', res2.success && res2.ugc?.eligibilitySnapshot?.eligibilityState === 'REQUIRES_CHECK' ? 'SUCCESS (Requires Check)' : 'FAILED');

  // SCENARIO-3 - Create eligible user product story
  const res3 = await fetch(`${BFF_URL}/ugc/user-product-story/create`, {
    method: 'POST',
    body: JSON.stringify({
      actorId: 'u_1',
      productTag: { productId: 'p_valid', orderId: 'o_1' },
      media: [{ mediaId: 'm_2', mediaType: 'VIDEO', simulationOnly: true }],
      eligibilitySnapshot: {
        actorId: 'u_1',
        productId: 'p_valid',
        deliveredRequired: true,
        deliveredConfirmed: true,
        eligibilityState: 'ELIGIBLE'
      }
    } as CreateUserProductStoryCommand)
  }).then(r => r.json());
  console.log('Scenario 3 (Eligible):', res3.success && res3.ugc?.trustState === 'VERIFIED_PURCHASE' ? 'SUCCESS (Verified)' : 'FAILED');

  // SCENARIO-4 - Duplicate idempotency
  const res4 = await fetch(`${BFF_URL}/ugc/user-product-story/create`, {
    method: 'POST',
    body: JSON.stringify({
      actorId: 'u_1',
      productTag: { productId: 'p_valid' },
      media: [{ mediaId: 'm_1', mediaType: 'IMAGE', simulationOnly: true }],
      idempotencyKey: 'idemp_ugc_1'
    } as CreateUserProductStoryCommand)
  }).then(r => r.json());
  console.log('Scenario 4 (Duplicate Idempotency):', res4.ugc?.ugcId === res2.ugc?.ugcId ? 'SUCCESS (Same ID)' : 'FAILED');

  // SCENARIO-5 - UGC transition happy path (SUBMITTED -> UNDER_REVIEW -> APPROVED)
  if (res3.ugc) {
    const ugcId = res3.ugc.ugcId;
    await fetch(`${BFF_URL}/ugc/transition`, {
      method: 'POST',
      body: JSON.stringify({ ugcId, targetStatus: 'UNDER_REVIEW' } as UgcTransitionCommand)
    });
    const appRes = await fetch(`${BFF_URL}/ugc/transition`, {
      method: 'POST',
      body: JSON.stringify({ ugcId, targetStatus: 'APPROVED' } as UgcTransitionCommand)
    }).then(r => r.json());
    console.log('Scenario 5 (Happy Transition):', appRes.success && appRes.ugc?.visibilityState === 'VISIBLE' ? 'SUCCESS' : 'FAILED');
  }

  // SCENARIO-6 - Reject UGC
  if (res2.ugc) {
    const ugcId = res2.ugc.ugcId;
    await fetch(`${BFF_URL}/ugc/transition`, {
      method: 'POST',
      body: JSON.stringify({ ugcId, targetStatus: 'UNDER_REVIEW' } as UgcTransitionCommand)
    });
    const rejRes = await fetch(`${BFF_URL}/ugc/transition`, {
      method: 'POST',
      body: JSON.stringify({ ugcId, targetStatus: 'REJECTED', note: 'Uygunsuz içerik' } as UgcTransitionCommand)
    }).then(r => r.json());
    console.log('Scenario 6 (Reject UGC):', rejRes.success && rejRes.ugc?.status === 'REJECTED' && rejRes.ugc?.rejectionReason === 'Uygunsuz içerik' ? 'SUCCESS' : 'FAILED');
  }

  // SCENARIO-7 - Invalid UGC transition
  if (res3.ugc) {
    const invRes = await fetch(`${BFF_URL}/ugc/transition`, {
      method: 'POST',
      body: JSON.stringify({ ugcId: res3.ugc.ugcId, targetStatus: 'SUBMITTED' } as UgcTransitionCommand)
    }).then(r => r.json());
    console.log('Scenario 7 (Invalid Transition):', !invRes.success && invRes.errors.includes('INVALID_TRANSITION') ? 'SUCCESS (Rejected)' : 'FAILED');
  }

  // SCENARIO-8 - Unknown UGC
  const res8 = await fetch(`${BFF_URL}/ugc/ugc_unknown`).then(r => r.json());
  console.log('Scenario 8 (Unknown UGC):', res8.errors?.includes('UGC_NOT_FOUND') ? 'SUCCESS (404)' : 'FAILED');
}
