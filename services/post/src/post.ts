import { 
  StorePostRecord, 
  CreateStorePostCommand, 
  StorePostListQuery, 
  StorePostTransitionCommand,
  StorePostMutationResult,
  StorePostStatus,
  StorePostModerationStatus,
  StorePostVisibility,
  CreateModerationCaseCommand
} from '@hx/contracts';
import { createModerationCase } from '@hx/moderation';
import { createInternalRiskSignal } from '@hx/risk';

interface PostStore {
  posts: Map<string, StorePostRecord>;
  idempotency: Map<string, string>;
}

const getPostStore = (): PostStore => {
  const root = globalThis as any;
  if (!root.__postStore) {
    console.log('[PostService] Initializing PostStore');
    root.__postStore = {
      posts: new Map(),
      idempotency: new Map()
    };
  }
  return root.__postStore;
};

export const createStorePost = async (command: CreateStorePostCommand): Promise<StorePostMutationResult> => {
  const store = getPostStore();

  if (command.idempotencyKey && store.idempotency.has(command.idempotencyKey)) {
    const existingId = store.idempotency.get(command.idempotencyKey)!;
    return { success: true, post: store.posts.get(existingId) };
  }

  const postId = `post_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  // ABUSE SIGNAL: Spam-like create attempt
  const isSpamLike = command.title?.toLowerCase().includes('spam') || command.body?.toLowerCase().includes('spam');
  if (isSpamLike) {
    try {
      await createInternalRiskSignal({
        targetId: command.creatorId,
        targetType: 'CREATOR',
        type: 'SOCIAL_ABUSE',
        level: 'LOW',
        source: 'POST_SERVICE',
        reasonCode: 'SPAM_LIKE_CONTENT',
        metadata: { title: command.title },
        correlationId: command.idempotencyKey
      });
    } catch (e) {
      console.error('[PostService] Risk signal failed:', e);
    }
  }

  // ABUSE SIGNAL: Rejected content pattern
  const recentRejectedPosts = Array.from(store.posts.values()).filter(
    p => p.creatorId === command.creatorId && p.status === 'REJECTED'
  );
  if (recentRejectedPosts.length >= 3) {
    try {
      await createInternalRiskSignal({
        targetId: command.creatorId,
        targetType: 'CREATOR',
        type: 'SOCIAL_ABUSE',
        level: 'MEDIUM',
        source: 'POST_SERVICE',
        reasonCode: 'REPEATED_REJECTED_CONTENT_PATTERN',
        metadata: { rejectedCount: recentRejectedPosts.length },
        correlationId: command.idempotencyKey ? `rejected_pattern_${command.idempotencyKey}` : undefined
      });
    } catch (e) {
      console.error('[PostService] Risk signal failed:', e);
    }
  }

  const post: StorePostRecord = {
    postId,
    creatorId: command.creatorId,
    storefrontId: command.storefrontId,
    postType: command.postType,
    status: 'SUBMITTED', 
    visibility: command.visibility || 'STORE_PROFILE',
    moderationStatus: 'PENDING',
    title: command.title,
    body: command.body,
    media: command.media || [],
    linkedObject: command.linkedObject,
    createdAt: now,
    updatedAt: now,
    idempotencyKey: command.idempotencyKey,
    socialThreadEnabled: false,
    officialStoreCommunication: true,
    supportProcess: false,
    qnaProcess: false,
    storyProcess: false
  };

  store.posts.set(postId, post);
  if (command.idempotencyKey) store.idempotency.set(command.idempotencyKey, postId);

  console.log(`[PostService] Post ${postId} stored in-memory as SUBMITTED (modStatus: PENDING)`);

  // Trigger moderation case creation
  try {
    const modCommand: CreateModerationCaseCommand = {
      target: {
        targetType: 'STORE_POST',
        targetId: postId,
        ownerActorId: post.creatorId,
        storefrontId: post.storefrontId
      },
      source: 'SYSTEM_RULE',
      riskLevel: 'LOW',
      reasonCodes: ['UNKNOWN'],
      contentText: `${post.title}\n${post.body}`,
      mediaAssetIds: post.media.map(m => m.mediaId),
      idempotencyKey: command.idempotencyKey ? `mod_post_${command.idempotencyKey}` : undefined
    };
    await createModerationCase(modCommand);
    console.log(`[PostService] Moderation case creation triggered for ${postId}`);
  } catch (error) {
    console.error('[PostService] Failed to create moderation case:', error);
  }

  return { success: true, post };
};

export const approvePostModerationResult = async (postId: string): Promise<StorePostMutationResult> => {
  const store = getPostStore();
  const post = store.posts.get(postId);
  if (!post) return { success: false, errors: ['POST_NOT_FOUND'] };

  post.moderationStatus = 'APPROVED';
  post.status = 'PUBLISHED';
  post.publishedAt = new Date().toISOString();
  post.updatedAt = post.publishedAt;
  
  return { success: true, post };
};

export const rejectPostModerationResult = async (postId: string, reason?: string): Promise<StorePostMutationResult> => {
  const store = getPostStore();
  const post = store.posts.get(postId);
  if (!post) return { success: false, errors: ['POST_NOT_FOUND'] };

  post.moderationStatus = 'REJECTED';
  post.status = 'REJECTED';
  post.rejectedAt = new Date().toISOString();
  post.rejectionReason = reason || 'REJECTED_BY_MODERATION';
  post.updatedAt = post.rejectedAt;

  return { success: true, post };
};

export const listStorePosts = async (query: StorePostListQuery) => {
  const store = getPostStore();
  let items = Array.from(store.posts.values());

  if (query.storefrontId) {
    items = items.filter(p => p.storefrontId === query.storefrontId);
  }
  if (query.creatorId) {
    items = items.filter(p => p.creatorId === query.creatorId);
  }
  
  const isPublicList = !query.status || query.status === 'PUBLISHED';

  if (isPublicList) {
    items = items.filter(p => {
      const isPublished = p.status === 'PUBLISHED';
      const isApproved = p.moderationStatus === 'APPROVED' || p.moderationStatus === 'NOT_REQUIRED';
      const visible = isPublished && isApproved;
      if (!visible) {
        console.log(`[PostService] Filtered out ${p.postId}: status=${p.status}, moderationStatus=${p.moderationStatus}`);
      }
      return visible;
    });
  } else if (query.status) {
    items = items.filter(p => p.status === query.status);
  } else {
    items = [];
  }
  
  items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const limit = query.limit || 20;
  items = items.slice(0, limit);

  return { items };
};

export const getStorePostById = async (postId: string) => {
  return getPostStore().posts.get(postId);
};

export const transitionStorePost = async (command: StorePostTransitionCommand): Promise<StorePostMutationResult> => {
  const store = getPostStore();
  const post = store.posts.get(command.postId);

  if (!post) return { success: false, errors: ['POST_NOT_FOUND'] };

  const currentStatus = post.status;
  const targetStatus = command.targetStatus;

  const allowedTransitions: Record<StorePostStatus, StorePostStatus[]> = {
    'DRAFT': ['SUBMITTED', 'ARCHIVED'],
    'SUBMITTED': ['UNDER_REVIEW', 'ARCHIVED'],
    'UNDER_REVIEW': ['PUBLISHED', 'REJECTED', 'ARCHIVED'],
    'PUBLISHED': ['HIDDEN', 'ARCHIVED'],
    'REJECTED': ['ARCHIVED'],
    'HIDDEN': ['PUBLISHED', 'ARCHIVED'],
    'ARCHIVED': []
  };

  if (!allowedTransitions[currentStatus]?.includes(targetStatus)) {
    return { success: false, errors: ['INVALID_TRANSITION'], post };
  }

  const now = new Date().toISOString();
  post.status = targetStatus;
  post.updatedAt = now;

  if (targetStatus === 'PUBLISHED') {
    // post.moderationStatus = 'APPROVED'; // HANDENING-06A: Domain should not set approved/rejected directly
    post.publishedAt = now;
  } else if (targetStatus === 'REJECTED') {
    // post.moderationStatus = 'REJECTED'; // HANDENING-06A: Domain should not set approved/rejected directly
    post.rejectedAt = now;
    post.rejectionReason = command.note || 'REJECTED_BY_MODERATION';
  } else if (targetStatus === 'ARCHIVED') {
    post.archivedAt = now;
  }

  return { success: true, post };
};
