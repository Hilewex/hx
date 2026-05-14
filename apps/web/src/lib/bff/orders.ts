import type {
  OrderSurfaceProjection,
  OrderSurfaceStatus,
  OrderTimelineStepProjection,
  PublicProjectionEnvelope,
} from '@hx/contracts';
import { readBffProjectionState } from './read';

export interface OrderProjectionReadInput {
  orderId?: string;
  orderRef?: string;
  checkoutId?: string;
  paymentId?: string;
  paymentAttemptId?: string;
  state?: string;
  paymentState?: string;
  shipmentState?: string;
}

export async function readOrderProjection(
  input: OrderProjectionReadInput,
): Promise<PublicProjectionEnvelope<OrderSurfaceProjection>> {
  if (!input.orderId && !input.orderRef && !input.paymentId && !input.paymentAttemptId && !input.checkoutId) {
    const data = createOrderSurfaceProjection({
      ...input,
      status: 'lookup_required',
      warnings: ['ORDER_LOOKUP_CONTEXT_MISSING'],
    });

    return {
      data,
      transport: {
        status: 'empty',
        retryable: false,
        warnings: data.warnings,
      },
    };
  }

  const params = new URLSearchParams();
  if (input.orderId) params.set('orderId', input.orderId);
  if (input.orderRef) params.set('orderRef', input.orderRef);
  if (input.checkoutId) params.set('checkoutId', input.checkoutId);
  if (input.paymentId) params.set('paymentId', input.paymentId);
  if (input.paymentAttemptId) params.set('paymentAttemptId', input.paymentAttemptId);

  const ownerProjection = await readBffProjectionState<OrderSurfaceProjection>(
    `/order/projection${params.size ? `?${params.toString()}` : ''}`,
  );

  if (ownerProjection.data) {
    return ownerProjection;
  }

  const status = normalizeOrderStatus(input, ownerProjection.transport.status);
  const data = createOrderSurfaceProjection({
    ...input,
    status,
    warnings: compactStrings([
      ...(ownerProjection.transport.warnings ?? []),
      ownerProjection.transport.error?.message,
      'ORDER_OWNER_READ_ENDPOINT_UNAVAILABLE_SAFE_PLACEHOLDER',
    ]),
  });

  return {
    data,
    transport: {
      ...ownerProjection.transport,
      status: data.status === 'timeout' ? 'timeout' : data.status === 'unavailable' ? 'unavailable' : 'degraded',
      warnings: data.warnings,
      retryable: true,
    },
  };
}

function normalizeOrderStatus(input: OrderProjectionReadInput, transportStatus: string): OrderSurfaceStatus {
  if (transportStatus === 'timeout') {
    return 'timeout';
  }

  if (input.shipmentState === 'degraded' || input.state === 'degraded') {
    return 'degraded';
  }

  switch (input.state) {
    case 'payment-pending':
      return 'payment_pending';
    case 'payment-succeeded-order-pending':
    case 'payment_succeeded_order_pending':
      return 'payment_succeeded_order_pending';
    case 'order-processing':
    case 'order_processing':
      return 'order_processing';
    case 'preparing-shipment':
    case 'preparing_shipment':
      return 'preparing_shipment';
    case 'shipped':
      return 'shipped';
    case 'delivery-attempt':
    case 'delivery_attempt':
      return 'delivery_attempt';
    case 'delivered':
      return 'delivered';
    case 'support-required':
    case 'support_required':
      return 'support_required';
    case 'unavailable':
      return 'unavailable';
    case 'error':
      return 'error';
    default:
      return input.paymentState === 'succeeded' ? 'payment_succeeded_order_pending' : 'order_processing';
  }
}

function createOrderSurfaceProjection(input: OrderProjectionReadInput & { status: OrderSurfaceStatus; warnings?: string[] }): OrderSurfaceProjection {
  const referenceText = input.orderRef ?? input.orderId ?? input.checkoutId ?? input.paymentId ?? 'Order reference unavailable';
  const paymentStatus = mapPaymentStatus(input.status, input.paymentState);
  const shipment = mapShipment(input.status, input.shipmentState, input.warnings);
  const delivery = mapDelivery(input.status, input.warnings);
  const items = createItemPreviews(input.warnings);

  return {
    status: input.status,
    reference: {
      orderId: input.orderId,
      orderNumber: input.orderRef,
      checkoutId: input.checkoutId,
      paymentId: input.paymentId,
      paymentAttemptId: input.paymentAttemptId,
      label: referenceText,
      helperText:
        input.status === 'lookup_required'
          ? 'Enter an owner-provided reference to read an order projection.'
          : 'This is a read projection reference. It does not prove order creation by itself.',
      orderCreatedTruth: false,
      paymentSuccessTruth: false,
      warnings: input.warnings,
    },
    payment: paymentStatus,
    orderState: mapOrderState(input.status, input.warnings),
    shipment,
    delivery,
    supportGuidance: {
      href: '/support',
      label: 'Contact support',
      referenceText,
      paymentReferenceText: input.paymentAttemptId ?? input.paymentId ?? 'Payment reference unavailable',
      helperText: supportHelper(input.status),
      ticketCreationTruth: false,
    },
    timeline: createTimeline(input.status),
    items,
    guestLookup: {
      status: input.status === 'lookup_required' ? 'available_placeholder' : input.status === 'degraded' ? 'degraded' : 'unavailable',
      title: 'Guest order lookup',
      helperText: 'Lookup UI is a foundation only. Authentication and verification remain outside this browser surface.',
      emailPlaceholder: 'Email used at checkout',
      referencePlaceholder: 'Order or payment reference',
      authVerificationTruth: false,
      orderLookupTruth: false,
      warnings: input.warnings,
    },
    navigation: {
      continueBrowsing: {
        href: '/',
        label: 'Continue browsing',
      },
      goToOrders: {
        href: '/orders',
        label: 'Go to orders',
      },
      contactSupport: {
        href: '/support',
        label: 'Contact support',
      },
    },
    boundaryFlags: {
      projectionTruth: false,
      queryCacheTruth: false,
      paymentSuccessTruth: false,
      paymentFinalityTruth: false,
      orderCreatedTruth: false,
      orderFinalityTruth: false,
      fulfillmentTruth: false,
      shipmentTruth: false,
      deliveryTruth: false,
      refundTruth: false,
      settlementTruth: false,
      payoutTruth: false,
      logisticsProviderTruth: false,
      rawLogisticsPayloadExposed: false,
      supportTicketTruth: false,
    },
    warnings: input.warnings,
  };
}

function mapPaymentStatus(
  status: OrderSurfaceStatus,
  paymentState?: string,
): OrderSurfaceProjection['payment'] {
  if (status === 'payment_pending' || paymentState === 'pending') {
    return payment('pending', 'Payment pending', 'Payment owner has not projected a final successful payment result.');
  }

  if (status === 'payment_succeeded_order_pending' || paymentState === 'succeeded') {
    return payment('succeeded_projection', 'Payment received projection', 'Payment success projection is separate from order creation and fulfillment.');
  }

  if (paymentState === 'failed') {
    return payment('failed_projection', 'Payment failed projection', 'Order creation must not be inferred from a failed payment projection.');
  }

  if (status === 'lookup_required' || status === 'unavailable' || status === 'timeout' || status === 'error') {
    return payment('unavailable', 'Payment projection unavailable', 'Payment state waits for owner projection.');
  }

  return payment('succeeded_projection', 'Payment confirmed projection', 'Payment is shown as projection only; order and shipment states remain separate.');
}

function payment(
  status: OrderSurfaceProjection['payment']['status'],
  label: string,
  helperText: string,
): OrderSurfaceProjection['payment'] {
  return {
    status,
    label,
    helperText,
    paymentSuccessTruth: false,
    paymentFinalityTruth: false,
    orderCreatedTruth: false,
    refundTruth: false,
    settlementTruth: false,
  };
}

function mapOrderState(status: OrderSurfaceStatus, warnings?: string[]): OrderSurfaceProjection['orderState'] {
  if (status === 'payment_pending' || status === 'payment_succeeded_order_pending') {
    return orderState('pending', 'Order processing pending', 'Order creation is not guaranteed by payment projection.', warnings);
  }

  if (status === 'lookup_required') {
    return orderState('lookup_required', 'Order lookup required', 'No order projection context is available yet.', warnings);
  }

  if (status === 'unavailable' || status === 'timeout' || status === 'error') {
    return orderState('unavailable', 'Order projection unavailable', 'The browser cannot create order truth when projection is unavailable.', warnings);
  }

  if (status === 'degraded' || status === 'support_required') {
    return orderState('degraded', 'Partial order projection', 'Order details are degraded or need support review.', warnings);
  }

  return orderState('processing', 'Order being prepared projection', 'Order processing is owner-provided and separate from shipment delivery.', warnings);
}

function orderState(
  status: OrderSurfaceProjection['orderState']['status'],
  label: string,
  helperText: string,
  warnings?: string[],
): OrderSurfaceProjection['orderState'] {
  return {
    status,
    label,
    helperText,
    orderCreatedTruth: false,
    orderFinalityTruth: false,
    fulfillmentTruth: false,
    warnings,
  };
}

function mapShipment(
  status: OrderSurfaceStatus,
  shipmentState?: string,
  warnings?: string[],
): OrderSurfaceProjection['shipment'] {
  if (shipmentState === 'degraded' || status === 'degraded') {
    return shipment('degraded', 'Tracking projection degraded', 'Carrier projection unavailable', 'Tracking temporarily unavailable', 'Estimated delivery unavailable; no delivery guarantee is made.', warnings);
  }

  if (status === 'shipped') {
    return shipment('shipped_projection', 'Shipped projection', 'Carrier projection placeholder', 'Tracking reference waits for logistics projection', 'Estimated delivery is projected only, not guaranteed.', warnings);
  }

  if (status === 'delivery_attempt') {
    return shipment('delivery_attempt_projection', 'Delivery attempt projection', 'Carrier projection placeholder', 'Attempt details wait for projection', 'Delivery timing remains a projection.', warnings);
  }

  if (status === 'preparing_shipment') {
    return shipment('preparing', 'Preparing shipment projection', 'Carrier not assigned by this UI', 'Tracking not available yet', 'Estimated delivery waits for shipment projection.', warnings);
  }

  return shipment('pending', 'Shipment not prepared projection', 'Carrier not available', 'Tracking unavailable', 'Shipment and delivery are not inferred from payment or order state.', warnings);
}

function shipment(
  status: OrderSurfaceProjection['shipment']['status'],
  label: string,
  carrierText: string,
  trackingText: string,
  estimatedDeliveryText: string,
  warnings?: string[],
): OrderSurfaceProjection['shipment'] {
  return {
    status,
    label,
    carrierText,
    trackingText,
    estimatedDeliveryText,
    shipmentTruth: false,
    logisticsProviderTruth: false,
    rawProviderPayloadExposed: false,
    warnings,
  };
}

function mapDelivery(status: OrderSurfaceStatus, warnings?: string[]): OrderSurfaceProjection['delivery'] {
  if (status === 'delivered') {
    return delivery('delivered_projection', 'Delivered projection', 'Delivery appears only when returned by owner projection; refund and return outcomes remain separate.', warnings);
  }

  if (status === 'delivery_attempt') {
    return delivery('attempt_projection', 'Delivery attempt projection', 'A delivery attempt projection is present, but delivered is not implied.', warnings);
  }

  if (status === 'shipped') {
    return delivery('in_progress_projection', 'Delivery in progress projection', 'Shipped does not mean delivered.', warnings);
  }

  if (status === 'degraded') {
    return delivery('degraded', 'Delivery projection degraded', 'Delivery status is unknown while tracking projection is degraded.', warnings);
  }

  return delivery('unknown', 'Delivery unknown', 'Delivered is not inferred locally by this browser surface.', warnings);
}

function delivery(
  status: OrderSurfaceProjection['delivery']['status'],
  label: string,
  helperText: string,
  warnings?: string[],
): OrderSurfaceProjection['delivery'] {
  return {
    status,
    label,
    helperText,
    deliveryTruth: false,
    guaranteedDeliveryTruth: false,
    warnings,
  };
}

function createTimeline(status: OrderSurfaceStatus): OrderTimelineStepProjection[] {
  const order = ['payment', 'order', 'shipment', 'shipped', 'delivery', 'support'];
  const currentIndex = currentTimelineIndex(status);

  return order.map((stepId, index) => {
    const base = timelineCopy(stepId);
    const stepStatus =
      status === 'degraded' || status === 'support_required'
        ? index < currentIndex
          ? 'complete_projection'
          : stepId === 'support'
            ? 'current_projection'
            : 'degraded_projection'
        : index < currentIndex
          ? 'complete_projection'
          : index === currentIndex
            ? 'current_projection'
            : 'pending_projection';

    return {
      stepId,
      title: base.title,
      description: base.description,
      status: stepStatus,
      ariaText: `${base.title}: ${stepStatus.replace(/_/g, ' ')}`,
      paymentTruth: false,
      orderTruth: false,
      shipmentTruth: false,
      deliveryTruth: false,
    };
  });
}

function currentTimelineIndex(status: OrderSurfaceStatus): number {
  switch (status) {
    case 'payment_pending':
    case 'payment_succeeded_order_pending':
    case 'lookup_required':
      return 0;
    case 'order_processing':
      return 1;
    case 'preparing_shipment':
      return 2;
    case 'shipped':
      return 3;
    case 'delivery_attempt':
    case 'delivered':
      return 4;
    case 'support_required':
    case 'degraded':
      return 5;
    default:
      return 0;
  }
}

function timelineCopy(stepId: string): { title: string; description: string } {
  switch (stepId) {
    case 'payment':
      return { title: 'Payment projection', description: 'Payment received is not the same as order created.' };
    case 'order':
      return { title: 'Order processing projection', description: 'Order creation and preparation are owner-provided projections.' };
    case 'shipment':
      return { title: 'Preparing shipment projection', description: 'Shipment preparation is separate from order processing.' };
    case 'shipped':
      return { title: 'Shipped projection', description: 'Shipped does not mean delivered.' };
    case 'delivery':
      return { title: 'Delivery projection', description: 'Delivery and delivery attempts come only from projection.' };
    default:
      return { title: 'Support escalation', description: 'Support can review references when projections are degraded or pending.' };
  }
}

function createItemPreviews(warnings?: string[]): OrderSurfaceProjection['items'] {
  return [
    {
      lineId: 'projection-line-placeholder',
      productId: 'projection-product',
      storefrontId: 'projection-store',
      title: 'Item preview projection',
      quantityText: 'Quantity waits for order owner projection',
      creatorStoreText: 'Creator/store context projection unavailable',
      mediaAltText: 'Order item media preview placeholder',
      summaryText: 'Item preview is safe display data only; refund and settlement states are not inferred.',
      refundTruth: false,
      settlementTruth: false,
      warnings,
    },
  ];
}

function supportHelper(status: OrderSurfaceStatus): string {
  if (status === 'degraded' || status === 'support_required') {
    return 'Share order and payment references with support for degraded tracking review.';
  }

  if (status === 'payment_pending' || status === 'payment_succeeded_order_pending') {
    return 'Support can compare payment and order projections without assuming they are equivalent.';
  }

  return 'Support can use these references for order, payment, and tracking projection review.';
}

function compactStrings(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}
