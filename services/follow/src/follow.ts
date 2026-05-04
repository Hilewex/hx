import { 
  FollowRecord, 
  FollowCreatorCommand, 
  UnfollowCreatorCommand, 
  GetFollowStateQuery, 
  ListFollowingQuery, 
  FollowMutationResult, 
  FollowStateResponse, 
  FollowingListResponse,
  FollowFeedQuery,
  FollowFeedResponse,
  FollowFeedItem,
  StorePostRecord
} from '@hx/contracts';
import { createInternalRiskSignal } from '@hx/risk';

// Avoid direct circular dependency or complex build ordering issues in monorepo
// Use a late require or a generic interface if needed.
const getPostService = () => {
  try {
    return require('@hx/post');
  } catch (e) {
    console.error('Post service not found, follow feed will be limited');
    return null;
  }
};

interface FollowStore {
  follows: Map<string, FollowRecord>;
  idempotency: Map<string, string>;
}

const getFollowStore = (): FollowStore => {
  const root = globalThis as any;
  if (!root.__followStore) {
    root.__followStore = {
      follows: new Map(),
      idempotency: new Map()
    };
  }
  return root.__followStore;
};

export const followCreator = async (command: FollowCreatorCommand): Promise<FollowMutationResult> => {
  const store = getFollowStore();
  const warnings: string[] = ['FOLLOW_TARGET_EXISTENCE_NOT_VERIFIED', 'IN_MEMORY_FOUNDATION_LIMITATION'];

  if (!command.actorId) return { success: false, errors: ['ACTOR_REQUIRED'] };
  if (!command.target) return { success: false, errors: ['FOLLOW_TARGET_REQUIRED'] };
  if (command.target.targetType !== 'CREATOR_STOREFRONT') return { success: false, errors: ['INVALID_TARGET_TYPE'] };
  if (!command.target.storefrontId) return { success: false, errors: ['STOREFRONT_ID_REQUIRED'] };

  if (command.idempotencyKey && store.idempotency.has(command.idempotencyKey)) {
    const existingId = store.idempotency.get(command.idempotencyKey)!;
    return { success: true, follow: store.follows.get(existingId), warnings };
  }

  // Check follow limit (foundation: max 100)
  const activeFollowsCount = Array.from(store.follows.values()).filter(
    f => f.actorId === command.actorId && f.state === 'ACTIVE'
  ).length;

  if (activeFollowsCount >= 100) {
    // ABUSE SIGNAL: Follow limit exceeded
    try {
      await createInternalRiskSignal({
        targetId: command.actorId!,
        targetType: 'CUSTOMER',
        type: 'SOCIAL_ABUSE',
        level: 'LOW',
        source: 'FOLLOW_SERVICE',
        reasonCode: 'FOLLOW_LIMIT_EXCEEDED_ATTEMPT',
        metadata: { currentCount: activeFollowsCount },
        correlationId: command.idempotencyKey
      });
    } catch (e) {
      console.error('[FollowService] Risk signal failed:', e);
    }
    return { success: false, errors: ['FOLLOW_LIMIT_EXCEEDED'] };
  }

  // Check if already following
  const existingFollow = Array.from(store.follows.values()).find(
    f => f.actorId === command.actorId && f.target.storefrontId === command.target.storefrontId
  );

  if (existingFollow) {
    if (existingFollow.state === 'ACTIVE') {
      // ABUSE SIGNAL: Repeated follow attempt for active follow
      try {
        await createInternalRiskSignal({
          targetId: command.actorId!,
          targetType: 'CUSTOMER',
          type: 'SOCIAL_ABUSE',
          level: 'LOW',
          source: 'FOLLOW_SERVICE',
          reasonCode: 'REPEATED_FOLLOW_ATTEMPT',
          metadata: { storefrontId: command.target.storefrontId },
          correlationId: command.idempotencyKey
        });
      } catch (e) {
        console.error('[FollowService] Risk signal failed:', e);
      }
      return { success: true, follow: existingFollow, warnings: [...warnings, 'ALREADY_FOLLOWING'] };
    }
    
    // Reactivate
    const now = new Date().toISOString();
    existingFollow.state = 'ACTIVE';
    existingFollow.updatedAt = now;
    existingFollow.removedAt = undefined;
    
    return { success: true, follow: existingFollow, state: 'ACTIVE', warnings };
  }

  const followId = `fol_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const follow: FollowRecord = {
    followId,
    actorId: command.actorId,
    actorType: command.actorType || 'CUSTOMER',
    target: command.target,
    state: 'ACTIVE',
    visibility: 'PRIVATE_RELATIONSHIP',
    createdAt: now,
    updatedAt: now,
    postTruthMutated: false,
    interactionTruthMutated: false,
    rankingTruthMutated: false,
    notificationEmitted: false,
    idempotencyKey: command.idempotencyKey,
    warnings
  };

  store.follows.set(followId, follow);
  if (command.idempotencyKey) store.idempotency.set(command.idempotencyKey, followId);

  return { success: true, follow, state: 'ACTIVE', warnings };
};

export const unfollowCreator = async (command: UnfollowCreatorCommand): Promise<FollowMutationResult> => {
  const store = getFollowStore();
  const warnings: string[] = ['IN_MEMORY_FOUNDATION_LIMITATION'];

  if (!command.actorId) return { success: false, errors: ['ACTOR_REQUIRED'] };
  if (!command.target) return { success: false, errors: ['FOLLOW_TARGET_REQUIRED'] };
  if (!command.target.storefrontId) return { success: false, errors: ['STOREFRONT_ID_REQUIRED'] };

  const existingFollow = Array.from(store.follows.values()).find(
    f => f.actorId === command.actorId && f.target.storefrontId === command.target.storefrontId
  );

  if (!existingFollow || existingFollow.state === 'REMOVED') {
    return { 
      success: true, 
      state: 'REMOVED', 
      warnings: [...warnings, 'FOLLOW_ALREADY_ABSENT'] 
    };
  }

  const now = new Date().toISOString();
  existingFollow.state = 'REMOVED';
  existingFollow.updatedAt = now;
  existingFollow.removedAt = now;

  return { success: true, state: 'REMOVED', warnings };
};

export const getFollowState = async (query: GetFollowStateQuery): Promise<FollowStateResponse> => {
  const store = getFollowStore();
  const warnings: string[] = ['IN_MEMORY_FOUNDATION_LIMITATION'];

  if (!query.actorId) {
    return {
      storefrontId: query.storefrontId,
      isFollowing: false,
      warnings: [...warnings, 'ACTOR_CONTEXT_MISSING_QUERY_LIMITATION']
    };
  }

  const follow = Array.from(store.follows.values()).find(
    f => f.actorId === query.actorId && f.target.storefrontId === query.storefrontId
  );

  return {
    actorId: query.actorId,
    storefrontId: query.storefrontId,
    state: follow?.state,
    isFollowing: follow?.state === 'ACTIVE',
    warnings
  };
};

export const listFollowing = async (query: ListFollowingQuery): Promise<FollowingListResponse> => {
  const store = getFollowStore();
  const warnings: string[] = ['IN_MEMORY_FOUNDATION_LIMITATION'];

  if (!query.actorId) return { items: [], warnings: [...warnings, 'ACTOR_REQUIRED'] };

  let items = Array.from(store.follows.values()).filter(f => f.actorId === query.actorId);

  const stateFilter = query.state || 'ACTIVE';
  items = items.filter(f => f.state === stateFilter);

  if (query.cursor) {
    warnings.push('CURSOR_NOT_IMPLEMENTED_FOUNDATION');
  }

  const limit = query.limit || 50;
  items = items.slice(0, limit);

  return { items, warnings };
};

export const listFollowFeed = async (query: FollowFeedQuery): Promise<FollowFeedResponse> => {
  const store = getFollowStore();
  const warnings: string[] = [
    'FOLLOW_FEED_RANKING_FOUNDATION_ONLY',
    'M8_RANKING_NOT_IN_SCOPE',
    'FOLLOW_FEED_READ_MODEL_NOT_TRUTH',
    'IN_MEMORY_FOUNDATION_LIMITATION'
  ];

  if (!query.actorId) return { items: [], warnings: [...warnings, 'ACTOR_REQUIRED'] };

  // 1. Get active following storefronts
  const activeFollows = Array.from(store.follows.values()).filter(
    f => f.actorId === query.actorId && f.state === 'ACTIVE'
  );

  if (activeFollows.length === 0) {
    return {
      items: [],
      emptyState: {
        code: 'NO_FOLLOWING',
        message: 'Henüz kimseyi takip etmiyorsunuz.',
        suggestedSurface: 'STORE_DISCOVERY'
      },
      warnings
    };
  }

  const storefrontIds = activeFollows.map(f => f.target.storefrontId);

  // 2. Fetch posts for these storefronts from services/post
  const postService = getPostService();
  if (!postService) {
    return { items: [], warnings: [...warnings, 'POST_SERVICE_NOT_AVAILABLE'] };
  }

  const allPostsPromises = storefrontIds.map(sid => postService.listStorePosts({ 
    storefrontId: sid,
    status: 'PUBLISHED'
  }));

  const allPostsResults = await Promise.all(allPostsPromises);
  let allPosts: StorePostRecord[] = allPostsResults.flatMap((res: any) => res.items);

  // 3. Filter for followers-only visibility
  allPosts = allPosts.filter((p: StorePostRecord) => p.visibility === 'FOLLOWERS_ONLY');

  if (allPosts.length === 0) {
    return {
      items: [],
      emptyState: {
        code: 'NO_POSTS_FROM_FOLLOWING',
        message: 'Takip ettiğiniz mağazalardan henüz bir paylaşım yok.',
        suggestedSurface: 'DISCOVER'
      },
      warnings
    };
  }

  // 4. Sort by date
  allPosts.sort((a: StorePostRecord, b: StorePostRecord) => {
    const dateA = new Date(a.publishedAt || a.updatedAt).getTime();
    const dateB = new Date(b.publishedAt || b.updatedAt).getTime();
    return dateB - dateA;
  });

  // 5. Apply limit
  const limit = query.limit || 20;
  const slicedPosts = allPosts.slice(0, limit);

  // 6. Map to FollowFeedItem
  const items: FollowFeedItem[] = slicedPosts.map((post: StorePostRecord) => ({
    feedItemId: `fi_${post.postId}`,
    postId: post.postId,
    storefrontId: post.storefrontId,
    creatorId: post.creatorId,
    postType: post.postType,
    title: post.title,
    body: post.body,
    media: post.media,
    linkedObject: post.linkedObject,
    publishedAt: post.publishedAt,
    source: 'FOLLOWING_STORE_POST',
    postTruthCopied: false,
    feedTruth: false,
    warnings: []
  }));

  return {
    items,
    warnings
  };
};
