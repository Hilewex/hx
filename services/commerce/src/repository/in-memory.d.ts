import { CartContext, CartLine, CheckoutReviewResponse } from '@hx/contracts';
import { ICartRepository, ICheckoutRepository } from './interface';
export declare class InMemoryCartRepository implements ICartRepository {
    private store;
    private getCartKey;
    getLines(context: CartContext): Promise<CartLine[]>;
    saveLines(context: CartContext, lines: CartLine[]): Promise<void>;
    clear(context: CartContext): Promise<void>;
}
export declare class InMemoryCheckoutRepository implements ICheckoutRepository {
    private store;
    save(checkout: CheckoutReviewResponse): Promise<void>;
    getById(checkoutId: string): Promise<CheckoutReviewResponse | undefined>;
}
//# sourceMappingURL=in-memory.d.ts.map