import { ActorContext } from '@hx/contracts';

export type AuthState = 
  | { status: 'LOADING' }
  | { status: 'GUEST'; actor: ActorContext }
  | { status: 'AUTHENTICATED'; actor: ActorContext };

export function initializeAuth(): AuthState {
  return { status: 'GUEST', actor: { role: 'GUEST', isAuthenticated: false } };
}
