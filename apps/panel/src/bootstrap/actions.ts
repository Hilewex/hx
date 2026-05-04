import { ActorRole } from '@hx/contracts';

export interface ActionCapability {
  canView: boolean;
  canInitiate: boolean;
}

export function evaluateCapabilities(role: ActorRole): ActionCapability {
  // E.g. A CUSTOMER cannot view or initiate panel actions
  // A SUPPLIER might view but not initiate moderation
  // An OPERATOR can view and initiate
  if (role === 'GUEST' || role === 'CUSTOMER') {
    return { canView: false, canInitiate: false };
  }
  if (role === 'SUPPLIER') {
    return { canView: true, canInitiate: false };
  }
  if (role === 'OPERATOR' || role === 'ADMIN') {
    return { canView: true, canInitiate: true };
  }
  return { canView: false, canInitiate: false };
}

export function initiatePanelAction(capability: ActionCapability, reason: string) {
  if (!capability.canInitiate) {
    throw new Error('FORBIDDEN: You do not have permission to initiate this action');
  }
  if (!reason || reason.trim() === '') {
    throw new Error('VALIDATION: Action reason is required');
  }
  
  return {
    actionId: 'act_panel_123',
    payload: { status: 'APPROVED' },
    reason
  };
}
