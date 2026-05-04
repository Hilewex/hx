import { ActorContext, SessionState } from '@hx/contracts';
import { resolveActorFromAuthorizationHeader } from '@hx/auth';

export function resolveContext(authHeader?: string, legacyActorHeader?: string, sessionIdHeader?: string): { context: ActorContext, state: SessionState } {
  const allowLegacyActorHeaderForSmoke = process.env.ALLOW_LEGACY_ACTOR_HEADER_FOR_SMOKE === 'true';

  if (!authHeader && allowLegacyActorHeaderForSmoke && legacyActorHeader) {
    // Legacy actor header fallback for testing. DO NOT USE IN PROD.
    return {
      state: 'ACTIVE',
      context: {
        role: 'CUSTOMER',
        isAuthenticated: true,
        actorId: legacyActorHeader,
        sessionId: sessionIdHeader || 'legacy-session'
      }
    };
  }

  const { actor, state } = resolveActorFromAuthorizationHeader(authHeader);
  if (!actor.isAuthenticated && sessionIdHeader) {
    actor.sessionId = sessionIdHeader;
  }
  return { context: actor, state: state as SessionState };
}
