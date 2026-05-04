import { 
  createCreatorStorefront,
  updateCreatorStorefrontProfile,
  getCreatorStorefront,
  getCreatorStorefrontBySlug,
  listCreatorStorefronts,
  suspendCreatorStorefront,
  reactivateCreatorStorefront
} from '@hx/service-storefront';
import { StorefrontErrorCode } from '@hx/contracts';
import { requireCreator, requireAdminOrOperator } from './guards';

// Mock Router for BFF
export const storefrontRouter = async (req: any, res: any) => {
  const { method, url, body, params, query, context } = req;

  // Helper for response
  const send = (status: number, data: any) => res.status(status).json(data);

  // POST /storefront/creator/profile
  if (method === 'POST' && url === '/storefront/creator/profile') {
    const guard = requireCreator(context);
    if (!guard.allowed) return send(guard.response.status, guard.response.body);

    const result = await createCreatorStorefront({
      ...body,
      creatorId: context.actorId
    });
    return send(result.success ? 201 : 400, result);
  }

  // PATCH /storefront/creator/profile/:storefrontId
  if (method === 'PATCH' && url.startsWith('/storefront/creator/profile/')) {
    const guard = requireCreator(context);
    if (!guard.allowed) return send(guard.response.status, guard.response.body);

    const storefrontId = params.storefrontId;
    const result = await updateCreatorStorefrontProfile({
      ...body,
      storefrontId,
      creatorId: context.actorId // Service will check ownership
    });
    return send(result.success ? 200 : (result.error.code === StorefrontErrorCode.ACCESS_DENIED ? 403 : 400), result);
  }

  // GET /storefront/creator/profile/:storefrontId
  if (method === 'GET' && url.startsWith('/storefront/creator/profile/')) {
    const guard = requireCreator(context);
    if (!guard.allowed) return send(guard.response.status, guard.response.body);

    const storefrontId = params.storefrontId;
    const result = await getCreatorStorefront(storefrontId);
    
    // Check ownership
    if (result.success && result.data.creatorId !== context.actorId) {
      return send(403, { success: false, error: { code: StorefrontErrorCode.ACCESS_DENIED, message: 'Not your storefront' } });
    }
    
    return send(result.success ? 200 : 404, result);
  }

  // GET /storefront/public/:slug
  if (method === 'GET' && url.startsWith('/storefront/public/')) {
    const slug = params.slug;
    const result = await getCreatorStorefrontBySlug(slug);
    return send(result.success ? 200 : (result.error.code === StorefrontErrorCode.ACCESS_DENIED ? 403 : 404), result);
  }

  // GET /storefront/admin/profiles
  if (method === 'GET' && url === '/storefront/admin/profiles') {
    const guard = requireAdminOrOperator(context);
    if (!guard.allowed) return send(guard.response.status, guard.response.body);

    const profiles = await listCreatorStorefronts();
    return send(200, { success: true, data: profiles });
  }

  // GET /storefront/admin/profiles/:storefrontId
  if (method === 'GET' && url.startsWith('/storefront/admin/profiles/')) {
    const guard = requireAdminOrOperator(context);
    if (!guard.allowed) return send(guard.response.status, guard.response.body);

    const storefrontId = params.storefrontId;
    const result = await getCreatorStorefront(storefrontId);
    return send(result.success ? 200 : 404, result);
  }

  // POST /storefront/admin/profiles/:storefrontId/suspend
  if (method === 'POST' && url.endsWith('/suspend')) {
    const guard = requireAdminOrOperator(context);
    if (!guard.allowed) return send(guard.response.status, guard.response.body);

    const storefrontId = params.storefrontId;
    const result = await suspendCreatorStorefront({
      storefrontId,
      reason: body.reason
    });
    return send(result.success ? 200 : 400, result);
  }

  // POST /storefront/admin/profiles/:storefrontId/reactivate
  if (method === 'POST' && url.endsWith('/reactivate')) {
    const guard = requireAdminOrOperator(context);
    if (!guard.allowed) return send(guard.response.status, guard.response.body);

    const storefrontId = params.storefrontId;
    const result = await reactivateCreatorStorefront({
      storefrontId
    });
    return send(result.success ? 200 : 400, result);
  }

  return send(404, { error: 'Not Found' });
};
