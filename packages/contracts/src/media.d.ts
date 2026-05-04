export declare enum MediaAssetType {
    IMAGE = "IMAGE",
    VIDEO = "VIDEO"
}
export declare enum MediaOwnerType {
    PRODUCT = "PRODUCT",
    STOREFRONT = "STOREFRONT",
    STORY = "STORY",
    POST = "POST",
    UGC = "UGC",
    CAMPAIGN = "CAMPAIGN",
    CATEGORY = "CATEGORY",
    SYSTEM = "SYSTEM"
}
export declare enum MediaSourceType {
    SUPPLIER_PANEL = "SUPPLIER_PANEL",
    CREATOR_PANEL = "CREATOR_PANEL",
    USER_UPLOAD = "USER_UPLOAD",
    ADMIN_PANEL = "ADMIN_PANEL",
    API_IMPORT = "API_IMPORT",
    SYSTEM_SEED = "SYSTEM_SEED"
}
export declare enum MediaAssetStatus {
    UPLOADED = "UPLOADED",
    VALIDATING = "VALIDATING",
    VALIDATION_FAILED = "VALIDATION_FAILED",
    PROCESSING = "PROCESSING",
    PROCESSED = "PROCESSED",
    PENDING_REVIEW = "PENDING_REVIEW",
    APPROVED = "APPROVED",
    RESTRICTED = "RESTRICTED",
    REJECTED = "REJECTED",
    ARCHIVED = "ARCHIVED",
    DELETED = "DELETED"
}
export declare enum MediaModerationStatus {
    NOT_REQUIRED = "NOT_REQUIRED",
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    RESTRICTED = "RESTRICTED"
}
export declare enum MediaProcessingState {
    NOT_STARTED = "NOT_STARTED",
    VALIDATING = "VALIDATING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    SKIPPED_FOUNDATION = "SKIPPED_FOUNDATION"
}
export declare enum MediaStorageTier {
    HOT = "HOT",
    WARM = "WARM",
    COLD = "COLD"
}
export declare enum MediaSurface {
    PRODUCT_CARD = "PRODUCT_CARD",
    VIDEO_PRODUCT_CARD = "VIDEO_PRODUCT_CARD",
    PDP_GALLERY = "PDP_GALLERY",
    STORY_FULLSCREEN = "STORY_FULLSCREEN",
    POST_CARD = "POST_CARD",
    STOREFRONT_HEADER = "STOREFRONT_HEADER",
    CATEGORY_BANNER = "CATEGORY_BANNER",
    HOME_PROMO = "HOME_PROMO"
}
export declare enum MediaVariantKind {
    ORIGINAL = "ORIGINAL",
    THUMBNAIL = "THUMBNAIL",
    POSTER = "POSTER",
    WEB_OPTIMIZED = "WEB_OPTIMIZED",
    MOBILE_OPTIMIZED = "MOBILE_OPTIMIZED",
    PREVIEW = "PREVIEW",
    STREAM_720P = "STREAM_720P",
    STREAM_1080P = "STREAM_1080P"
}
export declare enum MediaAspectRatio {
    SQUARE = "SQUARE",
    PORTRAIT = "PORTRAIT",
    LANDSCAPE = "LANDSCAPE",
    STORY_VERTICAL = "STORY_VERTICAL",
    FREEFORM = "FREEFORM"
}
export interface MediaVariantRef {
    variantId: string;
    kind: MediaVariantKind;
    url?: string;
    width?: number;
    height?: number;
    durationSeconds?: number;
    mimeType?: string;
    surface?: MediaSurface;
    generated: boolean;
    simulationOnly: true;
    warnings?: string[];
}
export interface MediaAssetRecord {
    assetId: string;
    ownerType: MediaOwnerType;
    ownerId: string;
    mediaType: MediaAssetType;
    sourceType: MediaSourceType;
    status: MediaAssetStatus;
    moderationStatus: MediaModerationStatus;
    processingState: MediaProcessingState;
    storageTier: MediaStorageTier;
    originalFileRef: string;
    variants: MediaVariantRef[];
    allowedSurfaces: MediaSurface[];
    aspectRatio?: MediaAspectRatio;
    durationSeconds?: number;
    mimeType?: string;
    fileSizeBytes?: number;
    width?: number;
    height?: number;
    createdAt: string;
    updatedAt: string;
    validatedAt?: string;
    processedAt?: string;
    archivedAt?: string;
    visibilityReady: boolean;
    moderationReady: boolean;
    assetTruth: true;
    contentTruthMutated: false;
    storyTruthMutated: false;
    postTruthMutated: false;
    ugcTruthMutated: false;
    productTruthMutated: false;
    storefrontTruthMutated: false;
    moderationDecisionTruthMutated: false;
    warnings?: string[];
}
export interface MediaValidationIssue {
    code: string;
    message: string;
    severity: 'WARNING' | 'ERROR';
    blocking: boolean;
}
export interface MediaUploadIntakeCommand {
    ownerType: MediaOwnerType;
    ownerId: string;
    mediaType: MediaAssetType;
    sourceType: MediaSourceType;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    width?: number;
    height?: number;
    durationSeconds?: number;
    requestedSurfaces?: MediaSurface[];
    idempotencyKey?: string;
}
export interface MediaUploadIntakeResult {
    success: boolean;
    asset?: MediaAssetRecord;
    validationIssues?: MediaValidationIssue[];
    errors?: string[];
    warnings?: string[];
}
export interface MediaProcessCommand {
    assetId: string;
    requestedVariants?: MediaVariantKind[];
    idempotencyKey?: string;
}
export interface MediaProcessResult {
    success: boolean;
    asset?: MediaAssetRecord;
    generatedVariants?: MediaVariantRef[];
    errors?: string[];
    warnings?: string[];
}
export interface MediaAssetQuery {
    assetId: string;
}
export interface MediaAssetListQuery {
    ownerType?: MediaOwnerType;
    ownerId?: string;
    mediaType?: MediaAssetType;
    status?: MediaAssetStatus;
    moderationStatus?: MediaModerationStatus;
    storageTier?: MediaStorageTier;
    visibilityReady?: boolean;
    limit?: number;
    cursor?: string;
}
export interface MediaAssetResponse {
    asset?: MediaAssetRecord;
    errors?: string[];
    warnings?: string[];
}
export interface MediaAssetListResponse {
    items: MediaAssetRecord[];
    nextCursor?: string;
    warnings?: string[];
}
export interface MediaVisibilityResponse {
    assetId: string;
    visibilityReady: boolean;
    moderationReady: boolean;
    allowedSurfaces: MediaSurface[];
    servingVariants: MediaVariantRef[];
    warnings?: string[];
}
//# sourceMappingURL=media.d.ts.map