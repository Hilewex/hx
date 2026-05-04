import { createOrderFromPayment, getOrderDetail } from '@hx/order';
import { CreateOrderCommand, SimulatePaymentSuccessResponse, ActorContext } from '@hx/contracts';
import { simulatePaymentSuccess } from '@hx/payment';
import { getCheckoutReview } from '@hx/checkout';
import { createInternalRiskSignal } from '@hx/risk';
import { randomUUID } from 'node:crypto';
import * as response from './response';
import { requireGuestOrCustomer, extractCommerceContext, requireResourceOwnership } from './guards';

export async function handleCreateOrder(context: ActorContext, body: any) {
  const guard = requireGuestOrCustomer(context);
  if (!guard.allowed) return guard.response;

  try {
    const { checkoutId } = body;
    if (!checkoutId) {
      return response.badRequest('BAD_REQUEST', 'checkoutId is required');
    }

    const checkout = await getCheckoutReview(checkoutId);
    if (!checkout) {
      return response.notFound('NOT_FOUND', 'Checkout not found');
    }

    if (!checkout.cartContext.actorId) {
      return response.forbidden('FORBIDDEN', 'Checkout has no owner');
    }

    const ownershipGuard = requireResourceOwnership(context, checkout.cartContext.actorId);
    if (!ownershipGuard.allowed) {
        // HARDENING-06D: Ownership mismatch signal
        const commerceContext = extractCommerceContext(context);
        await createInternalRiskSignal({
            targetId: checkoutId,
            targetType: 'CHECKOUT',
            type: 'PAYMENT_ANOMALY',
            level: 'HIGH',
            source: 'ORDER_SIGNAL',
            reasonCode: 'PAYMENT_ANOMALY',
            metadata: { 
                checkoutOwner: checkout.cartContext.actorId, 
                actorId: commerceContext.actorId,
                reason: 'ORDER_CREATE_OWNERSHIP_MISMATCH'
            },
            correlationId: randomUUID(),
        });
        return ownershipGuard.response;
    }

    const commerceContext = extractCommerceContext(context);
    const command: CreateOrderCommand = {
      ...body,
      customerId: commerceContext.actorId // Override with secure context
    };

    const result = await createOrderFromPayment(command);
    return response.created(result);
  } catch (error) {
    return response.forbidden('FORBIDDEN', (error as Error).message);
  }
}

export async function handleGetOrderDetail(context: ActorContext, orderId: string) {
  if (!orderId) {
    return response.badRequest('INVALID_ORDER_ID', 'Order ID is required');
  }

  const guard = requireGuestOrCustomer(context);
  if (!guard.allowed) return guard.response;

  try {
    const detail = await getOrderDetail(orderId);
    
    if (!detail.orderId || detail.errors?.includes('ORDER_NOT_FOUND')) {
      return response.notFound('ORDER_NOT_FOUND', 'Order not found');
    }

    const ownershipGuard = requireResourceOwnership(context, detail.customerId || '');
    if (!ownershipGuard.allowed) {
        // HARDENING-06D: Order read ownership mismatch signal
        const commerceContext = extractCommerceContext(context);
        await createInternalRiskSignal({
            targetId: orderId,
            targetType: 'ORDER',
            type: 'PAYMENT_ANOMALY',
            level: 'MEDIUM',
            source: 'ORDER_SIGNAL',
            reasonCode: 'PAYMENT_ANOMALY',
            metadata: { 
                orderOwner: detail.customerId, 
                actorId: commerceContext.actorId,
                reason: 'ORDER_READ_OWNERSHIP_MISMATCH'
            },
            correlationId: randomUUID(),
        });
        return ownershipGuard.response;
    }

    return response.ok(detail);
  } catch (error) {
     return response.forbidden('FORBIDDEN', (error as Error).message);
  }
}

export async function handleSimulatePaymentSuccess(context: any, body: any) {
  const { paymentAttemptId } = body;
  const result: SimulatePaymentSuccessResponse = await simulatePaymentSuccess(paymentAttemptId);
  return response.ok(result);
}
