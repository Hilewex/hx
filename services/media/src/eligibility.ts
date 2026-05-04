import {
  ReviewEligibilitySnapshot,
  ReviewProductTag,
  UgcEligibilitySnapshot,
  UgcProductTag,
} from '@hx/contracts';
import { getCancelReturnRequestsByOrderId } from '@hx/cancel-return';
import { getCheckoutReview } from '@hx/checkout';
import { getOrderById } from '@hx/order';
import { getPayment } from '@hx/payment';
import { getRefundByCancelReturnRequestId } from '@hx/refund';
import { getShipmentsByOrderId } from '@hx/shipment';

type ProductTag = ReviewProductTag | UgcProductTag;

export interface EligibilityDecision {
  eligible: boolean;
  deliveredConfirmed: boolean;
  verifiedPurchase: boolean;
  orderId?: string;
  orderLineId?: string;
  reason?: string;
  warnings: string[];
}

export async function derivePurchaseEligibility(
  actorId: string | undefined,
  productTag: ProductTag | undefined,
): Promise<EligibilityDecision> {
  const warnings: string[] = ['ELIGIBILITY_DERIVED_FROM_OWNER_TRUTH'];

  if (!actorId) {
    return notEligible('ACTOR_REQUIRED', warnings);
  }

  if (!productTag?.productId) {
    return notEligible('PRODUCT_REQUIRED', warnings);
  }

  if (!productTag.orderId) {
    return notEligible('ORDER_CONTEXT_MISSING', warnings);
  }

  const order = await getOrderById(productTag.orderId);
  if (!order || !order.orderId) {
    return notEligible('ORDER_NOT_FOUND', warnings);
  }

  if (!['CREATED', 'CONFIRMED'].includes(order.state)) {
    return notEligible('ORDER_NOT_SUCCESSFUL', warnings, order.orderId);
  }

  const checkout = await getCheckoutReview(order.checkoutId);
  if (!checkout || checkout.cartContext.actorId !== actorId) {
    return notEligible('ORDER_ACTOR_MISMATCH', warnings, order.orderId);
  }

  const payment = await getPayment(order.paymentId);
  if (!payment || payment.state !== 'SUCCEEDED' || payment.attempt.state !== 'SUCCEEDED') {
    return notEligible('PAYMENT_NOT_SUCCESSFUL', warnings, order.orderId);
  }

  const orderLine = productTag.orderLineId
    ? order.lines.find(line => line.orderLineId === productTag.orderLineId)
    : order.lines.find(line =>
        line.productId === productTag.productId &&
        (!productTag.storefrontId || line.storefrontId === productTag.storefrontId)
      );

  if (!orderLine || orderLine.productId !== productTag.productId) {
    return notEligible('ORDER_LINE_NOT_FOUND_FOR_PRODUCT', warnings, order.orderId);
  }

  const shipments = await getShipmentsByOrderId(order.orderId);
  const deliveredLine = shipments
    .flatMap(shipment => shipment.lines.map(line => ({ shipment, line })))
    .find(({ shipment, line }) =>
      shipment.state === 'DELIVERED' &&
      line.state === 'DELIVERED' &&
      line.orderLineId === orderLine.orderLineId &&
      line.productId === orderLine.productId
    );

  if (!deliveredLine) {
    return notEligible('ORDER_LINE_NOT_DELIVERED', warnings, order.orderId, orderLine.orderLineId);
  }

  const blockReason = await findReturnRefundBlock(order.orderId, orderLine.orderLineId, orderLine.productId);
  if (blockReason) {
    return notEligible(blockReason, warnings, order.orderId, orderLine.orderLineId);
  }

  return {
    eligible: true,
    deliveredConfirmed: true,
    verifiedPurchase: true,
    orderId: order.orderId,
    orderLineId: orderLine.orderLineId,
    warnings,
  };
}

export function toReviewEligibilitySnapshot(
  actorId: string,
  productId: string,
  decision: EligibilityDecision,
): ReviewEligibilitySnapshot {
  return {
    actorId,
    productId,
    orderId: decision.orderId,
    orderLineId: decision.orderLineId,
    deliveredRequired: true,
    deliveredConfirmed: decision.deliveredConfirmed,
    eligibilityState: decision.eligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
    reason: decision.reason,
  };
}

export function toUgcEligibilitySnapshot(
  actorId: string,
  productId: string,
  decision: EligibilityDecision,
): UgcEligibilitySnapshot {
  return {
    actorId,
    productId,
    orderId: decision.orderId,
    orderLineId: decision.orderLineId,
    deliveredRequired: true,
    deliveredConfirmed: decision.deliveredConfirmed,
    eligibilityState: decision.eligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
    reason: decision.reason,
  };
}

async function findReturnRefundBlock(
  orderId: string,
  orderLineId: string,
  productId: string,
): Promise<string | undefined> {
  const requests = await getCancelReturnRequestsByOrderId(orderId);
  const matchingRequests = requests.filter(request =>
    request.lines.some(line => line.orderLineId === orderLineId || line.productId === productId)
  );

  for (const request of matchingRequests) {
    if (request.type === 'CANCEL' && !['REJECTED', 'CLOSED'].includes(request.state)) {
      return 'ACTIVE_CANCEL_BLOCKS_ELIGIBILITY';
    }

    if (request.type === 'RETURN' && request.state !== 'REJECTED') {
      const refund = await getRefundByCancelReturnRequestId(request.requestId);
      if (refund && !['CANCELLED'].includes(refund.state)) {
        return `RETURN_REFUND_${refund.state}_BLOCKS_ELIGIBILITY`;
      }
      return `RETURN_${request.state}_BLOCKS_ELIGIBILITY`;
    }
  }

  return undefined;
}

function notEligible(
  reason: string,
  warnings: string[],
  orderId?: string,
  orderLineId?: string,
): EligibilityDecision {
  return {
    eligible: false,
    deliveredConfirmed: false,
    verifiedPurchase: false,
    orderId,
    orderLineId,
    reason,
    warnings,
  };
}
