export type ProductStatus = 'ACTIVE' | 'HIDDEN' | 'UNAVAILABLE';
export type CatalogProjectionSource =
  | 'POOL_COMMERCIAL_PRODUCT'
  | 'POOL_CREATOR_STORE_PRODUCT'
  | 'FOUNDATION_SEED';

export type CatalogVariantAvailabilityStatus =
  | 'AVAILABLE'
  | 'OUT_OF_STOCK'
  | 'UNAVAILABLE'
  | 'UNKNOWN';

export interface CategoryRef {
  categoryId: string;
  name: string;
  slug: string;
}

export interface ProductMedia {
  mediaId: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  isPrimary: boolean;
}

export interface ProductVariant {
  variantId: string;
  sku: string;
  options: Record<string, string>; // e.g., { "color": "red", "size": "M" }
  // Note: Stock and Pricing truth are deliberately omitted here.
}

export interface CatalogVariantProjection extends ProductVariant {
  availabilityStatus: CatalogVariantAvailabilityStatus;
  priceTruth: false;
  stockTruth: false;
  warnings?: string[];
}

export interface ProductSummary {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  primaryMedia?: ProductMedia;
  status: ProductStatus;
}

export interface ProductDetail extends ProductSummary {
  description: string;
  categories: CategoryRef[];
  media: ProductMedia[];
  variants: ProductVariant[];
  defaultVariantId?: string;
  // Commercial projections (Read-only from owner services)
  price?: {
    current: number;
    original?: number;
    currency: string;
    discountLabel?: string;
  };
  stock?: {
    status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
    label?: string; // e.g., "Last 3 items"
  };
  // Content and Social metadata (like ratings, reviews, stories) 
  // will be merged at a higher orchestration layer or by the client directly.
}

export interface CatalogProductReadProjection extends Omit<ProductDetail, 'variants'> {
  variants: CatalogVariantProjection[];
  publicReadable: boolean;
  catalogReadTruth: false;
  projectionSource: CatalogProjectionSource;
  commercialPoolProductId?: string;
  creatorStoreProductId?: string;
  storefrontId?: string;
  visibility?: 'VISIBLE' | 'HIDDEN';
  priceTruth: false;
  stockTruth: false;
  mediaTruth: false;
  searchIndexTruth: false;
  productTruthMutated: false;
  warnings?: string[];
}

export interface CatalogProductCardReadProjection {
  productId: string;
  slug: string;
  name: string;
  brand?: string;
  status: ProductStatus;
  primaryMedia?: ProductMedia;
  storefrontContext?: StorefrontContext;
  cardTruth: false;
  catalogReadTruth: false;
  priceTruth: false;
  stockTruth: false;
  mediaTruth: false;
  searchIndexTruth: false;
  productTruthMutated: false;
  warnings?: string[];
}

export interface StorefrontContext {
  storefrontId: string;
  name: string;
  creatorNote?: string;
  isFollowed?: boolean;
}

export interface PdpResponse {
  product: ProductDetail;
  storefrontContext: StorefrontContext;
}
