import { StockAvailability } from './stock';

export type CartActorType = 'GUEST' | 'CUSTOMER';

export interface CartContext {
  actorType: CartActorType;
  actorId: string; // guest sessionId or customer userId
}

export type CartErrorCode = 
  | 'CART_INVALID_PRODUCT'
  | 'CART_INVALID_VARIANT'
  | 'CART_INVALID_QUANTITY'
  | 'CART_LINE_NOT_FOUND'
  | 'CART_ADD_NOT_ALLOWED'
  | 'CART_STOCK_UNAVAILABLE'
  | 'CART_STOCK_UNKNOWN';

export interface CartLine {
  lineId: string;
  productId: string;
  variantId?: string;
  storefrontId: string;
  quantity: number;
  productName: string;
  productStatus: string;
  unitPrice?: number;
  lineTotal?: number;
  warnings: string[];
  stockAvailability?: StockAvailability;
}

export interface CartSummary {
  totalQuantity: number;
  subTotal?: number;
  // Shipping, discounts omitted for P09
}

export interface CartResponse {
  context: CartContext;
  lines: CartLine[];
  summary: CartSummary;
  errors?: { code: CartErrorCode; message: string }[];
}

export type CartProjectionStatus = 'available' | 'empty' | 'partial' | 'degraded' | 'unavailable' | 'timeout' | 'error';
export type CartLineProjectionStatus = 'available' | 'partial' | 'degraded' | 'unavailable';
export type CartCheckoutHandoffStatus = 'available_projection' | 'unavailable_projection' | 'degraded' | 'validation_required';

export interface CartContextProjection {
  cartId: string;
  actorType: CartActorType;
  actorLabel: string;
  contextTruth: false;
  warnings?: string[];
}

export interface CartMediaPreviewProjection {
  mediaId: string;
  url?: string;
  alt: string;
  status: 'available' | 'degraded' | 'unavailable';
  mediaTruth: false;
  warnings?: string[];
}

export interface CartLineItemProjection {
  lineId: string;
  productId: string;
  variantId?: string;
  storefrontId: string;
  title: string;
  creatorStoreText: string;
  quantityText: string;
  safePriceText: string;
  media: CartMediaPreviewProjection;
  status: CartLineProjectionStatus;
  warningText?: string;
  actionPlaceholderText: string;
  productTruth: false;
  priceTruth: false;
  stockTruth: false;
  availabilityTruth: false;
  purchaseEligibilityTruth: false;
  warnings?: string[];
}

export interface CartSummaryProjection {
  itemCountText: string;
  safeSubtotalText: string;
  couponPlaceholderText: string;
  summaryTruth: false;
  priceTruth: false;
  discountTruth: false;
  campaignTruth: false;
  warnings?: string[];
}

export interface CartCheckoutHandoffProjection {
  status: CartCheckoutHandoffStatus;
  ctaText: string;
  helperText: string;
  checkoutReadinessTruth: false;
  paymentOrderTruth: false;
  purchaseEligibilityTruth: false;
  warnings?: string[];
}

export interface CartSurfaceProjection {
  cartId: string;
  status: CartProjectionStatus;
  context: CartContextProjection;
  lines: CartLineItemProjection[];
  summary: CartSummaryProjection;
  checkoutHandoff: CartCheckoutHandoffProjection;
  boundaryFlags: {
    projectionTruth: false;
    priceTruth: false;
    stockTruth: false;
    availabilityTruth: false;
    checkoutReadinessTruth: false;
    paymentOrderTruth: false;
    couponCampaignTruth: false;
    purchaseEligibilityTruth: false;
  };
  warnings?: string[];
}

export interface AddToCartCommand {
  productId: string;
  variantId?: string;
  storefrontId: string;
  quantity: number;
}

export interface UpdateCartLineCommand {
  lineId: string;
  quantity: number;
}

export interface RemoveCartLineCommand {
  lineId: string;
}
