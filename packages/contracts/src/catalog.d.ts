export type ProductStatus = 'ACTIVE' | 'HIDDEN' | 'UNAVAILABLE';
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
    options: Record<string, string>;
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
}
export interface PdpResponse {
    product: ProductDetail;
}
//# sourceMappingURL=catalog.d.ts.map