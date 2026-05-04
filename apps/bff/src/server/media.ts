import { 
  intakeMediaUpload, 
  processMediaAsset, 
  getMediaAsset, 
  listMediaAssets, 
  getMediaVisibility 
} from '@hx/media';
import * as response from './response';
import { requireAuthenticated, requireAdminOrOperator } from './guards';

export const handleIntakeMediaUpload = async (context: any, body: any) => {
  const guard = requireAuthenticated(context);
  if (!guard.allowed) return guard.response;

  // sourceType/actorType check
  const sourceType = body.sourceType;
  if (sourceType === 'USER_UPLOAD' && context.role !== 'CUSTOMER') {
    return response.forbidden('FORBIDDEN_SOURCE', 'Only CUSTOMER can use USER_UPLOAD source');
  }
  if (sourceType === 'CREATOR_PANEL' && context.role !== 'CREATOR') {
    return response.forbidden('FORBIDDEN_SOURCE', 'Only CREATOR can use CREATOR_PANEL source');
  }
  if (sourceType === 'ADMIN_PANEL' && context.role !== 'ADMIN' && context.role !== 'OPERATOR') {
    return response.forbidden('FORBIDDEN_SOURCE', 'Only ADMIN/OPERATOR can use ADMIN_PANEL source');
  }
  if (sourceType === 'SUPPLIER_PANEL' && context.role !== 'SUPPLIER') {
    return response.forbidden('FORBIDDEN_SOURCE', 'Only SUPPLIER can use SUPPLIER_PANEL source');
  }

  const result = await intakeMediaUpload(body);
  if (!result.success && result.validationIssues?.some(i => i.blocking)) {
    return response.badRequest('MEDIA_VALIDATION_FAILED', 'Validation failed');
  }
  return response.created(result);
};

export const handleProcessMediaAsset = async (context: any, body: any) => {
  // Process is typically an admin/system action in this context
  const guard = requireAdminOrOperator(context);
  if (!guard.allowed) return guard.response;

  const result = await processMediaAsset(body);
  if (!result.success) {
    if (result.errors?.includes('ASSET_NOT_FOUND')) {
      return response.notFound('ASSET_NOT_FOUND', 'Asset not found');
    }
    return response.badRequest('PROCESS_FAILED', 'Process failed');
  }
  return response.ok(result);
};

export const handleGetMediaAsset = async (context: any, query: any) => {
  const assetId = query.assetId;
  if (!assetId) return response.badRequest('MISSING_ASSET_ID', 'Missing assetId');

  const result = await getMediaAsset({ assetId });
  if (result.errors?.includes('ASSET_NOT_FOUND')) {
    return response.notFound('ASSET_NOT_FOUND', 'Asset not found');
  }
  return response.ok(result);
};

export const handleListMediaAssets = async (context: any, query: any) => {
  const guard = requireAdminOrOperator(context);
  if (!guard.allowed) return guard.response;

  if (query.visibilityReady !== undefined && query.visibilityReady !== 'true' && query.visibilityReady !== 'false') {
    return response.badRequest('INVALID_QUERY', 'Invalid visibilityReady query');
  }

  const normalizedQuery = {
    ...query,
    visibilityReady: query.visibilityReady === undefined ? undefined : query.visibilityReady === 'true'
  };

  const result = await listMediaAssets(normalizedQuery);
  return response.ok(result);
};

export const handleGetMediaVisibility = async (context: any, query: any) => {
  const assetId = query.assetId;
  if (!assetId) return response.badRequest('MISSING_ASSET_ID', 'Missing assetId');

  try {
    const result = await getMediaVisibility(assetId);
    return response.ok(result);
  } catch (error: any) {
    if (error.message === 'ASSET_NOT_FOUND') {
      return response.notFound('ASSET_NOT_FOUND', 'Asset not found');
    }
    return response.internalError();
  }
};
