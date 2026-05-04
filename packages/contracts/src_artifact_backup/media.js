"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaAspectRatio = exports.MediaVariantKind = exports.MediaSurface = exports.MediaStorageTier = exports.MediaProcessingState = exports.MediaModerationStatus = exports.MediaAssetStatus = exports.MediaSourceType = exports.MediaOwnerType = exports.MediaAssetType = void 0;
var MediaAssetType;
(function (MediaAssetType) {
    MediaAssetType["IMAGE"] = "IMAGE";
    MediaAssetType["VIDEO"] = "VIDEO";
})(MediaAssetType || (exports.MediaAssetType = MediaAssetType = {}));
var MediaOwnerType;
(function (MediaOwnerType) {
    MediaOwnerType["PRODUCT"] = "PRODUCT";
    MediaOwnerType["STOREFRONT"] = "STOREFRONT";
    MediaOwnerType["STORY"] = "STORY";
    MediaOwnerType["POST"] = "POST";
    MediaOwnerType["UGC"] = "UGC";
    MediaOwnerType["CAMPAIGN"] = "CAMPAIGN";
    MediaOwnerType["CATEGORY"] = "CATEGORY";
    MediaOwnerType["SYSTEM"] = "SYSTEM";
})(MediaOwnerType || (exports.MediaOwnerType = MediaOwnerType = {}));
var MediaSourceType;
(function (MediaSourceType) {
    MediaSourceType["SUPPLIER_PANEL"] = "SUPPLIER_PANEL";
    MediaSourceType["CREATOR_PANEL"] = "CREATOR_PANEL";
    MediaSourceType["USER_UPLOAD"] = "USER_UPLOAD";
    MediaSourceType["ADMIN_PANEL"] = "ADMIN_PANEL";
    MediaSourceType["API_IMPORT"] = "API_IMPORT";
    MediaSourceType["SYSTEM_SEED"] = "SYSTEM_SEED";
})(MediaSourceType || (exports.MediaSourceType = MediaSourceType = {}));
var MediaAssetStatus;
(function (MediaAssetStatus) {
    MediaAssetStatus["UPLOADED"] = "UPLOADED";
    MediaAssetStatus["VALIDATING"] = "VALIDATING";
    MediaAssetStatus["VALIDATION_FAILED"] = "VALIDATION_FAILED";
    MediaAssetStatus["PROCESSING"] = "PROCESSING";
    MediaAssetStatus["PROCESSED"] = "PROCESSED";
    MediaAssetStatus["PENDING_REVIEW"] = "PENDING_REVIEW";
    MediaAssetStatus["APPROVED"] = "APPROVED";
    MediaAssetStatus["RESTRICTED"] = "RESTRICTED";
    MediaAssetStatus["REJECTED"] = "REJECTED";
    MediaAssetStatus["ARCHIVED"] = "ARCHIVED";
    MediaAssetStatus["DELETED"] = "DELETED";
})(MediaAssetStatus || (exports.MediaAssetStatus = MediaAssetStatus = {}));
var MediaModerationStatus;
(function (MediaModerationStatus) {
    MediaModerationStatus["NOT_REQUIRED"] = "NOT_REQUIRED";
    MediaModerationStatus["PENDING"] = "PENDING";
    MediaModerationStatus["APPROVED"] = "APPROVED";
    MediaModerationStatus["REJECTED"] = "REJECTED";
    MediaModerationStatus["RESTRICTED"] = "RESTRICTED";
})(MediaModerationStatus || (exports.MediaModerationStatus = MediaModerationStatus = {}));
var MediaProcessingState;
(function (MediaProcessingState) {
    MediaProcessingState["NOT_STARTED"] = "NOT_STARTED";
    MediaProcessingState["VALIDATING"] = "VALIDATING";
    MediaProcessingState["PROCESSING"] = "PROCESSING";
    MediaProcessingState["COMPLETED"] = "COMPLETED";
    MediaProcessingState["FAILED"] = "FAILED";
    MediaProcessingState["SKIPPED_FOUNDATION"] = "SKIPPED_FOUNDATION";
})(MediaProcessingState || (exports.MediaProcessingState = MediaProcessingState = {}));
var MediaStorageTier;
(function (MediaStorageTier) {
    MediaStorageTier["HOT"] = "HOT";
    MediaStorageTier["WARM"] = "WARM";
    MediaStorageTier["COLD"] = "COLD";
})(MediaStorageTier || (exports.MediaStorageTier = MediaStorageTier = {}));
var MediaSurface;
(function (MediaSurface) {
    MediaSurface["PRODUCT_CARD"] = "PRODUCT_CARD";
    MediaSurface["VIDEO_PRODUCT_CARD"] = "VIDEO_PRODUCT_CARD";
    MediaSurface["PDP_GALLERY"] = "PDP_GALLERY";
    MediaSurface["STORY_FULLSCREEN"] = "STORY_FULLSCREEN";
    MediaSurface["POST_CARD"] = "POST_CARD";
    MediaSurface["STOREFRONT_HEADER"] = "STOREFRONT_HEADER";
    MediaSurface["CATEGORY_BANNER"] = "CATEGORY_BANNER";
    MediaSurface["HOME_PROMO"] = "HOME_PROMO";
})(MediaSurface || (exports.MediaSurface = MediaSurface = {}));
var MediaVariantKind;
(function (MediaVariantKind) {
    MediaVariantKind["ORIGINAL"] = "ORIGINAL";
    MediaVariantKind["THUMBNAIL"] = "THUMBNAIL";
    MediaVariantKind["POSTER"] = "POSTER";
    MediaVariantKind["WEB_OPTIMIZED"] = "WEB_OPTIMIZED";
    MediaVariantKind["MOBILE_OPTIMIZED"] = "MOBILE_OPTIMIZED";
    MediaVariantKind["PREVIEW"] = "PREVIEW";
    MediaVariantKind["STREAM_720P"] = "STREAM_720P";
    MediaVariantKind["STREAM_1080P"] = "STREAM_1080P";
})(MediaVariantKind || (exports.MediaVariantKind = MediaVariantKind = {}));
var MediaAspectRatio;
(function (MediaAspectRatio) {
    MediaAspectRatio["SQUARE"] = "SQUARE";
    MediaAspectRatio["PORTRAIT"] = "PORTRAIT";
    MediaAspectRatio["LANDSCAPE"] = "LANDSCAPE";
    MediaAspectRatio["STORY_VERTICAL"] = "STORY_VERTICAL";
    MediaAspectRatio["FREEFORM"] = "FREEFORM";
})(MediaAspectRatio || (exports.MediaAspectRatio = MediaAspectRatio = {}));
