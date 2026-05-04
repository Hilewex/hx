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
  switch (error) {
    case 'ACTOR_REQUIRED':
    case 'INTERACTION_TARGET_TYPE_REQUIRED':
    case 'INTERACTION_TARGET_ID_REQUIRED':
    case 'INTERACTION_ACTION_REQUIRED':
    case 'SHARE_REQUIRES_RECORD_SHARE':
    case 'INTERACTION_TARGET_ACTION_NOT_ALLOWED':
      return response.badRequest(error, 'Validation error');
    default: return response.internalError();
  }
};

export const handleToggleInteraction = async (context: any, body: ToggleInteractionCommand) => {
  const finalActorId = body.actorId || context?.actorId;
  const result = await toggleInteraction({ ...body, actorId: finalActorId });
  
  if (!result.success) {
    return mapErrorToResponse(result.errors?.[0] || 'FAILED');
  }
  return response.ok(result);
};

export const handleRemoveInteraction = async (context: any, body: RemoveInteractionCommand) => {
  const finalActorId = body.actorId || context?.actorId;
  const result = await removeInteraction({ ...body, actorId: finalActorId });
  
  if (!result.success) {
    return mapErrorToResponse(result.errors?.[0] || 'FAILED');
  }
  return response.ok(result);
};

export const handleRecordShareInteraction = async (context: any, body: ShareInteractionCommand) => {
  const finalActorId = body.actorId || context?.actorId;
  const result = await recordShareInteraction({ ...body, actorId: finalActorId });
  
  if (!result.success) {
    return mapErrorToResponse(result.errors?.[0] || 'FAILED');
  }
  return response.created(result);
};

export const handleGetInteractionState = async (context: any, query: GetInteractionStateQuery) => {
  const finalActorId = query.actorId || context?.actorId;
  const result = await getInteractionState({ ...query, actorId: finalActorId });
  return response.ok(result);
};

export const handleListActorInteractions = async (context: any, query: ListActorInteractionsQuery) => {
  const finalActorId = query.actorId || context?.actorId;
  if (!finalActorId) return response.badRequest('ACTOR_REQUIRED', 'Actor ID required');
  const result = await listActorInteractions({ ...query, actorId: finalActorId });
  return response.ok(result);
};
