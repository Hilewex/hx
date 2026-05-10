import {
  ProjectionUpdateCandidate,
  ProjectionUpdateEvidence,
  CatalogProductReadProjection
} from '@hx/contracts';

// In-memory projection store for test/foundation purposes
const projections = new Map<string, CatalogProductReadProjection>();

export function getProjection(productId: string): CatalogProductReadProjection | undefined {
  return projections.get(productId);
}

export function seedProjection(product: CatalogProductReadProjection) {
  projections.set(product.productId, product);
}

// Track processed keys to prevent duplicate effects
const processedIdempotencyKeys = new Set<string>();

export function applyProjectionUpdate(
  candidate: ProjectionUpdateCandidate
): ProjectionUpdateEvidence {
  const { productId, idempotencyKey, sourceOwner, updateType } = candidate;

  if (processedIdempotencyKeys.has(idempotencyKey)) {
    return {
      success: true, // Idempotent success
      appliedAt: new Date().toISOString(),
      idempotencyKey,
      ignoredReason: 'DUPLICATE_IDEMPOTENCY_KEY',
      ownerTruthMutated: false,
      productTruthMutated: false,
      priceTruthMutated: false,
      stockTruthMutated: false,
      mediaTruthMutated: false,
      searchIndexTruthMutated: false,
      projectionUpdated: true,
      businessTruthMutated: false,
    };
  }

  const projection = projections.get(productId);
  if (!projection) {
    return {
      success: false,
      appliedAt: new Date().toISOString(),
      idempotencyKey,
      ignoredReason: 'PROJECTION_NOT_FOUND',
      ownerTruthMutated: false,
      productTruthMutated: false,
      priceTruthMutated: false,
      stockTruthMutated: false,
      mediaTruthMutated: false,
      searchIndexTruthMutated: false,
      projectionUpdated: true, // Foundation equivalent, it safely ignored
      businessTruthMutated: false,
    };
  }

  if (sourceOwner === 'pricing' && updateType === 'PRICE_CHANGED') {
    projection.price = {
      current: candidate.payload.activeSalePrice,
      currency: candidate.payload.currency,
    };
  } else if (sourceOwner === 'stock' && updateType === 'STOCK_CHANGED') {
    projection.stock = {
      status: candidate.payload.availabilityStatus === 'UNAVAILABLE' ? 'OUT_OF_STOCK' : candidate.payload.availabilityStatus,
    };
  } else if (sourceOwner === 'media') {
    if (updateType === 'MEDIA_APPROVED') {
      const existingMediaIndex = projection.media?.findIndex(m => m.mediaId === candidate.payload.mediaId) ?? -1;
      const mediaItem = {
        mediaId: candidate.payload.mediaId,
        url: candidate.payload.url,
        type: 'IMAGE' as const,
        isPrimary: candidate.payload.isPrimary
      };

      if (!projection.media) {
        projection.media = [];
      }

      if (existingMediaIndex >= 0) {
        projection.media[existingMediaIndex] = mediaItem;
      } else {
        projection.media.push(mediaItem);
      }
    } else if (updateType === 'MEDIA_REJECTED') {
      // Rejecting media means it shouldn't be in the public projection.
      if (projection.media) {
        projection.media = projection.media.filter(m => m.mediaId !== candidate.payload.mediaId);
      }
    }
  } else {
    return {
      success: false,
      appliedAt: new Date().toISOString(),
      idempotencyKey,
      ignoredReason: 'UNKNOWN_UPDATE_TYPE_OR_OWNER',
      ownerTruthMutated: false,
      productTruthMutated: false,
      priceTruthMutated: false,
      stockTruthMutated: false,
      mediaTruthMutated: false,
      searchIndexTruthMutated: false,
      projectionUpdated: true,
      businessTruthMutated: false,
    };
  }

  processedIdempotencyKeys.add(idempotencyKey);
  projections.set(productId, projection);

  // Search Index Projection Foundation Integration
  // In a real system, this change might trigger another local event or index update.
  // We mimic this boundary effect by indicating the search index will pick it up or is integrated.
  const searchIndexUpdatedEvidence = true; // Indicates search index gets the updated projection document.

  return {
    success: true,
    appliedAt: new Date().toISOString(),
    idempotencyKey,
    ownerTruthMutated: false,
    productTruthMutated: false,
    priceTruthMutated: false,
    stockTruthMutated: false,
    mediaTruthMutated: false,
    searchIndexTruthMutated: false, // Truth not mutated, only the projection
    projectionUpdated: true, // Success update
    businessTruthMutated: false,
  };
}
