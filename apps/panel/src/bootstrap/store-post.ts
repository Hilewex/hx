import { StorePostV2 } from '@hx/contracts';
import * as StorePostService from '@hx/service-store-post';

async function runSmokeTests() {
  console.log('🚀 Starting Store Post Smoke Tests (Service Level)...');

  const creatorId = 'creator_1';
  const storefrontId = 'store_1';

  try {
    // 1. Create post PASS
    console.log('\n--- 1. Create post PASS ---');
    const post = await StorePostService.createStorePost({
      creatorId,
      storefrontId,
      title: 'New Collection 2026',
      body: 'Check out our new summer collection!',
      mediaRefs: [{ type: 'IMAGE', url: 'https://cdn.hx.com/img1.jpg', displayOrder: 1 }],
      productRefs: [{ productId: 'prod_1', displayOrder: 1 }]
    });
    console.log('Create Post: PASS');
    const postId = post.id;

    // 2. Empty body create FAIL
    console.log('\n--- 2. Empty body create FAIL ---');
    try {
      await StorePostService.createStorePost({
        creatorId,
        storefrontId,
        title: 'Title only',
        body: '',
        mediaRefs: [],
        productRefs: []
      });
      console.log('Empty Body Create: FAIL');
    } catch (e: any) {
      console.log('Empty Body Create:', e.message === StorePostV2.StorePostErrorCode.INVALID_BODY ? 'PASS' : 'FAIL');
    }

    // 3. Publish PASS
    console.log('\n--- 3. Publish PASS ---');
    const publishedPost = await StorePostService.publishStorePost({
      creatorId,
      storefrontId,
      storePostId: postId
    });
    console.log('Publish Post:', (publishedPost.status === StorePostV2.StorePostStatus.PUBLISHED) ? 'PASS' : 'FAIL');

    // 4. Hide without reason FAIL
    console.log('\n--- 4. Hide without reason FAIL ---');
    try {
      await StorePostService.hideStorePost({
        creatorId,
        storefrontId,
        storePostId: postId,
        reason: ''
      });
      console.log('Hide Without Reason: FAIL');
    } catch (e: any) {
      console.log('Hide Without Reason:', e.message === StorePostV2.StorePostErrorCode.REASON_REQUIRED ? 'PASS' : 'FAIL');
    }

    // 5. Archive PASS
    console.log('\n--- 5. Archive PASS ---');
    const archivedPost = await StorePostService.archiveStorePost({
      creatorId,
      storefrontId,
      storePostId: postId,
      reason: 'End of season'
    });
    console.log('Archive Post:', (archivedPost.status === StorePostV2.StorePostStatus.ARCHIVED) ? 'PASS' : 'FAIL');

    // 6. Archived publish FAIL
    console.log('\n--- 6. Archived publish FAIL ---');
    try {
      await StorePostService.publishStorePost({
        creatorId,
        storefrontId,
        storePostId: postId
      });
      console.log('Archived Publish: FAIL');
    } catch (e: any) {
      console.log('Archived Publish:', e.message === StorePostV2.StorePostErrorCode.ARCHIVED_CANNOT_PUBLISH ? 'PASS' : 'FAIL');
    }

    // 7. Reorder PASS
    console.log('\n--- 7. Reorder PASS ---');
    const storefrontId7 = 'store_7';
    const p1 = await StorePostService.createStorePost({
      creatorId,
      storefrontId: storefrontId7,
      title: 'Post 1',
      body: 'First post content',
      mediaRefs: [],
      productRefs: []
    });
    const p2 = await StorePostService.createStorePost({
      creatorId,
      storefrontId: storefrontId7,
      title: 'Post 2',
      body: 'Second post content',
      mediaRefs: [],
      productRefs: []
    });

    await StorePostService.reorderStorePosts({
      creatorId,
      storefrontId: storefrontId7,
      orderedIds: [p2.id, p1.id]
    });
    console.log('Reorder Posts: PASS');

    // 8. Reorder duplicate FAIL
    console.log('\n--- 8. Reorder duplicate FAIL ---');
    try {
      await StorePostService.reorderStorePosts({
        creatorId,
        storefrontId: storefrontId7,
        orderedIds: [p2.id, p2.id]
      });
      console.log('Reorder Duplicate: FAIL');
    } catch (e: any) {
      console.log('Reorder Duplicate:', e.message === StorePostV2.StorePostErrorCode.REORDER_MISMATCH ? 'PASS' : 'FAIL');
    }

    // 9. Reorder foreign FAIL
    console.log('\n--- 9. Reorder foreign FAIL ---');
    try {
      await StorePostService.reorderStorePosts({
        creatorId,
        storefrontId: storefrontId7,
        orderedIds: ['foreign_id', p2.id]
      });
      console.log('Reorder Foreign: FAIL');
    } catch (e: any) {
      console.log('Reorder Foreign:', e.message === StorePostV2.StorePostErrorCode.REORDER_MISMATCH ? 'PASS' : 'FAIL');
    }

    // 10. Public list only PUBLISHED PASS
    console.log('\n--- 10. Public list only PUBLISHED PASS ---');
    const storefrontId10 = 'store_10';
    const post3 = await StorePostService.createStorePost({
      creatorId,
      storefrontId: storefrontId10,
      title: 'Public Post',
      body: 'Visible to everyone',
      mediaRefs: [],
      productRefs: []
    });
    const post3Id = post3.id;
    await StorePostService.publishStorePost({
      creatorId,
      storefrontId: storefrontId10,
      storePostId: post3Id
    });

    const publicPosts = await StorePostService.listPublishedStorePostsForPublicStorefront(storefrontId10);
    const allPublished = publicPosts.every((p: any) => p.status === StorePostV2.StorePostStatus.PUBLISHED);
    console.log('Public List (Only Published):', (allPublished && publicPosts.some((p: any) => p.id === post3Id)) ? 'PASS' : 'FAIL');

    // 11. Follow feed only followed storefront PUBLISHED posts PASS
    console.log('\n--- 11. Follow feed only followed storefront PUBLISHED posts PASS ---');
    const feedPosts = await StorePostService.listFollowFeedPosts([storefrontId10, 'store_non_existent']);
    const feedCorrect = feedPosts.every((p: any) => p.status === StorePostV2.StorePostStatus.PUBLISHED && p.storefrontId === storefrontId10);
    console.log('Follow Feed (Followed + Published):', (feedCorrect && feedPosts.length >= 1) ? 'PASS' : 'FAIL');

    console.log('\n✅ Store Post Smoke Tests Completed!');
  } catch (error: any) {
    console.error('❌ Smoke Test Failed:', error.message);
    process.exit(1);
  }
}

runSmokeTests();
