import {
  MediaAssetRecord,
  MediaAssetStatus,
  MediaAssetType,
  MediaModerationStatus,
  MediaOwnerType,
  MediaProcessingState,
  MediaSourceType,
  MediaStorageTier,
  MediaSurface,
  MediaVariantKind,
  MediaUploadIntakeCommand,
  MediaUploadIntakeResult,
  MediaProcessCommand,
  MediaProcessResult,
  MediaAssetQuery,
  MediaAssetResponse,
  MediaAssetListQuery,
  MediaAssetListResponse,
  MediaVisibilityResponse,
  MediaVariantRef,
  MediaValidationIssue
} from '@hx/contracts';

interface MediaAssetStore {
  assets: Map<string, MediaAssetRecord>;
  idempotency: Map<string, string>;
}

const COMMON_WARNINGS = [
  'MEDIA_ASSET_FOUNDATION_IN_MEMORY',
  'STORAGE_PROVIDER_NOT_CONFIGURED',
  'CDN_NOT_CONFIGURED',
  'PROCESSING_PIPELINE_SIMULATED',
  'MODERATION_DECISION_NOT_OWNED',
  'VIRUS_SCAN_NOT_CONFIGURED',
  'REAL_TRANSCODING_NOT_CONFIGURED'
];

const getStore = (): MediaAssetStore => {
  const globalStore = (globalThis as any).__mediaAssetStore;
  if (globalStore) return globalStore;

  const newStore: MediaAssetStore = {
    assets: new Map(),
    idempotency: new Map()
  };

  // Seed data
  const seedAssets: MediaAssetRecord[] = [
    {
      assetId: 'asset_product_image_1',
      ownerType: MediaOwnerType.PRODUCT,
      ownerId: 'p_valid',
      mediaType: MediaAssetType.IMAGE,
      sourceType: MediaSourceType.SYSTEM_SEED,
      status: MediaAssetStatus.APPROVED,
      moderationStatus: MediaModerationStatus.APPROVED,
      processingState: MediaProcessingState.COMPLETED,
      storageTier: MediaStorageTier.HOT,
      originalFileRef: 'orig_product_1.jpg',
      variants: [
        { variantId: 'v1', kind: MediaVariantKind.ORIGINAL, generated: true, simulationOnly: true },
        { variantId: 'v2', kind: MediaVariantKind.THUMBNAIL, generated: true, simulationOnly: true },
        { variantId: 'v3', kind: MediaVariantKind.WEB_OPTIMIZED, generated: true, simulationOnly: true }
      ],
      allowedSurfaces: [MediaSurface.PRODUCT_CARD, MediaSurface.PDP_GALLERY],
      visibilityReady: true,
      moderationReady: true,
      assetTruth: true,
      contentTruthMutated: false,
      storyTruthMutated: false,
      postTruthMutated: false,
      ugcTruthMutated: false,
      productTruthMutated: false,
      storefrontTruthMutated: false,
      moderationDecisionTruthMutated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      assetId: 'asset_store_story_video_1',
      ownerType: MediaOwnerType.STORY,
      ownerId: 'store_product_1',
      mediaType: MediaAssetType.VIDEO,
      sourceType: MediaSourceType.SYSTEM_SEED,
      status: MediaAssetStatus.APPROVED,
      moderationStatus: MediaModerationStatus.APPROVED,
      processingState: MediaProcessingState.COMPLETED,
      storageTier: MediaStorageTier.HOT,
      originalFileRef: 'orig_story_1.mp4',
      variants: [
        { variantId: 'v4', kind: MediaVariantKind.ORIGINAL, generated: true, simulationOnly: true },
        { variantId: 'v5', kind: MediaVariantKind.POSTER, generated: true, simulationOnly: true },
        { variantId: 'v6', kind: MediaVariantKind.PREVIEW, generated: true, simulationOnly: true },
        { variantId: 'v7', kind: MediaVariantKind.MOBILE_OPTIMIZED, generated: true, simulationOnly: true }
      ],
      allowedSurfaces: [MediaSurface.STORY_FULLSCREEN],
      visibilityReady: true,
      moderationReady: true,
      assetTruth: true,
      contentTruthMutated: false,
      storyTruthMutated: false,
      postTruthMutated: false,
      ugcTruthMutated: false,
      productTruthMutated: false,
      storefrontTruthMutated: false,
      moderationDecisionTruthMutated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      assetId: 'asset_post_image_1',
      ownerType: MediaOwnerType.POST,
      ownerId: 'post_seed_1',
      mediaType: MediaAssetType.IMAGE,
      sourceType: MediaSourceType.SYSTEM_SEED,
      status: MediaAssetStatus.PENDING_REVIEW,
      moderationStatus: MediaModerationStatus.PENDING,
      processingState: MediaProcessingState.COMPLETED,
      storageTier: MediaStorageTier.WARM,
      originalFileRef: 'orig_post_1.jpg',
      variants: [],
      allowedSurfaces: [MediaSurface.POST_CARD],
      visibilityReady: false,
      moderationReady: true,
      assetTruth: true,
      contentTruthMutated: false,
      storyTruthMutated: false,
      postTruthMutated: false,
      ugcTruthMutated: false,
      productTruthMutated: false,
      storefrontTruthMutated: false,
      moderationDecisionTruthMutated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      assetId: 'asset_ugc_image_1',
      ownerType: MediaOwnerType.UGC,
      ownerId: 'ugc_seed_1',
      mediaType: MediaAssetType.IMAGE,
      sourceType: MediaSourceType.SYSTEM_SEED,
      status: MediaAssetStatus.PENDING_REVIEW,
      moderationStatus: MediaModerationStatus.PENDING,
      processingState: MediaProcessingState.NOT_STARTED,
      storageTier: MediaStorageTier.WARM,
      originalFileRef: 'orig_ugc_1.jpg',
      variants: [],
      allowedSurfaces: [MediaSurface.STORY_FULLSCREEN, MediaSurface.PDP_GALLERY],
      visibilityReady: false,
      moderationReady: true,
      assetTruth: true,
      contentTruthMutated: false,
      storyTruthMutated: false,
      postTruthMutated: false,
      ugcTruthMutated: false,
      productTruthMutated: false,
      storefrontTruthMutated: false,
      moderationDecisionTruthMutated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  seedAssets.forEach(a => newStore.assets.set(a.assetId, a));
  (globalThis as any).__mediaAssetStore = newStore;
  return newStore;
};

export async function intakeMediaUpload(command: MediaUploadIntakeCommand): Promise<MediaUploadIntakeResult> {
  const store = getStore();
  const warnings = [...COMMON_WARNINGS];
  const validationIssues: MediaValidationIssue[] = [];

  // Mandatory fields validation
  if (!command.ownerType) {
    validationIssues.push({ code: 'OWNER_TYPE_REQUIRED', message: 'Owner type is required', severity: 'ERROR', blocking: true });
  }
  if (!command.ownerId) {
    validationIssues.push({ code: 'OWNER_ID_REQUIRED', message: 'Owner ID is required', severity: 'ERROR', blocking: true });
  }
  if (!command.mediaType) {
    validationIssues.push({ code: 'MEDIA_TYPE_REQUIRED', message: 'Media type is required', severity: 'ERROR', blocking: true });
  }
  if (!command.sourceType) {
    validationIssues.push({ code: 'SOURCE_TYPE_REQUIRED', message: 'Source type is required', severity: 'ERROR', blocking: true });
  }
  if (!command.fileName) {
    validationIssues.push({ code: 'FILE_NAME_REQUIRED', message: 'File name is required', severity: 'ERROR', blocking: true });
  }
  if (!command.mimeType) {
    validationIssues.push({ code: 'MIME_TYPE_REQUIRED', message: 'Mime type is required', severity: 'ERROR', blocking: true });
  }
  if (command.fileSizeBytes === undefined || command.fileSizeBytes === null) {
    validationIssues.push({ code: 'FILE_SIZE_REQUIRED', message: 'File size is required', severity: 'ERROR', blocking: true });
  } else if (command.fileSizeBytes <= 0) {
    validationIssues.push({ code: 'FILE_SIZE_INVALID', message: 'File size must be greater than 0', severity: 'ERROR', blocking: true });
  }

  if (command.idempotencyKey && store.idempotency.has(command.idempotencyKey)) {
    const assetId = store.idempotency.get(command.idempotencyKey)!;
    return { success: true, asset: store.assets.get(assetId), warnings };
  }

  // Content type validations
  if (command.mimeType) {
    if (command.mediaType === MediaAssetType.IMAGE && !command.mimeType.startsWith('image/')) {
      validationIssues.push({ code: 'INVALID_IMAGE_MIME_TYPE', message: 'Invalid image mime type', severity: 'ERROR', blocking: true });
    }

    if (command.mediaType === MediaAssetType.VIDEO && !command.mimeType.startsWith('video/')) {
      validationIssues.push({ code: 'INVALID_VIDEO_MIME_TYPE', message: 'Invalid video mime type', severity: 'ERROR', blocking: true });
    }
  }

  if (command.mediaType === MediaAssetType.VIDEO && command.durationSeconds && command.durationSeconds > 120) {
    validationIssues.push({ code: 'VIDEO_DURATION_TOO_LONG', message: 'Video duration exceeds 120 seconds', severity: 'ERROR', blocking: true });
  }

  if (command.mediaType === MediaAssetType.IMAGE && (!command.width || !command.height)) {
    warnings.push('IMAGE_DIMENSIONS_MISSING_FOUNDATION');
  }

  if (command.requestedSurfaces?.includes(MediaSurface.STORY_FULLSCREEN)) {
    // vertical check simulation
    warnings.push('STORY_VERTICAL_VARIANT_REQUIRED');
  }

  if (validationIssues.some(i => i.blocking)) {
    return { success: false, validationIssues, warnings };
  }

  const assetId = `asset_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const asset: MediaAssetRecord = {
    assetId,
    ownerType: command.ownerType,
    ownerId: command.ownerId,
    mediaType: command.mediaType,
    sourceType: command.sourceType,
    status: MediaAssetStatus.UPLOADED,
    moderationStatus: (command.ownerType === MediaOwnerType.SYSTEM || command.sourceType === MediaSourceType.SYSTEM_SEED) 
      ? MediaModerationStatus.NOT_REQUIRED 
      : MediaModerationStatus.PENDING,
    processingState: MediaProcessingState.NOT_STARTED,
    storageTier: MediaStorageTier.HOT,
    originalFileRef: command.fileName,
    variants: [{
      variantId: `v_${assetId}_orig`,
      kind: MediaVariantKind.ORIGINAL,
      generated: false,
      simulationOnly: true,
      mimeType: command.mimeType,
      width: command.width,
      height: command.height,
      durationSeconds: command.durationSeconds
    }],
    allowedSurfaces: command.requestedSurfaces || [],
    width: command.width,
    height: command.height,
    durationSeconds: command.durationSeconds,
    mimeType: command.mimeType,
    fileSizeBytes: command.fileSizeBytes,
    createdAt: now,
    updatedAt: now,
    visibilityReady: false,
    moderationReady: false,
    assetTruth: true,
    contentTruthMutated: false,
    storyTruthMutated: false,
    postTruthMutated: false,
    ugcTruthMutated: false,
    productTruthMutated: false,
    storefrontTruthMutated: false,
    moderationDecisionTruthMutated: false,
    warnings: []
  };

  store.assets.set(assetId, asset);
  if (command.idempotencyKey) {
    store.idempotency.set(command.idempotencyKey, assetId);
  }

  return { success: true, asset, validationIssues, warnings };
}

export async function processMediaAsset(command: MediaProcessCommand): Promise<MediaProcessResult> {
  const store = getStore();
  const asset = store.assets.get(command.assetId);
  const warnings = [...COMMON_WARNINGS, 'PROCESSING_PIPELINE_SIMULATED', 'REAL_TRANSCODING_NOT_CONFIGURED'];

  if (!asset) {
    return { success: false, errors: ['ASSET_NOT_FOUND'], warnings };
  }

  if (asset.status === MediaAssetStatus.DELETED || asset.status === MediaAssetStatus.ARCHIVED) {
    return { success: false, errors: ['ASSET_NOT_PROCESSABLE'], warnings };
  }

  const generatedVariants: MediaVariantRef[] = [];
  const now = new Date().toISOString();

  if (asset.mediaType === MediaAssetType.IMAGE) {
    generatedVariants.push(
      { variantId: `v_${asset.assetId}_thumb`, kind: MediaVariantKind.THUMBNAIL, generated: true, simulationOnly: true },
      { variantId: `v_${asset.assetId}_web`, kind: MediaVariantKind.WEB_OPTIMIZED, generated: true, simulationOnly: true },
      { variantId: `v_${asset.assetId}_mobile`, kind: MediaVariantKind.MOBILE_OPTIMIZED, generated: true, simulationOnly: true }
    );
  } else if (asset.mediaType === MediaAssetType.VIDEO) {
    generatedVariants.push(
      { variantId: `v_${asset.assetId}_poster`, kind: MediaVariantKind.POSTER, generated: true, simulationOnly: true },
      { variantId: `v_${asset.assetId}_preview`, kind: MediaVariantKind.PREVIEW, generated: true, simulationOnly: true },
      { variantId: `v_${asset.assetId}_mobile`, kind: MediaVariantKind.MOBILE_OPTIMIZED, generated: true, simulationOnly: true }
    );
  }

  asset.variants = [...asset.variants, ...generatedVariants];
  asset.processingState = MediaProcessingState.COMPLETED;
  asset.status = asset.moderationStatus === MediaModerationStatus.APPROVED ? MediaAssetStatus.PROCESSED : MediaAssetStatus.PENDING_REVIEW;
  asset.processedAt = now;
  asset.updatedAt = now;
  asset.moderationReady = true;
  asset.visibilityReady = asset.moderationStatus === MediaModerationStatus.APPROVED;

  return { success: true, asset, generatedVariants, warnings };
}

export async function getMediaAsset(query: MediaAssetQuery): Promise<MediaAssetResponse> {
  const store = getStore();
  const asset = store.assets.get(query.assetId);

  if (!asset) {
    return { errors: ['ASSET_NOT_FOUND'], warnings: COMMON_WARNINGS };
  }

  return { asset, warnings: COMMON_WARNINGS };
}

export async function listMediaAssets(query: MediaAssetListQuery): Promise<MediaAssetListResponse> {
  const store = getStore();
  const warnings = [...COMMON_WARNINGS];
  
  if (query.cursor) {
    warnings.push('CURSOR_NOT_IMPLEMENTED_FOUNDATION');
  }

  let items = Array.from(store.assets.values());

  // Filter DELETED by default
  items = items.filter(a => a.status !== MediaAssetStatus.DELETED);

  if (query.ownerType) items = items.filter(a => a.ownerType === query.ownerType);
  if (query.ownerId) items = items.filter(a => a.ownerId === query.ownerId);
  if (query.mediaType) items = items.filter(a => a.mediaType === query.mediaType);
  if (query.status) items = items.filter(a => a.status === query.status);
  if (query.moderationStatus) items = items.filter(a => a.moderationStatus === query.moderationStatus);
  if (query.storageTier) items = items.filter(a => a.storageTier === query.storageTier);
  if (query.visibilityReady !== undefined) items = items.filter(a => a.visibilityReady === query.visibilityReady);

  const limit = query.limit || 20;
  items = items.slice(0, limit);

  return { items, warnings };
}

export async function getMediaVisibility(assetId: string): Promise<MediaVisibilityResponse> {
  const store = getStore();
  const asset = store.assets.get(assetId);

  if (!asset) {
    throw new Error('ASSET_NOT_FOUND');
  }

  const servingVariants = asset.variants.filter(v => v.generated);

  return {
    assetId,
    visibilityReady: asset.visibilityReady,
    moderationReady: asset.moderationReady,
    allowedSurfaces: asset.allowedSurfaces,
    servingVariants,
    warnings: COMMON_WARNINGS
  };
}
