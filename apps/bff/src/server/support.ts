import { 
  createSupportTicket, 
  listSupportTickets, 
  getSupportTicketById, 
  transitionSupportTicket, 
  addSupportTicketMessage 
} from '@hx/support';
import { checkSupportVisibility, validateSupportProtectedAction } from '@hx/customer-support';
import { SupportProtectedActionRequest, SupportVisibilityRequest } from '@hx/contracts';
import * as response from './response';

function resolveSupportActor(context: any) {
  return {
    actorType: context?.role,
    actorId: context?.actorId || context?.sessionId,
  };
}

export async function handleCreateSupportTicket(context: any, body: any) {
  const { category, subtopic, title, description, channel, context: ticketContext, idempotencyKey } = body;
  const { actorType, actorId } = resolveSupportActor(context);

  if (!actorType || !actorId) {
    return response.badRequest('INVALID_SUPPORT_ACTOR', 'Actor type and ID are required');
  }

  if (!category || !subtopic || !title || !description || !channel) {
    return response.badRequest('INVALID_SUPPORT_TICKET_CONTENT', 'Missing required fields for support ticket');
  }

  const result = await createSupportTicket({
    actorType,
    actorId,
    category,
    subtopic,
    title,
    description,
    channel,
    context: ticketContext,
    idempotencyKey
  });

  if (!result.success) {
    return response.unprocessable('SUPPORT_TICKET_CREATION_FAILED', result.errors?.join(', ') || 'Failed');
  }

  return response.created(result);
}

export async function handleListSupportTickets(context: any, query: any) {
  const { status, category, limit, cursor } = query;
  const { actorType, actorId } = resolveSupportActor(context);

  if (!actorType || !actorId) {
    return response.badRequest('INVALID_SUPPORT_ACTOR', 'Actor type and ID are required');
  }

  const result = await listSupportTickets({
    actorType,
    actorId,
    status,
    category,
    limit: limit ? parseInt(limit as string, 10) : undefined,
    cursor: cursor as string
  });

  return response.ok(result);
}

export async function handleGetSupportTicket(context: any, ticketId: string) {
  const ticket = await getSupportTicketById(ticketId);

  if (!ticket) {
    return response.notFound('SUPPORT_TICKET_NOT_FOUND', 'Support ticket not found');
  }

  return response.ok(ticket);
}

export async function handleTransitionSupportTicket(context: any, body: any) {
  const { ticketId, targetStatus, reasonCode, note } = body;
  const { actorType, actorId } = resolveSupportActor(context);

  const result = await transitionSupportTicket({
    ticketId,
    targetStatus,
    actorType,
    actorId,
    reasonCode,
    note
  });

  if (!result.success) {
    if (result.errors?.includes('SUPPORT_TICKET_NOT_FOUND')) return response.notFound('SUPPORT_TICKET_NOT_FOUND', 'Support ticket not found');
    return response.badRequest('INVALID_TRANSITION', result.errors?.join(', ') || 'Invalid transition');
  }

  return response.ok(result);
}

export async function handleAddSupportTicketMessage(context: any, body: any) {
  const { ticketId, body: messageBody, isInternalNote } = body;
  const { actorType: authorType, actorId: authorId } = resolveSupportActor(context);

  const result = await addSupportTicketMessage({
    ticketId,
    authorType,
    authorId,
    body: messageBody,
    isInternalNote
  });

  if (!result.success) {
    if (result.errors?.includes('SUPPORT_TICKET_NOT_FOUND')) return response.notFound('SUPPORT_TICKET_NOT_FOUND', 'Support ticket not found');
    if (result.errors?.includes('SUPPORT_TICKET_CLOSED')) return response.badRequest('SUPPORT_TICKET_CLOSED', 'Support ticket is closed');
    if (result.errors?.includes('INTERNAL_NOTE_NOT_ALLOWED')) return response.forbidden('INTERNAL_NOTE_NOT_ALLOWED', 'Internal notes not allowed');
    return response.unprocessable('MESSAGE_FAILED', result.errors?.join(', ') || 'Failed');
  }

  return response.ok(result);
}

export async function handleSupportProtectedActionValidate(
  context: any,
  reqBody: any,
  headers: Record<string, string | string[] | undefined>
) {
  try {
    const payload = reqBody as SupportProtectedActionRequest;
    const authenticatedActorId = context?.isAuthenticated ? context.actorId : undefined;
    const authenticatedActorRole = context?.isAuthenticated ? context.role : undefined;
    const headerActorId = headers['x-actor-id'] as string | undefined;
    const headerActorRole = headers['x-actor-role'] as string | undefined;

    const actorId = authenticatedActorId || headerActorId || payload.actorId;
    const actorRole = authenticatedActorRole || headerActorRole || payload.actorRole;

    if (payload.actorId && actorId && payload.actorId !== actorId) {
      const result = validateSupportProtectedAction({
        ...payload,
        actorId,
        actorRole: actorRole || payload.actorRole
      });
      return {
        status: 403,
        body: {
          ...result,
          success: false,
          error: 'Role spoofing blocked',
          evidence: {
            ...result.evidence,
            roleSpoofingBlocked: true,
            decision: 'REJECTED'
          }
        }
      };
    }

    if (payload.actorRole && actorRole && payload.actorRole !== actorRole) {
      const result = validateSupportProtectedAction({
        ...payload,
        actorId,
        actorRole
      });
      return {
        status: 403,
        body: {
          ...result,
          success: false,
          error: 'Role spoofing blocked',
          evidence: {
            ...result.evidence,
            roleSpoofingBlocked: true,
            decision: 'REJECTED'
          }
        }
      };
    }

    const result = validateSupportProtectedAction({
      ...payload,
      actorId,
      actorRole
    });

    return { status: result.success ? 200 : 403, body: result };
  } catch {
    return { status: 500, body: { success: false, error: 'Internal Server Error' } };
  }
}

export async function handleSupportVisibilityCheck(
  context: any,
  reqBody: any,
  headers: Record<string, string | string[] | undefined>
) {
  try {
    const payload = reqBody as SupportVisibilityRequest;
    const authenticatedActorId = context?.isAuthenticated ? context.actorId : undefined;
    const authenticatedActorRole = context?.isAuthenticated ? context.role : undefined;
    const headerActorId = headers['x-actor-id'] as string | undefined;
    const headerActorRole = headers['x-actor-role'] as string | undefined;

    const actorId = authenticatedActorId || headerActorId || payload.actorId;
    const actorRole = authenticatedActorRole || headerActorRole || payload.actorRole;

    if (payload.actorId && actorId && payload.actorId !== actorId) {
      const result = checkSupportVisibility({
        ...payload,
        actorId,
        actorRole: actorRole || payload.actorRole
      });
      return {
        status: 403,
        body: {
          ...result,
          success: false,
          error: 'Role spoofing blocked',
          evidence: {
            ...result.evidence,
            roleSpoofingBlocked: true,
            decision: 'REJECTED'
          }
        }
      };
    }

    if (payload.actorRole && actorRole && payload.actorRole !== actorRole) {
      const result = checkSupportVisibility({
        ...payload,
        actorId,
        actorRole
      });
      return {
        status: 403,
        body: {
          ...result,
          success: false,
          error: 'Role spoofing blocked',
          evidence: {
            ...result.evidence,
            roleSpoofingBlocked: true,
            decision: 'REJECTED'
          }
        }
      };
    }

    const result = checkSupportVisibility({
      ...payload,
      actorId,
      actorRole
    });

    return { status: result.success ? 200 : 403, body: result };
  } catch {
    return { status: 500, body: { success: false, error: 'Internal Server Error' } };
  }
}
