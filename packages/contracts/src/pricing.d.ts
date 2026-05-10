export type CurrencyCode = 'TRY';
export type PriceSourceType = 'FOUNDATION_SIMULATED' | 'POOL_BASE_PRICE_SNAPSHOT';
export type InternalPriceVisibility = 'INTERNAL_ONLY';
export type PricingRuleSource = 'FOUNDATION_CATEGORY_MARGIN_POLICY_MISSING' | 'ADMIN_CATEGORY_MARGIN_POLICY';
export interface SupplierBasePriceSnapshot {
    amount: number;
    currency: CurrencyCode;
    supplierId: string;
    sourceProductId?: string;
    capturedAt: Date;
    visibility: InternalPriceVisibility;
}
export interface PoolBasePriceSnapshot {
    amount: number;
    currency: CurrencyCode;
    supplierBasePriceAmount: number;
    platformMarginAmount: number;
    platformMarginRate?: number;
    categoryId?: string;
    ruleSource: PricingRuleSource;
    calculatedAt: Date;
}
export type CreatorVisiblePoolBasePriceSnapshot = Omit<PoolBasePriceSnapshot, 'supplierBasePriceAmount'>;
export interface PriceCorridor {
    minPrice: number;
    suggestedPrice: number;
    recommendedPrice: number;
    maxPrice: number;
    currency: CurrencyCode;
    ruleSource: PricingRuleSource;
    launchMode?: boolean;
    launchRequiresRecommendedPrice?: boolean;
}
export interface CreatorPriceSelectionInput {
    commercialProductId: string;
    creatorStoreId: string;
    selectedPrice: number;
}
export interface CreatorPriceSelectionResult {
    accepted: boolean;
    selectedPrice: number;
    corridor: PriceCorridor;
    reasonCode?: 'SELECTED_PRICE_BELOW_MIN' | 'SELECTED_PRICE_ABOVE_MAX' | 'LAUNCH_REQUIRES_RECOMMENDED_PRICE';
}
export interface ActiveSalesPrice {
    productId: string;
    variantId?: string;
    storefrontId: string;
    currency: CurrencyCode;
    activeUnitPrice: number;
    corridor: PriceCorridor;
    source: PriceSourceType;
    warnings?: string[];
}
export interface ResolvePriceInput {
    productId: string;
    variantId?: string;
    storefrontId: string;
    quantity?: number;
}
export interface ResolvePriceResult {
    price?: ActiveSalesPrice;
    status: 'OK' | 'PRICE_UNAVAILABLE';
}
//# sourceMappingURL=pricing.d.ts.map