"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatorStoreProductMediaUsage = exports.CreatorStoreProductMediaType = exports.CreatorStoreProductVisibility = exports.CreatorStoreProductStatus = exports.PoolBindingType = exports.PoolBindingStatus = exports.CommercialPoolStatus = exports.PoolErrorCode = exports.ProductAcceptanceStatus = void 0;
var ProductAcceptanceStatus;
(function (ProductAcceptanceStatus) {
    ProductAcceptanceStatus["DRAFT"] = "DRAFT";
    ProductAcceptanceStatus["SUBMITTED"] = "SUBMITTED";
    ProductAcceptanceStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    ProductAcceptanceStatus["REVISION_REQUESTED"] = "REVISION_REQUESTED";
    ProductAcceptanceStatus["REVISION_SUBMITTED"] = "REVISION_SUBMITTED";
    ProductAcceptanceStatus["APPROVED"] = "APPROVED";
    ProductAcceptanceStatus["REJECTED"] = "REJECTED";
    ProductAcceptanceStatus["SUSPENDED"] = "SUSPENDED";
})(ProductAcceptanceStatus || (exports.ProductAcceptanceStatus = ProductAcceptanceStatus = {}));
var PoolErrorCode;
(function (PoolErrorCode) {
    PoolErrorCode["POOL_FORBIDDEN"] = "POOL_FORBIDDEN";
    PoolErrorCode["POOL_NOT_FOUND"] = "POOL_NOT_FOUND";
    PoolErrorCode["POOL_INVALID_TRANSITION"] = "POOL_INVALID_TRANSITION";
    PoolErrorCode["POOL_VALIDATION_FAILED"] = "POOL_VALIDATION_FAILED";
    PoolErrorCode["POOL_DUPLICATE_COMMERCIALIZE"] = "POOL_DUPLICATE_COMMERCIALIZE";
    PoolErrorCode["POOL_BINDING_INCOMPLETE"] = "POOL_BINDING_INCOMPLETE";
    PoolErrorCode["POOL_ACTOR_CONTEXT_REQUIRED"] = "POOL_ACTOR_CONTEXT_REQUIRED";
    PoolErrorCode["POOL_SUPPLIER_SCOPE_MISMATCH"] = "POOL_SUPPLIER_SCOPE_MISMATCH";
    PoolErrorCode["POOL_CREATOR_STORE_SCOPE_MISMATCH"] = "POOL_CREATOR_STORE_SCOPE_MISMATCH";
    PoolErrorCode["POOL_CREATOR_STORE_PRODUCT_NOT_FOUND"] = "POOL_CREATOR_STORE_PRODUCT_NOT_FOUND";
    PoolErrorCode["POOL_CREATOR_STORE_DUPLICATE_PRODUCT"] = "POOL_CREATOR_STORE_DUPLICATE_PRODUCT";
    PoolErrorCode["POOL_CREATOR_STORE_INVALID_MERCHANDISING"] = "POOL_CREATOR_STORE_INVALID_MERCHANDISING";
    PoolErrorCode["POOL_CREATOR_STORE_REORDER_FAILED"] = "POOL_CREATOR_STORE_REORDER_FAILED";
    PoolErrorCode["POOL_CREATOR_STORE_MEDIA_DUPLICATE"] = "POOL_CREATOR_STORE_MEDIA_DUPLICATE";
    PoolErrorCode["POOL_CREATOR_STORE_MEDIA_NOT_FOUND"] = "POOL_CREATOR_STORE_MEDIA_NOT_FOUND";
    PoolErrorCode["POOL_CREATOR_STORE_MEDIA_INVALID"] = "POOL_CREATOR_STORE_MEDIA_INVALID";
    PoolErrorCode["POOL_CREATOR_PRICE_OUT_OF_CORRIDOR"] = "POOL_CREATOR_PRICE_OUT_OF_CORRIDOR";
    PoolErrorCode["POOL_CREATOR_PRICE_REQUIRES_RECOMMENDED"] = "POOL_CREATOR_PRICE_REQUIRES_RECOMMENDED";
})(PoolErrorCode || (exports.PoolErrorCode = PoolErrorCode = {}));
var CommercialPoolStatus;
(function (CommercialPoolStatus) {
    CommercialPoolStatus["PENDING"] = "PENDING";
    CommercialPoolStatus["ACTIVE"] = "ACTIVE";
    CommercialPoolStatus["SUSPENDED"] = "SUSPENDED";
    CommercialPoolStatus["ARCHIVED"] = "ARCHIVED";
})(CommercialPoolStatus || (exports.CommercialPoolStatus = CommercialPoolStatus = {}));
var PoolBindingStatus;
(function (PoolBindingStatus) {
    PoolBindingStatus["PENDING"] = "PENDING";
    PoolBindingStatus["BOUND"] = "BOUND";
    PoolBindingStatus["FAILED"] = "FAILED";
})(PoolBindingStatus || (exports.PoolBindingStatus = PoolBindingStatus = {}));
var PoolBindingType;
(function (PoolBindingType) {
    PoolBindingType["PRICING"] = "PRICING";
    PoolBindingType["STOCK"] = "STOCK";
    PoolBindingType["CATEGORY"] = "CATEGORY";
    PoolBindingType["MEDIA"] = "MEDIA";
})(PoolBindingType || (exports.PoolBindingType = PoolBindingType = {}));
var CreatorStoreProductStatus;
(function (CreatorStoreProductStatus) {
    CreatorStoreProductStatus["ACTIVE"] = "ACTIVE";
    CreatorStoreProductStatus["PAUSED"] = "PAUSED";
    CreatorStoreProductStatus["REMOVED"] = "REMOVED";
})(CreatorStoreProductStatus || (exports.CreatorStoreProductStatus = CreatorStoreProductStatus = {}));
var CreatorStoreProductVisibility;
(function (CreatorStoreProductVisibility) {
    CreatorStoreProductVisibility["VISIBLE"] = "VISIBLE";
    CreatorStoreProductVisibility["HIDDEN"] = "HIDDEN";
})(CreatorStoreProductVisibility || (exports.CreatorStoreProductVisibility = CreatorStoreProductVisibility = {}));
var CreatorStoreProductMediaType;
(function (CreatorStoreProductMediaType) {
    CreatorStoreProductMediaType["IMAGE"] = "IMAGE";
    CreatorStoreProductMediaType["VIDEO"] = "VIDEO";
})(CreatorStoreProductMediaType || (exports.CreatorStoreProductMediaType = CreatorStoreProductMediaType = {}));
var CreatorStoreProductMediaUsage;
(function (CreatorStoreProductMediaUsage) {
    CreatorStoreProductMediaUsage["PRODUCT_CARD"] = "PRODUCT_CARD";
    CreatorStoreProductMediaUsage["PRODUCT_DETAIL"] = "PRODUCT_DETAIL";
    CreatorStoreProductMediaUsage["STORE_HIGHLIGHT"] = "STORE_HIGHLIGHT";
})(CreatorStoreProductMediaUsage || (exports.CreatorStoreProductMediaUsage = CreatorStoreProductMediaUsage = {}));
