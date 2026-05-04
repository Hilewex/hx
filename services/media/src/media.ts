import {
  MediaUploadIntakeCommand,
  MediaUploadIntakeResult,
  MediaProcessCommand,
  MediaProcessResult,
  MediaAssetQuery,
  MediaAssetListQuery,
  MediaAssetResponse,
  MediaAssetListResponse,
  MediaVisibilityResponse,
  MediaAssetStatus,
  MediaModerationStatus,
  MediaProcessingState,
  MediaAssetType,
  MediaVariantKind,
  MediaVariantRef,
  MediaSourceType,
} from '@hx/contracts';
import { getMediaRepository } from './repository';
import { getMediaStorageAdapter } from './storage';

// This is a simulation of a file being passed. In a real scenario,
// this would come from a multipart form upload.
const getSimulatedFileBuffer = () => Buffer.from('simulated file content');

export const intakeMediaUpload = async (command: MediaUploadIntakeCommand): Promise<MediaUploadIntakeResult> => {
  const repo = getMediaRepository();
  const assetId = `ast_${Math.random().toString(36).substr(2, 9)}`;

  const storage = getMediaStorageAdapter();
  const simulatedBuffer = getSimulatedFileBuffer();
  const fileExtension = command.fileName.split('.').pop() || 'tmp';
  
  const storeResult = await storage.store(assetId, 'original', simulatedBuffer, fileExtension);
  
  if (!storeResult.success) {
    return { success: false, errors: ['STORAGE_FAILED', storeResult.error || ''] };
  }

  const needsModeration = command.sourceType === MediaSourceType.USER_UPLOAD;

  const asset = await repo.create({
    assetId,
    ...command,
    status: MediaAssetStatus.UPLOADED,
    moderationStatus: needsModeration ? MediaModerationStatus.PENDING : MediaModerationStatus.NOT_REQUIRED,
    processingState: MediaProcessingState.NOT_STARTED,
    originalFileRef: storeResult.ref,
    variants: [],
    visibilityReady: false,
    moderationReady: !needsModeration,
  });

  return { success: true, asset };
};

export const processMediaAsset = async (command: MediaProcessCommand): Promise<MediaProcessResult> => {
  const repo = getMediaRepository();
  const asset = await repo.findById(command.assetId);

  if (!asset) {
    return { success: false, errors: ['ASSET_NOT_FOUND'] };
  }

  await repo.update(asset.assetId, { status: MediaAssetStatus.PROCESSING, processingState: MediaProcessingState.PROCESSING });

  const generatedVariants: MediaVariantRef[] = [];
  const storage = getMediaStorageAdapter();
  const simulatedThumbnailBuffer = Buffer.from('sim-thumb');

  if (asset.mediaType === MediaAssetType.IMAGE) {
    const thumbResult = await storage.store(asset.assetId, 'thumbnail', simulatedThumbnailBuffer, 'jpg');
    if (thumbResult.success) {
      generatedVariants.push({
        variantId: `var_${Math.random().toString(36).substr(2, 9)}`,
        kind: MediaVariantKind.THUMBNAIL,
        url: thumbResult.url,
        width: 150,
        height: 150,
        mimeType: 'image/jpeg',
        generated: true,
        simulationOnly: true,
      });
    }
  } else if (asset.mediaType === MediaAssetType.VIDEO) {
    const posterResult = await storage.store(asset.assetId, 'poster', simulatedThumbnailBuffer, 'jpg');
     if (posterResult.success) {
      generatedVariants.push({
        variantId: `var_${Math.random().toString(36).substr(2, 9)}`,
        kind: MediaVariantKind.POSTER,
        url: posterResult.url,
        width: 480,
        height: 720,
        mimeType: 'image/jpeg',
        generated: true,
        simulationOnly: true,
      });
    }
  }
  
  const now = new Date().toISOString();
  const needsModeration = asset.sourceType === MediaSourceType.USER_UPLOAD;
  
  const finalStatus = needsModeration ? MediaAssetStatus.PENDING_REVIEW : MediaAssetStatus.PROCESSED;
  const finalModerationStatus = needsModeration ? MediaModerationStatus.PENDING : MediaModerationStatus.APPROVED;

  const updatedAsset = await repo.update(asset.assetId, {
    status: finalStatus,
    moderationStatus: finalModerationStatus,
    processingState: MediaProcessingState.COMPLETED,
    variants: [...(asset.variants || []), ...generatedVariants],
    processedAt: now,
    visibilityReady: true,
    moderationReady: !needsModeration,
  });

  return { success: true, asset: updatedAsset!, generatedVariants };
};

export const getMediaAsset = async (query: MediaAssetQuery): Promise<MediaAssetResponse> => {
  const repo = getMediaRepository();
  const asset = await repo.findById(query.assetId);
  if (!asset) {
    return { errors: ['ASSET_NOT_FOUND'] };
  }
  return { asset };
};

export const listMediaAssets = async (query: MediaAssetListQuery): Promise<MediaAssetListResponse> => {
  const repo = getMediaRepository();
  const items = await repo.list(query);
  return { items };
};

export const getMediaVisibility = async (assetId: string): Promise<MediaVisibilityResponse> => {
  const repo = getMediaRepository();
  const asset = await repo.findById(assetId);

  if (!asset) {
    throw new Error('ASSET_NOT_FOUND');
  }

  const isVisible = asset.visibilityReady && (asset.moderationStatus === MediaModerationStatus.APPROVED || asset.moderationStatus === MediaModerationStatus.NOT_REQUIRED);

  return {
    assetId: asset.assetId,
    visibilityReady: isVisible,
    moderationReady: asset.moderationStatus === MediaModerationStatus.APPROVED || asset.moderationStatus === MediaModerationStatus.NOT_REQUIRED,
    allowedSurfaces: asset.allowedSurfaces || [],
    servingVariants: asset.variants || [],
  };
};

// --- Backward-Compatibility Stubs ---
// DEPRECATED: These functions were moved to their own services.
// Keeping them for a short grace period if needed by other internal services not yet updated.

export const createStorePost = async (...args: any[]) => ({ success: false, errors: ['MOVED_TO_POST_SERVICE'] });
export const listStorePosts = async (...args: any[]) => ({ success: false, errors: ['MOVED_TO_POST_SERVICE'] });
export const getStorePostById = async (...args: any[]) => ({ success: false, errors: ['MOVED_TO_POST_SERVICE'] });
export const transitionStorePost = async (...args: any[]) => ({ success: false, errors: ['MOVED_TO_POST_SERVICE'] });
export const createUserProductStory = async (...args: any[]) => ({ success: false, errors: ['MOVED_TO_UGC_SERVICE'] });
export const listUgc = async (...args: any[]) => ({ success: false, errors: ['MOVED_TO_UGC_SERVICE'] });
export const getUgcById = async (...args: any[]) => ({ success: false, errors: ['MOVED_TO_UGC_SERVICE'] });
export const transitionUgc = async (...args: any[]) => ({ success: false, errors: ['MOVED_TO_UGC_SERVICE'] });
export const createReview = async (...args: any[]) => ({ success: false, errors: ['MOVED_TO_REVIEW_SERVICE'] });
export const updateReview = async (...args: any[]) => ({ success: false, errors: ['MOVED_TO_REVIEW_SERVICE'] });
export const listReviews = async (...args: any[]) => ({ success: false, errors: ['MOVED_TO_REVIEW_SERVICE'] });
export const getReviewById = async (...args: any[]) => ({ success: false, errors: ['MOVED_TO_REVIEW_SERVICE'] });
export const transitionReview = async (...args: any[]) => ({ success: false, errors: ['MOVED_TO_REVIEW_SERVICE'] });
export const applyReviewReturnImpact = async (...args: any[]) => ({ success: false, errors: ['MOVED_TO_REVIEW_SERVICE'] });
export const getProductRatingSummary = async (...args: any[]) => ({ success: false, errors: ['MOVED_TO_REVIEW_SERVICE'] });
export const createQaQuestion = async (...args: any[]) => ({ success: false, errors: ['MOVED_TO_QA_SERVICE'] });
export const listQaQuestions = async (...args: any[]) => ({ success: false, errors: ['MOVED_TO_QA_SERVICE'] });
export const getQaQuestionById = async (...args: any[]) => ({ success: false, errors: ['MOVED_TO_QA_SERVICE'] });
export const transitionQaQuestion = async (...args: any[]) => ({ success: false, errors: ['MOVED_TO_QA_SERVICE'] });
export const createQaAnswer = async (...args: any[]) => ({ success: false, errors: ['MOVED_TO_QA_SERVICE'] });
export const transitionQaAnswer = async (...args: any[]) => ({ success: false, errors: ['MOVED_TO_QA_SERVICE'] });
