import { 
  toggleInteraction, 
  removeInteraction, 
  recordShareInteraction, 
  getInteractionState, 
  listActorInteractions 
} from '@hx/interaction';
import { 
  ToggleInteractionCommand, 
  RemoveInteractionCommand, 
  ShareInteractionCommand, 
  GetInteractionStateQuery, 
  ListActorInteractionsQuery 
} from '@hx/contracts';
import * as response from './response';

const mapErrorToResponse = (error: string): response.BffResponse => {
  if (error.startsWith('TARGET_VISIBILITY_')) {
    return response.forbidden(error, 'Target is not visible for interaction');
  }

  switch (error) {
    case 'ACTOR_REQUIRED':
    case 'INTERACTION_TARGET_TYPE_REQUIRED':
    case 'INTERACTION_TARGET_ID_REQUIRED':
    case 'INTERACTION_ACTION_REQUIRED':
    case 'SHARE_REQUIRES_RECORD_SHARE':
    case 'INTERACTION_TARGET_ACTION_NOT_ALLOWED':
    case 'UNKNOWN_TARGET_VISIBILITY_BLOCKED':
      return response.badRequest(error, 'Validation error');
    default: return response.internalError();
  }
};

export const handleToggleInteraction = async (context: any, body: ToggleInteractionCommand) => {
  const finalActorId = context?.actorId;
  const result = await toggleInteraction({ ...body, actorId: finalActorId });
  
  if (!result.success) {
    return mapErrorToResponse(result.errors?.[0] || 'FAILED');
  }
  return response.ok(result);
};

export const handleRemoveInteraction = async (context: any, body: RemoveInteractionCommand) => {
  const finalActorId = context?.actorId;
  const result = await removeInteraction({ ...body, actorId: finalActorId });
  
  if (!result.success) {
    return mapErrorToResponse(result.errors?.[0] || 'FAILED');
  }
  return response.ok(result);
};

export const handleRecordShareInteraction = async (context: any, body: ShareInteractionCommand) => {
  const finalActorId = context?.actorId;
  const result = await recordShareInteraction({ ...body, actorId: finalActorId });
  
  if (!result.success) {
    return mapErrorToResponse(result.errors?.[0] || 'FAILED');
  }
  return response.created(result);
};

export const handleGetInteractionState = async (context: any, query: GetInteractionStateQuery) => {
  const finalActorId = context?.actorId;
  const result = await getInteractionState({ ...query, actorId: finalActorId });
  return response.ok(result);
};

export const handleListActorInteractions = async (context: any, query: ListActorInteractionsQuery) => {
  const finalActorId = context?.actorId;
  if (!finalActorId) return response.badRequest('ACTOR_REQUIRED', 'Actor ID required');
  const result = await listActorInteractions({ ...query, actorId: finalActorId });
  return response.ok(result);
};
