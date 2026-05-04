import { StoryTrayResponse, StoryViewerResponse } from '@hx/contracts';

export const simulateStoryFlow = async (fetchBff: (path: string) => Promise<any>) => {
  console.log('--- P29 Story Simulation Starting ---');

  // Scenario 1: HOME Tray
  console.log('Scenario 1: Fetching HOME Story Tray...');
  const homeTray: StoryTrayResponse = await fetchBff('/story/tray?surface=HOME');
  console.log('HOME Tray Items Count:', homeTray.items.length);
  homeTray.items.forEach(item => {
    console.log(`- Item: ${item.label}, Type: ${item.storyType}`);
  });
  const hasStoreProductInHome = homeTray.items.some(item => item.storyType === 'STORE_PRODUCT');
  const hasUserProductInHome = homeTray.items.some(item => item.storyType === 'USER_PRODUCT');
  console.log('Has STORE_PRODUCT in HOME (should be false):', hasStoreProductInHome);
  console.log('Has USER_PRODUCT in HOME (should be false):', hasUserProductInHome);

  // Scenario 2: DISCOVER Tray
  console.log('Scenario 2: Fetching DISCOVER Story Tray...');
  const discoverTray: StoryTrayResponse = await fetchBff('/story/tray?surface=DISCOVER');
  console.log('DISCOVER Tray Items Count:', discoverTray.items.length);
  const hasStoreProductInDiscover = discoverTray.items.some(item => item.storyType === 'STORE_PRODUCT');
  console.log('Has STORE_PRODUCT in DISCOVER (should be false):', hasStoreProductInDiscover);

  // Scenario 3: STOREFRONT Tray
  console.log('Scenario 3: Fetching STOREFRONT Story Tray (s_1)...');
  const storefrontTray: StoryTrayResponse = await fetchBff('/story/tray?surface=STOREFRONT&storefrontId=s_1');
  console.log('STOREFRONT Tray Items Count:', storefrontTray.items.length);
  storefrontTray.items.forEach(item => {
    console.log(`- Item: ${item.label}, Type: ${item.storyType}`);
  });
  const hasUserProductInStorefront = storefrontTray.items.some(item => item.storyType === 'USER_PRODUCT');
  console.log('Has USER_PRODUCT in STOREFRONT (should be false):', hasUserProductInStorefront);

  // Scenario 4: PDP Tray
  console.log('Scenario 4: Fetching PDP Story Tray (p_valid)...');
  const pdpTray: StoryTrayResponse = await fetchBff('/story/tray?surface=PDP&productId=p_valid');
  console.log('PDP Tray Items Count:', pdpTray.items.length);
  const onlyUserProductInPdp = pdpTray.items.every(item => item.storyType === 'USER_PRODUCT');
  console.log('Only USER_PRODUCT in PDP (should be true):', onlyUserProductInPdp);

  // Scenario 5: Viewer STOREFRONT
  console.log('Scenario 5: Fetching Viewer for store_product_1 in STOREFRONT...');
  const storefrontViewer: StoryViewerResponse = await fetchBff('/story/viewer?storyId=store_product_1&surface=STOREFRONT');
  if (storefrontViewer.items && storefrontViewer.items.length > 0) {
    const item = storefrontViewer.items[0];
    console.log('Viewer Item ID:', item.storyId);
    console.log('Context Preserved:', item.viewerContext.contextPreserved);
    console.log('PC Presentation:', item.viewerContext.pcPresentation);
    console.log('Mobile Presentation:', item.viewerContext.mobilePresentation);
    console.log('PDP Target Store Context Required:', item.target?.pdpTarget?.storeContextRequired);
  }

  // Scenario 6: Viewer Forbidden (USER_PRODUCT in HOME)
  console.log('Scenario 6: Fetching USER_PRODUCT story in HOME (should fail/empty)...');
  const forbiddenViewer: StoryViewerResponse = await fetchBff('/story/viewer?storyId=user_product_story_1&surface=HOME');
  console.log('Forbidden Viewer Items Count (should be 0):', forbiddenViewer.items.length);
  console.log('Forbidden Viewer Empty State Code:', forbiddenViewer.emptyState?.code);

  // Scenario 7: Hidden/Expired Story
  console.log('Scenario 7: Verifying hidden/expired stories...');
  const homeStories: StoryTrayResponse = await fetchBff('/story/tray?surface=HOME');
  const hasHidden = homeStories.items.some(item => item.storyIds.includes('hidden_story_1'));
  const hasExpired = homeStories.items.some(item => item.storyIds.includes('expired_story_1'));
  console.log('Has Hidden Story (should be false):', hasHidden);
  console.log('Has Expired Story (should be false):', hasExpired);

  // Scenario 8: Warnings
  console.log('Scenario 8: Checking Foundation Warnings...');
  console.log('Warnings:', homeTray.warnings);
  const hasStaticWarning = homeTray.warnings?.includes('STORY_PROJECTION_FOUNDATION_STATIC');
  const hasMediaTruthWarning = homeTray.warnings?.includes('MEDIA_ASSET_TRUTH_NOT_OWNED');
  console.log('Has STATIC warning:', hasStaticWarning);
  console.log('Has MEDIA_TRUTH warning:', hasMediaTruthWarning);

  // Scenario 9: Viewer Surface Scope Check (STORE_PRODUCT in HOME)
  console.log('Scenario 9: Fetching STORE_PRODUCT story in HOME (should fail due to surfaceScope)...');
  const scopeViewer: StoryViewerResponse = await fetchBff('/story/viewer?storyId=store_product_1&surface=HOME');
  console.log('Scope Viewer Items Count (should be 0):', scopeViewer.items.length);
  console.log('Scope Viewer Empty State Code:', scopeViewer.emptyState?.code);

  console.log('--- P29 Story Simulation Completed ---');
};
