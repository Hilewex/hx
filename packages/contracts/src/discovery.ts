import type { CatalogProductCardReadProjection } from './catalog';
import type { CategoryNode } from './category';
import type { SearchCandidate } from './search';
import type { StoryTrayItem } from './story';
import type { StorefrontResponse } from './storefront';

export type PublicProjectionTransportStatus =
  | 'available'
  | 'degraded'
  | 'empty'
  | 'partial'
  | 'timeout'
  | 'unavailable'
  | 'error';

export interface PublicProjectionTransport {
  status: PublicProjectionTransportStatus;
  retryable: boolean;
  warnings?: string[];
  error?: {
    code: string;
    message: string;
    status?: number;
  };
}

export interface PublicProjectionEnvelope<T> {
  transport: PublicProjectionTransport;
  data?: T;
}

export type DiscoveryCandidateKind = 'product' | 'creator' | 'video' | 'story' | 'storefront' | 'category';

export interface DiscoveryCandidateProjection {
  id: string;
  kind: DiscoveryCandidateKind;
  title: string;
  context?: string;
  href?: string;
  mediaLabel?: string;
  priceText?: string;
  source: 'catalog_projection' | 'search_projection' | 'story_projection' | 'category_projection' | 'storefront_projection';
  projectionTruth: false;
  rankingFinal: false;
  recommendationTruth: false;
  commerceTruth: false;
  warnings?: string[];
}

export interface PublicHomeProjection {
  hero: {
    title: string;
    description: string;
    projectionOwner: 'bff_public_discovery_read';
  };
  stories: StoryTrayItem[];
  discoverFeed: DiscoveryCandidateProjection[];
  products: CatalogProductCardReadProjection[];
  creatorSpotlight: DiscoveryCandidateProjection[];
  categories: CategoryNode[];
  warnings?: string[];
}

export interface PublicDiscoverProjection {
  candidates: DiscoveryCandidateProjection[];
  warnings?: string[];
}

export interface PublicStorefrontProjection {
  storefront: StorefrontResponse;
  stories: StoryTrayItem[];
  products: CatalogProductCardReadProjection[];
  discoverFeed: DiscoveryCandidateProjection[];
  warnings?: string[];
}

export interface PublicSearchProjection {
  query: string;
  candidates: SearchCandidate[];
  warnings?: string[];
}

export interface PublicCategoryProjection {
  category?: CategoryNode;
  categories: CategoryNode[];
  candidates: DiscoveryCandidateProjection[];
  products: CatalogProductCardReadProjection[];
  warnings?: string[];
}
