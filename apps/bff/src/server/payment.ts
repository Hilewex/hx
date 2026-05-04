import { initiatePayment } from '@hx/payment';
import { getCheckoutReview } from '@hx/checkout';
import { ActorContext, CartContext, InitiatePaymentCommand } from '@hx/contracts';
import { createInternalRiskSignal } from '@hx/risk';
import { randomUUID } from 'node:crypto';
import * as response from './response';
import { requireGuestOrCustomer, extractCommerceContext, requireResourceOwnership } from './guards';

export async function handleInitiatePayment(context: ActorContext, body: any) {
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
        // HARDENING-06D: Payment initiation ownership mismatch signal
        const commerceContext = extractCommerceContext(context);
        await createInternalRiskSignal({
            targetId: checkoutId,
            targetType: 'CHECKOUT',
            type: 'PAYMENT_ANOMALY',
            level: 'HIGH',
            source: 'PAYMENT_SIGNAL',
            reasonCode: 'PAYMENT_ANOMALY',
            metadata: { 
                checkoutOwner: checkout.cartContext.actorId, 
                actorId: commerceContext.actorId,
                reason: 'PAYMENT_INITIATE_OWNERSHIP_MISMATCH'
            },
            correlationId: randomUUID(),
        });
        return ownershipGuard.response;
    }

    const cartContext = extractCommerceContext(context) as CartContext;
    const command: InitiatePaymentCommand = {
      ...body,
      cartContext, // Override with secure context
    };

    const result = await initiatePayment(command);
    return response.ok(result);
  } catch (error) {
    return response.forbidden('FORBIDDEN', (error as Error).message);
  }
}
