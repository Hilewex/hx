import { ActorContext, AuthorizationDecision, ProtectedActionRequest, ProtectedActionResult } from '@hx/contracts';
import { checkAccess } from './access';

export function handleProtectedAction(
  context: ActorContext, 
  body: Partial<ProtectedActionRequest>
): { status: number, data: ProtectedActionResult | AuthorizationDecision } {
  
  // 1. Check Access
  const decision = checkAccess(context, ['ADMIN', 'OPERATOR']);
  if (!decision.isAllowed) {
    return { status: decision.reason === 'UNAUTHORIZED' ? 401 : 403, data: decision };
  }

  // 2. Validate Reason
  if (!body.reason || body.reason.trim() === '') {
    return { 
      status: 400, 
      data: { 
        isAllowed: false, 
        reason: 'MISSING_PERMISSION', // Or custom reason
        message: 'A valid reason is required to execute this protected action'
      } 
    };
  }

  // 3. Accept Action
  const result: ProtectedActionResult = {
    actionId: body.actionId || 'act_unknown',
    status: 'ACCEPTED',
    correlationId: `corr_${Date.now()}`,
    message: 'Action accepted and pending execution'
  };

  return { status: 202, data: result }; // 202 Accepted
}
