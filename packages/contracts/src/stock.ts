export type StockAvailabilityStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';

export type StockSourceType = 'FOUNDATION_SIMULATED';

export interface StockAvailability {
  productId: string;
  variantId?: string;
  storefrontId: string;
  availableQuantity?: number;
  status: StockAvailabilityStatus;
  source: StockSourceType;
  warnings?: string[];
}

export interface ResolveStockInput {
  productId: string;
  variantId?: string;
  storefrontId: string;
  requestedQuantity: number;
}

export interface ResolveStockResult {
  availability?: StockAvailability;
  status: 'OK' | 'STOCK_UNAVAILABLE' | 'UNKNOWN';
}
