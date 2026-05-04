"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreMessageErrorCode = exports.StoreMessageSenderType = exports.StoreMessageThreadStatus = exports.StoreMessageTopic = void 0;
var StoreMessageTopic;
(function (StoreMessageTopic) {
    StoreMessageTopic["STYLE_ADVICE"] = "STYLE_ADVICE";
    StoreMessageTopic["ORDER_SUPPORT"] = "ORDER_SUPPORT";
    StoreMessageTopic["OFFICIAL_PRODUCT_QUESTION"] = "OFFICIAL_PRODUCT_QUESTION";
})(StoreMessageTopic || (exports.StoreMessageTopic = StoreMessageTopic = {}));
var StoreMessageThreadStatus;
(function (StoreMessageThreadStatus) {
    StoreMessageThreadStatus["OPEN"] = "OPEN";
    StoreMessageThreadStatus["CLOSED"] = "CLOSED";
    StoreMessageThreadStatus["REDIRECTED_TO_SUPPORT"] = "REDIRECTED_TO_SUPPORT";
    StoreMessageThreadStatus["REDIRECTED_TO_QA"] = "REDIRECTED_TO_QA";
})(StoreMessageThreadStatus || (exports.StoreMessageThreadStatus = StoreMessageThreadStatus = {}));
var StoreMessageSenderType;
(function (StoreMessageSenderType) {
    StoreMessageSenderType["CUSTOMER"] = "CUSTOMER";
    StoreMessageSenderType["CREATOR"] = "CREATOR";
    StoreMessageSenderType["SYSTEM"] = "SYSTEM";
})(StoreMessageSenderType || (exports.StoreMessageSenderType = StoreMessageSenderType = {}));
var StoreMessageErrorCode;
(function (StoreMessageErrorCode) {
    StoreMessageErrorCode["THREAD_NOT_FOUND"] = "THREAD_NOT_FOUND";
    StoreMessageErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    StoreMessageErrorCode["INVALID_TOPIC"] = "INVALID_TOPIC";
    StoreMessageErrorCode["INVALID_STATUS"] = "INVALID_STATUS";
    StoreMessageErrorCode["THREAD_CLOSED"] = "THREAD_CLOSED";
    StoreMessageErrorCode["BODY_REQUIRED"] = "BODY_REQUIRED";
    StoreMessageErrorCode["BODY_TOO_LONG"] = "BODY_TOO_LONG";
    StoreMessageErrorCode["CLOSE_REASON_REQUIRED"] = "CLOSE_REASON_REQUIRED";
    StoreMessageErrorCode["REDIRECTED_TOPIC"] = "REDIRECTED_TOPIC";
})(StoreMessageErrorCode || (exports.StoreMessageErrorCode = StoreMessageErrorCode = {}));
