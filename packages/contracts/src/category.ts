export type CategoryStatus = 'ACTIVE' | 'HIDDEN' | 'ARCHIVED';

export interface CategoryNode {
  categoryId: string;
  parentCategoryId?: string;
  name: string;
  slug: string;
  status: CategoryStatus;
  level: number;
  description?: string;
  childCategoryIds?: string[];
  taxonomyTruth: false;
  categoryProjection: true;
  warnings?: string[];
}

export interface CategoryListQuery {
  parentCategoryId?: string;
  status?: CategoryStatus;
  limit?: number;
  cursor?: string;
}

export interface CategoryListResponse {
  items: CategoryNode[];
  nextCursor?: string;
  warnings?: string[];
}

export interface CategoryDetailQuery {
  categoryId?: string;
  slug?: string;
}

export interface CategoryDetailResponse {
  category?: CategoryNode;
  errors?: string[];
  warnings?: string[];
}

export type CategoryFilterType = 'PRICE_RANGE' | 'MULTI_SELECT' | 'SINGLE_SELECT' | 'BOOLEAN';

export interface CategoryFilterDefinition {
  filterId: string;
  label: string;
  type: CategoryFilterType;
  field: string;
  options?: Array<{ label: string; value: string | number | boolean }>;
  categorySpecific: boolean;
  taxonomyTruth: false;
  warnings?: string[];
}

export type CategorySortKey = 
  | 'RECOMMENDED' 
  | 'BEST_SELLING' 
  | 'NEWEST' 
  | 'PRICE_ASC' 
  | 'PRICE_DESC' 
  | 'HIGHEST_RATED' 
  | 'MOST_REVIEWED' 
  | 'MOST_SAVED' 
  | 'CAMPAIGN_PRIORITY';

export interface CategorySortOption {
  sortKey: CategorySortKey;
  label: string;
  m8RankingRequired: boolean;
  foundationSupported: boolean;
}
