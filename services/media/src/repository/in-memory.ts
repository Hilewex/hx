import { MediaAssetRecord, MediaStorageTier } from '@hx/contracts';
import { IMediaRepository } from '.';

// In-memory store for media assets
const getMediaStore = (): Map<string, MediaAssetRecord> => {
  const root = globalThis as any;
  if (!root.__mediaAssetStore) {
    root.__mediaAssetStore = new Map<string, MediaAssetRecord>();
  }
  return root.__mediaAssetStore;
};

export class InMemoryMediaRepository implements IMediaRepository {
  private store: Map<string, MediaAssetRecord>;

  constructor() {
    this.store = getMediaStore();
  }

  async create(assetData: Partial<MediaAssetRecord>): Promise<MediaAssetRecord> {
    const now = new Date().toISOString();
    const assetId = assetData.assetId || `ast_${Math.random().toString(36).substr(2, 9)}`;
    
    const newAsset: MediaAssetRecord = {
      assetId,
      ownerType: assetData.ownerType!,
      ownerId: assetData.ownerId!,
      mediaType: assetData.mediaType!,
      sourceType: assetData.sourceType!,
      status: assetData.status!,
      moderationStatus: assetData.moderationStatus!,
      processingState: assetData.processingState!,
      storageTier: MediaStorageTier.HOT,
      originalFileRef: assetData.originalFileRef || '',
      variants: [],
      allowedSurfaces: [],
      createdAt: now,
      updatedAt: now,
      visibilityReady: false,
      moderationReady: false,
      // Defaulting boolean flags to their proper values
      assetTruth: true,
      contentTruthMutated: false,
      storyTruthMutated: false,
      postTruthMutated: false,
      ugcTruthMutated: false,
      productTruthMutated: false,
      storefrontTruthMutated: false,
      moderationDecisionTruthMutated: false,
      ...assetData,
    };

    this.store.set(assetId, newAsset);
    return newAsset;
  }

  async findById(assetId: string): Promise<MediaAssetRecord | null> {
    const asset = this.store.get(assetId);
    return asset || null;
  }

  async update(assetId: string, updates: Partial<MediaAssetRecord>): Promise<MediaAssetRecord | null> {
    const existingAsset = this.store.get(assetId);
    if (!existingAsset) {
      return null;
    }

    const updatedAsset = {
      ...existingAsset,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.store.set(assetId, updatedAsset);
    return updatedAsset;
  }

  async list(query: any): Promise<MediaAssetRecord[]> {
    let assets = Array.from(this.store.values());

    if (query.ownerId) {
      assets = assets.filter(a => a.ownerId === query.ownerId);
    }
    if (query.ownerType) {
      assets = assets.filter(a => a.ownerType === query.ownerType);
    }
    if (query.status) {
      assets = assets.filter(a => a.status === query.status);
    }

    return assets;
  }
}
