import { CategoryNode, CategorySortKey, CategorySortOption } from './category';
export interface PlpQuery {
    categoryId?: string;
    slug?: string;
    searchQuery?: string;
    filters?: Record<string, string | string[] | boolean>;
    sort?: CategorySortKey;
    limit?: number;
    cursor?: string;
}
export interface ClassicProductCardProjection {
    productId: string;
    slug: string;
    name: string;
    activePriceLabel: string;
    ratingLabel?: string;
    primaryMedia?: {
        mediaId: string;
        url: string;
        type: 'IMAGE' | 'VIDEO';
    };
    storefrontContext?: {
        storefrontId: string;
        name: string;
        slug: string;
    };
    actions: {
        canAddToCart: boolean;
        canLike: boolean;
        canSave: boolean;
        canShare: false;
    };
    pdpTarget: {
        productId: string;
        storefrontId?: string;
        storeContextRequired: true;
    };
    cardTruth: false;
    productTruthMutated: false;
    priceTruthMutated: false;
    stockTruthMutated: false;
    interactionTruthMutated: false;
    warnings?: string[];
}
export interface PlpVideoRailItem {
    productId: string;
    slug: string;
    name: string;
    mediaType: 'VIDEO';
    storefrontContext?: {
        storefrontId: string;
        name: string;
        slug: string;
    };
    supportOnly: true;
    discoveryFeed: false;
    warnings?: string[];
}
export interface PlpFacet {
    filterId: string;
    label: string;
    options: Array<{
        label: string;
        value: string | number | boolean;
        count?: number;
    }>;
    facetTruth: false;
    foundationCount?: number;
    warnings?: string[];
}
export type PlpEmptyStateCode = 'CATEGORY_NOT_FOUND' | 'NO_PRODUCTS' | 'FILTER_NO_RESULTS';
export interface PlpEmptyState {
    code: PlpEmptyStateCode;
    message: string;
    suggestedAction?: 'CLEAR_FILTERS' | 'GO_DISCOVER' | 'GO_HOME';
}
export interface PlpResponse {
    category?: CategoryNode;
    subcategories: CategoryNode[];
    filters: PlpFacet[];
    sortOptions: CategorySortOption[];
    activeSort?: CategorySortKey;
    productCards: ClassicProductCardProjection[];
    videoRail?: PlpVideoRailItem[];
    emptyState?: PlpEmptyState;
    warnings?: string[];
}
//# sourceMappingURL=plp.d.ts.map