import { 
  createNotification, 
  listNotificationsForActor,
  getNotificationForActor,
  markNotificationReadForActor,
  archiveNotificationForActor
} from '@hx/notification';
import { 
  ActorContext,
  CreateNotificationCommand, 
  NotificationListQuery, 
  MarkNotificationReadCommand, 
  ArchiveNotificationCommand,
  NotificationActorType
} from '@hx/contracts';
import * as response from './response';

type NotificationGuardResult =
  | { allowed: true; actor: { actorType: NotificationActorType; actorId: string; allowCrossActorAccess?: boolean }; target: { actorType: NotificationActorType; actorId: string }; submittedBy: { actorType: NotificationActorType; actorId: string } }
  | { allowed: false; response: response.BffResponse };

const SELF_NOTIFICATION_ROLES = new Set(['CUSTOMER', 'CREATOR', 'SUPPLIER']);
const OVERRIDE_NOTIFICATION_ROLES = new Set(['ADMIN', 'OPERATOR', 'INTERNAL_SERVICE']);

export async function handleCreateNotification(context: ActorContext, body: any) {
  try {
    const guard = normalizeNotificationTarget(context, body);
    if (!guard.allowed) return guard.response;

    if (!body.title || !body.body) {
      return response.badRequest('INVALID_NOTIFICATION_CONTENT', 'title and body are required');
    }

    const command: CreateNotificationCommand = {
      ...body,
      actorType: guard.target.actorType,
      actorId: guard.target.actorId,
      recipientActorType: guard.target.actorType,
      recipientActorId: guard.target.actorId,
      submittedByActorType: guard.submittedBy.actorType,
      submittedByActorId: guard.submittedBy.actorId,
      actorContextSource: 'BFF_CONTEXT',
      schemaVersion: body.schemaVersion || 'v1'
    };

    const result = await createNotification(command);
    if (result.success) {
      return response.created(result);
    } else {
      return response.unprocessable('NOTIFICATION_CREATION_FAILED', result.errors?.join(', ') || 'Failed to create notification');
    }
  } catch (error: any) {
    return response.internalError('NOTIFICATION_CREATION_FAILED', 'Failed to create notification');
  }
}

export async function handleListNotifications(context: ActorContext, query: any) {
  try {
    const guard = normalizeNotificationTarget(context, query);
    if (!guard.allowed) return guard.response;

    const listQuery: NotificationListQuery = {
      actorType: guard.target.actorType,
      actorId: guard.target.actorId,
      state: query.state,
      category: query.category,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      cursor: query.cursor
    };

    const result = await listNotificationsForActor(guard.actor, listQuery);
    if (result.errors?.includes('NOTIFICATION_ACCESS_DENIED')) {
      return response.forbidden('FORBIDDEN_OWNERSHIP', 'Notification inbox access is limited to the recipient actor');
    }
    return response.ok(result);
  } catch (error: any) {
    return response.internalError('NOTIFICATION_LIST_FAILED', 'Failed to list notifications');
  }
}

export async function handleGetNotification(context: ActorContext, notificationId: string) {
  try {
    const actor = normalizeRequesterActor(context);
    if (!actor.allowed) return actor.response;
    const record = await getNotificationForActor(notificationId, actor.actor);
    if (!record) {
      return response.notFound('RESOURCE_NOT_FOUND', 'Notification not found');
    }
    return response.ok(record);
  } catch (error: any) {
    if (response.isNotFoundError(error)) {
      return response.notFound('RESOURCE_NOT_FOUND', 'Notification not found');
    }
    return response.internalError('NOTIFICATION_GET_FAILED', 'Failed to retrieve notification');
  }
}

export async function handleMarkNotificationRead(context: ActorContext, body: any) {
  try {
    const actor = normalizeRequesterActor(context);
    if (!actor.allowed) return actor.response;
    const command: MarkNotificationReadCommand = body;
    const result = await markNotificationReadForActor(command, actor.actor);
    if (result.success) {
      return response.ok(result);
    } else {
      if (result.errors?.includes('NOTIFICATION_ACCESS_DENIED')) {
        return response.forbidden('FORBIDDEN_OWNERSHIP', 'Notification read access is limited to the recipient actor');
      }
      if (result.errors?.includes('NOTIFICATION_NOT_FOUND')) {
        return response.notFound('RESOURCE_NOT_FOUND', 'Notification not found');
      }
      return response.unprocessable('NOTIFICATION_MARK_READ_FAILED', result.errors?.join(', ') || 'Failed to mark as read');
    }
  } catch (error: any) {
    return response.internalError('NOTIFICATION_MARK_READ_FAILED', 'Failed to mark notification as read');
  }
}

export async function handleArchiveNotification(context: ActorContext, body: any) {
  try {
    const actor = normalizeRequesterActor(context);
    if (!actor.allowed) return actor.response;
    const command: ArchiveNotificationCommand = body;
    const result = await archiveNotificationForActor(command, actor.actor);
    if (result.success) {
      return response.ok(result);
    } else {
      if (result.errors?.includes('NOTIFICATION_ACCESS_DENIED')) {
        return response.forbidden('FORBIDDEN_OWNERSHIP', 'Notification archive access is limited to the recipient actor');
      }
      if (result.errors?.includes('NOTIFICATION_NOT_FOUND')) {
        return response.notFound('RESOURCE_NOT_FOUND', 'Notification not found');
      }
      return response.unprocessable('NOTIFICATION_ARCHIVE_FAILED', result.errors?.join(', ') || 'Failed to archive');
    }
  } catch (error: any) {
    return response.internalError('NOTIFICATION_ARCHIVE_FAILED', 'Failed to archive notification');
  }
}

function normalizeNotificationTarget(context: ActorContext, input: any): NotificationGuardResult {
  const requester = normalizeRequesterActor(context);
  if (!requester.allowed) return requester;

  const requestedActorType = normalizeNotificationActorType(input?.recipientActorType || input?.actorType || input?.actor?.actorType);
  const requestedActorId = normalizeActorId(input?.recipientActorId || input?.actorId || input?.actor?.actorId);

  if (requester.actor.allowCrossActorAccess) {
    const targetActorType = requestedActorType || requester.actor.actorType;
    const targetActorId = requestedActorId || requester.actor.actorId;
    return {
      allowed: true,
      actor: requester.actor,
      target: { actorType: targetActorType, actorId: targetActorId },
      submittedBy: { actorType: requester.actor.actorType, actorId: requester.actor.actorId }
    };
  }

  if (
    (requestedActorType && requestedActorType !== requester.actor.actorType) ||
    (requestedActorId && requestedActorId !== requester.actor.actorId)
  ) {
    return {
      allowed: false,
      response: response.forbidden('FORBIDDEN_OWNERSHIP', 'Body/query notification actor must match authenticated actor context')
    };
  }

  return {
    allowed: true,
    actor: requester.actor,
    target: { actorType: requester.actor.actorType, actorId: requester.actor.actorId },
    submittedBy: { actorType: requester.actor.actorType, actorId: requester.actor.actorId }
  };
}

function normalizeRequesterActor(context: ActorContext): NotificationGuardResult | { allowed: true; actor: { actorType: NotificationActorType; actorId: string; allowCrossActorAccess?: boolean } } {
  if (!context.isAuthenticated) {
    return { allowed: false, response: response.unauthorized('UNAUTHORIZED', 'Authentication is required for notification access') };
  }

  if (SELF_NOTIFICATION_ROLES.has(context.role)) {
    return { allowed: true, actor: { actorType: context.role as NotificationActorType, actorId: context.actorId } };
  }

  if (OVERRIDE_NOTIFICATION_ROLES.has(context.role)) {
    const actorType: NotificationActorType = context.role === 'INTERNAL_SERVICE' ? 'SYSTEM' : (context.role as NotificationActorType);
    return { allowed: true, actor: { actorType, actorId: context.actorId, allowCrossActorAccess: true } };
  }

  return { allowed: false, response: response.forbidden('FORBIDDEN', `Actor type ${context.role} is not allowed to access notifications`) };
}

function normalizeNotificationActorType(value: unknown): NotificationActorType | undefined {
  if (!value || typeof value !== 'string') return undefined;
  if (['CUSTOMER', 'CREATOR', 'SUPPLIER', 'ADMIN', 'OPERATOR', 'SYSTEM'].includes(value)) {
    return value as NotificationActorType;
  }
  return undefined;
}

function normalizeActorId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
