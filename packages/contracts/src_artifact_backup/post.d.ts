export type StorePostType = 'ANNOUNCEMENT' | 'PRODUCT_LINKED' | 'COLLECTION' | 'CAMPAIGN_NEWS' | 'STORE_UPDATE';
export type StorePostStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'HIDDEN' | 'ARCHIVED';
export type StorePostVisibility = 'FOLLOWERS_ONLY' | 'STORE_PROFILE' | 'INTERNAL_ONLY';
export type StorePostModerationStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type StorePostMediaType = 'IMAGE' | 'VIDEO';
export type StorePostLinkedObjectType = 'PRODUCT' | 'STORE' | 'COLLECTION' | 'NONE';
export interface StorePostMediaRef {
    mediaId: string;
    mediaType: StorePostMediaType;
    url?: string;
    thumbnailUrl?: string;
    altText?: string;
    simulationOnly: true;
}
export interface StorePostLinkedObjectRef {
    objectType: StorePostLinkedObjectType;
    objectId?: string;
    storefrontId?: string;
    productId?: string;
    collectionId?: string;
}
export interface StorePostRecord {
    postId: string;
    creatorId: string;
    storefrontId: string;
    postType: StorePostType;
    status: StorePostStatus;
    visibility: StorePostVisibility;
    moderationStatus: StorePostModerationStatus;
    title: string;
    body: string;
    media: StorePostMediaRef[];
    linkedObject?: StorePostLinkedObjectRef;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    archivedAt?: string;
    idempotencyKey?: string;
    socialThreadEnabled: false;
    officialStoreCommunication: true;
    supportProcess: false;
    qnaProcess: false;
    storyProcess: false;
    errors?: string[];
    warnings?: string[];
}
export interface CreateStorePostCommand {
    creatorId: string;
    storefrontId: string;
    postType: StorePostType;
    title: string;
    body: string;
    media?: StorePostMediaRef[];
    linkedObject?: StorePostLinkedObjectRef;
    visibility?: StorePostVisibility;
    idempotencyKey?: string;
}
export interface StorePostListQuery {
    storefrontId?: string;
    creatorId?: string;
    followerActorId?: string;
    status?: StorePostStatus;
    postType?: StorePostType;
    limit?: number;
    cursor?: string;
}
export interface StorePostListResponse {
    items: StorePostRecord[];
    nextCursor?: string;
    warnings?: string[];
}
export interface StorePostTransitionCommand {
    postId: string;
    targetStatus: StorePostStatus;
    actorType?: string;
    actorId?: string;
    reasonCode?: string;
    note?: string;
}
export interface StorePostMutationResult {
    success: boolean;
    post?: StorePostRecord;
    errors?: string[];
    warnings?: string[];
}
//# sourceMappingURL=post.d.ts.map