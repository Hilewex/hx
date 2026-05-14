import type { ActorContext, AuthSession } from '@hx/contracts';
import { readBffProjection } from './read';

export type SessionProjection =
  | { kind: 'unknown'; isLoading: true }
  | { kind: 'guest'; isLoading: false; actor: Extract<ActorContext, { role: 'GUEST' }> }
  | { kind: 'authenticated'; isLoading: false; actor: Exclude<ActorContext, { role: 'GUEST' }> };

export const unknownSessionProjection: SessionProjection = {
  kind: 'unknown',
  isLoading: true,
};

export async function readSessionProjection(): Promise<SessionProjection> {
  const session = await readBffProjection<AuthSession>('/session');
  if (!session.actor.isAuthenticated) {
    return {
      kind: 'guest',
      isLoading: false,
      actor: session.actor,
    };
  }

  return {
    kind: 'authenticated',
    isLoading: false,
    actor: session.actor,
  };
}
