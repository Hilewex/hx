import { config } from '../config';

const BFF_URL = config.NEXT_PUBLIC_BFF_URL || 'http://localhost:3000';

async function callBff(path: string, method: string, body?: any, token?: string) {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  if (token) options.headers = { ...options.headers, 'Authorization': `Bearer ${token}` };
  
  const res = await fetch(`${BFF_URL}${path}`, options);
  return res.json();
}

export async function simulateFollowFeedFlow() {
  console.log('\n--- P25 FOLLOW FEED FOUNDATION SIMULATION START ---');

  const actorToken = 'mock-token'; // usr_123
  const storefrontId = 's_feed_1';
  const creatorId = 'c_feed_1';

  // SCENARIO-1 — Empty feed (no following)
  console.log('\n[Scenario 1] Empty feed (no following):');
  const res1 = await callBff('/feed/following', 'GET', undefined, 'new-actor-token');
  console.log('Empty State Code:', res1.emptyState?.code);
  console.log('Empty State Message:', res1.emptyState?.message);

  // SCENARIO-2 — Setup content and follow
  console.log('\n[Scenario 2] Setup content and follow:');
  
  // 1. Create a post
  console.log('Creating a post...');
  const postRes = await callBff('/post/create', 'POST', {
    creatorId,
    storefrontId,
    postType: 'CAMPAIGN_NEWS',
    title: 'Takipçilere Özel İndirim!',
    body: 'Sadece bizi takip edenlere özel %20 indirim kodunuz: FOLLOW20',
    visibility: 'FOLLOWERS_ONLY'
  }, 'admin-token');
  const postId = postRes.post?.postId;
  console.log('Post created:', postId);

  // 2. Publish the post
  console.log('Publishing the post...');
  await callBff('/post/transition', 'POST', {
    postId,
    targetStatus: 'PUBLISHED'
  }, 'admin-token');

  // 3. Follow the storefront
  console.log('Following storefront...');
  await callBff('/follow/creator', 'POST', {
    target: { targetType: 'CREATOR_STOREFRONT', storefrontId }
  }, actorToken);

  // SCENARIO-3 — Fetch feed
  console.log('\n[Scenario 3] Fetch follow feed:');
  const res3 = await callBff('/feed/following', 'GET', undefined, actorToken);
  console.log('Feed items count:', res3.items?.length);
  if (res3.items?.length > 0) {
    const item = res3.items[0];
    console.log('First item title:', item.title);
    console.log('Source:', item.source);
    console.log('postTruthCopied:', item.postTruthCopied);
    console.log('feedTruth:', item.feedTruth);
  }
  console.log('Warnings:', res3.warnings);

  // SCENARIO-4 — Non-published posts should not appear
  console.log('\n[Scenario 4] Non-published post check:');
  console.log('Creating a draft post...');
  await callBff('/post/create', 'POST', {
    creatorId,
    storefrontId,
    postType: 'STORE_UPDATE',
    title: 'Taslak Paylaşım',
    body: 'Bu henüz yayınlanmadı.',
    visibility: 'FOLLOWERS_ONLY'
  }, 'admin-token');

  const res4 = await callBff('/feed/following', 'GET', undefined, actorToken);
  console.log('Feed items count (should still be 1):', res4.items?.length);

  console.log('\n--- P25 FOLLOW FEED FOUNDATION SIMULATION END ---');
}
