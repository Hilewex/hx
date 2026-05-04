import { StoryTrayQuery, StoryViewerQuery, StorySurface } from '@hx/contracts';
import { listStoryTray, getStoryViewer } from '@hx/story';
import * as response from './response';

export const handleListStoryTray = async (context: any, query: any) => {
  const trayQuery: StoryTrayQuery = {
    surface: query.surface as StorySurface,
    storefrontId: query.storefrontId as string,
    productId: query.productId as string,
    actorId: context?.actorId || query.actorId as string,
    limit: query.limit ? parseInt(query.limit as string) : undefined,
    cursor: query.cursor as string
  };

  if (!trayQuery.surface) {
    return response.badRequest('SURFACE_REQUIRED', 'Surface context is required');
  }

  const result = await listStoryTray(trayQuery);
  return response.ok(result);
};

export const handleGetStoryViewer = async (context: any, query: any) => {
  const viewerQuery: StoryViewerQuery = {
    storyId: query.storyId as string,
    trayItemId: query.trayItemId as string,
    surface: query.surface as StorySurface,
    storefrontId: query.storefrontId as string,
    productId: query.productId as string,
    actorId: context?.actorId || query.actorId as string
  };

  if (!viewerQuery.surface) {
    return response.badRequest('SURFACE_REQUIRED', 'Surface context is required');
  }

  const result = await getStoryViewer(viewerQuery);

  if (result.emptyState?.code === 'STORY_NOT_FOUND') {
    return response.notFound('STORY_NOT_FOUND', 'Story not found');
  }

  return response.ok(result);
};
