"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerAddressErrorCode = exports.CustomerAddressStatus = exports.CustomerAddressType = void 0;
var CustomerAddressType;
(function (CustomerAddressType) {
    CustomerAddressType["SHIPPING"] = "SHIPPING";
    CustomerAddressType["BILLING"] = "BILLING";
})(CustomerAddressType || (exports.CustomerAddressType = CustomerAddressType = {}));
var CustomerAddressStatus;
(function (CustomerAddressStatus) {
    CustomerAddressStatus["ACTIVE"] = "ACTIVE";
    CustomerAddressStatus["ARCHIVED"] = "ARCHIVED";
})(CustomerAddressStatus || (exports.CustomerAddressStatus = CustomerAddressStatus = {}));
var CustomerAddressErrorCode;
(function (CustomerAddressErrorCode) {
    CustomerAddressErrorCode["ADDRESS_NOT_FOUND"] = "ADDRESS_NOT_FOUND";
    CustomerAddressErrorCode["CUSTOMER_NOT_FOUND"] = "CUSTOMER_NOT_FOUND";
    CustomerAddressErrorCode["UNAUTHORIZED_ACCESS"] = "UNAUTHORIZED_ACCESS";
    CustomerAddressErrorCode["GUEST_CANNOT_CREATE_ADDRESS"] = "GUEST_CANNOT_CREATE_ADDRESS";
    CustomerAddressErrorCode["SUSPENDED_CUSTOMER_CANNOT_CREATE_ADDRESS"] = "SUSPENDED_CUSTOMER_CANNOT_CREATE_ADDRESS";
    CustomerAddressErrorCode["CLOSED_CUSTOMER_CANNOT_CREATE_ADDRESS"] = "CLOSED_CUSTOMER_CANNOT_CREATE_ADDRESS";
    CustomerAddressErrorCode["ARCHIVED_ADDRESS_CANNOT_BE_DEFAULT"] = "ARCHIVED_ADDRESS_CANNOT_BE_DEFAULT";
    CustomerAddressErrorCode["CLOSED_CUSTOMER_CANNOT_CHECKOUT"] = "CLOSED_CUSTOMER_CANNOT_CHECKOUT";
    CustomerAddressErrorCode["INVALID_DATA"] = "INVALID_DATA";
})(CustomerAddressErrorCode || (exports.CustomerAddressErrorCode = CustomerAddressErrorCode = {}));
