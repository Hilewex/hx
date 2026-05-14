import type { CatalogProductCardReadProjection, CatalogProductReadProjection, PublicProjectionEnvelope } from '@hx/contracts';
import { readBffProjection, readBffProjectionState } from './read';

export interface CatalogReadProjection {
  productCards: CatalogProductCardReadProjection[];
  warnings?: string[];
}

export function readCatalogProjection(options: { categoryId?: string; storefrontId?: string; limit?: number } = {}): Promise<PublicProjectionEnvelope<CatalogReadProjection>> {
  const params = new URLSearchParams();
  if (options.categoryId) params.set('categoryId', options.categoryId);
  if (options.storefrontId) params.set('storefrontId', options.storefrontId);
  if (options.limit) params.set('limit', String(options.limit));

  const suffix = params.toString() ? `?${params.toString()}` : '';
  return readBffProjectionState<CatalogReadProjection>(`/catalog/product-cards${suffix}`);
}

export function readProductProjection(productId: string): Promise<CatalogProductReadProjection> {
  return readBffProjection<CatalogProductReadProjection>(`/catalog/product/${encodeURIComponent(productId)}`);
}
