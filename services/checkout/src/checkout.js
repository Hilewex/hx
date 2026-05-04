"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetRepository = resetRepository;
exports.getCheckoutReview = getCheckoutReview;
exports.startCheckout = startCheckout;
const commerce_1 = require("@hx/commerce");
const pricing_1 = require("@hx/pricing");
const stock_1 = require("@hx/stock");
const config_1 = require("@hx/config");
const persistence_1 = require("@hx/persistence");
const node_crypto_1 = require("node:crypto");
const in_memory_1 = require("../../commerce/src/repository/in-memory");
const postgres_1 = require("../../commerce/src/repository/postgres");
const stockService = new stock_1.StockService();
let repository;
function getRepository() {
    if (repository)
        return repository;
    const config = (0, config_1.parseConfig)(persistence_1.persistenceConfigSchema);
    if (config.PERSISTENCE_MODE === 'postgres') {
        if (!config.DATABASE_URL) {
            throw new Error("DATABASE_URL is required when PERSISTENCE_MODE is 'postgres'");
        }
        repository = new postgres_1.PostgresCheckoutRepository();
    }
    else {
        repository = new in_memory_1.InMemoryCheckoutRepository();
    }
    return repository;
}
// For testing purposes
function resetRepository(mockRepo) {
    repository = mockRepo || new in_memory_1.InMemoryCheckoutRepository();
}
async function getCheckoutReview(checkoutId) {
    return await getRepository().getById(checkoutId);
}
async function startCheckout(command) {
    const { cartContext } = command;
    const cartRes = await (0, commerce_1.getCart)(cartContext);
    const cartData = cartRes.data;
    const checkoutId = (0, node_crypto_1.randomUUID)();
    if (!cartData.lines || cartData.lines.length === 0) {
        const response = {
            checkoutId,
            cartContext,
            state: 'BLOCKED',
            validationState: 'BLOCKED',
            lines: [],
            summary: { totalQuantity: 0, subTotal: 0, grandTotal: 0, currency: 'TRY' },
            errors: ['CART_IS_EMPTY'],
            warnings: []
        };
        await getRepository().save(response);
        return response;
    }
    let overallValidationState = 'VALID';
    let overallState = 'REVIEW_READY';
    const checkoutLines = [];
    let subTotal = 0;
    let totalQuantity = 0;
    const globalErrors = [];
    const globalWarnings = [];
    for (const line of cartData.lines) {
        const lineValidation = {
            lineId: line.lineId,
            productId: line.productId,
            variantId: line.variantId,
            storefrontId: line.storefrontId,
            quantity: line.quantity,
            validationState: 'PENDING',
            warnings: [],
            errors: []
        };
        const priceRes = await (0, pricing_1.resolvePrice)({
            productId: line.productId,
            variantId: line.variantId,
            storefrontId: line.storefrontId
        });
        const stockRes = await stockService.resolveStock({
            productId: line.productId,
            variantId: line.variantId,
            storefrontId: line.storefrontId,
            requestedQuantity: line.quantity
        });
        let hasError = false;
        if (priceRes.status === 'PRICE_UNAVAILABLE' || !priceRes.price) {
            lineValidation.validationState = 'PRICE_MISMATCH';
            lineValidation.errors.push('PRICE_UNAVAILABLE');
            hasError = true;
            if (overallValidationState !== 'BLOCKED')
                overallValidationState = 'PRICE_MISMATCH';
        }
        else {
            lineValidation.unitPrice = priceRes.price.activeUnitPrice;
            lineValidation.lineTotal = lineValidation.unitPrice * line.quantity;
        }
        if (stockRes.status === 'STOCK_UNAVAILABLE' || stockRes.availability?.status === 'OUT_OF_STOCK') {
            lineValidation.validationState = 'STOCK_MISMATCH';
            lineValidation.errors.push('STOCK_UNAVAILABLE');
            lineValidation.stockStatus = 'OUT_OF_STOCK';
            hasError = true;
            if (overallValidationState !== 'BLOCKED')
                overallValidationState = 'STOCK_MISMATCH';
        }
        else if (stockRes.availability?.status === 'UNKNOWN') {
            lineValidation.warnings.push('STOCK_UNKNOWN');
            lineValidation.stockStatus = 'UNKNOWN';
        }
        else {
            lineValidation.stockStatus = stockRes.availability?.status;
        }
        if (!hasError) {
            lineValidation.validationState = 'VALID';
            subTotal += lineValidation.lineTotal || 0;
            totalQuantity += line.quantity;
        }
        else {
            overallState = 'BLOCKED';
        }
        checkoutLines.push(lineValidation);
    }
    if (overallValidationState !== 'VALID') {
        overallState = 'BLOCKED';
    }
    const summary = {
        totalQuantity,
        subTotal,
        grandTotal: subTotal,
        currency: 'TRY'
    };
    const response = {
        checkoutId,
        cartContext,
        state: overallState,
        validationState: overallValidationState,
        lines: checkoutLines,
        summary,
        errors: globalErrors,
        warnings: globalWarnings
    };
    await getRepository().save(response);
    return response;
}
