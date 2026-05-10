"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardPointSourceType = exports.RewardPointEventType = exports.RewardPointState = exports.CustomerRewardEligibilityErrorCode = exports.CustomerRewardEligibilityAction = exports.CustomerRewardEventType = void 0;
var CustomerRewardEventType;
(function (CustomerRewardEventType) {
    CustomerRewardEventType["PURCHASE_DELIVERED"] = "PURCHASE_DELIVERED";
    CustomerRewardEventType["REVIEW_APPROVED"] = "REVIEW_APPROVED";
    CustomerRewardEventType["USER_STORY_APPROVED"] = "USER_STORY_APPROVED";
    CustomerRewardEventType["CAMPAIGN_ACTION"] = "CAMPAIGN_ACTION";
    CustomerRewardEventType["RETURN_OR_REFUND"] = "RETURN_OR_REFUND";
    CustomerRewardEventType["REVIEW_DELETED"] = "REVIEW_DELETED";
    CustomerRewardEventType["USER_STORY_REMOVED"] = "USER_STORY_REMOVED";
    CustomerRewardEventType["MODERATION_REJECTED"] = "MODERATION_REJECTED";
})(CustomerRewardEventType || (exports.CustomerRewardEventType = CustomerRewardEventType = {}));
var CustomerRewardEligibilityAction;
(function (CustomerRewardEligibilityAction) {
    CustomerRewardEligibilityAction["EARN_POINTS"] = "EARN_POINTS";
    CustomerRewardEligibilityAction["REVOKE_POINTS"] = "REVOKE_POINTS";
})(CustomerRewardEligibilityAction || (exports.CustomerRewardEligibilityAction = CustomerRewardEligibilityAction = {}));
var CustomerRewardEligibilityErrorCode;
(function (CustomerRewardEligibilityErrorCode) {
    CustomerRewardEligibilityErrorCode["GUEST_NOT_ELIGIBLE"] = "GUEST_NOT_ELIGIBLE";
    CustomerRewardEligibilityErrorCode["CUSTOMER_NOT_ACTIVE"] = "CUSTOMER_NOT_ACTIVE";
    CustomerRewardEligibilityErrorCode["BLOCKED_BY_MODERATION_OR_RISK"] = "BLOCKED_BY_MODERATION_OR_RISK";
    CustomerRewardEligibilityErrorCode["CONTEXT_REQUIREMENTS_NOT_MET"] = "CONTEXT_REQUIREMENTS_NOT_MET";
    CustomerRewardEligibilityErrorCode["INVALID_ACTOR"] = "INVALID_ACTOR";
})(CustomerRewardEligibilityErrorCode || (exports.CustomerRewardEligibilityErrorCode = CustomerRewardEligibilityErrorCode = {}));
var RewardPointState;
(function (RewardPointState) {
    RewardPointState["PENDING"] = "PENDING";
    RewardPointState["SPENDABLE"] = "SPENDABLE";
    RewardPointState["REDEEMED"] = "REDEEMED";
    RewardPointState["REVERSED"] = "REVERSED";
    RewardPointState["EXPIRED"] = "EXPIRED";
    RewardPointState["BLOCKED"] = "BLOCKED";
})(RewardPointState || (exports.RewardPointState = RewardPointState = {}));
var RewardPointEventType;
(function (RewardPointEventType) {
    RewardPointEventType["EARN_PENDING"] = "EARN_PENDING";
    RewardPointEventType["PROMOTE_TO_SPENDABLE"] = "PROMOTE_TO_SPENDABLE";
    RewardPointEventType["REDEEM"] = "REDEEM";
    RewardPointEventType["REVERSE_PENDING"] = "REVERSE_PENDING";
    RewardPointEventType["REVERSE_SPENDABLE"] = "REVERSE_SPENDABLE";
    RewardPointEventType["EXPIRE"] = "EXPIRE";
    RewardPointEventType["BLOCK"] = "BLOCK";
})(RewardPointEventType || (exports.RewardPointEventType = RewardPointEventType = {}));
var RewardPointSourceType;
(function (RewardPointSourceType) {
    RewardPointSourceType["ORDER_DELIVERY"] = "ORDER_DELIVERY";
    RewardPointSourceType["REVIEW"] = "REVIEW";
    RewardPointSourceType["STORY"] = "STORY";
    RewardPointSourceType["CAMPAIGN"] = "CAMPAIGN";
    RewardPointSourceType["REFUND"] = "REFUND";
    RewardPointSourceType["MANUAL_ADJUSTMENT"] = "MANUAL_ADJUSTMENT";
})(RewardPointSourceType || (exports.RewardPointSourceType = RewardPointSourceType = {}));
