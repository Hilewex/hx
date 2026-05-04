import { 
  CreateUserProductStoryCommand, 
  UgcListQuery, 
  UgcTransitionCommand 
} from '@hx/contracts';
import {
  createUserProductStory,
  listUgc,
  getUgcById,
  transitionUgc
} from '@hx/ugc';
import * as response from './response';
import { requireSocialCustomerActor, requireActorType } from './guards';

export const handleCreateUserProductStory = async (context: any, body: any) => {
  const guard = requireSocialCustomerActor(context);
  if (!guard.allowed) return guard.response;

  try {
    const command: CreateUserProductStoryCommand = {
      ...body,
      actorId: context.actorId,
    };
    const result = await createUserProductStory(command);
    if (!result.success) return response.badRequest('CREATE_UGC_FAILED', 'Failed');
    return response.created(result);
  } catch (error: any) {
    console.error('[BFF] handleCreateUserProductStory error:', error?.stack || error);
    return response.internalError();
  }
};

export const handleListUgc = async (context: any, query: any) => {
  const listQuery: UgcListQuery = {
    ...query
  };
  const result = await listUgc(listQuery);
  return response.ok(result);
};

export const handleGetUgc = async (context: any, ugcId: string) => {
  const ugc = await getUgcById(ugcId);
  if (!ugc) return response.notFound('UGC_NOT_FOUND', 'UGC not found');
  return response.ok({ success: true, ugc });
};

export const handleTransitionUgc = async (context: any, body: any) => {
  const guard = requireActorType(context, ['CUSTOMER', 'ADMIN', 'OPERATOR']);
  if (!guard.allowed) return guard.response;

  if (context.role === 'CUSTOMER') {
      const ugc = await getUgcById(body.ugcId);
      if (!ugc) return response.notFound('UGC_NOT_FOUND', 'UGC not found');
      if (ugc.actorId !== context.actorId) {
          return response.forbidden('FORBIDDEN_OWNERSHIP', 'You can only modify your own UGC');
      }
  }

  const command: UgcTransitionCommand = {
    ...body
  };
  const result = await transitionUgc(command);
  if (!result.success) return response.badRequest('TRANSITION_FAILED', 'Failed');
  return response.ok(result);
};
