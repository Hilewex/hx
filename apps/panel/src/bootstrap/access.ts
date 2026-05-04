import { AuthState } from './auth';
import { ActorRole } from '@hx/contracts';

export function resolvePanelRoute(authState: AuthState) {
  if (authState.status === 'UNAUTHORIZED' || authState.status === 'LOADING') {
    return { action: 'REDIRECT_TO_LOGIN', reason: 'UNAUTHORIZED' };
  }
  
  const role = authState.actor.role;
  const allowedRoles: ActorRole[] = ['ADMIN', 'OPERATOR'];
  
  if (!allowedRoles.includes(role)) {
    return { action: 'SHOW_FORBIDDEN', reason: 'FORBIDDEN_ROLE' };
  }
  
  return { action: 'RENDER_ROUTE' };
}
