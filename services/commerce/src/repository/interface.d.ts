import { CartContext, CartLine, CheckoutReviewResponse } from '@hx/contracts';
export interface ICartRepository {
    getLines(context: CartContext): Promise<CartLine[]>;
    saveLines(context: CartContext, lines: CartLine[]): Promise<void>;
    clear(context: CartContext): Promise<void>;
}
export interface ICheckoutRepository {
    save(checkout: CheckoutReviewResponse): Promise<void>;
    getById(checkoutId: string): Promise<CheckoutReviewResponse | undefined>;
}
//# sourceMappingURL=interface.d.ts.map