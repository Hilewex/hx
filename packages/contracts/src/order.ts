import { CheckoutSummary } from './checkout';
import type { CheckoutDiscountSourceType, DiscountSponsorType } from './coupon';

export type OrderState = 'CREATED' | 'CONFIRMED' | 'CREATE_FAILED';

export type OrderFulfillmentState = 'NOT_STARTED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
export type OrderPaymentState = 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';

export type OrderLineEconomicsSnapshotStatus = 'COMPLETE' | 'DEGRADED';

export type OrderLineEconomicsPriceSource =
  | 'CHECKOUT_LINE'
  | 'POOL_BASE_PRICE_SNAPSHOT'
  | 'FOUNDATION_SIMULATED'
  | 'UNKNOWN';

export interface OrderLineDiscountAllocationRef {
  allocationId: string;
  discountSnapshotId: string;
  discountCode?: string;
  discountKind: CheckoutDiscountSourceType;
  sponsorType?: DiscountSponsorType;
  sponsorId?: string;
  allocatedAmount: number;
  currency: string;
}

export interface OrderLineCouponSnapshotRef {
  discountSnapshotId?: string;
  sourceType: CheckoutDiscountSourceType;
  code: string;
  discountAmount: number;
  sponsorType?: DiscountSponsorType;
  sponsorId?: string;
}

export interface OrderLineEconomicsSnapshot {
  commercialPoolProductId?: string;
  creatorStoreProductId?: string;
  creatorStoreId?: string;
  supplierId?: string;
  supplierSubmittedProductId?: string;
  supplierVariantId?: string;
  poolBasePriceAmount?: number;
  creatorSelectedPriceAmount?: number;
  unitPriceSnapshot: number;
  lineTotalSnapshot: number;
  platformMarginAmount?: number;
  creatorMarginAmount?: number;
  supplierBaseAmount?: number;
  discountAllocationRefs: OrderLineDiscountAllocationRef[];
  couponSnapshotRefs: OrderLineCouponSnapshotRef[];
  priceSource: OrderLineEconomicsPriceSource;
  economicsSnapshotCreatedAt: string;
  status: OrderLineEconomicsSnapshotStatus;
  unknownFields: string[];
  warnings: string[];
  boundaryFlags: {
    economicsSnapshotOnly: true;
    settlementCreated: false;
    payoutCreated: false;
    ledgerEntryCreated: false;
    payableCreated: false;
  };
}

export interface OrderLine {
  orderLineId: string;
  productId: string;
  variantId?: string;
  storefrontId: string;
  quantity: number;
  productNameSnapshot: string;
  unitPriceSnapshot: number;
  lineTotalSnapshot: number;
  economicsSnapshot?: OrderLineEconomicsSnapshot;
}

export interface OrderSummary extends CheckoutSummary {}

export interface CreateOrderCommand {
  customerId?: string;
  paymentId: string;
  paymentAttemptId: string;
  checkoutId: string;
  idempotencyKey?: string;
}

export interface OrderResponse {
  orderId: string;
  orderNumber: string;
  customerId?: string;
  checkoutId: string;
  paymentId: string;
  paymentAttemptId: string;
  state: OrderState;
  lines: OrderLine[];
  summary: OrderSummary;
  errors: string[];
  warnings: string[];
}

export interface OrderDetailResponse extends OrderResponse {
  paymentSummary: {
    state: OrderPaymentState;
    method: string;
  };
  fulfillmentStateSummary: OrderFulfillmentState;
  shipmentStateSummary: 'NOT_AVAILABLE';
  actions: {
    canCancel: boolean;
    canReturn: boolean;
  };
}

export type OrderSurfaceStatus =
  | 'lookup_required'
  | 'payment_pending'
  | 'payment_succeeded_order_pending'
  | 'order_processing'
  | 'preparing_shipment'
  | 'shipped'
  | 'delivery_attempt'
  | 'delivered'
  | 'support_required'
  | 'degraded'
  | 'unavailable'
  | 'timeout'
  | 'error';

export type OrderTimelineStepStatus = 'complete_projection' | 'current_projection' | 'pending_projection' | 'degraded_projection';

export interface OrderReferenceProjection {
  orderId?: string;
  orderNumber?: string;
  checkoutId?: string;
  paymentId?: string;
  paymentAttemptId?: string;
  label: string;
  helperText: string;
  orderCreatedTruth: false;
  paymentSuccessTruth: false;
  warnings?: string[];
}

export interface OrderPaymentSummaryProjection {
  status: 'pending' | 'succeeded_projection' | 'failed_projection' | 'unknown' | 'unavailable';
  label: string;
  helperText: string;
  paymentSuccessTruth: false;
  paymentFinalityTruth: false;
  orderCreatedTruth: false;
  refundTruth: false;
  settlementTruth: false;
  warnings?: string[];
}

export interface OrderStateProjection {
  status: 'lookup_required' | 'pending' | 'processing' | 'partial' | 'unavailable' | 'degraded';
  label: string;
  helperText: string;
  orderCreatedTruth: false;
  orderFinalityTruth: false;
  fulfillmentTruth: false;
  warnings?: string[];
}

export interface OrderShipmentProjection {
  status: 'unavailable' | 'pending' | 'preparing' | 'shipped_projection' | 'delivery_attempt_projection' | 'degraded';
  label: string;
  carrierText: string;
  trackingText: string;
  estimatedDeliveryText: string;
  shipmentTruth: false;
  logisticsProviderTruth: false;
  rawProviderPayloadExposed: false;
  warnings?: string[];
}

export interface OrderDeliveryProjection {
  status: 'unknown' | 'in_progress_projection' | 'attempt_projection' | 'delivered_projection' | 'degraded';
  label: string;
  helperText: string;
  deliveryTruth: false;
  guaranteedDeliveryTruth: false;
  warnings?: string[];
}

export interface OrderSupportGuidanceProjection {
  href: '/support';
  label: string;
  referenceText: string;
  paymentReferenceText: string;
  helperText: string;
  ticketCreationTruth: false;
}

export interface OrderTimelineStepProjection {
  stepId: string;
  title: string;
  description: string;
  status: OrderTimelineStepStatus;
  ariaText: string;
  paymentTruth: false;
  orderTruth: false;
  shipmentTruth: false;
  deliveryTruth: false;
}

export interface OrderItemPreviewProjection {
  lineId: string;
  productId?: string;
  variantId?: string;
  storefrontId?: string;
  title: string;
  quantityText: string;
  creatorStoreText: string;
  mediaAltText: string;
  summaryText: string;
  refundTruth: false;
  settlementTruth: false;
  warnings?: string[];
}

export interface OrderGuestLookupProjection {
  status: 'available_placeholder' | 'degraded' | 'unavailable';
  title: string;
  helperText: string;
  emailPlaceholder: string;
  referencePlaceholder: string;
  authVerificationTruth: false;
  orderLookupTruth: false;
  warnings?: string[];
}

export interface OrderSurfaceProjection {
  status: OrderSurfaceStatus;
  reference: OrderReferenceProjection;
  payment: OrderPaymentSummaryProjection;
  orderState: OrderStateProjection;
  shipment: OrderShipmentProjection;
  delivery: OrderDeliveryProjection;
  supportGuidance: OrderSupportGuidanceProjection;
  timeline: OrderTimelineStepProjection[];
  items: OrderItemPreviewProjection[];
  guestLookup?: OrderGuestLookupProjection;
  navigation: {
    continueBrowsing: {
      href: '/';
      label: string;
    };
    goToOrders: {
      href: '/orders';
      label: string;
    };
    contactSupport: {
      href: '/support';
      label: string;
    };
  };
  boundaryFlags: {
    projectionTruth: false;
    queryCacheTruth: false;
    paymentSuccessTruth: false;
    paymentFinalityTruth: false;
    orderCreatedTruth: false;
    orderFinalityTruth: false;
    fulfillmentTruth: false;
    shipmentTruth: false;
    deliveryTruth: false;
    refundTruth: false;
    settlementTruth: false;
    payoutTruth: false;
    logisticsProviderTruth: false;
    rawLogisticsPayloadExposed: false;
    supportTicketTruth: false;
  };
  warnings?: string[];
}
