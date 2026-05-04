import { 
  StorePostV2
} from '@hx/contracts';

// In-memory storage
const storePosts: StorePostV2.StorePost[] = [];

export const createStorePost = async (command: StorePostV2.CreateStorePostCommandV2): Promise<StorePostV2.StorePost> => {
  if (!command.body || command.body.trim().length === 0) {
    throw new Error(StorePostV2.StorePostErrorCode.INVALID_BODY);
  }
  if (command.body.length > 5000) {
    throw new Error(StorePostV2.StorePostErrorCode.INVALID_BODY);
  }
  if (command.title.length > 200) {
    throw new Error(StorePostV2.StorePostErrorCode.INVALID_TITLE);
  }
  if (command.displayOrder !== undefined && command.displayOrder < 0) {
    throw new Error(StorePostV2.StorePostErrorCode.INVALID_DISPLAY_ORDER);
  }

  // Media duplicate guard
  const mediaUrls = command.mediaRefs.map((m: StorePostV2.StorePostMediaRef) => m.url);
  if (new Set(mediaUrls).size !== mediaUrls.length) {
    throw new Error(StorePostV2.StorePostErrorCode.DUPLICATE_MEDIA);
  }

  // Product duplicate guard
  const productIds = command.productRefs.map((p: StorePostV2.StorePostProductRef) => p.productId);
  if (new Set(productIds).size !== productIds.length) {
    throw new Error(StorePostV2.StorePostErrorCode.DUPLICATE_PRODUCT);
  }

  const post: StorePostV2.StorePost = {
    id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    storefrontId: command.storefrontId,
    creatorId: command.creatorId,
    title: command.title,
    body: command.body,
    status: StorePostV2.StorePostStatus.DRAFT,
    mediaRefs: command.mediaRefs,
    productRefs: command.productRefs,
    displayOrder: command.displayOrder ?? 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  storePosts.push(post);
  return post;
};

export const publishStorePost = async (command: StorePostV2.PublishStorePostCommand): Promise<StorePostV2.StorePost> => {
  const post = storePosts.find(p => p.id === command.storePostId && p.storefrontId === command.storefrontId);
  if (!post) throw new Error(StorePostV2.StorePostErrorCode.POST_NOT_FOUND);
  
  if (post.status === StorePostV2.StorePostStatus.ARCHIVED) {
    throw new Error(StorePostV2.StorePostErrorCode.ARCHIVED_CANNOT_PUBLISH);
  }

  post.status = StorePostV2.StorePostStatus.PUBLISHED;
  post.publishedAt = new Date();
  post.updatedAt = new Date();
  return post;
};

export const hideStorePost = async (command: StorePostV2.HideStorePostCommand): Promise<StorePostV2.StorePost> => {
  const post = storePosts.find(p => p.id === command.storePostId && p.storefrontId === command.storefrontId);
  if (!post) throw new Error(StorePostV2.StorePostErrorCode.POST_NOT_FOUND);
  
  if (!command.reason || command.reason.trim().length === 0) {
    throw new Error(StorePostV2.StorePostErrorCode.REASON_REQUIRED);
  }

  post.status = StorePostV2.StorePostStatus.HIDDEN;
  post.hideReason = command.reason;
  post.updatedAt = new Date();
  return post;
};

export const archiveStorePost = async (command: StorePostV2.ArchiveStorePostCommand): Promise<StorePostV2.StorePost> => {
  const post = storePosts.find(p => p.id === command.storePostId && p.storefrontId === command.storefrontId);
  if (!post) throw new Error(StorePostV2.StorePostErrorCode.POST_NOT_FOUND);
  
  if (!command.reason || command.reason.trim().length === 0) {
    throw new Error(StorePostV2.StorePostErrorCode.REASON_REQUIRED);
  }

  post.status = StorePostV2.StorePostStatus.ARCHIVED;
  post.archiveReason = command.reason;
  post.updatedAt = new Date();
  return post;
};

export const reorderStorePosts = async (command: StorePostV2.ReorderStorePostsCommand): Promise<void> => {
  const storefrontPosts = storePosts.filter(p => p.storefrontId === command.storefrontId);
  const storefrontPostIds = storefrontPosts.map(p => p.id);

  // Reorder duplicate/foreign guard
  if (command.orderedIds.length !== storefrontPostIds.length) {
    throw new Error(StorePostV2.StorePostErrorCode.REORDER_MISMATCH);
  }

  const hasAll = command.orderedIds.every((id: string) => storefrontPostIds.includes(id));
  const uniqueOrdered = new Set(command.orderedIds).size === command.orderedIds.length;

  if (!hasAll || !uniqueOrdered) {
    throw new Error(StorePostV2.StorePostErrorCode.REORDER_MISMATCH);
  }

  command.orderedIds.forEach((id: string, index: number) => {
    const post = storePosts.find(p => p.id === id);
    if (post) {
      post.displayOrder = index;
      post.updatedAt = new Date();
    }
  });
};

export const getStorePost = async (id: string): Promise<StorePostV2.StorePost | null> => {
  return storePosts.find(p => p.id === id) || null;
};

export const listStorePostsForStorefront = async (storefrontId: string): Promise<StorePostV2.StorePost[]> => {
  return storePosts
    .filter(p => p.storefrontId === storefrontId)
    .sort((a, b) => a.displayOrder - b.displayOrder);
};

export const listPublishedStorePostsForPublicStorefront = async (storefrontId: string): Promise<StorePostV2.StorePost[]> => {
  // Public list only PUBLISHED
  return storePosts
    .filter(p => p.storefrontId === storefrontId && p.status === StorePostV2.StorePostStatus.PUBLISHED)
    .sort((a, b) => a.displayOrder - b.displayOrder);
};

export const listFollowFeedPosts = async (followedStorefrontIds: string[]): Promise<StorePostV2.StorePost[]> => {
  // Follow feed only followed storefront PUBLISHED posts
  return storePosts
    .filter(p => followedStorefrontIds.includes(p.storefrontId) && p.status === StorePostV2.StorePostStatus.PUBLISHED)
    .sort((a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0));
};
