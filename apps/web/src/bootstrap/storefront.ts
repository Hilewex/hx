import { StorefrontResponse } from '@hx/contracts';

export const simulateStorefrontFlow = async (fetchBff: (path: string) => Promise<any>) => {
  console.log('--- P28 Storefront Simulation Starting ---');

  // 1. Get HX Store
  console.log('1. Fetching HX Store (slug=hx-store)...');
  const hxStore: StorefrontResponse = await fetchBff('/storefront?slug=hx-store');
  console.log('Storefront Name:', hxStore.storefront?.displayName);
  console.log('Product Cards Count:', hxStore.productCards.length);
  
  if (hxStore.productCards.length > 0) {
    const firstCard = hxStore.productCards[0];
    console.log('First Card canShare (should be false):', firstCard.actions.canShare);
    console.log('First Card storeContextRequired (should be true):', firstCard.pdpTarget.storeContextRequired);
  }

  // 2. Get Video Store
  console.log('2. Fetching Video Store (slug=video-store, tab=VIDEOS)...');
  const videoStore: StorefrontResponse = await fetchBff('/storefront?slug=video-store&tab=VIDEOS');
  console.log('Video Rail Item Count:', videoStore.videoRail?.length);
  if (videoStore.videoRail && videoStore.videoRail.length > 0) {
    const videoItem = videoStore.videoRail[0];
    console.log('Video Item supportOnly:', videoItem.supportOnly);
    console.log('Video Item discoveryFeed:', videoItem.discoveryFeed);
    console.log('Video Item storyTruth:', videoItem.storyTruth);
  }

  // 3. Unknown Storefront
  console.log('3. Fetching Unknown Storefront...');
  const unknownStore: StorefrontResponse = await fetchBff('/storefront?slug=unknown');
  console.log('Empty State Code:', unknownStore.emptyState?.code);

  // 4. Search within storefront
  console.log('4. Searching "valid" in HX Store...');
  const searchRes: StorefrontResponse = await fetchBff('/storefront?slug=hx-store&searchQuery=valid');
  console.log('Search Results Count:', searchRes.productCards.length);

  // 5. Check Warnings
  console.log('5. Checking Warnings for HX Store...');
  console.log('Warnings:', hxStore.warnings);
  const hasFoundationStatic = hxStore.warnings?.includes('STOREFRONT_PROJECTION_FOUNDATION_STATIC');
  const hasLifecycleNotOwned = hxStore.warnings?.includes('CREATOR_LIFECYCLE_TRUTH_NOT_OWNED');
  console.log('Has STATIC warning:', hasFoundationStatic);
  console.log('Has LIFECYCLE_NOT_OWNED warning:', hasLifecycleNotOwned);

  // 6. Check Visibility (Hidden/Unavailable)
  console.log('6. Verifying no hidden/unavailable products...');
  const hiddenProductInCards = hxStore.productCards.find((pc: any) => pc.productId === 'p_hidden' || pc.productId === 'p_unavailable');
  console.log('Hidden/Unavailable in cards:', !!hiddenProductInCards);

  // 7. Follow State (with mock actor)
  console.log('7. Checking follow state...');
  // Note: Simulation uses fetchBff which might not have actual actor context without token simulation
  console.log('Follow State IsFollowing:', hxStore.followState?.isFollowing);

  // 8. Posts
  console.log('8. Checking post preview...');
  const storeWithPosts: StorefrontResponse = await fetchBff('/storefront?slug=hx-store&tab=POSTS');
  if (storeWithPosts.posts && storeWithPosts.posts.length > 0) {
    console.log('First Post Title:', storeWithPosts.posts[0].title);
    console.log('Post Truth Copied (should be false):', storeWithPosts.posts[0].postTruthCopied);
  } else {
    console.log('No posts found in HX Store (expected in static seed if no posts created yet)');
  }

  console.log('--- P28 Storefront Simulation Completed ---');
};
