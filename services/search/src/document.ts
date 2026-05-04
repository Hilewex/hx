import { CatalogProductReadProjection, ProductDetail, ProductSearchCandidate } from '@hx/contracts';

export type ProductSearchDocumentSourceOwner = 'CATALOG_READ_PROJECTION' | 'FOUNDATION_SEED';

export interface ProductSearchDocument {
  productId: string;
  variantId?: string;
  slug: string;
  name: string;
  title: string;
  brand?: string;
  categoryIds: string[];
  categorySlugs: string[];
  storefrontId?: string;
  storefrontSlug?: string;
  creatorId?: string;
  status: 'ACTIVE' | 'HIDDEN' | 'UNAVAILABLE';
  visible: boolean;
  mediaType?: 'IMAGE' | 'VIDEO';
  priceMin?: number;
  priceMax?: number;
  facetValues: Record<string, string[]>;
  sourceOwner: ProductSearchDocumentSourceOwner;
  projectionTruth: false;
  searchIndexTruth: false;
  productTruthMutated: false;
  priceTruth: false;
  stockTruth: false;
  mediaTruth: false;
  rankingFinal: false;
  updatedAt: string;
}

export interface ProductSearchDocumentInput {
  productId: string;
  variantId?: string;
  slug: string;
  name: string;
  title?: string;
  brand?: string;
  categoryIds?: string[];
  categorySlugs?: string[];
  storefrontId?: string;
  storefrontSlug?: string;
  creatorId?: string;
  status: 'ACTIVE' | 'HIDDEN' | 'UNAVAILABLE';
  visible?: boolean;
  mediaType?: 'IMAGE' | 'VIDEO';
  priceMin?: number;
  priceMax?: number;
  facetValues?: Record<string, string[]>;
  sourceOwner?: ProductSearchDocumentSourceOwner;
  updatedAt?: string;
}

export function toProductSearchDocument(input: ProductSearchDocumentInput): ProductSearchDocument {
  const visible = input.visible ?? input.status === 'ACTIVE';
  return {
    productId: input.productId,
    variantId: input.variantId,
    slug: input.slug,
    name: input.name,
    title: input.title || input.name,
    brand: input.brand,
    categoryIds: input.categoryIds || [],
    categorySlugs: input.categorySlugs || [],
    storefrontId: input.storefrontId,
    storefrontSlug: input.storefrontSlug,
    creatorId: input.creatorId,
    status: input.status,
    visible,
    mediaType: input.mediaType,
    priceMin: input.priceMin,
    priceMax: input.priceMax,
    facetValues: input.facetValues || {},
    sourceOwner: input.sourceOwner || 'FOUNDATION_SEED',
    projectionTruth: false,
    searchIndexTruth: false,
    productTruthMutated: false,
    priceTruth: false,
    stockTruth: false,
    mediaTruth: false,
    rankingFinal: false,
    updatedAt: input.updatedAt || new Date(0).toISOString()
  };
}

export function isCatalogProjectionIndexable(product: CatalogProductReadProjection): boolean {
  return product.status === 'ACTIVE' && product.visibility !== 'HIDDEN' && product.publicReadable === true;
}

export function buildProductSearchDocumentFromCatalogProjection(
  product: CatalogProductReadProjection,
  updatedAt?: string
): ProductSearchDocument {
  return toProductSearchDocument({
    productId: product.productId,
    variantId: product.defaultVariantId,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    categoryIds: product.categories.map(category => category.categoryId),
    categorySlugs: product.categories.map(category => category.slug),
    storefrontId: product.storefrontId,
    status: product.status,
    visible: isCatalogProjectionIndexable(product),
    mediaType: product.primaryMedia?.type,
    sourceOwner: 'CATALOG_READ_PROJECTION',
    updatedAt
  });
}

export const toProductSearchDocumentFromCatalogProjection = buildProductSearchDocumentFromCatalogProjection;
export const buildSearchProjectionDocument = buildProductSearchDocumentFromCatalogProjection;

export function productDetailToSearchDocument(product: ProductDetail, updatedAt?: string): ProductSearchDocument {
  return toProductSearchDocument({
    productId: product.productId,
    variantId: product.defaultVariantId,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    categoryIds: product.categories.map(category => category.categoryId),
    categorySlugs: product.categories.map(category => category.slug),
    status: product.status,
    mediaType: product.primaryMedia?.type,
    sourceOwner: 'FOUNDATION_SEED',
    updatedAt
  });
}

export function productDocumentToCandidate(
  document: ProductSearchDocument,
  scoreFoundationOnly: number,
  warnings?: string[]
): ProductSearchCandidate {
  return {
    type: 'PRODUCT',
    productId: document.productId,
    slug: document.slug,
    name: document.name,
    brand: document.brand,
    status: document.status,
    mediaType: document.mediaType,
    categoryIds: document.categoryIds,
    storefrontId: document.storefrontId,
    scoreFoundationOnly,
    searchTruth: false,
    projectionTruth: false,
    searchIndexTruth: false,
    productTruthMutated: false,
    priceTruth: false,
    stockTruth: false,
    mediaTruth: false,
    rankingFinal: false,
    warnings
  };
}
