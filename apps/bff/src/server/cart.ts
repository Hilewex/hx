import { 
  CartContext, 
  AddToCartCommand, 
  UpdateCartLineCommand, 
  RemoveCartLineCommand,
  ActorContext
} from '@hx/contracts';
import { getCart, addToCart, updateCartLine, removeCartLine } from '@hx/commerce';
import * as response from './response';
import { requireGuestOrCustomer, extractCommerceContext } from './guards';

export async function handleGetCart(context: ActorContext) {
  const guard = requireGuestOrCustomer(context);
  if (!guard.allowed) return guard.response;

  try {
    const cartContext = extractCommerceContext(context) as CartContext;
    const result = await getCart(cartContext);
    return response.ok(result);
  } catch (error) {
    return response.forbidden('FORBIDDEN', (error as Error).message);
  }
}

export async function handleAddToCart(context: ActorContext, body: any) {
  const guard = requireGuestOrCustomer(context);
  if (!guard.allowed) return guard.response;

  try {
    const cartContext = extractCommerceContext(context) as CartContext;
    const command: AddToCartCommand = {
      productId: body.productId,
      variantId: body.variantId,
      storefrontId: body.storefrontId,
      quantity: body.quantity || 1
    };
    const result = await addToCart(cartContext, command);
    return response.ok(result);
  } catch (error) {
    return response.forbidden('FORBIDDEN', (error as Error).message);
  }
}

export async function handleUpdateCartLine(context: ActorContext, body: any) {
  const guard = requireGuestOrCustomer(context);
  if (!guard.allowed) return guard.response;

  try {
    const cartContext = extractCommerceContext(context) as CartContext;
    const command: UpdateCartLineCommand = {
      lineId: body.lineId,
      quantity: body.quantity
    };
    const result = await updateCartLine(cartContext, command);
    return response.ok(result);
  } catch (error) {
    return response.forbidden('FORBIDDEN', (error as Error).message);
  }
}

export async function handleRemoveCartLine(context: ActorContext, body: any) {
  const guard = requireGuestOrCustomer(context);
  if (!guard.allowed) return guard.response;

  try {
    const cartContext = extractCommerceContext(context) as CartContext;
    const command: RemoveCartLineCommand = {
      lineId: body.lineId
    };
    const result = await removeCartLine(cartContext, command);
    return response.ok(result);
  } catch (error) {
    return response.forbidden('FORBIDDEN', (error as Error).message);
  }
}
