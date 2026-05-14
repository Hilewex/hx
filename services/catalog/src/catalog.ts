import {
  CatalogProductCardReadProjection,
  CatalogProductReadProjection,
  CatalogVariantAvailabilityStatus,
  CommercialPoolProduct,
  CommercialPoolStatus,
  CreatorStoreProduct,
  CreatorStoreProductStatus,
  CreatorStoreProductVisibility,
  ProductMedia,
  ProductStatus,
  StorefrontContext,
  SupplierSubmittedVariant
} from '@hx/contracts';
import { getProjection } from './projection-handler';

export interface CatalogProductListInput {
  categoryId?: string;
  storefrontId?: string;
  includeNonPublic?: boolean;
  limit?: number;
}

export interface CatalogProductProjectionResult {
  status: 'OK' | 'NOT_FOUND' | 'UNAVAILABLE';
  product?: CatalogProductReadProjection;
  warnings?: string[];
}

const FOUNDATION_WARNINGS = [
  'CATALOG_READ_PROJECTION_FOUNDATION',
  'CATALOG_READ_TRUTH_FALSE',
  'POOL_COMMERCIAL_SOURCE_PROJECTION',
  'PRICE_TRUTH_OWNED_BY_PRICING',
  'STOCK_TRUTH_OWNED_BY_STOCK',
  'MEDIA_TRUTH_OWNED_BY_MEDIA',
  'SEARCH_INDEX_NOT_TRUTH'
];

const FOUNDATION_STOREFRONTS: Record<string, StorefrontContext> = {
  s_feno_1: {
    storefrontId: 's_feno_1',
    name: 'Feno Trend Store',
    creatorNote: 'Foundation creator note projection',
    isFollowed: false
  },
  s_feno_2: {
    storefrontId: 's_feno_2',
    name: 'Style by Ayse',
    creatorNote: 'Foundation creator note projection',
    isFollowed: false
  }
};

const FOUNDATION_PRODUCTS: CatalogProductReadProjection[] = [
  createFoundationProduct({
    productId: 'p_valid',
    commercialPoolProductId: 'cp_active',
    creatorStoreProductId: 'csp_active',
    storefrontId: 's_feno_1',
    slug: 'valid-product',
    name: 'Valid Product',
    brand: 'HX Brand',
    status: 'ACTIVE',
    visibility: 'VISIBLE',
    description: 'Foundation catalog read projection for an active product.',
    categoryId: 'c_1',
    categoryName: 'Electronics',
    categorySlug: 'electronics',
    media: [{ mediaId: 'm_1', url: 'http://img.com/1.jpg', type: 'IMAGE', isPrimary: true }],
    variants: [
      { variantId: 'v_1', sku: 'SKU-001', options: { color: 'Black' }, availabilityStatus: 'AVAILABLE' },
      { variantId: 'v_2', sku: 'SKU-002', options: { color: 'White' }, availabilityStatus: 'OUT_OF_STOCK' }
    ],
    defaultVariantId: 'v_1'
  }),
  createFoundationProduct({
    productId: 'p_hidden',
    commercialPoolProductId: 'cp_hidden',
    creatorStoreProductId: 'csp_hidden',
    storefrontId: 's_feno_1',
    slug: 'hidden-product',
    name: 'Hidden Product',
    brand: 'HX Brand',
    status: 'HIDDEN',
    visibility: 'HIDDEN',
    description: 'Foundation catalog read projection for a hidden product.',
    categoryId: 'c_1',
    categoryName: 'Electronics',
    categorySlug: 'electronics',
    media: [{ mediaId: 'm_hidden', url: 'http://img.com/hidden.jpg', type: 'IMAGE', isPrimary: true }],
    variants: [{ variantId: 'v_hidden', sku: 'SKU-HIDDEN', options: {}, availabilityStatus: 'AVAILABLE' }]
  }),
  createFoundationProduct({
    productId: 'p_unavailable',
    commercialPoolProductId: 'cp_unavailable',
    creatorStoreProductId: 'csp_unavailable',
    storefrontId: 's_feno_1',
    slug: 'unavailable-product',
    name: 'Unavailable Product',
    brand: 'HX Brand',
    status: 'UNAVAILABLE',
    visibility: 'VISIBLE',
    description: 'Foundation catalog read projection for an unavailable product.',
    categoryId: 'c_1',
    categoryName: 'Electronics',
    categorySlug: 'electronics',
    media: [{ mediaId: 'm_unavailable', url: 'http://img.com/unavailable.jpg', type: 'IMAGE', isPrimary: true }],
    variants: [{ variantId: 'v_unavailable', sku: 'SKU-UNAVAILABLE', options: {}, availabilityStatus: 'UNAVAILABLE' }]
  }),
  createFoundationProduct({
    productId: 'p_suspended',
    commercialPoolProductId: 'cp_suspended',
    creatorStoreProductId: 'csp_suspended',
    storefrontId: 's_feno_1',
    slug: 'suspended-product',
    name: 'Suspended Product',
    brand: 'HX Brand',
    status: 'HIDDEN',
    visibility: 'VISIBLE',
    description: 'Foundation catalog read projection for a suspended commercial product.',
    categoryId: 'c_1',
    categoryName: 'Electronics',
    categorySlug: 'electronics',
    media: [{ mediaId: 'm_suspended', url: 'http://img.com/suspended.jpg', type: 'IMAGE', isPrimary: true }],
    variants: [{ variantId: 'v_suspended', sku: 'SKU-SUSPENDED', options: {}, availabilityStatus: 'AVAILABLE' }],
    extraWarnings: ['COMMERCIAL_STATUS_SUSPENDED_PUBLIC_EXCLUDED']
  }),
  createFoundationProduct({
    productId: 'p_archived',
    commercialPoolProductId: 'cp_archived',
    creatorStoreProductId: 'csp_archived',
    storefrontId: 's_feno_1',
    slug: 'archived-product',
    name: 'Archived Product',
    brand: 'HX Brand',
    status: 'HIDDEN',
    visibility: 'VISIBLE',
    description: 'Foundation catalog read projection for an archived commercial product.',
    categoryId: 'c_1',
    categoryName: 'Electronics',
    categorySlug: 'electronics',
    media: [{ mediaId: 'm_archived', url: 'http://img.com/archived.jpg', type: 'IMAGE', isPrimary: true }],
    variants: [{ variantId: 'v_archived', sku: 'SKU-ARCHIVED', options: {}, availabilityStatus: 'AVAILABLE' }],
    extraWarnings: ['COMMERCIAL_STATUS_ARCHIVED_PUBLIC_EXCLUDED']
  })
];

export function mapCommercialProductToCatalogStatus(product: CommercialPoolProduct): ProductStatus {
  if (product.status === CommercialPoolStatus.ACTIVE) return 'ACTIVE';
  return 'HIDDEN';
}

export function mapCreatorStoreProductToCatalogVisibility(
  product: CreatorStoreProduct
): 'VISIBLE' | 'HIDDEN' {
  if (
    product.status === CreatorStoreProductStatus.ACTIVE &&
    product.visibility === CreatorStoreProductVisibility.VISIBLE
  ) {
    return 'VISIBLE';
  }
  return 'HIDDEN';
}

export function mapVariantAvailability(variant: SupplierSubmittedVariant): CatalogVariantAvailabilityStatus {
  if (variant.stock > 0) return 'AVAILABLE';
  return 'OUT_OF_STOCK';
}

export function getCatalogProduct(productId: string): CatalogProductProjectionResult {
  return getCatalogProductProjection(productId, { includeNonPublic: true });
}

export function getCatalogProductProjection(
  productId: string,
  options: { includeNonPublic?: boolean } = {}
): CatalogProductProjectionResult {
  const product = getProjection(productId) ?? FOUNDATION_PRODUCTS.find(item => item.productId === productId);
  if (!product) {
    return { status: 'NOT_FOUND', warnings: FOUNDATION_WARNINGS };
  }

  if (!options.includeNonPublic && !isPublicReadable(product)) {
    if (product.status === 'UNAVAILABLE') {
      return { status: 'UNAVAILABLE', product, warnings: product.warnings };
    }
    return { status: 'NOT_FOUND', warnings: product.warnings };
  }

  if (product.status === 'UNAVAILABLE') {
    return { status: 'UNAVAILABLE', product, warnings: product.warnings };
  }

  return { status: 'OK', product, warnings: product.warnings };
}

export function listCatalogProducts(input: CatalogProductListInput = {}): CatalogProductReadProjection[] {
  return filterCatalogProducts(input);
}

export function listPublicCatalogProductCards(input: CatalogProductListInput = {}): CatalogProductCardReadProjection[] {
  return filterCatalogProducts({ ...input, includeNonPublic: false }).map(product => ({
    productId: product.productId,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    status: product.status,
    primaryMedia: product.primaryMedia,
    storefrontContext: product.storefrontId ? FOUNDATION_STOREFRONTS[product.storefrontId] : undefined,
    cardTruth: false,
    catalogReadTruth: false,
    priceTruth: false,
    stockTruth: false,
    mediaTruth: false,
    searchIndexTruth: false,
    productTruthMutated: false,
    warnings: product.warnings
  }));
}

export function getStorefrontContext(storefrontId: string): StorefrontContext | undefined {
  return FOUNDATION_STOREFRONTS[storefrontId];
}

export function isPublicReadable(product: CatalogProductReadProjection): boolean {
  return product.status === 'ACTIVE' && product.visibility !== 'HIDDEN' && product.publicReadable;
}

function filterCatalogProducts(input: CatalogProductListInput): CatalogProductReadProjection[] {
  const limit = input.limit || 20;
  return FOUNDATION_PRODUCTS.filter(product => {
    if (!input.includeNonPublic && !isPublicReadable(product)) return false;
    if (input.categoryId && !product.categories.some(category => category.categoryId === input.categoryId)) return false;
    if (input.storefrontId && product.storefrontId !== input.storefrontId) return false;
    return true;
  }).slice(0, limit);
}

function createFoundationProduct(input: {
  productId: string;
  commercialPoolProductId: string;
  creatorStoreProductId: string;
  storefrontId: string;
  slug: string;
  name: string;
  brand: string;
  status: ProductStatus;
  visibility: 'VISIBLE' | 'HIDDEN';
  description: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  media: ProductMedia[];
  variants: Array<{
    variantId: string;
    sku: string;
    options: Record<string, string>;
    availabilityStatus: CatalogVariantAvailabilityStatus;
  }>;
  defaultVariantId?: string;
  extraWarnings?: string[];
}): CatalogProductReadProjection {
  const warnings = [...FOUNDATION_WARNINGS, ...(input.extraWarnings || [])];
  return {
    productId: input.productId,
    commercialPoolProductId: input.commercialPoolProductId,
    creatorStoreProductId: input.creatorStoreProductId,
    storefrontId: input.storefrontId,
    slug: input.slug,
    name: input.name,
    brand: input.brand,
    status: input.status,
    visibility: input.visibility,
    publicReadable: input.status === 'ACTIVE' && input.visibility === 'VISIBLE',
    description: input.description,
    categories: [{ categoryId: input.categoryId, name: input.categoryName, slug: input.categorySlug }],
    media: input.media,
    primaryMedia: input.media.find(media => media.isPrimary) || input.media[0],
    variants: input.variants.map(variant => ({
      ...variant,
      priceTruth: false,
      stockTruth: false,
      warnings
    })),
    defaultVariantId: input.defaultVariantId || input.variants[0]?.variantId,
    catalogReadTruth: false,
    projectionSource: 'FOUNDATION_SEED',
    priceTruth: false,
    stockTruth: false,
    mediaTruth: false,
    searchIndexTruth: false,
    productTruthMutated: false,
    warnings
  };
}
