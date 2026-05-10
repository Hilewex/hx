"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorePostErrorCode = exports.StorePostStatus = void 0;
var StorePostStatus;
(function (StorePostStatus) {
    StorePostStatus["DRAFT"] = "DRAFT";
    StorePostStatus["PUBLISHED"] = "PUBLISHED";
    StorePostStatus["HIDDEN"] = "HIDDEN";
    StorePostStatus["ARCHIVED"] = "ARCHIVED";
})(StorePostStatus || (exports.StorePostStatus = StorePostStatus = {}));
var StorePostErrorCode;
(function (StorePostErrorCode) {
    StorePostErrorCode["POST_NOT_FOUND"] = "POST_NOT_FOUND";
    StorePostErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    StorePostErrorCode["INVALID_BODY"] = "INVALID_BODY";
    StorePostErrorCode["INVALID_TITLE"] = "INVALID_TITLE";
    StorePostErrorCode["INVALID_DISPLAY_ORDER"] = "INVALID_DISPLAY_ORDER";
    StorePostErrorCode["DUPLICATE_MEDIA"] = "DUPLICATE_MEDIA";
    StorePostErrorCode["DUPLICATE_PRODUCT"] = "DUPLICATE_PRODUCT";
    StorePostErrorCode["ARCHIVED_CANNOT_PUBLISH"] = "ARCHIVED_CANNOT_PUBLISH";
    StorePostErrorCode["REASON_REQUIRED"] = "REASON_REQUIRED";
    StorePostErrorCode["REORDER_MISMATCH"] = "REORDER_MISMATCH";
})(StorePostErrorCode || (exports.StorePostErrorCode = StorePostErrorCode = {}));
