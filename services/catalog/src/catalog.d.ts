import { CatalogProductCardReadProjection, CatalogProductReadProjection, CatalogVariantAvailabilityStatus, CommercialPoolProduct, CreatorStoreProduct, ProductStatus, StorefrontContext, SupplierSubmittedVariant } from '@hx/contracts';
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
export declare function mapCommercialProductToCatalogStatus(product: CommercialPoolProduct): ProductStatus;
export declare function mapCreatorStoreProductToCatalogVisibility(product: CreatorStoreProduct): 'VISIBLE' | 'HIDDEN';
export declare function mapVariantAvailability(variant: SupplierSubmittedVariant): CatalogVariantAvailabilityStatus;
export declare function getCatalogProduct(productId: string): CatalogProductProjectionResult;
export declare function getCatalogProductProjection(productId: string, options?: {
    includeNonPublic?: boolean;
}): CatalogProductProjectionResult;
export declare function listCatalogProducts(input?: CatalogProductListInput): CatalogProductReadProjection[];
export declare function listPublicCatalogProductCards(input?: CatalogProductListInput): CatalogProductCardReadProjection[];
export declare function getStorefrontContext(storefrontId: string): StorefrontContext | undefined;
export declare function isPublicReadable(product: CatalogProductReadProjection): boolean;
//# sourceMappingURL=catalog.d.ts.map