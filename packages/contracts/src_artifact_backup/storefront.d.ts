export interface StorefrontResponse {
    storefront?: {
        displayName: string;
    };
    productCards: any[];
    videoRail?: any[];
    posts?: any[];
    emptyState?: {
        code: string;
    };
    warnings?: string[];
    followState?: {
        isFollowing: boolean;
    };
}
export declare enum StorefrontStatus {
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED"
}
export declare enum StorefrontVisibility {
    PUBLIC = "PUBLIC",
    HIDDEN = "HIDDEN"
}
export interface CreatorStorefrontProfile {
    id: string;
    creatorId: string;
    slug: string;
    title: string;
    bio?: string;
    profileMediaAssetId?: string;
    coverMediaAssetId?: string;
    status: StorefrontStatus;
    visibility: StorefrontVisibility;
    suspendReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateCreatorStorefrontCommand {
    creatorId: string;
    slug: string;
    title: string;
    bio?: string;
    profileMediaAssetId?: string;
    coverMediaAssetId?: string;
}
export interface UpdateCreatorStorefrontProfileCommand {
    storefrontId: string;
    creatorId: string;
    title?: string;
    bio?: string;
    profileMediaAssetId?: string;
    coverMediaAssetId?: string;
    visibility?: StorefrontVisibility;
}
export interface SuspendCreatorStorefrontCommand {
    storefrontId: string;
    reason: string;
}
export interface ReactivateCreatorStorefrontCommand {
    storefrontId: string;
}
export type StorefrontResult<T> = {
    success: true;
    data: T;
} | {
    success: false;
    error: {
        code: StorefrontErrorCode;
        message: string;
    };
};
export declare enum StorefrontErrorCode {
    NOT_FOUND = "STOREFRONT_NOT_FOUND",
    SLUG_ALREADY_EXISTS = "SLUG_ALREADY_EXISTS",
    UNAUTHORIZED = "UNAUTHORIZED",
    ACCESS_DENIED = "ACCESS_DENIED",
    INVALID_INPUT = "INVALID_INPUT",
    ALREADY_EXISTS = "STOREFRONT_ALREADY_EXISTS"
}
//# sourceMappingURL=storefront.d.ts.map