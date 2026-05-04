import { 
  CreateStorePostCommand, 
  StorePostListQuery, 
  StorePostTransitionCommand 
} from '@hx/contracts';
import {
  createStorePost,
  getStorePostById,
  listStorePosts,
  transitionStorePost
} from '@hx/post';
import * as response from './response';
import { requireCreator, requireActorType } from './guards';

const storePostTypes = new Set(['ANNOUNCEMENT', 'PRODUCT_LINKED', 'COLLECTION', 'CAMPAIGN_NEWS', 'STORE_UPDATE']);
const storePostVisibilities = new Set(['FOLLOWERS_ONLY', 'STORE_PROFILE', 'INTERNAL_ONLY']);

const validateCreateStorePost = (command: Partial<CreateStorePostCommand>): string[] => {
  const errors: string[] = [];

  if (!command.creatorId) errors.push('CREATOR_ID_REQUIRED');
  if (!command.storefrontId) errors.push('STOREFRONT_ID_REQUIRED');
  if (!command.postType || !storePostTypes.has(command.postType)) errors.push('INVALID_POST_TYPE');
  if (!command.title) errors.push('TITLE_REQUIRED');
  if (!command.body) errors.push('BODY_REQUIRED');
  if (command.visibility && !storePostVisibilities.has(command.visibility)) errors.push('INVALID_VISIBILITY');

  return errors;
};

export const handleCreateStorePost = async (context: any, body: any) => {
  const guard = requireCreator(context);
  if (!guard.allowed) return guard.response;

  try {
    const command: CreateStorePostCommand = {
      ...body,
      creatorId: context?.actorId,
    };

    const validationErrors = validateCreateStorePost(command);
    if (validationErrors.length > 0) {
      return response.badRequest('EXPECTED_VALIDATION', validationErrors[0], { errors: validationErrors });
    }

    const result = await createStorePost(command);
    if (!result.success) return response.badRequest('CREATE_POST_FAILED', result.errors?.[0] || 'Failed');
    return response.ok(result);
  } catch (error: any) {
    console.error('[BFF] handleCreateStorePost error:', error?.stack || error);
    return response.internalError();
  }
};

export const handleListStorePosts = async (context: any, query: any) => {
  const listQuery: StorePostListQuery = {
    ...query
  };
  
  const result = await listStorePosts(listQuery);
  
  console.log(`[BFF] Post list result count: ${result.items?.length || 0}`);
  
  return response.ok(result);
};

export const handleGetStorePost = async (context: any, postId: string) => {
  const post = await getStorePostById(postId);
  if (!post) return response.notFound('POST_NOT_FOUND', 'Post not found');
  return response.ok({ success: true, post });
};

export const handleTransitionStorePost = async (context: any, body: any) => {
  const guard = requireActorType(context, ['CREATOR', 'ADMIN', 'OPERATOR']);
  if (!guard.allowed) return guard.response;

  const command: StorePostTransitionCommand = {
    ...body
  };
  
  // Post ownership validation check logic
  if (context.role === 'CREATOR') {
    const post = await getStorePostById(command.postId);
    if (!post) return response.notFound('POST_NOT_FOUND', 'Post not found');
    if (post.creatorId !== context.actorId) {
      return response.forbidden('FORBIDDEN_OWNERSHIP', 'You can only modify your own post');
    }
  }

  const result = await transitionStorePost(command);
  if (!result.success) return response.badRequest('TRANSITION_FAILED', result.errors?.[0] || 'Failed');
  return response.ok(result);
};
