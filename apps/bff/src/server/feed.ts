import { listFollowFeed } from '@hx/follow';
import { FollowFeedQuery } from '@hx/contracts';
import * as response from './response';

export const handleGetFollowFeed = async (context: any, query: FollowFeedQuery) => {
  if (!context?.actorId) {
    return response.unauthorized('UNAUTHORIZED', 'Actor ID required');
  }

  const result = await listFollowFeed({ ...query, actorId: context.actorId });
  return response.ok(result);
};
