export type CurrencyCode = 'TRY';
export type PriceSourceType = 'FOUNDATION_SIMULATED';
export interface PriceCorridor {
    minPrice: number;
    suggestedPrice: number;
    maxPrice: number;
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