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

export async function simulateInteractionFlow() {
  console.log('\n--- P24 INTERACTION FOUNDATION SIMULATION START ---');

  // SCENARIO-1 — Toggle without actor
  console.log('\n[Scenario 1] Toggle without actor:');
  const res1 = await callBff('/interaction/toggle', 'POST', {
    target: { targetType: 'PRODUCT', targetId: 'p_int_1' },
    actionType: 'LIKE'
  });
  console.log('Result:', JSON.stringify(res1));

  // SCENARIO-2 — Toggle without target
  console.log('\n[Scenario 2] Toggle without target:');
  const res2 = await callBff('/interaction/toggle', 'POST', {
    actorId: 'u_int_1',
    actionType: 'LIKE'
  });
  console.log('Result:', JSON.stringify(res2));

  // SCENARIO-3 — Like product
  console.log('\n[Scenario 3] Like product:');
  const res3 = await callBff('/interaction/toggle', 'POST', {
    actorId: 'u_int_1',
    target: { targetType: 'PRODUCT', targetId: 'p_int_1' },
    actionType: 'LIKE'
  });
  console.log('State:', res3.state);
  console.log('Like Count:', res3.counters?.likeCount);

  // SCENARIO-4 — Toggle same like removes it
  console.log('\n[Scenario 4] Toggle same like removes it:');
  const res4 = await callBff('/interaction/toggle', 'POST', {
    actorId: 'u_int_1',
    target: { targetType: 'PRODUCT', targetId: 'p_int_1' },
    actionType: 'LIKE'
  });
  console.log('State after toggle:', res4.state);
  console.log('Like Count:', res4.counters?.likeCount);

  // SCENARIO-5 — Save product
  console.log('\n[Scenario 5] Save product:');
  const res5 = await callBff('/interaction/toggle', 'POST', {
    actorId: 'u_int_1',
    target: { targetType: 'PRODUCT', targetId: 'p_int_1' },
    actionType: 'SAVE'
  });
  console.log('State:', res5.state);
  console.log('Visibility:', res5.interaction?.visibility);
  console.log('Save Count:', res5.counters?.saveCount);

  // SCENARIO-6 — List actor saved products
  console.log('\n[Scenario 6] List actor saved products:');
  const res6 = await callBff('/interaction/list?actorId=u_int_1&actionType=SAVE&targetType=PRODUCT', 'GET');
  console.log('Saved items count:', res6.items?.length);
  console.log('First saved target ID:', res6.items?.[0]?.target?.targetId);

  // SCENARIO-7 — Share product
  console.log('\n[Scenario 7] Share product:');
  const res7 = await callBff('/interaction/share', 'POST', {
    actorId: 'u_int_1',
    target: { targetType: 'PRODUCT', targetId: 'p_int_1' }
  });
  console.log('Share Count:', res7.counters?.shareCount);
  console.log('Warnings:', res7.warnings);

  // SCENARIO-8 — Helpful review
  console.log('\n[Scenario 8] Helpful review:');
  const res8 = await callBff('/interaction/toggle', 'POST', {
    actorId: 'u_int_2',
    target: { targetType: 'REVIEW', targetId: 'rev_1' },
    actionType: 'HELPFUL'
  });
  console.log('State:', res8.state);
  console.log('Helpful Count:', res8.counters?.helpfulCount);

  // SCENARIO-9 — Invalid helpful target
  console.log('\n[Scenario 9] Invalid helpful target (HELPFUL PRODUCT):');
  const res9 = await callBff('/interaction/toggle', 'POST', {
    actorId: 'u_int_2',
    target: { targetType: 'PRODUCT', targetId: 'p_int_1' },
    actionType: 'HELPFUL'
  });
  console.log('Result:', JSON.stringify(res9));

  // SCENARIO-10 — Vote up Q&A answer
  console.log('\n[Scenario 10] Vote up Q&A answer:');
  const res10 = await callBff('/interaction/toggle', 'POST', {
    actorId: 'u_int_3',
    target: { targetType: 'QA_ANSWER', targetId: 'ans_1' },
    actionType: 'VOTE_UP'
  });
  console.log('Vote Up Count:', res10.counters?.voteUpCount);

  // SCENARIO-11 — Vote down same Q&A answer
  console.log('\n[Scenario 11] Vote down same Q&A answer (Mutual Exclusion):');
  const res11 = await callBff('/interaction/toggle', 'POST', {
    actorId: 'u_int_3',
    target: { targetType: 'QA_ANSWER', targetId: 'ans_1' },
    actionType: 'VOTE_DOWN'
  });
  console.log('Vote Up Count:', res11.counters?.voteUpCount);
  console.log('Vote Down Count:', res11.counters?.voteDownCount);

  // SCENARIO-12 — Get interaction state
  console.log('\n[Scenario 12] Get interaction state for p_int_1:');
  const res12 = await callBff('/interaction/state?actorId=u_int_1&targetType=PRODUCT&targetId=p_int_1', 'GET');
  console.log('Counters:', JSON.stringify(res12.counters));
  console.log('Actor State:', JSON.stringify(res12.actorState));

  // SCENARIO-13 — Idempotency
  console.log('\n[Scenario 13] Idempotency:');
  const idempKey = 'idemp_int_1';
  const res13_1 = await callBff('/interaction/toggle', 'POST', {
    actorId: 'u_int_4',
    target: { targetType: 'PRODUCT', targetId: 'p_int_2' },
    actionType: 'LIKE',
    idempotencyKey: idempKey
  });
  const res13_2 = await callBff('/interaction/toggle', 'POST', {
    actorId: 'u_int_4',
    target: { targetType: 'PRODUCT', targetId: 'p_int_2' },
    actionType: 'LIKE',
    idempotencyKey: idempKey
  });
  console.log('Same Result (interactionId):', res13_1.interaction?.interactionId === res13_2.interaction?.interactionId);

  console.log('\n--- P24 INTERACTION FOUNDATION SIMULATION END ---');
}
