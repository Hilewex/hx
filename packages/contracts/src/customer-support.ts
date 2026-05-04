export enum CustomerSupportAction {
  VIEW_ORDER = 'VIEW_ORDER',
  VIEW_ORDER_HISTORY = 'VIEW_ORDER_HISTORY',
  OPEN_SUPPORT_TICKET = 'OPEN_SUPPORT_TICKET',
  OPEN_RETURN_CANCEL_SUPPORT = 'OPEN_RETURN_CANCEL_SUPPORT',
  OPEN_DELIVERY_SUPPORT = 'OPEN_DELIVERY_SUPPORT',
  OPEN_PAYMENT_SUPPORT = 'OPEN_PAYMENT_SUPPORT'
}

export enum CustomerSupportTopic {
  GENERAL_SUPPORT = 'GENERAL_SUPPORT',
  ORDER = 'ORDER',
  PAYMENT = 'PAYMENT',
  DELIVERY = 'DELIVERY',
  RETURN_CANCEL = 'RETURN_CANCEL'
}

export interface CustomerOrderVisibilityContext {
  actorId: string;
  actorType: 'GUEST' | 'CUSTOMER' | 'ADMIN';
  customerProfileId?: string;
  customerStatus?: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  orderId?: string;
  orderCustomerProfileId?: string;
  hasExistingOrderContext?: boolean;
  supportTopic?: CustomerSupportTopic;
}

export interface CustomerSupportEligibilityResult {
  allowed: boolean;
  action: CustomerSupportAction;
  topic?: CustomerSupportTopic;
  reasonCode?: string;
  reason: string;
}

export interface CheckCustomerSupportEligibilityCommand {
  context: CustomerOrderVisibilityContext;
  action: CustomerSupportAction;
}

export enum CustomerSupportEligibilityErrorCode {
  UNAUTHORIZED_GUEST = 'UNAUTHORIZED_GUEST',
  CLOSED_ACCOUNT_DENIED = 'CLOSED_ACCOUNT_DENIED',
  FOREIGN_ORDER_ACCESS_DENIED = 'FOREIGN_ORDER_ACCESS_DENIED',
  MISSING_ORDER_CONTEXT = 'MISSING_ORDER_CONTEXT',
  SUSPENDED_NEW_SUPPORT_DENIED = 'SUSPENDED_NEW_SUPPORT_DENIED'
}
