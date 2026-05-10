"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockService = exports.StockService = void 0;
class StockService {
    async resolveStock(input) {
        const { productId, variantId, storefrontId, requestedQuantity } = input;
        let status = 'IN_STOCK';
        let availableQuantity = 100;
        if (productId.includes('out_of_stock')) {
            status = 'OUT_OF_STOCK';
            availableQuantity = 0;
        }
        else if (productId.includes('low_stock')) {
            status = 'LOW_STOCK';
            availableQuantity = 5;
        }
        else if (productId.includes('stock_unknown')) {
            status = 'UNKNOWN';
            availableQuantity = undefined;
        }
        const availability = {
            productId,
            variantId,
            storefrontId,
            availableQuantity,
            status,
            source: 'FOUNDATION_SIMULATED',
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
exports.StockService = StockService;
exports.stockService = new StockService();
