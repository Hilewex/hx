import { StorePostType, StorePostMediaRef, StorePostLinkedObjectRef } from './post';

export interface FollowFeedItem {
  feedItemId: string;
  postId: string;
  storefrontId: string;
  creatorId: string;
  postType: StorePostType;
  title: string;
  body: string;
  media: StorePostMediaRef[];
  linkedObject?: StorePostLinkedObjectRef;
  publishedAt?: string;
  source: 'FOLLOWING_STORE_POST';
  postTruthCopied: false;
  feedTruth: false;
  interactionSummary?: {
    likeCount?: number;
    commentCount?: number;
    isLiked?: boolean;
  };
  warnings?: string[];
}

export interface FollowFeedQuery {
  actorId: string;
  limit?: number;
  cursor?: string;
}

export interface FollowFeedResponse {
  items: FollowFeedItem[];
  nextCursor?: string;
  emptyState?: FollowFeedEmptyState;
  warnings?: string[];
}

export interface FollowFeedEmptyState {
  code: 'NO_FOLLOWING' | 'NO_POSTS_FROM_FOLLOWING';
  message: string;
  suggestedSurface?: 'DISCOVER' | 'STORE_DISCOVERY';
}
