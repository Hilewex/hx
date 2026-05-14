import type { PublicProjectionEnvelope, SearchResponse, SearchSurface } from '@hx/contracts';
import { readBffProjectionState } from './read';

export function readSearchProjection(options: {
  query: string;
  surface?: SearchSurface;
  categoryId?: string;
  storefrontId?: string;
  limit?: number;
}): Promise<PublicProjectionEnvelope<SearchResponse>> {
  const params = new URLSearchParams({ q: options.query });
  if (options.surface) params.set('surface', options.surface);
  if (options.categoryId) params.set('categoryId', options.categoryId);
  if (options.storefrontId) params.set('storefrontId', options.storefrontId);
  if (options.limit) params.set('limit', String(options.limit));

  return readBffProjectionState<SearchResponse>(`/search?${params.toString()}`);
}
