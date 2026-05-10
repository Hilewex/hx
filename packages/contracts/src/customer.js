"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerErrorCode = exports.CustomerCapability = exports.CustomerAccountType = exports.CustomerProfileVisibility = exports.CustomerAccountStatus = void 0;
var CustomerAccountStatus;
(function (CustomerAccountStatus) {
    CustomerAccountStatus["ACTIVE"] = "ACTIVE";
    CustomerAccountStatus["SUSPENDED"] = "SUSPENDED";
    CustomerAccountStatus["CLOSED"] = "CLOSED";
})(CustomerAccountStatus || (exports.CustomerAccountStatus = CustomerAccountStatus = {}));
var CustomerProfileVisibility;
(function (CustomerProfileVisibility) {
    CustomerProfileVisibility["PRIVATE"] = "PRIVATE";
    CustomerProfileVisibility["LIMITED"] = "LIMITED";
})(CustomerProfileVisibility || (exports.CustomerProfileVisibility = CustomerProfileVisibility = {}));
var CustomerAccountType;
(function (CustomerAccountType) {
    CustomerAccountType["REGISTERED_CUSTOMER"] = "REGISTERED_CUSTOMER";
    CustomerAccountType["GUEST_CONTEXT"] = "GUEST_CONTEXT";
})(CustomerAccountType || (exports.CustomerAccountType = CustomerAccountType = {}));
var CustomerCapability;
(function (CustomerCapability) {
    CustomerCapability["BROWSE_PUBLIC_CATALOG"] = "BROWSE_PUBLIC_CATALOG";
    CustomerCapability["ADD_TO_CART"] = "ADD_TO_CART";
    CustomerCapability["START_CHECKOUT"] = "START_CHECKOUT";
    CustomerCapability["VIEW_ORDER_HISTORY"] = "VIEW_ORDER_HISTORY";
    CustomerCapability["ASK_PRODUCT_QUESTION"] = "ASK_PRODUCT_QUESTION";
    CustomerCapability["WRITE_REVIEW"] = "WRITE_REVIEW";
    CustomerCapability["CREATE_USER_PRODUCT_STORY"] = "CREATE_USER_PRODUCT_STORY";
    CustomerCapability["FOLLOW_STORE"] = "FOLLOW_STORE";
    CustomerCapability["SEND_STORE_MESSAGE"] = "SEND_STORE_MESSAGE";
    CustomerCapability["EARN_REWARD_POINTS"] = "EARN_REWARD_POINTS";
    CustomerCapability["OPEN_SUPPORT_TICKET"] = "OPEN_SUPPORT_TICKET";
})(CustomerCapability || (exports.CustomerCapability = CustomerCapability = {}));
var CustomerErrorCode;
(function (CustomerErrorCode) {
    CustomerErrorCode["CUSTOMER_NOT_FOUND"] = "CUSTOMER_NOT_FOUND";
    CustomerErrorCode["CUSTOMER_SUSPENDED"] = "CUSTOMER_SUSPENDED";
    CustomerErrorCode["CUSTOMER_CLOSED"] = "CUSTOMER_CLOSED";
    CustomerErrorCode["GUEST_CANNOT_CREATE_PERSISTENT_PROFILE"] = "GUEST_CANNOT_CREATE_PERSISTENT_PROFILE";
    CustomerErrorCode["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    CustomerErrorCode["INVALID_REASON"] = "INVALID_REASON";
    CustomerErrorCode["CUSTOMER_CAPABILITY_DENIED"] = "CUSTOMER_CAPABILITY_DENIED";
    CustomerErrorCode["CUSTOMER_GUEST_NOT_ALLOWED"] = "CUSTOMER_GUEST_NOT_ALLOWED";
    CustomerErrorCode["CUSTOMER_PROFILE_REQUIRED"] = "CUSTOMER_PROFILE_REQUIRED";
})(CustomerErrorCode || (exports.CustomerErrorCode = CustomerErrorCode = {}));
