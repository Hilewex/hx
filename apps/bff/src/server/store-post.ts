import { Router } from 'express';
import { 
  StorePostV2
} from '@hx/contracts';
import * as StorePostService from '../../../../services/store-post/src';

const router: Router = Router();

// Middleware: actorType CREATOR zorunlu
const creatorGuard = (req: any, res: any, next: any) => {
  const actorType = req.headers['x-actor-type'];
  if (actorType !== 'CREATOR') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Only creators can access these routes'
      }
    });
  }
  next();
};

// Middleware: x-storefront-id zorunlu
const storefrontGuard = (req: any, res: any, next: any) => {
  const storefrontId = req.headers['x-storefront-id'];
  if (!storefrontId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'x-storefront-id header is required'
      }
    });
  }
  next();
};

// POST /store-post/creator/posts
router.post('/creator/posts', creatorGuard, storefrontGuard, async (req: any, res: any) => {
  try {
    const storefrontId = req.headers['x-storefront-id'] as string;
    const actorId = req.headers['x-actor-id'] as string;
    
    const post = await StorePostService.createStorePost({
      ...req.body,
      storefrontId,
      creatorId: actorId
    });
    
    res.status(201).json({ success: true, data: post });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: error.message } });
  }
});

// GET /store-post/creator/posts
router.get('/creator/posts', creatorGuard, storefrontGuard, async (req: any, res: any) => {
  try {
    const storefrontId = req.headers['x-storefront-id'] as string;
    const posts = await StorePostService.listStorePostsForStorefront(storefrontId);
    res.json({ success: true, data: posts });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: error.message } });
  }
});

// GET /store-post/creator/posts/:storePostId
router.get('/creator/posts/:storePostId', creatorGuard, storefrontGuard, async (req: any, res: any) => {
  try {
    const post = await StorePostService.getStorePost(req.params.storePostId);
    if (!post) {
      return res.status(404).json({ success: false, error: { code: StorePostV2.StorePostErrorCode.POST_NOT_FOUND } });
    }
    res.json({ success: true, data: post });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: error.message } });
  }
});

// POST /store-post/creator/posts/:storePostId/publish
router.post('/creator/posts/:storePostId/publish', creatorGuard, storefrontGuard, async (req: any, res: any) => {
  try {
    const storefrontId = req.headers['x-storefront-id'] as string;
    const actorId = req.headers['x-actor-id'] as string;
    const post = await StorePostService.publishStorePost({
      storePostId: req.params.storePostId,
      storefrontId,
      creatorId: actorId
    });
    res.json({ success: true, data: post });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: error.message } });
  }
});

// POST /store-post/creator/posts/:storePostId/hide
router.post('/creator/posts/:storePostId/hide', creatorGuard, storefrontGuard, async (req: any, res: any) => {
  try {
    const storefrontId = req.headers['x-storefront-id'] as string;
    const actorId = req.headers['x-actor-id'] as string;
    const post = await StorePostService.hideStorePost({
      storePostId: req.params.storePostId,
      storefrontId,
      creatorId: actorId,
      reason: req.body.reason
    });
    res.json({ success: true, data: post });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: error.message } });
  }
});

// POST /store-post/creator/posts/:storePostId/archive
router.post('/creator/posts/:storePostId/archive', creatorGuard, storefrontGuard, async (req: any, res: any) => {
  try {
    const storefrontId = req.headers['x-storefront-id'] as string;
    const actorId = req.headers['x-actor-id'] as string;
    const post = await StorePostService.archiveStorePost({
      storePostId: req.params.storePostId,
      storefrontId,
      creatorId: actorId,
      reason: req.body.reason
    });
    res.json({ success: true, data: post });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: error.message } });
  }
});

// POST /store-post/creator/posts/reorder
router.post('/creator/posts/reorder', creatorGuard, storefrontGuard, async (req: any, res: any) => {
  try {
    const storefrontId = req.headers['x-storefront-id'] as string;
    const actorId = req.headers['x-actor-id'] as string;
    await StorePostService.reorderStorePosts({
      storefrontId,
      creatorId: actorId,
      orderedIds: req.body.orderedIds
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: error.message } });
  }
});

// GET /store-post/public/:storefrontId
router.get('/public/:storefrontId', async (req: any, res: any) => {
  try {
    const posts = await StorePostService.listPublishedStorePostsForPublicStorefront(req.params.storefrontId);
    res.json({ success: true, data: posts });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: error.message } });
  }
});

// POST /store-post/follow-feed
router.post('/follow-feed', async (req: any, res: any) => {
  try {
    const followedStorefrontIds = req.body.followedStorefrontIds || [];
    const posts = await StorePostService.listFollowFeedPosts(followedStorefrontIds);
    res.json({ success: true, data: posts });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: error.message } });
  }
});

export default router;
