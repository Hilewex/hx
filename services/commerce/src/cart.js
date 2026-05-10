"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetRepository = resetRepository;
exports.getCart = getCart;
exports.addToCart = addToCart;
exports.updateCartLine = updateCartLine;
exports.removeCartLine = removeCartLine;
exports.clearCart = clearCart;
const pricing_1 = require("@hx/pricing");
const catalog_1 = require("@hx/catalog");
const stock_1 = require("@hx/stock");
const config_1 = require("@hx/config");
const persistence_1 = require("@hx/persistence");
const node_crypto_1 = require("node:crypto");
const in_memory_1 = require("./repository/in-memory");
const postgres_1 = require("./repository/postgres");
let repository;
function getRepository() {
    if (repository)
        return repository;
    const config = (0, config_1.parseConfig)(persistence_1.persistenceConfigSchema, process.env);
    if (config.PERSISTENCE_MODE === 'postgres') {
        if (!config.DATABASE_URL) {
            throw new Error("DATABASE_URL is required when PERSISTENCE_MODE is 'postgres'");
        }
        repository = new postgres_1.PostgresCartRepository();
    }
    else {
        repository = new in_memory_1.InMemoryCartRepository();
    }
    return repository;
}
// For testing purposes
function resetRepository(mockRepo) {
    repository = mockRepo || new in_memory_1.InMemoryCartRepository();
}
function calculateSummary(lines) {
    return {
        totalQuantity: lines.reduce((acc, line) => acc + line.quantity, 0),
        subTotal: lines.reduce((acc, line) => acc + ((line.lineTotal !== undefined ? line.lineTotal : (line.unitPrice || 0) * line.quantity)), 0)
    };
}
async function getCart(context) {
    const repo = getRepository();
    const lines = await repo.getLines(context);
    return {
        status: 200,
        data: {
            context,
            lines,
            summary: calculateSummary(lines)
        }
    };
}
async function addToCart(context, command) {
    if (command.quantity < 1) {
        return {
            status: 400,
            data: { context, lines: [], summary: { totalQuantity: 0 }, errors: [{ code: 'CART_INVALID_QUANTITY', message: 'Quantity must be at least 1' }] }
        };
    }
    if (!command.productId) {
        return {
            status: 400,
            data: { context, lines: [], summary: { totalQuantity: 0 }, errors: [{ code: 'CART_INVALID_PRODUCT', message: 'Product ID is required' }] }
        };
    }
    if (!command.storefrontId) {
        return {
            status: 400,
            data: { context, lines: [], summary: { totalQuantity: 0 }, errors: [{ code: 'CART_INVALID_PRODUCT', message: 'Storefront ID is required' }] }
        };
    }
    const repo = getRepository();
    const lines = await repo.getLines(context);
    const existingLine = lines.find(l => l.productId === command.productId &&
        l.variantId === command.variantId &&
        l.storefrontId === command.storefrontId);
    const targetQuantity = (existingLine?.quantity || 0) + command.quantity;
    const stockResult = await stock_1.stockService.resolveStock({
        productId: command.productId,
        variantId: command.variantId,
        storefrontId: command.storefrontId,
        requestedQuantity: targetQuantity
    });
    if (stockResult.status === 'STOCK_UNAVAILABLE') {
        return {
            status: 400,
            data: { context, lines, summary: calculateSummary(lines), errors: [{ code: 'CART_STOCK_UNAVAILABLE', message: 'Product is out of stock or requested quantity is not available' }] }
        };
    }
    const warnings = stockResult.availability?.warnings || [];
    if (existingLine) {
        existingLine.quantity += command.quantity;
        existingLine.stockAvailability = stockResult.availability;
        existingLine.warnings = [...(existingLine.warnings?.filter(w => !w.includes('few left')) || []), ...warnings];
        if (existingLine.unitPrice !== undefined) {
            existingLine.lineTotal = existingLine.unitPrice * existingLine.quantity;
        }
    }
    else {
        const catalogResult = (0, catalog_1.getCatalogProduct)(command.productId);
        if (catalogResult.status === 'NOT_FOUND') {
            return {
                status: 404,
                data: { context, lines, summary: calculateSummary(lines), errors: [{ code: 'CART_INVALID_PRODUCT', message: 'Product not found' }] }
            };
        }
        if (catalogResult.status === 'UNAVAILABLE' || catalogResult.product?.status !== 'ACTIVE') {
            return {
                status: 400,
                data: { context, lines, summary: calculateSummary(lines), errors: [{ code: 'CART_ADD_NOT_ALLOWED', message: 'Product is not available for purchase' }] }
            };
        }
        const product = catalogResult.product;
        // Variant validation
        const targetVariantId = command.variantId || product.defaultVariantId;
        if (product.variants && product.variants.length > 0) {
            if (!targetVariantId) {
                return {
                    status: 400,
                    data: { context, lines, summary: calculateSummary(lines), errors: [{ code: 'CART_INVALID_VARIANT', message: 'A variant must be selected for this product.' }] }
                };
            }
            const isValidVariant = product.variants.some((v) => v.variantId === targetVariantId);
            if (!isValidVariant) {
                return {
                    status: 400,
                    data: { context, lines, summary: calculateSummary(lines), errors: [{ code: 'CART_INVALID_VARIANT', message: 'The selected variant does not exist.' }] }
                };
            }
        }
        const priceResult = await (0, pricing_1.resolvePrice)({
            productId: command.productId,
            variantId: targetVariantId,
            storefrontId: command.storefrontId,
            quantity: command.quantity
        });
        if (priceResult.status === 'PRICE_UNAVAILABLE' || !priceResult.price) {
            return {
                status: 400,
                data: { context, lines, summary: calculateSummary(lines), errors: [{ code: 'CART_INVALID_PRODUCT', message: 'Pricing unavailable for this product' }] }
            };
        }
        const newLine = {
            lineId: (0, node_crypto_1.randomUUID)(),
            productId: command.productId,
            variantId: targetVariantId,
            storefrontId: command.storefrontId,
            quantity: command.quantity,
            productName: product.name, // Use actual product name
            productStatus: product.status, // Use actual product status
            unitPrice: priceResult.price.activeUnitPrice,
            lineTotal: priceResult.price.activeUnitPrice * command.quantity,
            warnings,
            stockAvailability: stockResult.availability
        };
        lines.push(newLine);
    }
    await repo.saveLines(context, lines);
    return {
        status: 200,
        data: {
            context,
            lines,
            summary: calculateSummary(lines)
        }
    };
}
async function updateCartLine(context, command) {
    const repo = getRepository();
    const lines = await repo.getLines(context);
    const line = lines.find(l => l.lineId === command.lineId);
    if (!line) {
        return {
            status: 404,
            data: { context, lines, summary: calculateSummary(lines), errors: [{ code: 'CART_LINE_NOT_FOUND', message: 'Cart line not found' }] }
        };
    }
    if (command.quantity < 1) {
        return {
            status: 400,
            data: { context, lines, summary: calculateSummary(lines), errors: [{ code: 'CART_INVALID_QUANTITY', message: 'Quantity must be at least 1' }] }
        };
    }
    const stockResult = await stock_1.stockService.resolveStock({
        productId: line.productId,
        variantId: line.variantId,
        storefrontId: line.storefrontId,
        requestedQuantity: command.quantity
    });
    if (stockResult.status === 'STOCK_UNAVAILABLE') {
        return {
            status: 400,
            data: { context, lines, summary: calculateSummary(lines), errors: [{ code: 'CART_STOCK_UNAVAILABLE', message: 'Product is out of stock or requested quantity is not available' }] }
        };
    }
    line.quantity = command.quantity;
    line.stockAvailability = stockResult.availability;
    line.warnings = [...(line.warnings?.filter(w => !w.includes('few left')) || []), ...(stockResult.availability?.warnings || [])];
    if (line.unitPrice !== undefined) {
        line.lineTotal = line.unitPrice * line.quantity;
    }
    await repo.saveLines(context, lines);
    return {
        status: 200,
        data: {
            context,
            lines,
            summary: calculateSummary(lines)
        }
    };
}
async function removeCartLine(context, command) {
    const repo = getRepository();
    let lines = await repo.getLines(context);
    const lineExists = lines.some(l => l.lineId === command.lineId);
    if (!lineExists) {
        return {
            status: 404,
            data: { context, lines, summary: calculateSummary(lines), errors: [{ code: 'CART_LINE_NOT_FOUND', message: 'Cart line not found' }] }
        };
    }
    lines = lines.filter(l => l.lineId !== command.lineId);
    await repo.saveLines(context, lines);
    return {
        status: 200,
        data: {
            context,
            lines,
            summary: calculateSummary(lines)
        }
    };
}
async function clearCart(context) {
    const repo = getRepository();
    await repo.clear(context);
}
