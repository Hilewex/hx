import { CartContext, CartResponse, AddToCartCommand, UpdateCartLineCommand, RemoveCartLineCommand } from '@hx/contracts';
import { ICartRepository } from './repository/interface';
export declare function resetRepository(mockRepo?: ICartRepository): void;
export declare function getCart(context: CartContext): Promise<{
    status: number;
    data: CartResponse;
}>;
export declare function addToCart(context: CartContext, command: AddToCartCommand): Promise<{
    status: number;
    data: CartResponse;
}>;
export declare function updateCartLine(context: CartContext, command: UpdateCartLineCommand): Promise<{
    status: number;
    data: CartResponse;
}>;
export declare function removeCartLine(context: CartContext, command: RemoveCartLineCommand): Promise<{
    status: number;
    data: CartResponse;
}>;
export declare function clearCart(context: CartContext): Promise<void>;
//# sourceMappingURL=cart.d.ts.map