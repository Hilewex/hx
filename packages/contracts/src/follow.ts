export type FollowActorType = 'CUSTOMER' | 'SYSTEM';

export type FollowTargetType = 'CREATOR_STOREFRONT';

export type FollowState = 'ACTIVE' | 'REMOVED';

export type FollowVisibility = 'PRIVATE_RELATIONSHIP' | 'AGGREGATE_VISIBLE';

export interface FollowTargetRef {
  targetType: FollowTargetType;
  storefrontId: string;
  creatorId?: string;
}

export interface FollowRecord {
  followId: string;
  actorId: string;
  actorType: FollowActorType;
  target: FollowTargetRef;
  state: FollowState;
  visibility: FollowVisibility;
  createdAt: string;
  updatedAt: string;
  removedAt?: string;
  idempotencyKey?: string;
  postTruthMutated: false;
  interactionTruthMutated: false;
  rankingTruthMutated: false;
  notificationEmitted: false;
  errors?: string[];
  warnings?: string[];
}

export interface FollowCreatorCommand {
  actorId?: string;
  actorType?: FollowActorType;
  target: FollowTargetRef;
  idempotencyKey?: string;
}

export interface UnfollowCreatorCommand {
  actorId?: string;
  target: {
    storefrontId: string;
  };
  idempotencyKey?: string;
}

export interface GetFollowStateQuery {
  actorId?: string;
  storefrontId: string;
}

export interface ListFollowingQuery {
  actorId: string;
  state?: FollowState;
  limit?: number;
  cursor?: string;
}

export interface FollowMutationResult {
  success: boolean;
  follow?: FollowRecord;
  state?: FollowState;
  errors?: string[];
  warnings?: string[];
}

export interface FollowStateResponse {
  actorId?: string;
  storefrontId: string;
  state?: FollowState;
  isFollowing: boolean;
  warnings?: string[];
}

export interface FollowingListResponse {
  items: FollowRecord[];
  nextCursor?: string;
  warnings?: string[];
}
