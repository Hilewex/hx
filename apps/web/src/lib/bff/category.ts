import type { CategoryDetailResponse, CategoryListResponse, PublicProjectionEnvelope } from '@hx/contracts';
import { readBffProjectionState } from './read';

export function readCategoryListProjection(options: { limit?: number } = {}): Promise<PublicProjectionEnvelope<CategoryListResponse>> {
  const params = new URLSearchParams();
  if (options.limit) params.set('limit', String(options.limit));
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return readBffProjectionState<CategoryListResponse>(`/category/list${suffix}`);
}

export function readCategoryDetailProjection(options: { slug?: string; categoryId?: string }): Promise<PublicProjectionEnvelope<CategoryDetailResponse>> {
  const params = new URLSearchParams();
  if (options.slug) params.set('slug', options.slug);
  if (options.categoryId) params.set('categoryId', options.categoryId);
  return readBffProjectionState<CategoryDetailResponse>(`/category/detail?${params.toString()}`);
}
