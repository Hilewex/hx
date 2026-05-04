import { ResolveStockInput, ResolveStockResult, StockAvailabilityStatus } from '@hx/contracts';

export class StockService {
  async resolveStock(input: ResolveStockInput): Promise<ResolveStockResult> {
    const { productId, variantId, storefrontId, requestedQuantity } = input;
    
    let status: StockAvailabilityStatus = 'IN_STOCK';
    let availableQuantity = 100;

    if (productId.includes('out_of_stock')) {
      status = 'OUT_OF_STOCK';
      availableQuantity = 0;
    } else if (productId.includes('low_stock')) {
      status = 'LOW_STOCK';
      availableQuantity = 5;
    } else if (productId.includes('stock_unknown')) {
      status = 'UNKNOWN';
      availableQuantity = undefined as any;
    }

    const availability = {
      productId,
      variantId,
      storefrontId,
      availableQuantity,
      status,
      source: 'FOUNDATION_SIMULATED' as const,
      warnings: status === 'LOW_STOCK' ? ['Hurry up, only a few left!'] : undefined
    };

    if (status === 'OUT_OF_STOCK' || (availableQuantity !== undefined && requestedQuantity > availableQuantity)) {
      return {
        availability,
        status: 'STOCK_UNAVAILABLE'
      };
    }

    if (status === 'UNKNOWN') {
      return {
        availability,
        status: 'UNKNOWN'
      };
    }

    return {
      availability,
      status: 'OK'
    };
  }
}

export const stockService = new StockService();
