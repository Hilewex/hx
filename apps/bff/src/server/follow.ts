import { 
  followCreator, 
  unfollowCreator, 
  getFollowState, 
  listFollowing 
} from '@hx/follow';
import { 
  FollowCreatorCommand, 
  UnfollowCreatorCommand, 
  GetFollowStateQuery, 
  ListFollowingQuery 
} from '@hx/contracts';
import * as response from './response';
import { requireSocialCustomerActor } from './guards';

export const handleFollowCreator = async (context: any, body: FollowCreatorCommand) => {
  const guard = requireSocialCustomerActor(context);
  if (!guard.allowed) return guard.response;

  const result = await followCreator({ ...body, actorId: context.actorId });
  if (!result.success) return response.badRequest('FOLLOW_FAILED', 'Follow failed');
  return response.ok(result);
};

export const handleUnfollowCreator = async (context: any, body: UnfollowCreatorCommand) => {
  const guard = requireSocialCustomerActor(context);
  if (!guard.allowed) return guard.response;

  const result = await unfollowCreator({ ...body, actorId: context.actorId });
  if (!result.success) return response.badRequest('UNFOLLOW_FAILED', 'Unfollow failed');
  return response.ok(result);
};

export const handleGetFollowState = async (context: any, query: GetFollowStateQuery) => {
  const finalActorId = context?.actorId;
  const result = await getFollowState({ ...query, actorId: finalActorId });
  return response.ok(result);
};

export const handleListFollowing = async (context: any, query: ListFollowingQuery) => {
  const guard = requireSocialCustomerActor(context);
  if (!guard.allowed) return guard.response;
  
  const result = await listFollowing({ ...query, actorId: context.actorId });
  return response.ok(result);
};
