import { 
  CreateStorePostCommand, 
  StorePostMutationResult, 
  StorePostListResponse,
  StorePostTransitionCommand
} from '@hx/contracts';

const BFF_URL = 'http://localhost:54112';

export async function simulatePostFlow() {
  console.log('\n--- P21 Post Simulation ---');

  // SCENARIO-1 - Create announcement post
  const res1 = await fetch(`${BFF_URL}/post/create`, {
    method: 'POST',
    body: JSON.stringify({
      creatorId: 'c_1',
      storefrontId: 's_1',
      postType: 'ANNOUNCEMENT',
      title: 'Mağaza Açılış Duyurusu',
      body: 'Yeni mağazamızda tüm takipçilere özel %20 indirim!',
      visibility: 'FOLLOWERS_ONLY',
      idempotencyKey: 'idemp_post_1'
    } as CreateStorePostCommand)
  }).then(r => r.json());
  console.log('Scenario 1 (Announcement):', res1.success ? 'SUCCESS' : 'FAILED', res1.post?.status, res1.post?.moderationStatus);

  // SCENARIO-2 - Create product-linked post
  const res2 = await fetch(`${BFF_URL}/post/create`, {
    method: 'POST',
    body: JSON.stringify({
      creatorId: 'c_1',
      storefrontId: 's_1',
      postType: 'PRODUCT_LINKED',
      title: 'Yeni Sezon Ürünü',
      body: 'Bu ürünü kaçırmayın!',
      linkedObject: { objectType: 'PRODUCT', productId: 'p_valid' }
    } as CreateStorePostCommand)
  }).then(r => r.json());
  console.log('Scenario 2 (Product-Linked):', res2.success ? 'SUCCESS' : 'FAILED', res2.post?.linkedObject?.productId);

  // SCENARIO-3 - Duplicate idempotency
  const res3 = await fetch(`${BFF_URL}/post/create`, {
    method: 'POST',
    body: JSON.stringify({
      creatorId: 'c_1',
      storefrontId: 's_1',
      postType: 'ANNOUNCEMENT',
      title: 'Mağaza Açılış Duyurusu',
      body: 'Yeni mağazamızda tüm takipçilere özel %20 indirim!',
      idempotencyKey: 'idemp_post_1'
    } as CreateStorePostCommand)
  }).then(r => r.json());
  console.log('Scenario 3 (Duplicate Idempotency):', res3.post?.postId === res1.post?.postId ? 'SUCCESS (Same ID)' : 'FAILED');

  // SCENARIO-4 - Post list by storefront
  const res4: StorePostListResponse = await fetch(`${BFF_URL}/post/list?storefrontId=s_1`).then(r => r.json());
  console.log('Scenario 4 (Post List):', res4.items.length >= 2 ? `SUCCESS (${res4.items.length} items)` : 'FAILED');

  // SCENARIO-5 - Post transition happy path
  if (res1.post) {
    const postId = res1.post.postId;
    // SUBMITTED -> UNDER_REVIEW
    await fetch(`${BFF_URL}/post/transition`, {
      method: 'POST',
      body: JSON.stringify({ postId, targetStatus: 'UNDER_REVIEW' } as StorePostTransitionCommand)
    });
    // UNDER_REVIEW -> PUBLISHED
    const transRes = await fetch(`${BFF_URL}/post/transition`, {
      method: 'POST',
      body: JSON.stringify({ postId, targetStatus: 'PUBLISHED' } as StorePostTransitionCommand)
    }).then(r => r.json());
    console.log('Scenario 5 (Happy Transition):', transRes.success ? 'SUCCESS' : 'FAILED', transRes.post?.status, transRes.post?.publishedAt ? 'PublishedAt Set' : 'PublishedAt Missing');
  }

  // SCENARIO-6 - Invalid post transition (PUBLISHED -> SUBMITTED)
  if (res1.post) {
    const invRes = await fetch(`${BFF_URL}/post/transition`, {
      method: 'POST',
      body: JSON.stringify({ postId: res1.post.postId, targetStatus: 'SUBMITTED' } as StorePostTransitionCommand)
    }).then(r => r.json());
    console.log('Scenario 6 (Invalid Transition):', !invRes.success && invRes.errors.includes('INVALID_TRANSITION') ? 'SUCCESS (Rejected)' : 'FAILED');
  }

  // SCENARIO-7 - Unknown post
  const res7 = await fetch(`${BFF_URL}/post/post_unknown`).then(r => r.json());
  console.log('Scenario 7 (Unknown Post):', res7.errors?.includes('POST_NOT_FOUND') ? 'SUCCESS (404)' : 'FAILED');
}
