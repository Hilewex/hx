import type { CheckoutDiscountInput, CheckoutDiscountSnapshot } from './coupon';

export type CheckoutState = 
  | 'STARTED'
  | 'VALIDATING'
  | 'REVIEW_READY'
  | 'BLOCKED'
  | 'ABANDONED';

export type CheckoutValidationState =
  | 'PENDING'
  | 'VALID'
  | 'PRICE_MISMATCH'
  | 'STOCK_MISMATCH'
  | 'BLOCKED';

export interface CheckoutLineValidation {
  lineId: string;
  productId: string;
  variantId?: string;
  storefrontId: string;
  commercialPoolProductId?: string;
  creatorStoreProductId?: string;
  creatorStoreId?: string;
  supplierId?: string;
  supplierSubmittedProductId?: string;
  supplierVariantId?: string;
  poolBasePriceAmount?: number;
  creatorSelectedPriceAmount?: number;
  platformMarginAmount?: number;
  creatorMarginAmount?: number;
  supplierBaseAmount?: number;
  quantity: number;
  unitPrice?: number;
  lineTotal?: number;
  stockStatus?: string;
  validationState: CheckoutValidationState;
  warnings: string[];
  errors: string[];
}

export interface CheckoutSummary {
  totalQuantity: number;
  subTotal: number;
  shippingTotal?: number;
  discountTotal?: number;
  grandTotal: number;
  currency: string;
}


export interface CheckoutAddressSnapshot {
  kind: 'REGISTERED_ADDRESS' | 'GUEST_ADDRESS';
  addressId?: string;
  recipientName?: string;
  phone?: string;
  city?: string;
  district?: string;
  addressLine?: string;
  country?: string;
  postalCode?: string;
}

export interface StartCheckoutCommand {
  cartContext: {
    actorType: 'GUEST' | 'CUSTOMER';
    actorId: string;
  };
  addressSnapshot?: CheckoutAddressSnapshot;
  couponCode?: string;
  campaignId?: string;
  discountInputs?: CheckoutDiscountInput[];
}

export interface CheckoutReviewResponse {
  checkoutId: string;
  cartContext: {
    actorType: 'GUEST' | 'CUSTOMER';
    actorId: string;
  };
  state: CheckoutState;
  validationState: CheckoutValidationState;
  lines: CheckoutLineValidation[];
  summary: CheckoutSummary;
  errors: string[];
  warnings: string[];
  addressSnapshot?: CheckoutAddressSnapshot;
  discountSnapshots?: CheckoutDiscountSnapshot[];
}

export type CheckoutProjectionStatus =
  | 'available'
  | 'empty'
  | 'partial'
  | 'degraded'
  | 'unavailable'
  | 'timeout'
  | 'error';

export type CheckoutActorSurfaceKind = 'guest' | 'authenticated' | 'unknown';

export type CheckoutAddressProjectionStatus =
  | 'selected'
  | 'guest_placeholder'
  | 'missing'
  | 'degraded'
  | 'unavailable';

export type CheckoutShippingProjectionStatus =
  | 'available_projection'
  | 'missing_address'
  | 'degraded'
  | 'unavailable';

export type CheckoutValidationFeedbackSeverity = 'info' | 'warning' | 'blocking';

export type CheckoutPaymentHandoffStatus =
  | 'owner_review_required'
  | 'handoff_projection_present'
  | 'blocked_by_projection'
  | 'degraded'
  | 'unavailable';

export interface CheckoutContextProjection {
  checkoutId?: string;
  actorType: 'GUEST' | 'CUSTOMER' | 'UNKNOWN';
  actorLabel: string;
  actorSurfaceKind: CheckoutActorSurfaceKind;
  checkoutStateText: string;
  validationStateText: string;
  contextTruth: false;
  checkoutValidationTruth: false;
  warnings?: string[];
}

export interface CheckoutCartSummaryProjection {
  itemCountText: string;
  subtotalProjectionText: string;
  payableTotalProjectionText: string;
  summaryTruth: false;
  priceTruth: false;
  discountTruth: false;
  shippingFeeTruth: false;
  warnings?: string[];
}

export interface CheckoutLineItemReviewProjection {
  lineId: string;
  productId: string;
  variantId?: string;
  title: string;
  quantityText: string;
  priceProjectionText: string;
  stockProjectionText: string;
  validationText: string;
  status: 'available' | 'degraded' | 'blocked' | 'unavailable';
  priceTruth: false;
  stockTruth: false;
  availabilityTruth: false;
  purchaseEligibilityTruth: false;
  warnings?: string[];
}

export interface CheckoutAddressPreviewProjection {
  status: CheckoutAddressProjectionStatus;
  title: string;
  detailText: string;
  helperText: string;
  addressTruth: false;
  shippingEligibilityTruth: false;
  warnings?: string[];
}

export interface CheckoutShippingOptionProjection {
  optionId: string;
  status: CheckoutShippingProjectionStatus;
  label: string;
  estimatedDeliveryText: string;
  feeProjectionText: string;
  selected: boolean;
  shippingFeeTruth: false;
  logisticsTruth: false;
  warnings?: string[];
}

export interface CheckoutValidationFeedbackProjection {
  feedbackId: string;
  severity: CheckoutValidationFeedbackSeverity;
  title: string;
  message: string;
  checkoutValidationTruth: false;
  priceTruth: false;
  stockTruth: false;
  couponCampaignTruth: false;
}

export interface CheckoutCouponProjection {
  status: 'not_applied' | 'owner_feedback' | 'degraded' | 'unavailable';
  label: string;
  helperText: string;
  couponTruth: false;
  campaignTruth: false;
  discountTruth: false;
  warnings?: string[];
}

export interface CheckoutStaleWarningProjection {
  isStale: boolean;
  message?: string;
  projectionTruth: false;
}

export interface CheckoutReadinessProjection {
  status: CheckoutPaymentHandoffStatus;
  ctaText: string;
  helperText: string;
  checkoutReadinessTruth: false;
  paymentOrderTruth: false;
  purchaseEligibilityTruth: false;
  warnings?: string[];
}

export interface CheckoutPaymentHandoffProjection extends CheckoutReadinessProjection {
  paymentProviderTruth: false;
  orderTruth: false;
}

export interface CheckoutSurfaceProjection {
  checkoutId?: string;
  status: CheckoutProjectionStatus;
  context: CheckoutContextProjection;
  cartSummary: CheckoutCartSummaryProjection;
  lines: CheckoutLineItemReviewProjection[];
  address: CheckoutAddressPreviewProjection;
  shippingOptions: CheckoutShippingOptionProjection[];
  validationFeedback: CheckoutValidationFeedbackProjection[];
  coupon: CheckoutCouponProjection;
  staleWarning: CheckoutStaleWarningProjection;
  readiness: CheckoutReadinessProjection;
  paymentHandoff: CheckoutPaymentHandoffProjection;
  returnToCart: {
    href: '/cart';
    label: string;
    helperText: string;
  };
  boundaryFlags: {
    projectionTruth: false;
    priceTruth: false;
    stockTruth: false;
    availabilityTruth: false;
    couponTruth: false;
    shippingFeeTruth: false;
    checkoutValidationTruth: false;
    checkoutReadinessTruth: false;
    paymentOrderTruth: false;
    purchaseEligibilityTruth: false;
  };
  warnings?: string[];
}
