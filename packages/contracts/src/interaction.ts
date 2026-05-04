export type InteractionActorType = 
  | 'CUSTOMER'
  | 'CREATOR'
  | 'ADMIN'
  | 'SYSTEM';

export type InteractionTargetType = 
  | 'PRODUCT'
  | 'STORE_POST'
  | 'USER_PRODUCT_STORY'
  | 'STORE_STORY'
  | 'VIDEO_PRODUCT_CARD'
  | 'REVIEW'
  | 'QA_QUESTION'
  | 'QA_ANSWER';

export type InteractionActionType = 
  | 'LIKE'
  | 'SAVE'
  | 'SHARE'
  | 'HELPFUL'
  | 'VOTE_UP'
  | 'VOTE_DOWN';

export type InteractionState = 
  | 'ACTIVE'
  | 'REMOVED';

export type InteractionVisibility = 
  | 'PRIVATE'
  | 'PUBLIC_AGGREGATE_ONLY';

export interface InteractionTargetRef {
  targetType: InteractionTargetType;
  targetId: string;
  productId?: string;
  storefrontId?: string;
  variantId?: string;
  contextSurface?: string;
  metadata?: Record<string, any>;
}

export interface InteractionRecord {
  interactionId: string;
  actorId: string;
  actorType: InteractionActorType;
  target: InteractionTargetRef;
  actionType: InteractionActionType;
  state: InteractionState;
  visibility: InteractionVisibility;
  createdAt: string;
  updatedAt: string;
  removedAt?: string;
  idempotencyKey?: string;
  optimisticClientMutationId?: string;
  contentTruthMutated: false;
  ratingTruthMutated: false;
  qaTruthMutated: false;
  supportProcess: false;
  notificationEmitted: false;
  errors: string[];
  warnings: string[];
}

export interface InteractionCounterSummary {
  targetType: InteractionTargetType;
  targetId: string;
  likeCount: number;
  saveCount: number;
  shareCount: number;
  helpfulCount: number;
  voteUpCount: number;
  voteDownCount: number;
  lastCalculatedAt: string;
}

export interface ToggleInteractionCommand {
  actorId: string;
  actorType?: InteractionActorType;
  target: InteractionTargetRef;
  actionType: InteractionActionType;
  idempotencyKey?: string;
  optimisticClientMutationId?: string;
}

export interface RemoveInteractionCommand {
  actorId: string;
  target: InteractionTargetRef;
  actionType: InteractionActionType;
  idempotencyKey?: string;
}

export interface ShareInteractionCommand {
  actorId: string;
  actorType?: InteractionActorType;
  target: InteractionTargetRef;
  channel?: string;
  idempotencyKey?: string;
  optimisticClientMutationId?: string;
}

export interface GetInteractionStateQuery {
  actorId?: string;
  targetType: InteractionTargetType;
  targetId: string;
}

export interface ListActorInteractionsQuery {
  actorId: string;
  actionType?: InteractionActionType;
  targetType?: InteractionTargetType;
  state?: InteractionState;
  limit?: number;
  cursor?: string;
}

export interface InteractionMutationResult {
  success: boolean;
  interaction?: InteractionRecord;
  state?: InteractionState;
  counters?: InteractionCounterSummary;
  errors?: string[];
  warnings?: string[];
}

export interface InteractionStateResponse {
  target: InteractionTargetRef;
  actorState?: {
    [key in InteractionActionType]?: InteractionState;
  };
  counters: InteractionCounterSummary;
  warnings?: string[];
}

export interface ActorInteractionListResponse {
  items: InteractionRecord[];
  nextCursor?: string;
  warnings?: string[];
}
