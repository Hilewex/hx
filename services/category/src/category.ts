import { 
  CategoryNode, 
  CategoryListQuery, 
  CategoryListResponse, 
  CategoryDetailQuery, 
  CategoryDetailResponse,
  PlpQuery,
  PlpResponse,
  ClassicProductCardProjection,
  CategorySortOption,
  PlpFacet,
  PlpVideoRailItem
} from '@hx/contracts';
import { listPublicCatalogProductCards } from '@hx/catalog';
import { searchCandidates } from '@hx/search';

// STATIC SEED - NOT TRUTH
const STATIC_CATEGORIES: CategoryNode[] = [
  {
    categoryId: 'c_1',
    name: 'Electronics',
    slug: 'electronics',
    status: 'ACTIVE',
    level: 0,
    taxonomyTruth: false,
    categoryProjection: true,
    childCategoryIds: []
  },
  {
    categoryId: 'c_fashion',
    name: 'Fashion',
    slug: 'fashion',
    status: 'ACTIVE',
    level: 0,
    taxonomyTruth: false,
    categoryProjection: true,
    childCategoryIds: ['c_fashion_dress']
  },
  {
    categoryId: 'c_fashion_dress',
    parentCategoryId: 'c_fashion',
    name: 'Elbise',
    slug: 'elbise',
    status: 'ACTIVE',
    level: 1,
    taxonomyTruth: false,
    categoryProjection: true,
    childCategoryIds: []
  },
  {
    categoryId: 'c_hidden',
    name: 'Hidden Category',
    slug: 'hidden',
    status: 'HIDDEN',
    level: 0,
    taxonomyTruth: false,
    categoryProjection: true,
    childCategoryIds: []
  }
];

// STATIC PRODUCT SEED - NOT TRUTH (Foundation Projection only)
const STATIC_PRODUCTS = [
  {
    productId: 'p_valid',
    name: 'Valid Product',
    slug: 'valid-product',
    status: 'ACTIVE',
    categoryId: 'c_1',
    media: { mediaId: 'm1', url: 'http://img.com/1.jpg', type: 'IMAGE' as const },
    storefront: { storefrontId: 's_1', name: 'HX Store', slug: 'hx-store' },
    priceLabel: '₺999',
    ratingLabel: '★ 4,7'
  },
  {
    productId: 'p_video_1',
    name: 'Video Product',
    slug: 'video-product',
    status: 'ACTIVE',
    categoryId: 'c_fashion',
    media: { mediaId: 'm_v1', url: 'http://video.com/1.mp4', type: 'VIDEO' as const },
    storefront: { storefrontId: 's_video', name: 'Video Store', slug: 'video-store' },
    priceLabel: '₺1299',
    ratingLabel: '★ 4,5'
  },
  {
    productId: 'p_hidden',
    name: 'HIDDEN',
    slug: 'hidden-product',
    status: 'HIDDEN',
    categoryId: 'c_1',
    media: { mediaId: 'm2', url: 'http://img.com/2.jpg', type: 'IMAGE' as const },
    storefront: { storefrontId: 's_1', name: 'HX Store', slug: 'hx-store' },
    priceLabel: '₺0',
    ratingLabel: ''
  },
  {
    productId: 'p_unavailable',
    name: 'UNAVAILABLE',
    slug: 'unavailable-product',
    status: 'UNAVAILABLE',
    categoryId: 'c_1',
    media: { mediaId: 'm3', url: 'http://img.com/3.jpg', type: 'IMAGE' as const },
    storefront: { storefrontId: 's_1', name: 'HX Store', slug: 'hx-store' },
    priceLabel: '₺0',
    ratingLabel: ''
  }
];

const FOUNDATION_WARNINGS = [
  'CATEGORY_PROJECTION_FOUNDATION_STATIC',
  'TAXONOMY_TRUTH_NOT_OWNED',
  'PLP_PRODUCT_CARDS_DELEGATED_TO_CATALOG_READ_PROJECTION',
  'PRODUCT_CARD_PROJECTION_NOT_TRUTH',
  'PRICE_STOCK_MEDIA_OWNER_TRUTH_NOT_PRODUCED_BY_PLP',
  'M8_RANKING_NOT_IN_SCOPE'
];

export async function listCategories(query: CategoryListQuery): Promise<CategoryListResponse> {
  const status = query.status || 'ACTIVE';
  const parentId = query.parentCategoryId;
  const limit = query.limit || 20;

  let items = STATIC_CATEGORIES.filter(c => {
    if (parentId && c.parentCategoryId !== parentId) return false;
    if (!parentId && c.parentCategoryId) return false; // root listesi
    if (c.status !== status) return false;
    return true;
  });

  const warnings = [...FOUNDATION_WARNINGS];
  if (query.cursor) {
    warnings.push('CURSOR_NOT_IMPLEMENTED_FOUNDATION');
  }

  return {
    items: items.slice(0, limit),
    warnings
  };
}

export async function getCategoryDetail(query: CategoryDetailQuery): Promise<CategoryDetailResponse> {
  const category = STATIC_CATEGORIES.find(c => 
    (query.categoryId && c.categoryId === query.categoryId) || 
    (query.slug && c.slug === query.slug)
  );

  if (!category) {
    return { errors: ['CATEGORY_NOT_FOUND'], warnings: FOUNDATION_WARNINGS };
  }

  const warnings = [...FOUNDATION_WARNINGS];
  if (category.status === 'HIDDEN') {
    warnings.push('CATEGORY_HIDDEN_FOUNDATION_VISIBILITY');
  }

  return {
    category,
    warnings
  };
}

const SORT_OPTIONS: CategorySortOption[] = [
  { sortKey: 'RECOMMENDED', label: 'Önerilen', m8RankingRequired: false, foundationSupported: true },
  { sortKey: 'PRICE_ASC', label: 'En Düşük Fiyat', m8RankingRequired: false, foundationSupported: true },
  { sortKey: 'PRICE_DESC', label: 'En Yüksek Fiyat', m8RankingRequired: false, foundationSupported: true },
  { sortKey: 'BEST_SELLING', label: 'En Çok Satanlar', m8RankingRequired: true, foundationSupported: false },
  { sortKey: 'NEWEST', label: 'En Yeniler', m8RankingRequired: true, foundationSupported: false }
];

const STATIC_FACETS: PlpFacet[] = [
  {
    filterId: 'price',
    label: 'Fiyat',
    facetTruth: false,
    options: [
      { label: '0 - 500 TL', value: '0-500' },
      { label: '500 - 1000 TL', value: '500-1000' },
      { label: '1000 TL+', value: '1000-plus' }
    ]
  },
  {
    filterId: 'video_available',
    label: 'Videolu Ürünler',
    facetTruth: false,
    options: [
      { label: 'Evet', value: true }
    ]
  }
];

export async function getPlp(query: PlpQuery): Promise<PlpResponse> {
  const categoryRes = await getCategoryDetail({ categoryId: query.categoryId, slug: query.slug });
  const category = categoryRes.category;

  if (!category) {
    return {
      subcategories: [],
      filters: [],
      sortOptions: SORT_OPTIONS,
      productCards: [],
      emptyState: { code: 'CATEGORY_NOT_FOUND', message: 'Kategori bulunamadı.' },
      warnings: FOUNDATION_WARNINGS
    };
  }

  if (category.status !== 'ACTIVE') {
    return {
      category,
      subcategories: [],
      filters: [],
      sortOptions: SORT_OPTIONS,
      productCards: [],
      emptyState: { code: 'NO_PRODUCTS', message: 'Bu kategori şu an erişime kapalıdır.' },
      warnings: [...FOUNDATION_WARNINGS, 'CATEGORY_NOT_ACTIVE_FOUNDATION']
    };
  }

  const catalogCards = listPublicCatalogProductCards({
    categoryId: category.categoryId,
    limit: query.limit
  });

  let productCards: ClassicProductCardProjection[] = catalogCards.map(card => ({
    productId: card.productId,
    slug: card.slug,
    name: card.name,
    activePriceLabel: 'PRICE_OWNED_BY_PRICING',
    primaryMedia: card.primaryMedia
      ? {
          mediaId: card.primaryMedia.mediaId,
          url: card.primaryMedia.url,
          type: card.primaryMedia.type
        }
      : undefined,
    storefrontContext: card.storefrontContext
      ? {
          storefrontId: card.storefrontContext.storefrontId,
          name: card.storefrontContext.name,
          slug: card.storefrontContext.storefrontId
        }
      : undefined,
    actions: {
      canAddToCart: true,
      canLike: true,
      canSave: true,
      canShare: false
    },
    pdpTarget: {
      productId: card.productId,
      storefrontId: card.storefrontContext?.storefrontId,
      storeContextRequired: true
    },
    cardTruth: false,
    catalogReadTruth: card.catalogReadTruth,
    productTruthMutated: card.productTruthMutated,
    priceTruth: card.priceTruth,
    stockTruth: card.stockTruth,
    mediaTruth: card.mediaTruth,
    searchIndexTruth: card.searchIndexTruth,
    priceTruthMutated: false,
    stockTruthMutated: false,
    interactionTruthMutated: false,
    warnings: [
      ...(card.warnings || []),
      'PLP_CARD_FROM_CATALOG_READ_PROJECTION',
      'ACTIVE_PRICE_LABEL_UNAVAILABLE_PRICE_OWNER_NOT_DELEGATED'
    ]
  }));

  if (query.filters?.video_available === 'true' || query.filters?.video_available === true) {
    productCards = productCards.filter(card => card.primaryMedia?.type === 'VIDEO');
  }

  const videoRail: PlpVideoRailItem[] = productCards
    .filter(card => card.primaryMedia?.type === 'VIDEO')
    .map(card => ({
      productId: card.productId,
      slug: card.slug,
      name: card.name,
      mediaType: 'VIDEO',
      storefrontContext: card.storefrontContext,
      supportOnly: true, 
      discoveryFeed: false,
      warnings: FOUNDATION_WARNINGS
    }));

  const subcategories = STATIC_CATEGORIES.filter(c => c.parentCategoryId === category.categoryId && c.status === 'ACTIVE');

  let emptyState;
  if (productCards.length === 0) {
    emptyState = {
      code: query.filters ? 'FILTER_NO_RESULTS' as const : 'NO_PRODUCTS' as const,
      message: 'Ürün bulunamadı.',
      suggestedAction: query.filters ? 'CLEAR_FILTERS' as const : 'GO_DISCOVER' as const
    };
  }

  // Search candidate integration (Optional/simulation)
  if (query.searchQuery) {
    await searchCandidates({ query: query.searchQuery, mode: 'CATALOG', categoryId: category.categoryId });
  }

  return {
    category,
    subcategories,
    filters: STATIC_FACETS,
    sortOptions: SORT_OPTIONS,
    activeSort: query.sort || 'RECOMMENDED',
    productCards,
    videoRail: videoRail.length > 0 ? videoRail : undefined,
    emptyState,
    warnings: FOUNDATION_WARNINGS
  };
}
