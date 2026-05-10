import { startCheckout } from '@hx/checkout';
import { getCart } from '@hx/commerce';
import { ActorContext, CartContext, CheckoutAddressSnapshot, CheckoutDiscountInput } from '@hx/contracts';
import * as response from './response';
import { requireGuestOrCustomer, extractCommerceContext, requireResourceOwnership } from './guards';

export async function handleStartCheckout(
  context: ActorContext,
  body: {
    cartId: string;
    addressSnapshot?: CheckoutAddressSnapshot;
    couponCode?: string;
    campaignId?: string;
    discountInputs?: CheckoutDiscountInput[];
  },
) {
  const guard = requireGuestOrCustomer(context);
  if (!guard.allowed) return guard.response;

  try {
    const cartContext = extractCommerceContext(context);
    const cart = await getCart(cartContext);

    if (!cart.data.context.actorId) {
        return response.forbidden('FORBIDDEN', 'Cart has no owner');
    }

    const ownershipGuard = requireResourceOwnership(context, cart.data.context.actorId);
    if (!ownershipGuard.allowed) return ownershipGuard.response;
    
    const result = await startCheckout({
      cartContext,
      addressSnapshot: body.addressSnapshot,
      couponCode: body.couponCode,
      campaignId: body.campaignId,
      discountInputs: body.discountInputs,
    });
    return response.ok(result);
  } catch (error) {
    return response.forbidden('FORBIDDEN', (error as Error).message);
  }
}
