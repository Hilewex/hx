"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerSocialEligibilityErrorCode = exports.CustomerSocialAction = void 0;
var CustomerSocialAction;
(function (CustomerSocialAction) {
    CustomerSocialAction["FOLLOW_STOREFRONT"] = "FOLLOW_STOREFRONT";
    CustomerSocialAction["SEND_STORE_MESSAGE"] = "SEND_STORE_MESSAGE";
})(CustomerSocialAction || (exports.CustomerSocialAction = CustomerSocialAction = {}));
var CustomerSocialEligibilityErrorCode;
(function (CustomerSocialEligibilityErrorCode) {
    CustomerSocialEligibilityErrorCode["GUEST_NOT_ALLOWED"] = "GUEST_NOT_ALLOWED";
    CustomerSocialEligibilityErrorCode["CUSTOMER_SUSPENDED"] = "CUSTOMER_SUSPENDED";
    CustomerSocialEligibilityErrorCode["CUSTOMER_CLOSED"] = "CUSTOMER_CLOSED";
    CustomerSocialEligibilityErrorCode["MISSING_STOREFRONT_ID"] = "MISSING_STOREFRONT_ID";
    CustomerSocialEligibilityErrorCode["STOREFRONT_SUSPENDED"] = "STOREFRONT_SUSPENDED";
    CustomerSocialEligibilityErrorCode["STOREFRONT_HIDDEN"] = "STOREFRONT_HIDDEN";
    CustomerSocialEligibilityErrorCode["ALREADY_FOLLOWING"] = "ALREADY_FOLLOWING";
    CustomerSocialEligibilityErrorCode["MESSAGES_NOT_ALLOWED"] = "MESSAGES_NOT_ALLOWED";
    CustomerSocialEligibilityErrorCode["UNKNOWN_ACTION"] = "UNKNOWN_ACTION";
})(CustomerSocialEligibilityErrorCode || (exports.CustomerSocialEligibilityErrorCode = CustomerSocialEligibilityErrorCode = {}));
