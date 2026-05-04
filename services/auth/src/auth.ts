import {
  ActorContext,
  AuthTokenClaims,
  GuestActor,
  AuthenticatedActor,
} from '@hx/contracts';
import { validateAuthToken } from './token';

export function createGuestActor(): GuestActor {
  return {
    role: 'GUEST',
    isAuthenticated: false,
  };
}

export function createAuthenticatedActorFromClaims(claims: AuthTokenClaims): AuthenticatedActor {
  return {
    role: claims.role as any, // TypeScript sees Exclude<ActorRole, 'GUEST'>
    isAuthenticated: true,
    actorId: claims.sub,
    sessionId: claims.sid,
  };
}

export function resolveActorFromAuthorizationHeader(header?: string): { actor: ActorContext; isValidToken: boolean; state: string } {
  if (!header || !header.startsWith('Bearer ')) {
    return { actor: createGuestActor(), isValidToken: false, state: 'ABSENT' };
  }

  const token = header.substring(7);
  const result = validateAuthToken(token);

  if (result.isValid && result.claims) {
    return {
      actor: createAuthenticatedActorFromClaims(result.claims),
      isValidToken: true,
      state: 'ACTIVE',
    };
  }

  // Token is invalid/expired
  return {
    actor: createGuestActor(),
    isValidToken: false,
    state: result.state,
  };
}
