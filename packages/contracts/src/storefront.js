"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorefrontErrorCode = exports.StorefrontVisibility = exports.StorefrontStatus = void 0;
var StorefrontStatus;
(function (StorefrontStatus) {
    StorefrontStatus["ACTIVE"] = "ACTIVE";
    StorefrontStatus["SUSPENDED"] = "SUSPENDED";
})(StorefrontStatus || (exports.StorefrontStatus = StorefrontStatus = {}));
var StorefrontVisibility;
(function (StorefrontVisibility) {
    StorefrontVisibility["PUBLIC"] = "PUBLIC";
    StorefrontVisibility["HIDDEN"] = "HIDDEN";
})(StorefrontVisibility || (exports.StorefrontVisibility = StorefrontVisibility = {}));
var StorefrontErrorCode;
(function (StorefrontErrorCode) {
    StorefrontErrorCode["NOT_FOUND"] = "STOREFRONT_NOT_FOUND";
    StorefrontErrorCode["SLUG_ALREADY_EXISTS"] = "SLUG_ALREADY_EXISTS";
    StorefrontErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    StorefrontErrorCode["ACCESS_DENIED"] = "ACCESS_DENIED";
    StorefrontErrorCode["INVALID_INPUT"] = "INVALID_INPUT";
    StorefrontErrorCode["ALREADY_EXISTS"] = "STOREFRONT_ALREADY_EXISTS";
})(StorefrontErrorCode || (exports.StorefrontErrorCode = StorefrontErrorCode = {}));
