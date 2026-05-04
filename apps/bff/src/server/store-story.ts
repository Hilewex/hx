import * as storeStoryService from '@hx/store-story';
import {
  CreateStoreStoryCommand,
  PublishStoreStoryCommand,
  UnpublishStoreStoryCommand,
  ArchiveStoreStoryCommand,
  ReorderStoreStoriesCommand,
  StoreStoryErrorCode,
} from '@hx/contracts';
import * as http from 'http';

export interface StoreStoryActorContext {
  actorId: string;
  actorType: 'CREATOR' | 'ADMIN' | 'CUSTOMER' | 'SUPPLIER';
  storefrontId?: string;
}

export function extractStoreStoryActorContext(
  req: http.IncomingMessage
): StoreStoryActorContext | null {
  const actorId = req.headers['x-actor-id'];
  const actorType = req.headers['x-actor-type'];
  const storefrontId = req.headers['x-storefront-id'];

  if (
    !actorId ||
    !actorType ||
    typeof actorId !== 'string' ||
    typeof actorType !== 'string'
  ) {
    return null;
  }

  return {
    actorId,
    actorType: actorType as any,
    storefrontId: typeof storefrontId === 'string' ? storefrontId : undefined,
  };
}

// Creator Routes
export const createStoreStory = async (
  actor: StoreStoryActorContext,
  cmd: CreateStoreStoryCommand
) => {
  if (actor.actorType !== 'CREATOR') {
    return { success: false, error: { code: StoreStoryErrorCode.UNAUTHORIZED, message: 'Only CREATORS can create stories' } };
  }
  if (!actor.storefrontId) {
    return { success: false, error: { code: StoreStoryErrorCode.UNAUTHORIZED, message: 'x-storefront-id is required' } };
  }
  return await storeStoryService.createStoreStory(actor.storefrontId, cmd);
};

export const listCreatorStoreStories = async (actor: StoreStoryActorContext) => {
  if (actor.actorType !== 'CREATOR') {
    return { success: false, error: { code: StoreStoryErrorCode.UNAUTHORIZED, message: 'Unauthorized' } };
  }
  if (!actor.storefrontId) {
    return { success: false, error: { code: StoreStoryErrorCode.UNAUTHORIZED, message: 'x-storefront-id is required' } };
  }
  return await storeStoryService.listStoreStoriesForStorefront(actor.storefrontId);
};

export const getCreatorStoreStory = async (
  actor: StoreStoryActorContext,
  storeStoryId: string
) => {
  if (actor.actorType !== 'CREATOR') {
    return { success: false, error: { code: StoreStoryErrorCode.UNAUTHORIZED, message: 'Unauthorized' } };
  }
  if (!actor.storefrontId) {
    return { success: false, error: { code: StoreStoryErrorCode.UNAUTHORIZED, message: 'x-storefront-id is required' } };
  }
  return await storeStoryService.getStoreStory(actor.storefrontId, storeStoryId);
};

export const publishStoreStory = async (
  actor: StoreStoryActorContext,
  storeStoryId: string
) => {
  if (actor.actorType !== 'CREATOR') {
    return { success: false, error: { code: StoreStoryErrorCode.UNAUTHORIZED, message: 'Unauthorized' } };
  }
  if (!actor.storefrontId) {
    return { success: false, error: { code: StoreStoryErrorCode.UNAUTHORIZED, message: 'x-storefront-id is required' } };
  }
  return await storeStoryService.publishStoreStory(actor.storefrontId, { storeStoryId });
};

export const unpublishStoreStory = async (
  actor: StoreStoryActorContext,
  storeStoryId: string,
  cmd: { reason: string }
) => {
  if (actor.actorType !== 'CREATOR') {
    return { success: false, error: { code: StoreStoryErrorCode.UNAUTHORIZED, message: 'Unauthorized' } };
  }
  if (!actor.storefrontId) {
    return { success: false, error: { code: StoreStoryErrorCode.UNAUTHORIZED, message: 'x-storefront-id is required' } };
  }
  return await storeStoryService.unpublishStoreStory(actor.storefrontId, { storeStoryId, reason: cmd.reason });
};

export const archiveStoreStory = async (
  actor: StoreStoryActorContext,
  storeStoryId: string
) => {
  if (actor.actorType !== 'CREATOR') {
    return { success: false, error: { code: StoreStoryErrorCode.UNAUTHORIZED, message: 'Unauthorized' } };
  }
  if (!actor.storefrontId) {
    return { success: false, error: { code: StoreStoryErrorCode.UNAUTHORIZED, message: 'x-storefront-id is required' } };
  }
  return await storeStoryService.archiveStoreStory(actor.storefrontId, { storeStoryId });
};

export const reorderStoreStories = async (
  actor: StoreStoryActorContext,
  cmd: ReorderStoreStoriesCommand
) => {
  if (actor.actorType !== 'CREATOR') {
    return { success: false, error: { code: StoreStoryErrorCode.UNAUTHORIZED, message: 'Unauthorized' } };
  }
  if (!actor.storefrontId) {
    return { success: false, error: { code: StoreStoryErrorCode.UNAUTHORIZED, message: 'x-storefront-id is required' } };
  }
  return await storeStoryService.reorderStoreStories(actor.storefrontId, cmd);
};

// Public Routes
export const listPublicStoreStories = async (storefrontId: string) => {
  return await storeStoryService.listPublishedStoreStoriesForPublicStorefront(storefrontId);
};
