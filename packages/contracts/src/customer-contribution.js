"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerContributionEligibilityErrorCode = exports.CustomerContributionType = void 0;
var CustomerContributionType;
(function (CustomerContributionType) {
    CustomerContributionType["PRODUCT_QUESTION"] = "PRODUCT_QUESTION";
    CustomerContributionType["PRODUCT_REVIEW"] = "PRODUCT_REVIEW";
    CustomerContributionType["USER_PRODUCT_STORY"] = "USER_PRODUCT_STORY";
})(CustomerContributionType || (exports.CustomerContributionType = CustomerContributionType = {}));
var CustomerContributionEligibilityErrorCode;
(function (CustomerContributionEligibilityErrorCode) {
    CustomerContributionEligibilityErrorCode["GUEST_DENIED"] = "GUEST_DENIED";
    CustomerContributionEligibilityErrorCode["SUSPENDED_CUSTOMER_DENIED"] = "SUSPENDED_CUSTOMER_DENIED";
    CustomerContributionEligibilityErrorCode["CLOSED_CUSTOMER_DENIED"] = "CLOSED_CUSTOMER_DENIED";
    CustomerContributionEligibilityErrorCode["MODERATION_BLOCKED"] = "MODERATION_BLOCKED";
    CustomerContributionEligibilityErrorCode["RISK_BLOCKED"] = "RISK_BLOCKED";
    CustomerContributionEligibilityErrorCode["MISSING_PRODUCT_ID"] = "MISSING_PRODUCT_ID";
    CustomerContributionEligibilityErrorCode["DELIVERY_REQUIRED"] = "DELIVERY_REQUIRED";
    CustomerContributionEligibilityErrorCode["VERIFIED_PURCHASE_REQUIRED"] = "VERIFIED_PURCHASE_REQUIRED";
})(CustomerContributionEligibilityErrorCode || (exports.CustomerContributionEligibilityErrorCode = CustomerContributionEligibilityErrorCode = {}));
