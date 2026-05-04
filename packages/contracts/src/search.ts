import { ProductStatus } from './catalog';

export type SearchMode = 'GLOBAL' | 'DISCOVER' | 'CATALOG' | 'STOREFRONT';

export type SearchIntentType = 
  | 'PRODUCT' 
  | 'CATEGORY' 
  | 'STOREFRONT' 
  | 'DISCOVERY' 
  | 'AMBIGUOUS' 
  | 'UNKNOWN';

export type SearchCandidateType = 'PRODUCT' | 'CATEGORY' | 'STOREFRONT';

export type SearchSurface = 
  | 'HOME' 
  | 'HEADER' 
  | 'DISCOVER' 
  | 'CATEGORY_PLP' 
  | 'STOREFRONT' 
  | 'MOBILE_OVERLAY';

export interface SearchQueryInput {
  query: string;
  mode?: SearchMode;
  surface?: SearchSurface;
  storefrontId?: string;
  categoryId?: string;
  limit?: number;
  cursor?: string;
}

export interface SearchIntent {
  type: SearchIntentType;
  confidence: number;
  normalizedQuery: string;
  tokens: string[];
  warnings?: string[];
}

export interface ProductSearchCandidate {
  type: 'PRODUCT';
  productId: string;
  slug: string;
  name: string;
  brand?: string;
  status: ProductStatus;
  mediaType?: 'IMAGE' | 'VIDEO';
  categoryIds?: string[];
  storefrontId?: string;
  scoreFoundationOnly: number;
  searchTruth: false;
  projectionTruth: false;
  searchIndexTruth: false;
  productTruthMutated: false;
  priceTruth: false;
  stockTruth: false;
  mediaTruth: false;
  rankingFinal: false;
  warnings?: string[];
}

export interface CategorySearchCandidate {
  type: 'CATEGORY';
  categoryId: string;
  name: string;
  slug: string;
  parentCategoryId?: string;
  scoreFoundationOnly: number;
  searchTruth: false;
  taxonomyTruthMutated: false;
  rankingFinal: false;
  warnings?: string[];
}

export interface StorefrontSearchCandidate {
  type: 'STOREFRONT';
  storefrontId: string;
  creatorId?: string;
  name: string;
  slug: string;
  scoreFoundationOnly: number;
  searchTruth: false;
  storefrontTruthMutated: false;
  rankingFinal: false;
  warnings?: string[];
}

export type SearchCandidate = 
  | ProductSearchCandidate 
  | CategorySearchCandidate 
  | StorefrontSearchCandidate;

export type SearchEmptyStateCode = 
  | 'QUERY_REQUIRED' 
  | 'NO_RESULTS' 
  | 'MODE_NOT_SUPPORTED_FOUNDATION';

export interface SearchEmptyState {
  code: SearchEmptyStateCode;
  message: string;
  suggestedSurface?: SearchSurface;
}

export type SearchSuggestionType = 
  | 'QUERY_COMPLETION' 
  | 'CATEGORY' 
  | 'STOREFRONT' 
  | 'TRENDING';

export interface SearchSuggestion {
  suggestionType: SearchSuggestionType;
  label: string;
  value: string;
  targetType?: string;
  targetId?: string;
}

export interface SearchResponse {
  query: string;
  mode: SearchMode;
  surface?: SearchSurface;
  intent: SearchIntent;
  candidates: SearchCandidate[];
  emptyState?: SearchEmptyState;
  suggestions?: SearchSuggestion[];
  warnings?: string[];
}
