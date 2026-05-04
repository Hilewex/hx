import {
  CheckCustomerSocialEligibilityCommand,
  CustomerSocialEligibilityResult,
  CustomerSocialEligibilityErrorCode,
  CustomerSocialAction,
} from '@hx/contracts';

export function checkCustomerSocialEligibility(command: CheckCustomerSocialEligibilityCommand): CustomerSocialEligibilityResult {
  const { action, context } = command;

  // Guest deny
  if (context.actorType === 'GUEST') {
    return {
      allowed: false,
      action,
      reasonCode: CustomerSocialEligibilityErrorCode.GUEST_NOT_ALLOWED,
      reason: 'Guests cannot perform social actions',
    };
  }

  // Suspended/closed deny
  if (context.customerStatus === 'SUSPENDED') {
    return {
      allowed: false,
      action,
      reasonCode: CustomerSocialEligibilityErrorCode.CUSTOMER_SUSPENDED,
      reason: 'Suspended customers cannot perform social actions',
    };
  }

  if (context.customerStatus === 'CLOSED') {
    return {
      allowed: false,
      action,
      reasonCode: CustomerSocialEligibilityErrorCode.CUSTOMER_CLOSED,
      reason: 'Closed customers cannot perform social actions',
    };
  }

  // StorefrontId required
  if (!context.storefrontId) {
    return {
      allowed: false,
      action,
      reasonCode: CustomerSocialEligibilityErrorCode.MISSING_STOREFRONT_ID,
      reason: 'Storefront ID is required',
    };
  }

  // Hidden/suspended storefront deny
  if (context.storefrontStatus === 'SUSPENDED') {
    return {
      allowed: false,
      action,
      reasonCode: CustomerSocialEligibilityErrorCode.STOREFRONT_SUSPENDED,
      reason: 'Cannot interact with suspended storefront',
    };
  }

  if (context.storefrontVisibility === 'HIDDEN') {
    return {
      allowed: false,
      action,
      reasonCode: CustomerSocialEligibilityErrorCode.STOREFRONT_HIDDEN,
      reason: 'Cannot interact with hidden storefront',
    };
  }

  if (action === CustomerSocialAction.FOLLOW_STOREFRONT) {
    if (context.alreadyFollowing) {
      return {
        allowed: false,
        action,
        reasonCode: CustomerSocialEligibilityErrorCode.ALREADY_FOLLOWING,
        reason: 'Already following this storefront',
      };
    }

    return {
      allowed: true,
      action,
      reason: 'Follow allowed',
    };
  }

  if (action === CustomerSocialAction.SEND_STORE_MESSAGE) {
    if (context.messageAllowedByStorefront === false) {
      return {
        allowed: false,
        action,
        reasonCode: CustomerSocialEligibilityErrorCode.MESSAGES_NOT_ALLOWED,
        reason: 'Storefront does not allow messages',
      };
    }

    return {
      allowed: true,
      action,
      reason: 'Message allowed',
    };
  }

  return {
    allowed: false,
    action,
    reasonCode: CustomerSocialEligibilityErrorCode.UNKNOWN_ACTION,
    reason: 'Unknown action',
  };
}
