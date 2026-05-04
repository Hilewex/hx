import { AuthState } from './auth';

export type RouteType = 'PUBLIC' | 'PROTECTED';

export function resolveWebRoute(route: RouteType, authState: AuthState) {
  if (route === 'PROTECTED' && authState.status === 'GUEST') {
    return { action: 'REDIRECT_TO_LOGIN' };
  }
  return { action: 'RENDER_ROUTE' };
}
