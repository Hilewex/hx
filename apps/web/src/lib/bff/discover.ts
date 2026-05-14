import type { DiscoveryCandidateProjection, PublicDiscoverProjection, PublicProjectionEnvelope, SearchCandidate } from '@hx/contracts';
import { readSearchProjection } from './search';

export async function readDiscoverProjection(options: {
  query?: string;
  surface?: 'HOME' | 'DISCOVER' | 'CATEGORY_PLP' | 'STOREFRONT';
  categoryId?: string;
  storefrontId?: string;
  limit?: number;
} = {}): Promise<PublicProjectionEnvelope<PublicDiscoverProjection>> {
  const result = await readSearchProjection({
    query: options.query ?? '',
    surface: options.surface ?? 'DISCOVER',
    categoryId: options.categoryId,
    storefrontId: options.storefrontId,
    limit: options.limit ?? 12,
  });

  return {
    transport: result.transport,
    data: result.data
      ? {
          candidates: result.data.candidates.map(toDiscoveryCandidate),
          warnings: result.data.warnings,
        }
      : undefined,
  };
}

export function toDiscoveryCandidate(candidate: SearchCandidate): DiscoveryCandidateProjection {
  if (candidate.type === 'PRODUCT') {
    return {
      id: candidate.productId,
      kind: 'product',
      title: candidate.name,
      context: candidate.brand ?? candidate.storefrontId,
      href: `/product/${candidate.productId}`,
      mediaLabel: candidate.mediaType ?? 'Product projection',
      source: 'search_projection',
      projectionTruth: false,
      rankingFinal: false,
      recommendationTruth: false,
      commerceTruth: false,
      warnings: candidate.warnings,
    };
  }

  if (candidate.type === 'CATEGORY') {
    return {
      id: candidate.categoryId,
      kind: 'category',
      title: candidate.name,
      context: 'Category projection',
      href: `/category?surface=${encodeURIComponent(candidate.slug)}`,
      source: 'category_projection',
      projectionTruth: false,
      rankingFinal: false,
      recommendationTruth: false,
      commerceTruth: false,
      warnings: candidate.warnings,
    };
  }

  return {
    id: candidate.storefrontId,
    kind: 'storefront',
    title: candidate.name,
    context: 'Storefront projection teaser',
    href: `/store/${candidate.slug}`,
    source: 'storefront_projection',
    projectionTruth: false,
    rankingFinal: false,
    recommendationTruth: false,
    commerceTruth: false,
    warnings: candidate.warnings,
  };
}
