import { ActorContext } from '@hx/contracts';

export type AuthState = 
  | { status: 'LOADING' }
  | { status: 'UNAUTHORIZED' }
  | { status: 'AUTHENTICATED'; actor: ActorContext };

export function initializeAuth(): AuthState {
  // Panel strictly requires authentication. If absent, it should fallback to UNAUTHORIZED
  return { status: 'UNAUTHORIZED' };
}
