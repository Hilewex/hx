export enum StorePostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  HIDDEN = 'HIDDEN',
  ARCHIVED = 'ARCHIVED',
}

export interface StorePostMediaRef {
  type: 'IMAGE' | 'VIDEO';
  url: string;
  displayOrder: number;
}

export interface StorePostProductRef {
  productId: string;
  displayOrder: number;
}

export interface StorePost {
  id: string;
  storefrontId: string;
  creatorId: string;
  title: string;
  body: string;
  status: StorePostStatus;
  mediaRefs: StorePostMediaRef[];
  productRefs: StorePostProductRef[];
  displayOrder: number;
  hideReason?: string;
  archiveReason?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface CreateStorePostCommandV2 {
  storefrontId: string;
  creatorId: string;
  title: string;
  body: string;
  mediaRefs: StorePostMediaRef[];
  productRefs: StorePostProductRef[];
  displayOrder?: number;
}

export interface PublishStorePostCommand {
  storePostId: string;
  storefrontId: string;
  creatorId: string;
}

export interface HideStorePostCommand {
  storePostId: string;
  storefrontId: string;
  creatorId: string;
  reason: string;
}

export interface ArchiveStorePostCommand {
  storePostId: string;
  storefrontId: string;
  creatorId: string;
  reason: string;
}

export interface ReorderStorePostsCommand {
  storefrontId: string;
  creatorId: string;
  orderedIds: string[];
}

export interface ListFollowFeedPostsQuery {
  followerId: string;
  limit?: number;
  cursor?: string;
}

export enum StorePostErrorCode {
  POST_NOT_FOUND = 'POST_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_BODY = 'INVALID_BODY',
  INVALID_TITLE = 'INVALID_TITLE',
  INVALID_DISPLAY_ORDER = 'INVALID_DISPLAY_ORDER',
  DUPLICATE_MEDIA = 'DUPLICATE_MEDIA',
  DUPLICATE_PRODUCT = 'DUPLICATE_PRODUCT',
  ARCHIVED_CANNOT_PUBLISH = 'ARCHIVED_CANNOT_PUBLISH',
  REASON_REQUIRED = 'REASON_REQUIRED',
  REORDER_MISMATCH = 'REORDER_MISMATCH',
}
