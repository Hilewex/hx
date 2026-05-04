import {
  StartCheckoutCommand, 
  CheckoutReviewResponse, 
  CheckoutState, 
  CheckoutValidationState,
  CheckoutLineValidation,
  CheckoutSummary
} from '@hx/contracts';
import { getCart, getCheckoutRepository } from '@hx/commerce';
import type { ICheckoutRepository } from '@hx/commerce';
import { resolvePrice } from '@hx/pricing';
import { StockService } from '@hx/stock';
import { createInternalRiskSignal } from '@hx/risk';
import { randomUUID } from 'node:crypto';

const stockService = new StockService();
const GUEST_CHECKOUT_WINDOW_MS = 60_000;
const GUEST_CHECKOUT_SIGNAL_THRESHOLD = 3;
const guestCheckoutAttempts = new Map<string, number[]>();

let repository: ICheckoutRepository | undefined;

function getRepository(): ICheckoutRepository {
  return repository || getCheckoutRepository();
}

// For testing purposes
export function resetRepository(mockRepo?: ICheckoutRepository) {
  repository = mockRepo;
}

export async function getCheckoutReview(checkoutId: string): Promise<CheckoutReviewResponse | undefined> {
  return await getRepository().getById(checkoutId);
}

export async function startCheckout(command: StartCheckoutCommand): Promise<CheckoutReviewResponse> {
  const { cartContext } = command;
  const cartRes = await getCart(cartContext);
  const cartData = cartRes.data;

  if (cartContext.actorType === 'GUEST') {
    const now = Date.now();
    const recentAttempts = (guestCheckoutAttempts.get(cartContext.actorId) || [])
      .filter((createdAt) => now - createdAt <= GUEST_CHECKOUT_WINDOW_MS);
    recentAttempts.push(now);
    guestCheckoutAttempts.set(cartContext.actorId, recentAttempts);

    if (recentAttempts.length >= GUEST_CHECKOUT_SIGNAL_THRESHOLD) {
      await createInternalRiskSignal({
        targetId: cartContext.actorId,
        targetType: 'ACCOUNT',
        type: 'ACCOUNT_VELOCITY',
        level: 'MEDIUM',
        source: 'SYSTEM_RULE',
        reasonCode: 'SUSPICIOUS_VELOCITY',
        metadata: {
          actorId: cartContext.actorId,
          actorType: 'GUEST',
          reason: 'GUEST_CHECKOUT_RATE_PATTERN',
          attemptCount: recentAttempts.length,
          windowMs: GUEST_CHECKOUT_WINDOW_MS,
          checkoutTruthMutated: false,
        },
        correlationId: randomUUID(),
      });
    }
  }

  const checkoutId = randomUUID();

  if (!cartData.lines || cartData.lines.length === 0) {
    const response: CheckoutReviewResponse = {
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

  let overallValidationState: CheckoutValidationState = 'VALID';
  let overallState: CheckoutState = 'REVIEW_READY';
  const checkoutLines: CheckoutLineValidation[] = [];
  let subTotal = 0;
  let totalQuantity = 0;
  const globalErrors: string[] = [];
  const globalWarnings: string[] = [];

  for (const line of cartData.lines) {
    const lineValidation: CheckoutLineValidation = {
      lineId: line.lineId,
      productId: line.productId,
      variantId: line.variantId,
      storefrontId: line.storefrontId,
      quantity: line.quantity,
      validationState: 'PENDING',
      warnings: [],
      errors: []
    };

    const priceRes = await resolvePrice({
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
      if (overallValidationState as CheckoutValidationState !== 'BLOCKED') overallValidationState = 'PRICE_MISMATCH';
    } else {
      lineValidation.unitPrice = priceRes.price.activeUnitPrice;
      lineValidation.lineTotal = lineValidation.unitPrice * line.quantity;
    }

    if (stockRes.status === 'STOCK_UNAVAILABLE' || stockRes.availability?.status === 'OUT_OF_STOCK') {
      lineValidation.validationState = 'STOCK_MISMATCH';
      lineValidation.errors.push('STOCK_UNAVAILABLE');
      lineValidation.stockStatus = 'OUT_OF_STOCK';
      hasError = true;
      if (overallValidationState as CheckoutValidationState !== 'BLOCKED') overallValidationState = 'STOCK_MISMATCH';
    } else if (stockRes.availability?.status === 'UNKNOWN') {
      lineValidation.warnings.push('STOCK_UNKNOWN');
      lineValidation.stockStatus = 'UNKNOWN';
    } else {
      lineValidation.stockStatus = stockRes.availability?.status;
    }

    if (!hasError) {
      lineValidation.validationState = 'VALID';
      subTotal += lineValidation.lineTotal || 0;
      totalQuantity += line.quantity;
    } else {
      overallState = 'BLOCKED';
    }

    checkoutLines.push(lineValidation);
  }

  if (overallValidationState !== 'VALID') {
    overallState = 'BLOCKED';
  }

  const summary: CheckoutSummary = {
    totalQuantity,
    subTotal,
    grandTotal: subTotal,
    currency: 'TRY'
  };

  const response: CheckoutReviewResponse = {
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
