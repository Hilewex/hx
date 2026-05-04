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
