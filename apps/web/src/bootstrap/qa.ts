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

export async function simulateQaFlow() {
  console.log('\n--- P23 Q&A FOUNDATION SIMULATION START ---');

  // SCENARIO-1 — Create question without actor
  console.log('\n[Scenario 1] Create question without actor:');
  const res1 = await callBff('/qa/question/create', 'POST', {
    productTag: { productId: 'p_qa_1' },
    body: 'What is the material?'
  });
  console.log('Result:', JSON.stringify(res1));

  // SCENARIO-2 — Create question without product tag
  console.log('\n[Scenario 2] Create question without product tag:');
  const res2 = await callBff('/qa/question/create', 'POST', {
    actorId: 'u_qa_1',
    body: 'What is the material?'
  });
  console.log('Result:', JSON.stringify(res2));

  // SCENARIO-3 — Create short question
  console.log('\n[Scenario 3] Create short question:');
  const res3 = await callBff('/qa/question/create', 'POST', {
    actorId: 'u_qa_1',
    productTag: { productId: 'p_qa_1' },
    body: 'How?'
  });
  console.log('Result:', JSON.stringify(res3));

  // SCENARIO-4 — Create valid product question
  console.log('\n[Scenario 4] Create valid product question:');
  const res4 = await callBff('/qa/question/create', 'POST', {
    actorId: 'u_qa_1',
    productTag: { productId: 'p_qa_1' },
    body: 'Is this product waterproof?'
  });
  const questionId = res4.question?.questionId;
  console.log('Created Question ID:', questionId);
  console.log('Status:', res4.question?.status);
  console.log('Review Process Flag:', res4.question?.reviewProcess);

  // SCENARIO-5 — Duplicate question idempotency
  console.log('\n[Scenario 5] Duplicate question idempotency:');
  const res5 = await callBff('/qa/question/create', 'POST', {
    actorId: 'u_qa_1',
    productTag: { productId: 'p_qa_1' },
    body: 'Is this product waterproof?',
    idempotencyKey: 'qa_idemp_1'
  });
  const res5_dup = await callBff('/qa/question/create', 'POST', {
    actorId: 'u_qa_1',
    productTag: { productId: 'p_qa_1' },
    body: 'Is this product waterproof?',
    idempotencyKey: 'qa_idemp_1'
  });
  console.log('Match Question ID:', res5.question?.questionId === res5_dup.question?.questionId);

  // SCENARIO-6 — Question transition happy path
  console.log('\n[Scenario 6] Question transition happy path (SUBMITTED -> UNDER_REVIEW -> PUBLISHED):');
  await callBff('/qa/question/transition', 'POST', { questionId, targetStatus: 'UNDER_REVIEW' });
  const res6 = await callBff('/qa/question/transition', 'POST', { questionId, targetStatus: 'PUBLISHED' });
  console.log('Final Status:', res6.question?.status);
  console.log('Visibility:', res6.question?.visibilityState);

  // SCENARIO-7 — Invalid question transition
  console.log('\n[Scenario 7] Invalid question transition (SUBMITTED -> PUBLISHED direct):');
  const newQRes = await callBff('/qa/question/create', 'POST', {
    actorId: 'u_qa_2',
    productTag: { productId: 'p_qa_1' },
    body: 'When will it be in stock?'
  });
  const res7 = await callBff('/qa/question/transition', 'POST', { questionId: newQRes.question.questionId, targetStatus: 'PUBLISHED' });
  console.log('Result:', JSON.stringify(res7));

  // SCENARIO-8 — Customer answer rejected
  console.log('\n[Scenario 8] Customer answer rejected:');
  const res8 = await callBff('/qa/answer/create', 'POST', {
    questionId,
    authorType: 'CUSTOMER',
    authorId: 'u_qa_1',
    body: 'I think it is waterproof.'
  });
  console.log('Result:', JSON.stringify(res8));

  // SCENARIO-9 — Authorized answer create
  console.log('\n[Scenario 9] Authorized answer create (SUPPLIER):');
  const res9 = await callBff('/qa/answer/create', 'POST', {
    questionId,
    authorType: 'SUPPLIER',
    authorId: 's_qa_1',
    body: 'Yes, it is IP68 rated waterproof.'
  });
  const answerId = res9.answer?.answerId;
  console.log('Created Answer ID:', answerId);
  console.log('Official Answer Flag:', res9.answer?.officialAnswer);
  console.log('Answer Status:', res9.answer?.status);

  // SCENARIO-10 — Answer transition happy path
  console.log('\n[Scenario 10] Answer transition happy path (SUBMITTED -> UNDER_REVIEW -> PUBLISHED):');
  await callBff('/qa/answer/transition', 'POST', { questionId, answerId, targetStatus: 'UNDER_REVIEW' });
  const res10 = await callBff('/qa/answer/transition', 'POST', { questionId, answerId, targetStatus: 'PUBLISHED' });
  console.log('Final Answer Status:', res10.answer?.status);
  console.log('Answer Visibility:', res10.answer?.visibilityState);

  // SCENARIO-11 — Invalid answer transition
  console.log('\n[Scenario 11] Invalid answer transition:');
  const newAnsRes = await callBff('/qa/answer/create', 'POST', {
    questionId,
    authorType: 'PLATFORM',
    authorId: 'adm_1',
    body: 'Wait for updates.'
  });
  const res11 = await callBff('/qa/answer/transition', 'POST', { questionId, answerId: newAnsRes.answer.answerId, targetStatus: 'PUBLISHED' });
  console.log('Result:', JSON.stringify(res11));

  // SCENARIO-12 — List questions by product
  console.log('\n[Scenario 12] List questions for p_qa_1:');
  const res12 = await callBff('/qa/question/list?productId=p_qa_1', 'GET');
  console.log('Count:', res12.items?.length);
  console.log('First Question Body:', res12.items?.[0]?.body);
  console.log('Answers Count in first item:', res12.items?.[0]?.answers?.length);

  // SCENARIO-13 — Unknown question
  console.log('\n[Scenario 13] Unknown question:');
  const res13 = await callBff('/qa/question/unknown_q', 'GET');
  console.log('Result:', JSON.stringify(res13));

  console.log('\n--- P23 Q&A FOUNDATION SIMULATION END ---');
}
