import { 
  StoryRecord, 
  StoryTrayItem, 
  StoryViewerItem, 
  StoryTrayQuery, 
  StoryViewerQuery, 
  StoryTrayResponse, 
  StoryViewerResponse,
  StoryEmptyState
} from '@hx/contracts';

const COMMON_WARNINGS = [
  'STORY_PROJECTION_FOUNDATION_STATIC',
  'STORY_TRUTH_NOT_OWNED',
  'MEDIA_ASSET_TRUTH_NOT_OWNED',
  'MEDIA_PROCESSING_NOT_CONFIGURED',
  'MODERATION_TRUTH_NOT_OWNED',
  'STORY_UPLOAD_PIPELINE_NOT_CONFIGURED',
  'M8_RANKING_NOT_IN_SCOPE'
];

const STATIC_STORIES: StoryRecord[] = [
  {
    storyId: 'store_intro_1',
    type: 'STORE_INTRO',
    status: 'ACTIVE',
    surfaceScope: ['HOME', 'DISCOVER', 'STOREFRONT'],
    contextType: 'STORE',
    storefrontId: 's_1',
    creatorId: 'creator_1',
    media: [
      {
        mediaId: 'm_intro_1',
        mediaType: 'IMAGE',
        url: 'https://simulation.hx.com/stories/intro_1.jpg',
        assetTruth: false,
        mediaProcessingTruthMutated: false,
        simulationOnly: true
      }
    ],
    interactionCapabilities: {
      canLike: true,
      canSave: true,
      canShare: true,
      canFollowStore: true,
      canGoStorefront: true,
      canGoPdp: false,
      canAddToCart: false
    },
    createdAt: new Date().toISOString(),
    storyProjection: true,
    storyTruth: false,
    assetTruthMutated: false,
    moderationTruthMutated: false,
    productTruthMutated: false,
    storefrontTruthMutated: false,
    postTruthMutated: false,
    feedTruthMutated: false,
    warnings: COMMON_WARNINGS
  },
  {
    storyId: 'store_product_1',
    type: 'STORE_PRODUCT',
    status: 'ACTIVE',
    surfaceScope: ['STOREFRONT'],
    contextType: 'PRODUCT',
    storefrontId: 's_1',
    productId: 'p_valid',
    target: {
      pdpTarget: {
        productId: 'p_valid',
        storefrontId: 's_1',
        storeContextRequired: true
      }
    },
    media: [
      {
        mediaId: 'm_prod_1',
        mediaType: 'VIDEO',
        url: 'https://simulation.hx.com/stories/prod_1.mp4',
        assetTruth: false,
        mediaProcessingTruthMutated: false,
        simulationOnly: true
      }
    ],
    interactionCapabilities: {
      canLike: true,
      canSave: true,
      canShare: true,
      canFollowStore: true,
      canGoStorefront: true,
      canGoPdp: true,
      canAddToCart: true
    },
    createdAt: new Date().toISOString(),
    storyProjection: true,
    storyTruth: false,
    assetTruthMutated: false,
    moderationTruthMutated: false,
    productTruthMutated: false,
    storefrontTruthMutated: false,
    postTruthMutated: false,
    feedTruthMutated: false,
    warnings: COMMON_WARNINGS
  },
  {
    storyId: 'user_product_story_1',
    type: 'USER_PRODUCT',
    status: 'ACTIVE',
    surfaceScope: ['PDP'],
    contextType: 'USER_PRODUCT_EXPERIENCE',
    actorId: 'u_1',
    productId: 'p_valid',
    storefrontId: 's_1',
    target: {
      pdpTarget: {
        productId: 'p_valid',
        storefrontId: 's_1',
        storeContextRequired: true
      }
    },
    media: [
      {
        mediaId: 'm_ugc_1',
        mediaType: 'IMAGE',
        url: 'https://simulation.hx.com/stories/ugc_1.jpg',
        assetTruth: false,
        mediaProcessingTruthMutated: false,
        simulationOnly: true
      }
    ],
    interactionCapabilities: {
      canLike: true,
      canSave: true,
      canShare: true,
      canFollowStore: false,
      canGoStorefront: true,
      canGoPdp: true,
      canAddToCart: false
    },
    createdAt: new Date().toISOString(),
    storyProjection: true,
    storyTruth: false,
    assetTruthMutated: false,
    moderationTruthMutated: false,
    productTruthMutated: false,
    storefrontTruthMutated: false,
    postTruthMutated: false,
    feedTruthMutated: false,
    warnings: COMMON_WARNINGS
  },
  {
    storyId: 'hidden_story_1',
    type: 'STORE_INTRO',
    status: 'HIDDEN',
    surfaceScope: ['HOME'],
    contextType: 'STORE',
    storefrontId: 's_1',
    media: [],
    interactionCapabilities: {
      canLike: false, canSave: false, canShare: false, canFollowStore: false,
      canGoStorefront: false, canGoPdp: false, canAddToCart: false
    },
    createdAt: new Date().toISOString(),
    storyProjection: true,
    storyTruth: false,
    assetTruthMutated: false,
    moderationTruthMutated: false,
    productTruthMutated: false,
    storefrontTruthMutated: false,
    postTruthMutated: false,
    feedTruthMutated: false
  },
  {
    storyId: 'expired_story_1',
    type: 'STORE_INTRO',
    status: 'EXPIRED',
    surfaceScope: ['HOME'],
    contextType: 'STORE',
    storefrontId: 's_1',
    media: [],
    interactionCapabilities: {
      canLike: false, canSave: false, canShare: false, canFollowStore: false,
      canGoStorefront: false, canGoPdp: false, canAddToCart: false
    },
    createdAt: new Date().toISOString(),
    storyProjection: true,
    storyTruth: false,
    assetTruthMutated: false,
    moderationTruthMutated: false,
    productTruthMutated: false,
    storefrontTruthMutated: false,
    postTruthMutated: false,
    feedTruthMutated: false
  }
];

export async function listStoryTray(query: StoryTrayQuery): Promise<StoryTrayResponse> {
  const warnings: string[] = [...COMMON_WARNINGS];
  
  if (query.cursor) {
    warnings.push('CURSOR_NOT_IMPLEMENTED_FOUNDATION');
  }

  const limit = query.limit || 20;

  const filteredStories = STATIC_STORIES.filter(story => {
    if (story.status !== 'ACTIVE') return false;
    if (!story.surfaceScope.includes(query.surface)) return false;

    switch (query.surface) {
      case 'HOME':
      case 'DISCOVER':
        return story.type === 'STORE_INTRO';
      case 'STOREFRONT':
        if (query.storefrontId && story.storefrontId !== query.storefrontId) return false;
        return story.type === 'STORE_INTRO' || story.type === 'STORE_PRODUCT';
      case 'PDP':
        if (query.productId && story.productId !== query.productId) return false;
        return story.type === 'USER_PRODUCT';
      default:
        return false;
    }
  });

  if (filteredStories.length === 0) {
    return {
      items: [],
      emptyState: {
        code: 'NO_STORIES',
        message: 'Henüz story bulunmuyor.',
        suggestedAction: 'GO_HOME'
      },
      warnings
    };
  }

  // Group by storefront or actor to create tray items
  const trayItems: StoryTrayItem[] = [];
  const groups = new Map<string, StoryRecord[]>();

  for (const story of filteredStories.slice(0, limit)) {
    const groupId = story.storefrontId || story.actorId || 'unknown';
    if (!groups.has(groupId)) groups.set(groupId, []);
    groups.get(groupId)!.push(story);
  }

  groups.forEach((stories, groupId) => {
    const firstStory = stories[0];
    trayItems.push({
      trayItemId: `tray_${groupId}`,
      storefrontId: firstStory.storefrontId,
      actorId: firstStory.actorId,
      label: firstStory.title || (firstStory.type === 'USER_PRODUCT' ? 'Kullanıcı Deneyimi' : 'Mağaza'),
      avatarUrl: undefined, // simulation
      hasUnseen: true,
      storyIds: stories.map(s => s.storyId),
      storyType: firstStory.type,
      surface: query.surface,
      storyRingProjection: true,
      storefrontTruthMutated: false,
      warnings: COMMON_WARNINGS
    });
  });

  return {
    items: trayItems,
    warnings
  };
}

export async function getStoryViewer(query: StoryViewerQuery): Promise<StoryViewerResponse> {
  const warnings: string[] = [...COMMON_WARNINGS];

  let targetStories: StoryRecord[] = [];

  if (query.storyId) {
    const story = STATIC_STORIES.find(s => s.storyId === query.storyId);
    if (story) targetStories = [story];
  } else if (query.trayItemId) {
    // In foundation, we can derive from listStoryTray logic or just filter again
    const trayResponse = await listStoryTray({ 
      surface: query.surface, 
      storefrontId: query.storefrontId, 
      productId: query.productId, 
      actorId: query.actorId 
    });
    const trayItem = trayResponse.items.find((item: StoryTrayItem) => item.trayItemId === query.trayItemId);
    if (trayItem) {
      targetStories = STATIC_STORIES.filter(s => trayItem.storyIds.includes(s.storyId));
    }
  }

  // Filter by surface rules again for safety
  targetStories = targetStories.filter(story => {
    if (story.status !== 'ACTIVE') return false;
    if (!story.surfaceScope.includes(query.surface)) return false;

    switch (query.surface) {
      case 'HOME':
      case 'DISCOVER':
        return story.type === 'STORE_INTRO';

      case 'STOREFRONT':
        if (query.storefrontId && story.storefrontId !== query.storefrontId) return false;
        return story.type === 'STORE_INTRO' || story.type === 'STORE_PRODUCT';

      case 'PDP':
        if (query.productId && story.productId !== query.productId) return false;
        return story.type === 'USER_PRODUCT';

      default:
        return false;
    }
  });

  if (targetStories.length === 0) {
    return {
      items: [],
      emptyState: {
        code: 'STORY_NOT_FOUND',
        message: 'Story bulunamadı.',
        suggestedAction: 'GO_HOME'
      },
      warnings
    };
  }

  const viewerItems: StoryViewerItem[] = targetStories.map((story, index) => ({
    storyId: story.storyId,
    type: story.type,
    media: story.media,
    title: story.title,
    caption: story.caption,
    target: story.target,
    interactionCapabilities: story.interactionCapabilities,
    progressIndex: index,
    totalInGroup: targetStories.length,
    viewerContext: {
      openedFrom: query.surface,
      contextPreserved: true,
      pcPresentation: 'MODAL',
      mobilePresentation: 'FULLSCREEN'
    },
    storyProjection: true,
    warnings: COMMON_WARNINGS
  }));

  return {
    items: viewerItems,
    activeStoryId: viewerItems[0].storyId,
    warnings
  };
}
