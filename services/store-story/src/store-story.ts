import {
  StoreStory,
  StoreStoryModerationStatus,
  StoreStoryType,
  StoreStoryStatus,
  StoreStoryVisibilityState,
  CreateStoreStoryCommand,
  PublishStoreStoryCommand,
  UnpublishStoreStoryCommand,
  ArchiveStoreStoryCommand,
  ReorderStoreStoriesCommand,
  StoreStoryResult,
  StoreStoryErrorCode,
} from '@hx/contracts';

const stories: StoreStory[] = [];

export const createStoreStory = async (
  storefrontId: string,
  cmd: CreateStoreStoryCommand
): Promise<StoreStoryResult<StoreStory>> => {
  if (!cmd.mediaAssetId) {
    return {
      success: false,
      error: { code: StoreStoryErrorCode.MEDIA_REQUIRED, message: 'mediaAssetId is required' },
    };
  }

  if (cmd.type === StoreStoryType.PRODUCT_PROMOTION && !cmd.creatorStoreProductId) {
    return {
      success: false,
      error: { code: StoreStoryErrorCode.PRODUCT_REQUIRED, message: 'creatorStoreProductId is required for PRODUCT_PROMOTION' },
    };
  }

  if (cmd.displayOrder !== undefined && cmd.displayOrder < 0) {
    return {
      success: false,
      error: { code: StoreStoryErrorCode.INVALID_DISPLAY_ORDER, message: 'displayOrder must be >= 0' },
    };
  }

  if (cmd.caption && cmd.caption.length > 500) {
    return {
      success: false,
      error: { code: StoreStoryErrorCode.CAPTION_TOO_LONG, message: 'caption max length 500' },
    };
  }

  const newStory: StoreStory = {
    id: `story_${Math.random().toString(36).substr(2, 9)}`,
    storefrontId,
    type: cmd.type,
    status: StoreStoryStatus.DRAFT,
    moderationStatus: StoreStoryModerationStatus.PENDING,
    visibilityState: StoreStoryVisibilityState.NOT_VISIBLE,
    mediaAssetId: cmd.mediaAssetId,
    mediaVisibilityReady: cmd.mediaVisibilityReady === true,
    creatorStoreProductId: cmd.creatorStoreProductId,
    caption: cmd.caption,
    displayOrder: cmd.displayOrder ?? 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  stories.push(newStory);

  return { success: true, data: newStory };
};

export const publishStoreStory = async (
  storefrontId: string,
  cmd: PublishStoreStoryCommand
): Promise<StoreStoryResult<StoreStory>> => {
  const story = stories.find((s) => s.id === cmd.storeStoryId);

  if (!story) {
    return { success: false, error: { code: StoreStoryErrorCode.NOT_FOUND, message: 'Story not found' } };
  }

  if (story.storefrontId !== storefrontId) {
    return { success: false, error: { code: StoreStoryErrorCode.UNAUTHORIZED, message: 'Unauthorized' } };
  }

  if (story.status === StoreStoryStatus.ARCHIVED) {
    return { success: false, error: { code: StoreStoryErrorCode.ALREADY_ARCHIVED, message: 'Archived story cannot be published' } };
  }

  if (story.moderationStatus !== StoreStoryModerationStatus.APPROVED) {
    return { success: false, error: { code: StoreStoryErrorCode.MODERATION_NOT_APPROVED, message: 'Story moderation must be approved before publish' } };
  }

  if (!story.mediaVisibilityReady) {
    return { success: false, error: { code: StoreStoryErrorCode.MEDIA_NOT_VISIBILITY_READY, message: 'Story media must be visibility-ready before publish' } };
  }

  story.status = StoreStoryStatus.PUBLISHED;
  story.visibilityState = StoreStoryVisibilityState.VISIBLE;
  story.updatedAt = new Date();

  return { success: true, data: story };
};

export const unpublishStoreStory = async (
  storefrontId: string,
  cmd: UnpublishStoreStoryCommand
): Promise<StoreStoryResult<StoreStory>> => {
  const story = stories.find((s) => s.id === cmd.storeStoryId);

  if (!story) {
    return { success: false, error: { code: StoreStoryErrorCode.NOT_FOUND, message: 'Story not found' } };
  }

  if (story.storefrontId !== storefrontId) {
    return { success: false, error: { code: StoreStoryErrorCode.UNAUTHORIZED, message: 'Unauthorized' } };
  }

  if (!cmd.reason) {
    return { success: false, error: { code: StoreStoryErrorCode.UNPUBLISH_REASON_REQUIRED, message: 'reason is required' } };
  }

  story.status = StoreStoryStatus.UNPUBLISHED;
  story.visibilityState = StoreStoryVisibilityState.NOT_VISIBLE;
  story.unpublishReason = cmd.reason;
  story.updatedAt = new Date();

  return { success: true, data: story };
};

export const archiveStoreStory = async (
  storefrontId: string,
  cmd: ArchiveStoreStoryCommand
): Promise<StoreStoryResult<StoreStory>> => {
  const story = stories.find((s) => s.id === cmd.storeStoryId);

  if (!story) {
    return { success: false, error: { code: StoreStoryErrorCode.NOT_FOUND, message: 'Story not found' } };
  }

  if (story.storefrontId !== storefrontId) {
    return { success: false, error: { code: StoreStoryErrorCode.UNAUTHORIZED, message: 'Unauthorized' } };
  }

  story.status = StoreStoryStatus.ARCHIVED;
  story.visibilityState = StoreStoryVisibilityState.ARCHIVED;
  story.updatedAt = new Date();

  return { success: true, data: story };
};

export const reorderStoreStories = async (
  storefrontId: string,
  cmd: ReorderStoreStoriesCommand
): Promise<StoreStoryResult<void>> => {
  const storefrontStories = stories.filter((s) => s.storefrontId === storefrontId);
  const storefrontStoryIds = storefrontStories.map((s) => s.id);

  // Duplicate check
  const uniqueIds = new Set(cmd.storeStoryIds);
  if (uniqueIds.size !== cmd.storeStoryIds.length) {
    return { success: false, error: { code: StoreStoryErrorCode.DUPLICATE_ID, message: 'Duplicate IDs in reorder' } };
  }

  // Foreign/Missing check
  for (const id of cmd.storeStoryIds) {
    if (!storefrontStoryIds.includes(id)) {
      return { success: false, error: { code: StoreStoryErrorCode.FOREIGN_STORY, message: 'Foreign or missing story ID' } };
    }
  }

  // Apply reorder
  cmd.storeStoryIds.forEach((id: string, index: number) => {
    const story = stories.find((s) => s.id === id);
    if (story) {
      story.displayOrder = index;
      story.updatedAt = new Date();
    }
  });

  return { success: true };
};

export const getStoreStory = async (
  storefrontId: string,
  storeStoryId: string
): Promise<StoreStoryResult<StoreStory>> => {
  const story = stories.find((s) => s.id === storeStoryId);

  if (!story) {
    return { success: false, error: { code: StoreStoryErrorCode.NOT_FOUND, message: 'Story not found' } };
  }

  if (story.storefrontId !== storefrontId) {
    return { success: false, error: { code: StoreStoryErrorCode.UNAUTHORIZED, message: 'Unauthorized' } };
  }

  return { success: true, data: story };
};

export const listStoreStoriesForStorefront = async (
  storefrontId: string
): Promise<StoreStoryResult<StoreStory[]>> => {
  const list = stories
    .filter((s) => s.storefrontId === storefrontId)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return { success: true, data: list };
};

export const listPublishedStoreStoriesForPublicStorefront = async (
  storefrontId: string
): Promise<StoreStoryResult<StoreStory[]>> => {
  const list = stories
    .filter((s) =>
      s.storefrontId === storefrontId &&
      s.status === StoreStoryStatus.PUBLISHED &&
      s.moderationStatus === StoreStoryModerationStatus.APPROVED &&
      s.visibilityState === StoreStoryVisibilityState.VISIBLE &&
      s.mediaVisibilityReady
    )
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return { success: true, data: list };
};

export const approveStoreStoryModerationResult = async (
  storefrontId: string,
  storeStoryId: string
): Promise<StoreStoryResult<StoreStory>> => {
  const story = stories.find((s) => s.id === storeStoryId);

  if (!story) {
    return { success: false, error: { code: StoreStoryErrorCode.NOT_FOUND, message: 'Story not found' } };
  }

  if (story.storefrontId !== storefrontId) {
    return { success: false, error: { code: StoreStoryErrorCode.UNAUTHORIZED, message: 'Unauthorized' } };
  }

  story.moderationStatus = StoreStoryModerationStatus.APPROVED;
  story.updatedAt = new Date();

  return { success: true, data: story };
};

export const rejectStoreStoryModerationResult = async (
  storefrontId: string,
  storeStoryId: string,
  reason?: string
): Promise<StoreStoryResult<StoreStory>> => {
  const story = stories.find((s) => s.id === storeStoryId);

  if (!story) {
    return { success: false, error: { code: StoreStoryErrorCode.NOT_FOUND, message: 'Story not found' } };
  }

  if (story.storefrontId !== storefrontId) {
    return { success: false, error: { code: StoreStoryErrorCode.UNAUTHORIZED, message: 'Unauthorized' } };
  }

  story.moderationStatus = StoreStoryModerationStatus.REJECTED;
  story.visibilityState = StoreStoryVisibilityState.NOT_VISIBLE;
  story.unpublishReason = reason;
  story.updatedAt = new Date();

  return { success: true, data: story };
};
