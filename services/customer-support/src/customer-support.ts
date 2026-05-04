import { 
  CheckCustomerSupportEligibilityCommand, 
  CustomerSupportEligibilityResult,
  CustomerSupportAction,
  CustomerSupportEligibilityErrorCode
} from '@hx/contracts';

export class CustomerSupportService {
  async checkCustomerSupportEligibility(command: CheckCustomerSupportEligibilityCommand): Promise<CustomerSupportEligibilityResult> {
    const { context, action } = command;

    if (context.actorType === 'GUEST') {
      return {
        allowed: false,
        action,
        reasonCode: CustomerSupportEligibilityErrorCode.UNAUTHORIZED_GUEST,
        reason: 'Guest users cannot access order history or support tickets'
      };
    }

    if (context.customerStatus === 'CLOSED') {
      return {
        allowed: false,
        action,
        reasonCode: CustomerSupportEligibilityErrorCode.CLOSED_ACCOUNT_DENIED,
        reason: 'Closed accounts cannot perform active order or support actions'
      };
    }

    if (action === CustomerSupportAction.VIEW_ORDER) {
      if (context.orderCustomerProfileId && context.customerProfileId !== context.orderCustomerProfileId) {
        return {
          allowed: false,
          action,
          reasonCode: CustomerSupportEligibilityErrorCode.FOREIGN_ORDER_ACCESS_DENIED,
          reason: 'Cannot view orders belonging to other customers'
        };
      }
    }

    if (action === CustomerSupportAction.VIEW_ORDER_HISTORY) {
      if (context.customerStatus === 'SUSPENDED') {
         return {
            allowed: false,
            action,
            reasonCode: CustomerSupportEligibilityErrorCode.SUSPENDED_NEW_SUPPORT_DENIED,
            reason: 'Suspended customers cannot view order history foundation'
         };
      }
    }

    const requiresOrderContext = [
      CustomerSupportAction.OPEN_RETURN_CANCEL_SUPPORT,
      CustomerSupportAction.OPEN_DELIVERY_SUPPORT,
      CustomerSupportAction.OPEN_PAYMENT_SUPPORT
    ].includes(action);

    if (requiresOrderContext && !context.hasExistingOrderContext) {
      return {
        allowed: false,
        action,
        reasonCode: CustomerSupportEligibilityErrorCode.MISSING_ORDER_CONTEXT,
        reason: 'This support action requires an existing order context'
      };
    }

    if (context.customerStatus === 'SUSPENDED') {
      const allowedSuspendedActions = [
        CustomerSupportAction.VIEW_ORDER,
        CustomerSupportAction.OPEN_SUPPORT_TICKET,
        CustomerSupportAction.OPEN_RETURN_CANCEL_SUPPORT,
        CustomerSupportAction.OPEN_DELIVERY_SUPPORT,
        CustomerSupportAction.OPEN_PAYMENT_SUPPORT
      ];

      if (allowedSuspendedActions.includes(action)) {
        if (!context.hasExistingOrderContext && action !== CustomerSupportAction.VIEW_ORDER) {
          return {
             allowed: false,
             action,
             reasonCode: CustomerSupportEligibilityErrorCode.SUSPENDED_NEW_SUPPORT_DENIED,
             reason: 'Suspended customers can only access support for existing orders'
          };
        }
      }
    }

    return {
      allowed: true,
      action,
      topic: context.supportTopic,
      reason: 'Customer is eligible for this support action'
    };
  }
}
