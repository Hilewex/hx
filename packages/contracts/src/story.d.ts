export type StoryType = 'STORE_INTRO' | 'STORE_PRODUCT' | 'USER_PRODUCT';
export type StoryStatus = 'ACTIVE' | 'HIDDEN' | 'EXPIRED' | 'ARCHIVED';
export type StorySurface = 'HOME' | 'DISCOVER' | 'STOREFRONT' | 'PDP';
export type StoryMediaType = 'IMAGE' | 'VIDEO';
export type StoryContextType = 'STORE' | 'PRODUCT' | 'USER_PRODUCT_EXPERIENCE';
export interface StoryInteractionCapability {
    canLike: boolean;
    canSave: boolean;
    canShare: boolean;
    canFollowStore: boolean;
    canGoStorefront: boolean;
    canGoPdp: boolean;
    canAddToCart: boolean;
}
export interface StoryMediaRef {
    mediaId: string;
    mediaType: StoryMediaType;
    url?: string;
    thumbnailUrl?: string;
    assetTruth: false;
    mediaProcessingTruthMutated: false;
    simulationOnly: true;
    warnings?: string[];
}
export interface StoryTargetRef {
    storefrontId?: string;
    creatorId?: string;
    productId?: string;
    pdpTarget?: {
        productId: string;
        storefrontId?: string;
        storeContextRequired: true;
    };
    storefrontTarget?: {
        storefrontId: string;
        slug?: string;
    };
}
export interface StoryRecord {
    storyId: string;
    type: StoryType;
    status: StoryStatus;
    surfaceScope: StorySurface[];
    contextType: StoryContextType;
    storefrontId?: string;
    creatorId?: string;
    actorId?: string;
    productId?: string;
    title?: string;
    caption?: string;
    media: StoryMediaRef[];
    target?: StoryTargetRef;
    interactionCapabilities: StoryInteractionCapability;
    createdAt: string;
    expiresAt?: string;
    storyProjection: true;
    storyTruth: false;
    assetTruthMutated: false;
    moderationTruthMutated: false;
    productTruthMutated: false;
    storefrontTruthMutated: false;
    postTruthMutated: false;
    feedTruthMutated: false;
    warnings?: string[];
}
export interface StoryTrayItem {
    trayItemId: string;
    storefrontId?: string;
    actorId?: string;
    label: string;
    avatarUrl?: string;
    hasUnseen: boolean;
    storyIds: string[];
    storyType: StoryType;
    surface: StorySurface;
    storyRingProjection: true;
    storefrontTruthMutated: false;
    warnings?: string[];
}
export interface StoryViewerItem {
    storyId: string;
    type: StoryType;
    media: StoryMediaRef[];
    title?: string;
    caption?: string;
    target?: StoryTargetRef;
    interactionCapabilities: StoryInteractionCapability;
    progressIndex: number;
    totalInGroup: number;
    viewerContext: {
        openedFrom: StorySurface;
        contextPreserved: true;
        pcPresentation: 'MODAL';
        mobilePresentation: 'FULLSCREEN';
    };
    storyProjection: true;
    warnings?: string[];
}
export interface StoryTrayQuery {
    surface: StorySurface;
    storefrontId?: string;
    productId?: string;
    actorId?: string;
    limit?: number;
    cursor?: string;
}
export interface StoryViewerQuery {
    storyId?: string;
    trayItemId?: string;
    surface: StorySurface;
    storefrontId?: string;
    productId?: string;
    actorId?: string;
}
export interface StoryTrayResponse {
    items: StoryTrayItem[];
    emptyState?: StoryEmptyState;
    warnings?: string[];
}
export interface StoryViewerResponse {
    items: StoryViewerItem[];
    activeStoryId?: string;
    emptyState?: StoryEmptyState;
    warnings?: string[];
}
export type StoryEmptyStateCode = 'NO_STORIES' | 'STORY_NOT_FOUND' | 'SURFACE_NOT_SUPPORTED_FOUNDATION';
export interface StoryEmptyState {
    code: StoryEmptyStateCode;
    message: string;
    suggestedAction?: 'GO_HOME' | 'GO_STOREFRONT' | 'GO_PDP';
}
//# sourceMappingURL=story.d.ts.map