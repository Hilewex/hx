export enum StoreStoryType {
  STORE_INTRO = 'STORE_INTRO',
  PRODUCT_PROMOTION = 'PRODUCT_PROMOTION',
}

export enum StoreStoryStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  UNPUBLISHED = 'UNPUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum StoreStoryModerationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum StoreStoryVisibilityState {
  NOT_VISIBLE = 'NOT_VISIBLE',
  VISIBLE = 'VISIBLE',
  HIDDEN_BY_MODERATION = 'HIDDEN_BY_MODERATION',
  ARCHIVED = 'ARCHIVED',
}

export interface StoreStory {
  id: string;
  storefrontId: string;
  type: StoreStoryType;
  status: StoreStoryStatus;
  moderationStatus: StoreStoryModerationStatus;
  visibilityState: StoreStoryVisibilityState;
  mediaAssetId: string;
  mediaVisibilityReady: boolean;
  creatorStoreProductId?: string;
  caption?: string;
  displayOrder: number;
  unpublishReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStoreStoryCommand {
  type: StoreStoryType;
  mediaAssetId: string;
  mediaVisibilityReady?: boolean;
  creatorStoreProductId?: string;
  caption?: string;
  displayOrder?: number;
}

export interface PublishStoreStoryCommand {
  storeStoryId: string;
}

export interface UnpublishStoreStoryCommand {
  storeStoryId: string;
  reason: string;
}

export interface ArchiveStoreStoryCommand {
  storeStoryId: string;
}

export interface ReorderStoreStoriesCommand {
  storeStoryIds: string[];
}

export type StoreStoryResult<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: StoreStoryErrorCode;
    message: string;
  };
};

export enum StoreStoryErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  INVALID_TYPE = 'INVALID_TYPE',
  INVALID_STATUS = 'INVALID_STATUS',
  MEDIA_REQUIRED = 'MEDIA_REQUIRED',
  PRODUCT_REQUIRED = 'PRODUCT_REQUIRED',
  UNPUBLISH_REASON_REQUIRED = 'UNPUBLISH_REASON_REQUIRED',
  ALREADY_ARCHIVED = 'ALREADY_ARCHIVED',
  INVALID_DISPLAY_ORDER = 'INVALID_DISPLAY_ORDER',
  CAPTION_TOO_LONG = 'CAPTION_TOO_LONG',
  UNAUTHORIZED = 'UNAUTHORIZED',
  DUPLICATE_ID = 'DUPLICATE_ID',
  FOREIGN_STORY = 'FOREIGN_STORY',
  MODERATION_NOT_APPROVED = 'MODERATION_NOT_APPROVED',
  MEDIA_NOT_VISIBILITY_READY = 'MEDIA_NOT_VISIBILITY_READY',
}
