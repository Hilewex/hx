import { 
  StoreMessageTopic, 
  StoreMessageThreadStatus, 
  StoreMessageSenderType,
  StoreMessageErrorCode 
} from '@hx/contracts';
import { StoreMessageService } from '@hx/service-store-message';

async function test() {
  console.log('🚀 Starting Store Message Smoke Test (Service Direct)');

  const customerId = 'cust_123';
  const creatorId = 'cre_456';
  const storefrontId = 'sf_789';
  const foreignStorefrontId = 'sf_999';

  // 1. STYLE_ADVICE thread OPEN PASS
  console.log('\n--- Test 1: STYLE_ADVICE thread OPEN PASS ---');
  const t1 = await StoreMessageService.startStoreMessageThread(
    customerId,
    storefrontId,
    StoreMessageTopic.STYLE_ADVICE,
    'I need some style advice for the red dress.'
  );
  console.log('Result:', t1.success ? 'PASS' : 'FAIL', t1.data?.status === StoreMessageThreadStatus.OPEN ? '(OPEN)' : '');
  const threadId = t1.data!.id;

  // 2. ORDER_SUPPORT redirected to support PASS
  console.log('\n--- Test 2: ORDER_SUPPORT redirected to support PASS ---');
  const t2 = await StoreMessageService.startStoreMessageThread(
    customerId,
    storefrontId,
    StoreMessageTopic.ORDER_SUPPORT,
    'Where is my order?'
  );
  console.log('Result:', t2.success && t2.data!.status === StoreMessageThreadStatus.REDIRECTED_TO_SUPPORT ? 'PASS (REDIRECTED_TO_SUPPORT)' : 'FAIL');

  // 3. OFFICIAL_PRODUCT_QUESTION redirected to QA PASS
  console.log('\n--- Test 3: OFFICIAL_PRODUCT_QUESTION redirected to QA PASS ---');
  const t3 = await StoreMessageService.startStoreMessageThread(
    customerId,
    storefrontId,
    StoreMessageTopic.OFFICIAL_PRODUCT_QUESTION,
    'Is this fabric organic?'
  );
  console.log('Result:', t3.success && t3.data!.status === StoreMessageThreadStatus.REDIRECTED_TO_QA ? 'PASS (REDIRECTED_TO_QA)' : 'FAIL');

  // 4. creator reply own storefront thread PASS
  console.log('\n--- Test 4: creator reply own storefront thread PASS ---');
  const t4 = await StoreMessageService.replyStoreMessage(
    creatorId,
    StoreMessageSenderType.CREATOR,
    threadId,
    'Sure! I would recommend the silver shoes.',
    storefrontId
  );
  console.log('Result:', t4.success ? 'PASS' : 'FAIL');

  // 5. creator reply foreign storefront thread FAIL
  console.log('\n--- Test 5: creator reply foreign storefront thread FAIL ---');
  const t5 = await StoreMessageService.replyStoreMessage(
    'other_creator',
    StoreMessageSenderType.CREATOR,
    threadId,
    'Hijacking this thread.',
    foreignStorefrontId
  );
  console.log('Result:', !t5.success && t5.error?.code === StoreMessageErrorCode.UNAUTHORIZED ? 'PASS (FAIL as expected: UNAUTHORIZED)' : 'FAIL');

  // 6. customer reply own thread PASS
  console.log('\n--- Test 6: customer reply own thread PASS ---');
  const t6 = await StoreMessageService.replyStoreMessage(
    customerId,
    StoreMessageSenderType.CUSTOMER,
    threadId,
    'Thanks for the advice!'
  );
  console.log('Result:', t6.success ? 'PASS' : 'FAIL');

  // 7. closed thread reply FAIL
  console.log('\n--- Test 7: closed thread reply FAIL ---');
  // Close the thread first
  await StoreMessageService.closeStoreMessageThread(
    customerId,
    StoreMessageSenderType.CUSTOMER,
    threadId,
    'Issue resolved'
  );
  
  const t7 = await StoreMessageService.replyStoreMessage(
    customerId,
    StoreMessageSenderType.CUSTOMER,
    threadId,
    'Replying to closed thread.'
  );
  console.log('Result:', !t7.success && t7.error?.code === StoreMessageErrorCode.THREAD_CLOSED ? 'PASS (FAIL as expected: THREAD_CLOSED)' : 'FAIL');

  // 8. close without reason FAIL
  console.log('\n--- Test 8: close without reason FAIL ---');
  const t8_thread = await StoreMessageService.startStoreMessageThread(
    customerId,
    storefrontId,
    StoreMessageTopic.STYLE_ADVICE,
    'New thread to test close without reason.'
  );
  const t8 = await StoreMessageService.closeStoreMessageThread(
    customerId,
    StoreMessageSenderType.CUSTOMER,
    t8_thread.data!.id,
    ''
  );
  console.log('Result:', !t8.success && t8.error?.code === StoreMessageErrorCode.CLOSE_REASON_REQUIRED ? 'PASS (FAIL as expected: CLOSE_REASON_REQUIRED)' : 'FAIL');

  console.log('\n✅ Store Message Smoke Test Completed');
}

test().catch(console.error);
