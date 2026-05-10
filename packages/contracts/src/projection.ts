export type ProjectionUpdateSourceOwner = 'pricing' | 'stock' | 'media';
export type ProjectionUpdateType = 'PRICE_CHANGED' | 'STOCK_CHANGED' | 'MEDIA_APPROVED' | 'MEDIA_REJECTED';

export interface BaseProjectionUpdateCandidate {
  productId: string;
  variantId?: string;
  storeContextId?: string;
  sourceOwner: ProjectionUpdateSourceOwner;
  updateType: ProjectionUpdateType;
  occurredAt: string;
  correlationId: string;
  idempotencyKey: string;
  
  // Boundary flags
  ownerTruthMutated: false;
  productTruthMutated: false;
  priceTruthMutated: false;
  stockTruthMutated: false;
  mediaTruthMutated: false;
  searchIndexTruthMutated: false;
  projectionUpdated: true;
  businessTruthMutated: false;
}

export interface PriceProjectionUpdateCandidate extends BaseProjectionUpdateCandidate {
  sourceOwner: 'pricing';
  updateType: 'PRICE_CHANGED';
  payload: {
    activeSalePrice: number;
    currency: string;
  };
}

export interface StockProjectionUpdateCandidate extends BaseProjectionUpdateCandidate {
  sourceOwner: 'stock';
  updateType: 'STOCK_CHANGED';
  payload: {
    availabilityStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNAVAILABLE';
  };
}

export interface MediaProjectionUpdateCandidate extends BaseProjectionUpdateCandidate {
  sourceOwner: 'media';
  updateType: 'MEDIA_APPROVED' | 'MEDIA_REJECTED';
  payload: {
    mediaId: string;
    url: string;
    isPrimary: boolean;
    status: 'APPROVED' | 'REJECTED' | 'PENDING';
  };
}

export type ProjectionUpdateCandidate =
  | PriceProjectionUpdateCandidate
  | StockProjectionUpdateCandidate
  | MediaProjectionUpdateCandidate;

export interface ProjectionUpdateEvidence {
  success: boolean;
  appliedAt: string;
  idempotencyKey: string;
  ignoredReason?: string;
  
  // Evidence boundary
  ownerTruthMutated: false;
  productTruthMutated: false;
  priceTruthMutated: false;
  stockTruthMutated: false;
  mediaTruthMutated: false;
  searchIndexTruthMutated: false;
  projectionUpdated: true;
  businessTruthMutated: false;
}
