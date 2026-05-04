import * as storeStoryService from '@hx/store-story';
import {
  StoreStoryType,
  StoreStoryStatus,
  StoreStoryErrorCode,
} from '@hx/contracts';

async function runSmokeTests() {
  console.log('--- Store Story Surface Foundation Smoke Tests ---');

  const storefrontId = 'sf_123';
  const otherStorefrontId = 'sf_456';

  // 1. create STORE_INTRO story PASS
  console.log('Test 1: create STORE_INTRO story...');
  const res1 = await storeStoryService.createStoreStory(storefrontId, {
    type: StoreStoryType.STORE_INTRO,
    mediaAssetId: 'media_1',
    caption: 'Welcome to my store!',
    displayOrder: 0,
  });
  if (res1.success) console.log('PASS'); else console.error('FAIL', res1.error);

  const story1Id = res1.data!.id;

  // 2. create PRODUCT_PROMOTION without creatorStoreProductId FAIL
  console.log('Test 2: create PRODUCT_PROMOTION without creatorStoreProductId...');
  const res2 = await storeStoryService.createStoreStory(storefrontId, {
    type: StoreStoryType.PRODUCT_PROMOTION,
    mediaAssetId: 'media_2',
  });
  if (!res2.success && res2.error?.code === StoreStoryErrorCode.PRODUCT_REQUIRED) console.log('PASS'); else console.error('FAIL', res2.error);

  // 3. create without mediaAssetId FAIL
  console.log('Test 3: create without mediaAssetId...');
  const res3 = await storeStoryService.createStoreStory(storefrontId, {
    type: StoreStoryType.STORE_INTRO,
    mediaAssetId: '',
  } as any);
  if (!res3.success && res3.error?.code === StoreStoryErrorCode.MEDIA_REQUIRED) console.log('PASS'); else console.error('FAIL', res3.error);

  // 4. publish PASS
  console.log('Test 4: publish story...');
  const res4 = await storeStoryService.publishStoreStory(storefrontId, { storeStoryId: story1Id });
  if (res4.success && res4.data?.status === StoreStoryStatus.PUBLISHED) console.log('PASS'); else console.error('FAIL', res4.error);

  // 5. unpublish without reason FAIL
  console.log('Test 5: unpublish without reason...');
  const res5 = await storeStoryService.unpublishStoreStory(storefrontId, { storeStoryId: story1Id, reason: '' });
  if (!res5.success && res5.error?.code === StoreStoryErrorCode.UNPUBLISH_REASON_REQUIRED) console.log('PASS'); else console.error('FAIL', res5.error);

  // 6. archive PASS
  console.log('Test 6: archive story...');
  const res6 = await storeStoryService.archiveStoreStory(storefrontId, { storeStoryId: story1Id });
  if (res6.success && res6.data?.status === StoreStoryStatus.ARCHIVED) console.log('PASS'); else console.error('FAIL', res6.error);

  // 7. archived publish FAIL
  console.log('Test 7: archived publish FAIL...');
  const res7 = await storeStoryService.publishStoreStory(storefrontId, { storeStoryId: story1Id });
  if (!res7.success && res7.error?.code === StoreStoryErrorCode.ALREADY_ARCHIVED) console.log('PASS'); else console.error('FAIL', res7.error);

  // 8. reorder PASS
  console.log('Test 8: reorder PASS...');
  const s2 = await storeStoryService.createStoreStory(storefrontId, { type: StoreStoryType.STORE_INTRO, mediaAssetId: 'm2' });
  const s3 = await storeStoryService.createStoreStory(storefrontId, { type: StoreStoryType.STORE_INTRO, mediaAssetId: 'm3' });
  const s2Id = s2.data!.id;
  const s3Id = s3.data!.id;
  
  const res8 = await storeStoryService.reorderStoreStories(storefrontId, { storeStoryIds: [s3Id, s2Id] });
  if (res8.success) {
    const list = await storeStoryService.listStoreStoriesForStorefront(storefrontId);
    // Find the actual stories in the list to check order
    const idx3 = list.data!.findIndex(s => s.id === s3Id);
    const idx2 = list.data!.findIndex(s => s.id === s2Id);
    if (idx3 < idx2) console.log('PASS'); else console.error('FAIL Order', { idx3, idx2 });
  } else console.error('FAIL', res8.error);

  // 9. reorder duplicate FAIL
  console.log('Test 9: reorder duplicate FAIL...');
  const res9 = await storeStoryService.reorderStoreStories(storefrontId, { storeStoryIds: [s2Id, s2Id] });
  if (!res9.success && res9.error?.code === StoreStoryErrorCode.DUPLICATE_ID) console.log('PASS'); else console.error('FAIL', res9.error);

  // 10. reorder foreign FAIL
  console.log('Test 10: reorder foreign FAIL...');
  const otherStory = await storeStoryService.createStoreStory(otherStorefrontId, { type: StoreStoryType.STORE_INTRO, mediaAssetId: 'mo' });
  const res10 = await storeStoryService.reorderStoreStories(storefrontId, { storeStoryIds: [s2Id, otherStory.data!.id] });
  if (!res10.success && res10.error?.code === StoreStoryErrorCode.FOREIGN_STORY) console.log('PASS'); else console.error('FAIL', res10.error);

  // 11. public list only PUBLISHED PASS
  console.log('Test 11: public list only PUBLISHED PASS...');
  await storeStoryService.publishStoreStory(storefrontId, { storeStoryId: s2Id });
  // story1 is ARCHIVED, s2 is PUBLISHED, s3 is DRAFT
  const res11 = await storeStoryService.listPublishedStoreStoriesForPublicStorefront(storefrontId);
  if (res11.success && res11.data?.length === 1 && res11.data[0].id === s2Id) console.log('PASS'); else console.error('FAIL', res11.data);

  console.log('--- Smoke Tests Completed ---');
}

runSmokeTests().catch(console.error);
