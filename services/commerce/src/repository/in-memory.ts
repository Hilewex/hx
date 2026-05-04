import { CartContext, CartLine, CheckoutReviewResponse } from '@hx/contracts';
import { ICartRepository, ICheckoutRepository } from './interface';

export class InMemoryCartRepository implements ICartRepository {
  private store = new Map<string, CartLine[]>();

  private getCartKey(context: CartContext): string {
    return `${context.actorType}:${context.actorId}`;
  }

  async getLines(context: CartContext): Promise<CartLine[]> {
    return this.store.get(this.getCartKey(context)) || [];
  }

  async saveLines(context: CartContext, lines: CartLine[]): Promise<void> {
    this.store.set(this.getCartKey(context), lines);
  }

  async clear(context: CartContext): Promise<void> {
    this.store.delete(this.getCartKey(context));
  }
}

export class InMemoryCheckoutRepository implements ICheckoutRepository {
  private store = new Map<string, CheckoutReviewResponse>();

  async save(checkout: CheckoutReviewResponse): Promise<void> {
    this.store.set(checkout.checkoutId, checkout);
  }

  async getById(checkoutId: string): Promise<CheckoutReviewResponse | undefined> {
    return this.store.get(checkoutId);
  }
}
