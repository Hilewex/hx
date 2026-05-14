import type {
  CartSurfaceProjection,
  CheckoutAddressSnapshot,
  CheckoutReviewResponse,
  CheckoutSurfaceProjection,
  CheckoutValidationState,
  PublicProjectionEnvelope,
} from '@hx/contracts';
import { readCartProjection } from './cart';

export async function readCheckoutProjection(): Promise<PublicProjectionEnvelope<CheckoutSurfaceProjection>> {
  const cart = await readCartProjection();

  if (!cart.data) {
    return {
      transport: cart.transport,
    };
  }

  const data = mapCartToCheckoutProjection(cart.data);

  return {
    data,
    transport: {
      ...cart.transport,
      status: data.status,
      warnings: compactStrings([...(cart.transport.warnings ?? []), ...(data.warnings ?? [])]),
    },
  };
}

export function mapCheckoutReviewProjection(response: CheckoutReviewResponse): CheckoutSurfaceProjection {
  const warnings = compactStrings([
    ...response.warnings,
    ...response.errors,
    ...response.lines.flatMap((line) => [...line.warnings, ...line.errors]),
  ]);
  const hasBlockingFeedback =
    response.validationState === 'BLOCKED' ||
    response.validationState === 'PRICE_MISMATCH' ||
    response.validationState === 'STOCK_MISMATCH' ||
    response.state === 'BLOCKED';
  const status = response.lines.length === 0 ? 'empty' : warnings.length || hasBlockingFeedback ? 'degraded' : 'available';
  const address = mapAddressProjection(response.addressSnapshot);
  const validationFeedback = [
    ...response.errors.map((message, index) => feedback(`checkout-error-${index}`, 'blocking', 'Checkout owner feedback', message)),
    ...response.warnings.map((message, index) => feedback(`checkout-warning-${index}`, 'warning', 'Checkout projection warning', message)),
    ...response.lines.flatMap((line) =>
      compactStrings([...line.warnings, ...line.errors]).map((message, index) =>
        feedback(`${line.lineId}-feedback-${index}`, line.errors.length ? 'blocking' : 'warning', line.validationState, message),
      ),
    ),
  ];

  return {
    checkoutId: response.checkoutId,
    status,
    context: {
      checkoutId: response.checkoutId,
      actorType: response.cartContext.actorType,
      actorLabel: response.cartContext.actorType === 'GUEST' ? 'Guest checkout projection' : 'Customer checkout projection',
      actorSurfaceKind: response.cartContext.actorType === 'GUEST' ? 'guest' : 'authenticated',
      checkoutStateText: `Owner checkout state projection: ${response.state}`,
      validationStateText: `Owner validation projection: ${response.validationState}`,
      contextTruth: false,
      checkoutValidationTruth: false,
      warnings,
    },
    cartSummary: {
      itemCountText: `${response.summary.totalQuantity} item projection${response.summary.totalQuantity === 1 ? '' : 's'}`,
      subtotalProjectionText: 'Owner subtotal projection is present; browser does not lock price.',
      payableTotalProjectionText: 'Payable total is owner projection only; payment/order owners confirm final handoff.',
      summaryTruth: false,
      priceTruth: false,
      discountTruth: false,
      shippingFeeTruth: false,
      warnings,
    },
    lines: response.lines.map((line) => ({
      lineId: line.lineId,
      productId: line.productId,
      variantId: line.variantId,
      title: `Product projection ${line.productId}`,
      quantityText: `Quantity projection: ${line.quantity}`,
      priceProjectionText: line.unitPrice === undefined ? 'Price projection unavailable.' : 'Owner price projection present; not locked in browser.',
      stockProjectionText: line.stockStatus ? `Stock projection: ${line.stockStatus}` : 'Stock projection waits for owner validation.',
      validationText: `Owner line validation projection: ${line.validationState}`,
      status: line.validationState === 'BLOCKED' ? 'blocked' : line.warnings.length || line.errors.length ? 'degraded' : 'available',
      priceTruth: false,
      stockTruth: false,
      availabilityTruth: false,
      purchaseEligibilityTruth: false,
      warnings: compactStrings([...line.warnings, ...line.errors]),
    })),
    address,
    shippingOptions: mapShippingOptions(address.status),
    validationFeedback:
      validationFeedback.length > 0
        ? validationFeedback
        : [feedback('checkout-owner-validation-required', 'info', 'Validation projection', 'Checkout validation feedback is provided by the owner projection.')],
    coupon: {
      status: response.discountSnapshots?.length ? 'owner_feedback' : 'not_applied',
      label: response.discountSnapshots?.length ? 'Coupon/campaign owner feedback present' : 'No coupon projection applied',
      helperText: 'Coupon validation and campaign impact are checked during checkout validation by the owner.',
      couponTruth: false,
      campaignTruth: false,
      discountTruth: false,
      warnings,
    },
    staleWarning: {
      isStale: warnings.length > 0,
      message: warnings[0],
      projectionTruth: false,
    },
    readiness: mapReadinessProjection(response.validationState, warnings),
    paymentHandoff: {
      ...mapReadinessProjection(response.validationState, warnings),
      paymentProviderTruth: false,
      orderTruth: false,
    },
    returnToCart: {
      href: '/cart',
      label: 'Return to cart',
      helperText: 'Use cart review when checkout projection is degraded, blocked, or missing required owner feedback.',
    },
    boundaryFlags: boundaryFlags(),
    warnings,
  };
}

function mapCartToCheckoutProjection(cart: CartSurfaceProjection): CheckoutSurfaceProjection {
  const warnings = cart.warnings ?? [];
  const isEmpty = cart.lines.length === 0;
  const status = isEmpty ? 'empty' : warnings.length || cart.status === 'degraded' ? 'degraded' : 'partial';
  const address = mapAddressProjection();

  return {
    status,
    context: {
      actorType: cart.context.actorType,
      actorLabel: cart.context.actorType === 'GUEST' ? 'Guest checkout foundation' : 'Customer checkout foundation',
      actorSurfaceKind: cart.context.actorType === 'GUEST' ? 'guest' : 'authenticated',
      checkoutStateText: 'Checkout review projection is composed from cart projection until owner review is available.',
      validationStateText: isEmpty ? 'Owner validation projection unavailable for empty cart.' : 'Owner validation is required before payment handoff.',
      contextTruth: false,
      checkoutValidationTruth: false,
      warnings,
    },
    cartSummary: {
      itemCountText: cart.summary.itemCountText,
      subtotalProjectionText: cart.summary.safeSubtotalText,
      payableTotalProjectionText: 'Final payable total is not calculated by this browser surface.',
      summaryTruth: false,
      priceTruth: false,
      discountTruth: false,
      shippingFeeTruth: false,
      warnings,
    },
    lines: cart.lines.map((line) => ({
      lineId: line.lineId,
      productId: line.productId,
      variantId: line.variantId,
      title: line.title,
      quantityText: line.quantityText,
      priceProjectionText: line.safePriceText,
      stockProjectionText: line.warningText?.includes('STOCK') ? line.warningText : 'Stock validation waits for owner projection.',
      validationText: line.warningText ?? 'Checkout line validation has not been finalized by the owner.',
      status: line.status === 'degraded' ? 'degraded' : 'available',
      priceTruth: false,
      stockTruth: false,
      availabilityTruth: false,
      purchaseEligibilityTruth: false,
      warnings: line.warnings,
    })),
    address,
    shippingOptions: mapShippingOptions(address.status),
    validationFeedback: buildCartValidationFeedback(cart),
    coupon: {
      status: warnings.length ? 'degraded' : 'not_applied',
      label: 'Coupon projection',
      helperText: cart.summary.couponPlaceholderText,
      couponTruth: false,
      campaignTruth: false,
      discountTruth: false,
      warnings,
    },
    staleWarning: {
      isStale: warnings.length > 0 || cart.status === 'degraded',
      message: warnings[0],
      projectionTruth: false,
    },
    readiness: {
      status: isEmpty ? 'unavailable' : warnings.length ? 'degraded' : 'owner_review_required',
      ctaText: isEmpty ? 'Payment waits for cart lines' : 'Continue after owner validation',
      helperText: isEmpty
        ? 'Checkout is empty; the browser does not create purchase eligibility.'
        : 'Payment handoff waits for checkout owner validation and readiness projection.',
      checkoutReadinessTruth: false,
      paymentOrderTruth: false,
      purchaseEligibilityTruth: false,
      warnings,
    },
    paymentHandoff: {
      status: isEmpty ? 'unavailable' : warnings.length ? 'degraded' : 'owner_review_required',
      ctaText: isEmpty ? 'Payment unavailable' : 'Proceed to payment placeholder',
      helperText: 'This CTA is a handoff placeholder; payment readiness is not decided by the UI.',
      checkoutReadinessTruth: false,
      paymentOrderTruth: false,
      purchaseEligibilityTruth: false,
      paymentProviderTruth: false,
      orderTruth: false,
      warnings,
    },
    returnToCart: {
      href: '/cart',
      label: isEmpty ? 'Return to cart' : 'Review cart',
      helperText: 'Cart remains the return path for degraded checkout projection or missing owner feedback.',
    },
    boundaryFlags: boundaryFlags(),
    warnings,
  };
}

function mapAddressProjection(address?: CheckoutAddressSnapshot): CheckoutSurfaceProjection['address'] {
  if (!address) {
    return {
      status: 'guest_placeholder',
      title: 'Address selection',
      detailText: 'No selected address projection returned yet.',
      helperText: 'Saved and guest address eligibility are validated outside this browser surface.',
      addressTruth: false,
      shippingEligibilityTruth: false,
      warnings: ['CHECKOUT_ADDRESS_PROJECTION_PLACEHOLDER'],
    };
  }

  return {
    status: 'selected',
    title: address.kind === 'GUEST_ADDRESS' ? 'Guest address projection' : 'Saved address projection',
    detailText: compactStrings([address.recipientName, address.city, address.district, address.country]).join(', ') || 'Address preview projection present.',
    helperText: 'Address validation and shipping eligibility remain owner responsibilities.',
    addressTruth: false,
    shippingEligibilityTruth: false,
  };
}

function mapShippingOptions(addressStatus: CheckoutSurfaceProjection['address']['status']): CheckoutSurfaceProjection['shippingOptions'] {
  return [
    {
      optionId: 'owner-shipping-projection',
      status: addressStatus === 'selected' ? 'available_projection' : 'missing_address',
      label: addressStatus === 'selected' ? 'Shipping option projection' : 'Shipping waits for address projection',
      estimatedDeliveryText: 'Estimated delivery text is owner projection only; no delivery guarantee is made here.',
      feeProjectionText: 'Shipping fee is not calculated in the browser.',
      selected: addressStatus === 'selected',
      shippingFeeTruth: false,
      logisticsTruth: false,
      warnings: addressStatus === 'selected' ? [] : ['CHECKOUT_SHIPPING_ADDRESS_REQUIRED_PROJECTION'],
    },
  ];
}

function mapReadinessProjection(
  validationState: CheckoutValidationState,
  warnings: string[],
): CheckoutSurfaceProjection['readiness'] {
  const blocked = validationState === 'BLOCKED' || validationState === 'PRICE_MISMATCH' || validationState === 'STOCK_MISMATCH';
  return {
    status: blocked ? 'blocked_by_projection' : validationState === 'VALID' ? 'handoff_projection_present' : warnings.length ? 'degraded' : 'owner_review_required',
    ctaText: validationState === 'VALID' ? 'Proceed to payment placeholder' : 'Resolve owner feedback first',
    helperText:
      validationState === 'VALID'
        ? 'Owner validation projection is valid; payment owner still controls payment initiation and order outcome.'
        : 'Checkout readiness is owner-provided and is not inferred by this UI.',
    checkoutReadinessTruth: false,
    paymentOrderTruth: false,
    purchaseEligibilityTruth: false,
    warnings,
  };
}

function buildCartValidationFeedback(cart: CartSurfaceProjection): CheckoutSurfaceProjection['validationFeedback'] {
  const warnings = compactStrings([...(cart.warnings ?? []), ...cart.lines.flatMap((line) => line.warnings ?? [])]);

  if (cart.lines.length === 0) {
    return [
      feedback('checkout-empty-cart', 'blocking', 'Empty checkout', 'No cart line projection is available for checkout review.'),
    ];
  }

  if (warnings.length === 0) {
    return [
      feedback('checkout-validation-required', 'info', 'Owner validation required', 'Price, stock, coupon, shipping, and purchase eligibility validation are not owned by the browser.'),
    ];
  }

  return warnings.map((message, index) => feedback(`checkout-warning-${index}`, 'warning', 'Owner projection warning', message));
}

function feedback(
  feedbackId: string,
  severity: CheckoutSurfaceProjection['validationFeedback'][number]['severity'],
  title: string,
  message: string,
): CheckoutSurfaceProjection['validationFeedback'][number] {
  return {
    feedbackId,
    severity,
    title,
    message,
    checkoutValidationTruth: false,
    priceTruth: false,
    stockTruth: false,
    couponCampaignTruth: false,
  };
}

function boundaryFlags(): CheckoutSurfaceProjection['boundaryFlags'] {
  return {
    projectionTruth: false,
    priceTruth: false,
    stockTruth: false,
    availabilityTruth: false,
    couponTruth: false,
    shippingFeeTruth: false,
    checkoutValidationTruth: false,
    checkoutReadinessTruth: false,
    paymentOrderTruth: false,
    purchaseEligibilityTruth: false,
  };
}

function compactStrings(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}
