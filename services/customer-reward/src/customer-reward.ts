import {
  CustomerRewardEligibilityContext,
  CustomerRewardEligibilityResult,
  CustomerRewardEligibilityAction,
  CustomerRewardEventType,
  CustomerRewardEligibilityErrorCode,
} from '@hx/contracts';

export async function checkCustomerRewardEligibility(
  context: CustomerRewardEligibilityContext
): Promise<CustomerRewardEligibilityResult> {
  // Guest deny guard
  if (context.actorType === 'GUEST') {
    return {
      allowed: false,
      action: context.action,
      eventType: context.eventType,
      reasonCode: CustomerRewardEligibilityErrorCode.GUEST_NOT_ELIGIBLE,
      reason: 'Guests cannot earn or revoke points.',
    };
  }

  if (context.action === CustomerRewardEligibilityAction.EARN_POINTS) {
    // Suspended/Closed deny guard for earn
    if (context.customerStatus === 'SUSPENDED' || context.customerStatus === 'CLOSED') {
      return {
        allowed: false,
        action: context.action,
        eventType: context.eventType,
        reasonCode: CustomerRewardEligibilityErrorCode.CUSTOMER_NOT_ACTIVE,
        reason: `Customer status is ${context.customerStatus}. Cannot earn points.`,
      };
    }

    // Moderation/Risk blocked deny guard for earn
    if (context.moderationBlocked || context.riskBlocked) {
      return {
        allowed: false,
        action: context.action,
        eventType: context.eventType,
        reasonCode: CustomerRewardEligibilityErrorCode.BLOCKED_BY_MODERATION_OR_RISK,
        reason: 'Cannot earn points due to moderation or risk blocks.',
      };
    }

    switch (context.eventType) {
      case CustomerRewardEventType.PURCHASE_DELIVERED:
        if (context.delivered && context.notReturned) {
          return { allowed: true, action: context.action, eventType: context.eventType };
        }
        break;
      case CustomerRewardEventType.REVIEW_APPROVED:
        if (context.reviewApproved) {
          return { allowed: true, action: context.action, eventType: context.eventType };
        }
        break;
      case CustomerRewardEventType.USER_STORY_APPROVED:
        if (context.storyApproved) {
          return { allowed: true, action: context.action, eventType: context.eventType };
        }
        break;
      case CustomerRewardEventType.CAMPAIGN_ACTION:
        if (context.campaignEligible) {
          return { allowed: true, action: context.action, eventType: context.eventType };
        }
        break;
      default:
        break;
    }
  } else if (context.action === CustomerRewardEligibilityAction.REVOKE_POINTS) {
    switch (context.eventType) {
      case CustomerRewardEventType.RETURN_OR_REFUND:
        if (context.returnOrRefund) {
          return { allowed: true, action: context.action, eventType: context.eventType };
        }
        break;
      case CustomerRewardEventType.REVIEW_DELETED:
        if (context.reviewDeleted) {
          return { allowed: true, action: context.action, eventType: context.eventType };
        }
        break;
      case CustomerRewardEventType.USER_STORY_REMOVED:
        if (context.storyRemoved) {
          return { allowed: true, action: context.action, eventType: context.eventType };
        }
        break;
      case CustomerRewardEventType.MODERATION_REJECTED:
        if (context.moderationBlocked) {
          return { allowed: true, action: context.action, eventType: context.eventType };
        }
        break;
      default:
        break;
    }
  }

  return {
    allowed: false,
    action: context.action,
    eventType: context.eventType,
    reasonCode: CustomerRewardEligibilityErrorCode.CONTEXT_REQUIREMENTS_NOT_MET,
    reason: 'Context requirements for the event type were not met.',
  };
}