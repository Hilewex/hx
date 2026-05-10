import { CartContext, CartLine, CheckoutReviewResponse } from '@hx/contracts';
import { ICartRepository, ICheckoutRepository } from './interface';
export declare class PostgresCartRepository implements ICartRepository {
    getLines(context: CartContext): Promise<CartLine[]>;
    saveLines(context: CartContext, lines: CartLine[]): Promise<void>;
    clear(context: CartContext): Promise<void>;
}
export declare class PostgresCheckoutRepository implements ICheckoutRepository {
    save(checkout: CheckoutReviewResponse): Promise<void>;
    getById(checkoutId: string): Promise<CheckoutReviewResponse | undefined>;
}
//# sourceMappingURL=postgres.d.ts.map