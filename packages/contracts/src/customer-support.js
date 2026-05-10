"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerSupportEligibilityErrorCode = exports.CustomerSupportTopic = exports.CustomerSupportAction = void 0;
var CustomerSupportAction;
(function (CustomerSupportAction) {
    CustomerSupportAction["VIEW_ORDER"] = "VIEW_ORDER";
    CustomerSupportAction["VIEW_ORDER_HISTORY"] = "VIEW_ORDER_HISTORY";
    CustomerSupportAction["OPEN_SUPPORT_TICKET"] = "OPEN_SUPPORT_TICKET";
    CustomerSupportAction["OPEN_RETURN_CANCEL_SUPPORT"] = "OPEN_RETURN_CANCEL_SUPPORT";
    CustomerSupportAction["OPEN_DELIVERY_SUPPORT"] = "OPEN_DELIVERY_SUPPORT";
    CustomerSupportAction["OPEN_PAYMENT_SUPPORT"] = "OPEN_PAYMENT_SUPPORT";
})(CustomerSupportAction || (exports.CustomerSupportAction = CustomerSupportAction = {}));
var CustomerSupportTopic;
(function (CustomerSupportTopic) {
    CustomerSupportTopic["GENERAL_SUPPORT"] = "GENERAL_SUPPORT";
    CustomerSupportTopic["ORDER"] = "ORDER";
    CustomerSupportTopic["PAYMENT"] = "PAYMENT";
    CustomerSupportTopic["DELIVERY"] = "DELIVERY";
    CustomerSupportTopic["RETURN_CANCEL"] = "RETURN_CANCEL";
})(CustomerSupportTopic || (exports.CustomerSupportTopic = CustomerSupportTopic = {}));
var CustomerSupportEligibilityErrorCode;
(function (CustomerSupportEligibilityErrorCode) {
    CustomerSupportEligibilityErrorCode["UNAUTHORIZED_GUEST"] = "UNAUTHORIZED_GUEST";
    CustomerSupportEligibilityErrorCode["CLOSED_ACCOUNT_DENIED"] = "CLOSED_ACCOUNT_DENIED";
    CustomerSupportEligibilityErrorCode["FOREIGN_ORDER_ACCESS_DENIED"] = "FOREIGN_ORDER_ACCESS_DENIED";
    CustomerSupportEligibilityErrorCode["MISSING_ORDER_CONTEXT"] = "MISSING_ORDER_CONTEXT";
    CustomerSupportEligibilityErrorCode["SUSPENDED_NEW_SUPPORT_DENIED"] = "SUSPENDED_NEW_SUPPORT_DENIED";
})(CustomerSupportEligibilityErrorCode || (exports.CustomerSupportEligibilityErrorCode = CustomerSupportEligibilityErrorCode = {}));
