import {
  CheckCustomerContributionEligibilityCommand,
  CustomerContributionEligibilityResult,
  CustomerContributionType,
  CustomerContributionEligibilityErrorCode,
} from '@hx/contracts';

export const checkCustomerContributionEligibility = async (
  command: CheckCustomerContributionEligibilityCommand
): Promise<CustomerContributionEligibilityResult> => {
  const { context, contributionType } = command;

  // Global Deny Rules
  if (context.actorType === 'GUEST' || context.actorType === 'ANONYMOUS') {
    return {
      allowed: false,
      contributionType,
      reasonCode: CustomerContributionEligibilityErrorCode.GUEST_DENIED,
      reason: 'Guest users cannot contribute.',
    };
  }

  if (context.customerStatus === 'SUSPENDED') {
    return {
      allowed: false,
      contributionType,
      reasonCode: CustomerContributionEligibilityErrorCode.SUSPENDED_CUSTOMER_DENIED,
      reason: 'Suspended customers cannot contribute.',
    };
  }

  if (context.customerStatus === 'CLOSED') {
    return {
      allowed: false,
      contributionType,
      reasonCode: CustomerContributionEligibilityErrorCode.CLOSED_CUSTOMER_DENIED,
      reason: 'Closed customers cannot contribute.',
    };
  }

  if (context.moderationBlocked) {
    return {
      allowed: false,
      contributionType,
      reasonCode: CustomerContributionEligibilityErrorCode.MODERATION_BLOCKED,
      reason: 'Customer is blocked by moderation.',
    };
  }

  if (context.riskBlocked) {
    return {
      allowed: false,
      contributionType,
      reasonCode: CustomerContributionEligibilityErrorCode.RISK_BLOCKED,
      reason: 'Customer is blocked by risk.',
    };
  }

  if (!context.productId) {
    return {
      allowed: false,
      contributionType,
      reasonCode: CustomerContributionEligibilityErrorCode.MISSING_PRODUCT_ID,
      reason: 'Product ID is required for contribution.',
    };
  }

  // Type Specific Rules
  switch (contributionType) {
    case CustomerContributionType.PRODUCT_QUESTION:
      // Active registered customer with a valid product ID can ask questions (foundation)
      return {
        allowed: true,
        contributionType,
        reason: 'Allowed to ask product questions.',
      };

    case CustomerContributionType.PRODUCT_REVIEW:
    case CustomerContributionType.USER_PRODUCT_STORY:
      // Both require delivery and verified purchase
      if (!context.delivered) {
        return {
          allowed: false,
          contributionType,
          reasonCode: CustomerContributionEligibilityErrorCode.DELIVERY_REQUIRED,
          reason: 'Product must be delivered to contribute.',
        };
      }

      if (!context.verifiedPurchase) {
        return {
          allowed: false,
          contributionType,
          reasonCode: CustomerContributionEligibilityErrorCode.VERIFIED_PURCHASE_REQUIRED,
          reason: 'Verified purchase is required to contribute.',
        };
      }

      return {
        allowed: true,
        contributionType,
        reason: 'Allowed to contribute.',
      };

    default:
      return {
        allowed: false,
        contributionType,
        reason: 'Unknown contribution type.',
      };
  }
};
