import type {
  CartLine,
  CartResponse,
  CartSurfaceProjection,
  PublicProjectionEnvelope,
  PublicProjectionTransport,
} from '@hx/contracts';
import { readBffProjectionState } from './read';

const guestCartSessionId = 'web-cart-projection-session';

type CartBffReadResponse = CartResponse | { status: number; data: CartResponse };

export async function readCartProjection(): Promise<PublicProjectionEnvelope<CartSurfaceProjection>> {
  const cart = await readBffProjectionState<CartBffReadResponse>('/cart', {
    headers: {
      'session-id': guestCartSessionId,
    },
  });

  const cartResponse = unwrapCartResponse(cart.data);

  if (!cartResponse) {
    return {
      transport: cart.transport,
    };
  }

  const data = mapCartProjection(cartResponse, cart.transport);

  return {
    data,
    transport: {
      ...cart.transport,
      status: data.status,
      warnings: compactStrings([...(cart.transport.warnings ?? []), ...(data.warnings ?? [])]),
    },
  };
}

function unwrapCartResponse(response?: CartBffReadResponse): CartResponse | undefined {
  if (!response) {
    return undefined;
  }

  if ('lines' in response && 'summary' in response) {
    return response;
  }

  return response.data;
}

function mapCartProjection(response: CartResponse, transport: PublicProjectionTransport): CartSurfaceProjection {
  const warnings = compactStrings([
    ...(response.errors?.map((error) => error.message) ?? []),
    ...(transport.warnings ?? []),
    ...response.lines.flatMap((line) => line.warnings ?? []),
  ]);
  const status = response.lines.length === 0 ? 'empty' : warnings.length ? 'degraded' : 'available';
  const cartId = `${response.context.actorType.toLowerCase()}-${response.context.actorId}`;

  return {
    cartId,
    status,
    context: {
      cartId,
      actorType: response.context.actorType,
      actorLabel: response.context.actorType === 'GUEST' ? 'Guest cart projection' : 'Customer cart projection',
      contextTruth: false,
      warnings,
    },
    lines: response.lines.map(mapLineProjection),
    summary: {
      itemCountText: `${response.summary.totalQuantity} item projection${response.summary.totalQuantity === 1 ? '' : 's'}`,
      safeSubtotalText:
        response.summary.subTotal === undefined
          ? 'Subtotal projection unavailable; final totals are confirmed by checkout owner validation.'
          : 'Owner-provided subtotal projection is present; final totals are not decided in the browser.',
      couponPlaceholderText: 'Coupon validation and campaign impact are checked by checkout or owner validation.',
      summaryTruth: false,
      priceTruth: false,
      discountTruth: false,
      campaignTruth: false,
      warnings,
    },
    checkoutHandoff: {
      status: warnings.length ? 'degraded' : response.lines.length ? 'validation_required' : 'unavailable_projection',
      ctaText: response.lines.length ? 'Continue to checkout validation' : 'Checkout waits for cart lines',
      helperText: response.lines.length
        ? 'Checkout readiness is not decided here. The next owner validates price, stock, coupons, and eligibility.'
        : 'Add items from storefront or search before checkout validation can begin.',
      checkoutReadinessTruth: false,
      paymentOrderTruth: false,
      purchaseEligibilityTruth: false,
      warnings,
    },
    boundaryFlags: {
      projectionTruth: false,
      priceTruth: false,
      stockTruth: false,
      availabilityTruth: false,
      checkoutReadinessTruth: false,
      paymentOrderTruth: false,
      couponCampaignTruth: false,
      purchaseEligibilityTruth: false,
    },
    warnings,
  };
}

function mapLineProjection(line: CartLine): CartSurfaceProjection['lines'][number] {
  const warnings = compactStrings([
    ...(line.warnings ?? []),
    line.stockAvailability?.warnings?.join(', '),
    line.productStatus !== 'ACTIVE' ? `Product status projection: ${line.productStatus}` : undefined,
  ]);

  return {
    lineId: line.lineId,
    productId: line.productId,
    variantId: line.variantId,
    storefrontId: line.storefrontId,
    title: line.productName,
    creatorStoreText: `Storefront projection: ${line.storefrontId}`,
    quantityText: `Quantity projection: ${line.quantity}`,
    safePriceText:
      line.lineTotal === undefined && line.unitPrice === undefined
        ? 'Price projection unavailable; checkout owner confirms final price.'
        : 'Price projection present; checkout owner confirms final price.',
    media: {
      mediaId: `${line.lineId}-media-placeholder`,
      alt: `${line.productName} cart media projection unavailable`,
      status: 'unavailable',
      mediaTruth: false,
      warnings: ['CART_LINE_MEDIA_PROJECTION_UNAVAILABLE'],
    },
    status: warnings.length ? 'degraded' : 'available',
    warningText: warnings[0],
    actionPlaceholderText: 'Update and remove actions will delegate to BFF cart commands.',
    productTruth: false,
    priceTruth: false,
    stockTruth: false,
    availabilityTruth: false,
    purchaseEligibilityTruth: false,
    warnings,
  };
}

function compactStrings(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}
