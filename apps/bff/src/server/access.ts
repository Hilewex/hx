import { ActorContext, AuthorizationDecision, ActorRole } from '@hx/contracts';

export function checkAccess(context: ActorContext, requiredRoles?: ActorRole[]): AuthorizationDecision {
  if (requiredRoles && requiredRoles.length > 0) {
    if (!context.isAuthenticated) {
      return { isAllowed: false, reason: 'UNAUTHORIZED', message: 'Authentication required' };
    }
    if (!requiredRoles.includes(context.role)) {
      return { isAllowed: false, reason: 'FORBIDDEN_ROLE', message: 'Insufficient role' };
    }
  }
  return { isAllowed: true };
}
