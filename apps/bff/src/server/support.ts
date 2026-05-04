import { 
  createSupportTicket, 
  listSupportTickets, 
  getSupportTicketById, 
  transitionSupportTicket, 
  addSupportTicketMessage 
} from '@hx/support';
import * as response from './response';

export async function handleCreateSupportTicket(context: any, body: any) {
  const { actorType, actorId, category, subtopic, title, description, channel, context: ticketContext, idempotencyKey } = body;

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
  const { actorType, actorId, status, category, limit, cursor } = query;

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
  const { ticketId, targetStatus, actorType, actorId, reasonCode, note } = body;

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
  const { ticketId, authorType, authorId, body: messageBody, isInternalNote } = body;

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
