import { validateCreatorProtectedAction } from '@hx/creator-management';
import { CreatorProtectedActionRequest } from '@hx/contracts';

export async function handleCreatorProtectedActionValidate(
  context: any,
  reqBody: any,
  headers: Record<string, string | string[] | undefined>
) {
  try {
    const payload = reqBody as CreatorProtectedActionRequest;
    const authenticatedActorId = context?.isAuthenticated ? context.actorId : undefined;
    const authenticatedActorRole = context?.isAuthenticated ? context.role : undefined;
    const headerActorId = headers['x-actor-id'] as string | undefined;
    const headerActorRole = headers['x-actor-role'] as string | undefined;

    const actorId = authenticatedActorId || headerActorId || payload.actorId;
    const actorRole = authenticatedActorRole || headerActorRole || payload.actorRole;

    if (payload.actorId && actorId && payload.actorId !== actorId) {
      const result = validateCreatorProtectedAction({
        ...payload,
        actorId,
        actorRole: actorRole || payload.actorRole
      });
      return {
        status: 403,
        body: {
          ...result,
          success: false,
          error: 'Actor spoofing blocked',
          evidence: {
            ...result.evidence,
            actorSpoofingBlocked: true,
            decision: 'REJECTED'
          }
        }
      };
    }

    const validatedPayload: CreatorProtectedActionRequest = {
      ...payload,
      actorId,
      actorRole
    };

    const result = validateCreatorProtectedAction(validatedPayload);
    return { status: result.success ? 200 : 403, body: result };
  } catch {
    return { status: 500, body: { success: false, error: 'Internal Server Error' } };
  }
}
