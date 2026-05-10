"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreStoryErrorCode = exports.StoreStoryStatus = exports.StoreStoryType = void 0;
var StoreStoryType;
(function (StoreStoryType) {
    StoreStoryType["STORE_INTRO"] = "STORE_INTRO";
    StoreStoryType["PRODUCT_PROMOTION"] = "PRODUCT_PROMOTION";
})(StoreStoryType || (exports.StoreStoryType = StoreStoryType = {}));
var StoreStoryStatus;
(function (StoreStoryStatus) {
    StoreStoryStatus["DRAFT"] = "DRAFT";
    StoreStoryStatus["PUBLISHED"] = "PUBLISHED";
    StoreStoryStatus["UNPUBLISHED"] = "UNPUBLISHED";
    StoreStoryStatus["ARCHIVED"] = "ARCHIVED";
})(StoreStoryStatus || (exports.StoreStoryStatus = StoreStoryStatus = {}));
var StoreStoryErrorCode;
(function (StoreStoryErrorCode) {
    StoreStoryErrorCode["NOT_FOUND"] = "NOT_FOUND";
    StoreStoryErrorCode["INVALID_TYPE"] = "INVALID_TYPE";
    StoreStoryErrorCode["INVALID_STATUS"] = "INVALID_STATUS";
    StoreStoryErrorCode["MEDIA_REQUIRED"] = "MEDIA_REQUIRED";
    StoreStoryErrorCode["PRODUCT_REQUIRED"] = "PRODUCT_REQUIRED";
    StoreStoryErrorCode["UNPUBLISH_REASON_REQUIRED"] = "UNPUBLISH_REASON_REQUIRED";
    StoreStoryErrorCode["ALREADY_ARCHIVED"] = "ALREADY_ARCHIVED";
    StoreStoryErrorCode["INVALID_DISPLAY_ORDER"] = "INVALID_DISPLAY_ORDER";
    StoreStoryErrorCode["CAPTION_TOO_LONG"] = "CAPTION_TOO_LONG";
    StoreStoryErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    StoreStoryErrorCode["DUPLICATE_ID"] = "DUPLICATE_ID";
    StoreStoryErrorCode["FOREIGN_STORY"] = "FOREIGN_STORY";
})(StoreStoryErrorCode || (exports.StoreStoryErrorCode = StoreStoryErrorCode = {}));
