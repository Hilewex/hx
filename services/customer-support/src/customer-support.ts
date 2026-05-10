import { 
  CheckCustomerSupportEligibilityCommand, 
  CustomerSupportEligibilityResult,
  CustomerSupportAction,
  CustomerSupportEligibilityErrorCode,
  SupportActionResult,
  SupportActionType,
  SupportPermissionCode,
  SupportProtectedActionEvidence,
  SupportProtectedActionRequest,
  SupportVisibilityRequest,
  SupportVisibilityResult
} from '@hx/contracts';

const processedSupportIdempotencyKeys = new Set<string>();

const supportActionPermissionMap: Record<SupportActionType, SupportPermissionCode> = {
  VIEW_ORDER_SUPPORT_CONTEXT: 'CAN_VIEW_ORDER_SUPPORT_CONTEXT',
  VIEW_CUSTOMER_SUPPORT_CONTEXT: 'CAN_VIEW_CUSTOMER_SUPPORT_CONTEXT',
  CREATE_SUPPORT_TRIAGE_HANDOFF: 'CAN_CREATE_SUPPORT_TRIAGE_HANDOFF',
  REQUEST_ORDER_OWNER_REVIEW: 'CAN_REQUEST_ORDER_OWNER_REVIEW',
  REQUEST_REFUND_OWNER_REVIEW: 'CAN_REQUEST_REFUND_OWNER_REVIEW',
  REQUEST_ESCALATION_REVIEW: 'CAN_REQUEST_ESCALATION_REVIEW',
  ASSIGN_SUPPORT_TICKET_FOUNDATION: 'CAN_ASSIGN_SUPPORT_TICKET_FOUNDATION'
};

const supportVisibilityPermissions = new Set<SupportPermissionCode>([
  'CAN_VIEW_ORDER_SUPPORT_CONTEXT',
  'CAN_VIEW_CUSTOMER_SUPPORT_CONTEXT'
]);

const allowedSupportActorRoles = new Set(['ADMIN', 'OPERATOR']);

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

export function validateSupportProtectedAction(req: SupportProtectedActionRequest): SupportActionResult {
  const requiredError = validateSupportActionRequiredFields(req);
  if (requiredError) {
    return supportFailure(req, requiredError, {
      permissionChecked: false,
      visibilityScopeChecked: Boolean(req.scopeId && req.targetId && req.scopeId === req.targetId)
    });
  }

  if (!allowedSupportActorRoles.has(req.actorRole)) {
    return supportFailure(req, 'Insufficient permissions', {
      permissionChecked: true,
      roleSpoofingBlocked: true
    });
  }

  const expectedPermission = supportActionPermissionMap[req.actionType];
  if (!expectedPermission || (req.permissionCode && req.permissionCode !== expectedPermission)) {
    return supportFailure(req, 'Insufficient permissions', { permissionChecked: true });
  }

  if (!isSupportScopeAllowed(req)) {
    return supportFailure(req, 'Unauthorized visibility scope', {
      permissionChecked: true,
      visibilityScopeChecked: true
    });
  }

  if (processedSupportIdempotencyKeys.has(req.idempotencyKey)) {
    return {
      success: false,
      error: 'Duplicate idempotency key',
      evidence: createSupportEvidence(req, {
        decision: 'DUPLICATE_IDEMPOTENCY_KEY',
        reasonCode: 'ALREADY_PROCESSED',
        permissionCode: expectedPermission,
        permissionChecked: true,
        visibilityScopeChecked: true,
        roleSpoofingBlocked: true,
        ownerDomainHandoff: getSupportOwnerDomainForAction(req.actionType)
      })
    };
  }

  processedSupportIdempotencyKeys.add(req.idempotencyKey);

  return {
    success: true,
    evidence: createSupportEvidence(req, {
      decision: 'PENDING_OWNER_DOMAIN',
      permissionCode: expectedPermission,
      permissionChecked: true,
      visibilityScopeChecked: true,
      roleSpoofingBlocked: true,
      ownerDomainHandoff: getSupportOwnerDomainForAction(req.actionType)
    })
  };
}

export function checkSupportVisibility(req: SupportVisibilityRequest): SupportVisibilityResult {
  const requiredError = validateSupportVisibilityRequiredFields(req);
  if (requiredError) {
    return {
      success: false,
      error: requiredError,
      evidence: createSupportEvidence(visibilityToActionRequest(req), {
        decision: 'REJECTED',
        permissionChecked: false,
        visibilityScopeChecked: Boolean(req.scopeId && req.targetId && req.scopeId === req.targetId),
        ownerDomainHandoff: null
      })
    };
  }

  if (!allowedSupportActorRoles.has(req.actorRole)) {
    return {
      success: false,
      error: 'Insufficient permissions',
      evidence: createSupportEvidence(visibilityToActionRequest(req), {
        decision: 'REJECTED',
        permissionChecked: true,
        visibilityScopeChecked: false,
        roleSpoofingBlocked: true,
        ownerDomainHandoff: null
      })
    };
  }

  if (req.permissionCode && !supportVisibilityPermissions.has(req.permissionCode)) {
    return {
      success: false,
      error: 'Insufficient permissions',
      evidence: createSupportEvidence(visibilityToActionRequest(req), {
        decision: 'REJECTED',
        permissionChecked: true,
        visibilityScopeChecked: false,
        ownerDomainHandoff: null
      })
    };
  }

  if (!isVisibilityScopeAllowed(req)) {
    return {
      success: false,
      error: 'Unauthorized visibility scope',
      evidence: createSupportEvidence(visibilityToActionRequest(req), {
        decision: 'REJECTED',
        permissionChecked: true,
        visibilityScopeChecked: true,
        ownerDomainHandoff: null
      })
    };
  }

  return {
    success: true,
    evidence: createSupportEvidence(visibilityToActionRequest(req), {
      decision: 'ALLOWED_MASKED_VISIBILITY',
      permissionCode: req.permissionCode || getVisibilityPermission(req),
      permissionChecked: true,
      visibilityScopeChecked: true,
      roleSpoofingBlocked: true,
      ownerDomainHandoff: getSupportOwnerDomainForAction(visibilityToActionType(req))
    }),
    maskedContext: {
      targetId: req.targetId,
      customerId: req.customerId,
      orderId: req.orderId,
      ticketId: req.ticketId,
      piiPolicy: 'MASKED_MINIMIZED_ONLY',
      maskedCustomerRef: req.customerId ? `${req.customerId.slice(0, 4)}***` : undefined
    }
  };
}

function validateSupportActionRequiredFields(req: Partial<SupportProtectedActionRequest>): string | null {
  if (!req.actorId || !req.actorRole) return 'Missing actorId or actorRole';
  if (!req.supportRole) return 'Missing supportRole';
  if (!req.actionType) return 'Missing actionType';
  if (!req.targetType || !req.targetId) return 'Missing target';
  if (!req.reasonCode) return 'Missing reasonCode';
  if (!req.correlationId) return 'Missing correlationId';
  if (!req.idempotencyKey) return 'Missing idempotencyKey';
  if (!req.requestedAt) return 'Missing requestedAt';
  return null;
}

function validateSupportVisibilityRequiredFields(req: Partial<SupportVisibilityRequest>): string | null {
  if (!req.actorId || !req.actorRole) return 'Missing actorId or actorRole';
  if (!req.supportRole) return 'Missing supportRole';
  if (!req.visibilityScope) return 'Missing visibilityScope';
  if (!req.targetType || !req.targetId) return 'Missing target';
  if (!req.reasonCode) return 'Missing reasonCode';
  if (!req.correlationId) return 'Missing correlationId';
  if (!req.idempotencyKey) return 'Missing idempotencyKey';
  if (!req.requestedAt) return 'Missing requestedAt';
  return null;
}

function supportFailure(
  req: Partial<SupportProtectedActionRequest>,
  error: string,
  flags: Partial<Pick<SupportProtectedActionEvidence, 'permissionChecked' | 'visibilityScopeChecked' | 'roleSpoofingBlocked'>> = {}
): SupportActionResult {
  return {
    success: false,
    error,
    evidence: createSupportEvidence(req, {
      decision: 'REJECTED',
      permissionChecked: flags.permissionChecked ?? false,
      visibilityScopeChecked: flags.visibilityScopeChecked ?? false,
      roleSpoofingBlocked: flags.roleSpoofingBlocked ?? false,
      ownerDomainHandoff: null
    })
  };
}

function createSupportEvidence(
  req: Partial<SupportProtectedActionRequest>,
  overrides: Partial<SupportProtectedActionEvidence>
): SupportProtectedActionEvidence {
  const actionType = req.actionType || 'VIEW_ORDER_SUPPORT_CONTEXT';

  return {
    actorId: req.actorId || 'UNKNOWN',
    actorRole: req.actorRole || 'UNKNOWN',
    supportRole: req.supportRole || 'UNKNOWN',
    supportTeam: req.supportTeam || null,
    actionType,
    targetType: req.targetType || 'ORDER',
    targetId: req.targetId || 'UNKNOWN',
    customerId: req.customerId || null,
    orderId: req.orderId || null,
    ticketId: req.ticketId || null,
    refundId: req.refundId || null,
    reasonCode: overrides.reasonCode || req.reasonCode || 'MISSING_REASON_CODE',
    correlationId: req.correlationId || 'UNKNOWN',
    idempotencyKey: req.idempotencyKey || 'UNKNOWN',
    decision: overrides.decision || 'REJECTED',
    permissionCode: overrides.permissionCode || (req.permissionCode ?? null),
    visibilityScope: getVisibilityScopeForAction(actionType),
    piiPolicy: 'MASKED_MINIMIZED_ONLY',
    ownerDomainHandoff: overrides.ownerDomainHandoff ?? null,
    auditRequired: true,
    supportDirectWrite: false,
    orderTruthMutated: false,
    refundTruthMutated: false,
    financeTruthMutated: false,
    payoutTruthMutated: false,
    customerTruthMutated: false,
    customerPiiExposed: false,
    piiMasked: true,
    piiMinimized: true,
    bffTruthMutated: false,
    uiTruthMutated: false,
    roleSpoofingBlocked: overrides.roleSpoofingBlocked ?? false,
    permissionChecked: overrides.permissionChecked ?? false,
    visibilityScopeChecked: overrides.visibilityScopeChecked ?? false,
    auditEvidenceRequired: true,
    reasonCodeRequired: true,
    businessTruthMutated: false
  };
}

function isSupportScopeAllowed(req: SupportProtectedActionRequest): boolean {
  if (!req.scopeId) return true;
  if (req.targetType === 'ORDER') return req.scopeId === req.orderId || req.scopeId === req.targetId;
  if (req.targetType === 'CUSTOMER') return req.scopeId === req.customerId || req.scopeId === req.targetId;
  if (req.targetType === 'SUPPORT_TICKET') return req.scopeId === req.ticketId || req.scopeId === req.targetId;
  if (req.targetType === 'REFUND') return req.scopeId === req.refundId || req.scopeId === req.targetId;
  return req.scopeId === req.targetId;
}

function isVisibilityScopeAllowed(req: SupportVisibilityRequest): boolean {
  if (!req.scopeId) return true;
  if (req.visibilityScope === 'ORDER_SUPPORT_CONTEXT') return req.scopeId === req.orderId || req.scopeId === req.targetId;
  if (req.visibilityScope === 'CUSTOMER_SUPPORT_CONTEXT') return req.scopeId === req.customerId || req.scopeId === req.targetId;
  if (req.visibilityScope === 'TICKET_SUPPORT_CONTEXT') return req.scopeId === req.ticketId || req.scopeId === req.targetId;
  return false;
}

function visibilityToActionType(req: SupportVisibilityRequest): SupportActionType {
  return req.visibilityScope === 'CUSTOMER_SUPPORT_CONTEXT'
    ? 'VIEW_CUSTOMER_SUPPORT_CONTEXT'
    : 'VIEW_ORDER_SUPPORT_CONTEXT';
}

function visibilityToActionRequest(req: SupportVisibilityRequest): SupportProtectedActionRequest {
  return {
    ...req,
    actionType: visibilityToActionType(req)
  };
}

function getVisibilityPermission(req: SupportVisibilityRequest): SupportPermissionCode {
  return req.visibilityScope === 'CUSTOMER_SUPPORT_CONTEXT'
    ? 'CAN_VIEW_CUSTOMER_SUPPORT_CONTEXT'
    : 'CAN_VIEW_ORDER_SUPPORT_CONTEXT';
}

function getVisibilityScopeForAction(actionType: SupportActionType) {
  if (actionType === 'VIEW_CUSTOMER_SUPPORT_CONTEXT') return 'CUSTOMER_SUPPORT_CONTEXT';
  if (actionType === 'VIEW_ORDER_SUPPORT_CONTEXT') return 'ORDER_SUPPORT_CONTEXT';
  if (actionType === 'ASSIGN_SUPPORT_TICKET_FOUNDATION') return 'TICKET_SUPPORT_CONTEXT';
  return null;
}

function getSupportOwnerDomainForAction(actionType: SupportActionType): string {
  switch (actionType) {
    case 'VIEW_ORDER_SUPPORT_CONTEXT':
    case 'REQUEST_ORDER_OWNER_REVIEW':
      return 'ORDER_OPERATIONS_DOMAIN';
    case 'VIEW_CUSTOMER_SUPPORT_CONTEXT':
      return 'CUSTOMER_DOMAIN';
    case 'REQUEST_REFUND_OWNER_REVIEW':
      return 'REFUND_DOMAIN';
    case 'REQUEST_ESCALATION_REVIEW':
      return 'ESCALATION_OWNER_DOMAIN';
    case 'CREATE_SUPPORT_TRIAGE_HANDOFF':
    case 'ASSIGN_SUPPORT_TICKET_FOUNDATION':
      return 'SUPPORT_OPERATIONS_DOMAIN';
    default:
      return 'UNKNOWN_DOMAIN';
  }
}
