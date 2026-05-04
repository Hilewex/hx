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

export async function simulateFollowFlow() {
  console.log('\n--- P25 FOLLOW FOUNDATION SIMULATION START ---');

  // SCENARIO-1 — Unauthenticated follow attempt
  console.log('\n[Scenario 1] Unauthenticated follow attempt:');
  const res1 = await callBff('/follow/creator', 'POST', {
    target: { targetType: 'CREATOR_STOREFRONT', storefrontId: 's_fol_1' }
  });
  console.log('Result:', JSON.stringify(res1)); // Expected 401 via BFF

  // SCENARIO-2 — Follow creator storefront
  console.log('\n[Scenario 2] Follow creator storefront (usr_123):');
  const res2 = await callBff('/follow/creator', 'POST', {
    target: { targetType: 'CREATOR_STOREFRONT', storefrontId: 's_fol_1' }
  }, 'mock-token');
  console.log('Success:', res2.success);
  console.log('State:', res2.state);
  console.log('Warnings:', res2.warnings);

  // SCENARIO-3 — Duplicate follow / Idempotency
  console.log('\n[Scenario 3] Duplicate follow / Idempotency:');
  const idempKey = 'idemp_fol_1';
  const res3_1 = await callBff('/follow/creator', 'POST', {
    target: { targetType: 'CREATOR_STOREFRONT', storefrontId: 's_fol_2' },
    idempotencyKey: idempKey
  }, 'mock-token');
  const res3_2 = await callBff('/follow/creator', 'POST', {
    target: { targetType: 'CREATOR_STOREFRONT', storefrontId: 's_fol_2' },
    idempotencyKey: idempKey
  }, 'mock-token');
  console.log('Same Result (followId):', res3_1.follow?.followId === res3_2.follow?.followId);

  // SCENARIO-4 — Get follow state
  console.log('\n[Scenario 4] Get follow state:');
  const res4 = await callBff('/follow/state?storefrontId=s_fol_1', 'GET', undefined, 'mock-token');
  console.log('Is Following:', res4.isFollowing);
  console.log('State:', res4.state);

  // SCENARIO-5 — List following
  console.log('\n[Scenario 5] List following:');
  const res5 = await callBff('/follow/list', 'GET', undefined, 'mock-token');
  console.log('Following items count:', res5.items?.length);
  console.log('First following storefront ID:', res5.items?.[0]?.target?.storefrontId);

  // SCENARIO-6 — Unfollow creator
  console.log('\n[Scenario 6] Unfollow creator:');
  const res6 = await callBff('/follow/creator/remove', 'POST', {
    target: { storefrontId: 's_fol_1' }
  }, 'mock-token');
  console.log('State after unfollow:', res6.state);

  // SCENARIO-7 — Get state after unfollow
  console.log('\n[Scenario 7] Get state after unfollow:');
  const res7 = await callBff('/follow/state?storefrontId=s_fol_1', 'GET', undefined, 'mock-token');
  console.log('Is Following:', res7.isFollowing);
  console.log('State:', res7.state);

  console.log('\n--- P25 FOLLOW FOUNDATION SIMULATION END ---');
}
