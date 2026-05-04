import { CartContext, CartLine, CheckoutReviewResponse } from '@hx/contracts';
import { query } from '@hx/persistence';
import { ICartRepository, ICheckoutRepository } from './interface';

export class PostgresCartRepository implements ICartRepository {
  async getLines(context: CartContext): Promise<CartLine[]> {
    const cartRes = await query(
      'SELECT id FROM carts WHERE actor_type = $1 AND actor_id = $2',
      [context.actorType, context.actorId]
    );

    if (!cartRes.rowCount || cartRes.rowCount === 0) return [];

    const cartId = cartRes.rows[0].id;
    const linesRes = await query(
      'SELECT data FROM cart_lines WHERE cart_id = $1 ORDER BY created_at ASC',
      [cartId]
    );

    return linesRes.rows.map(r => r.data);
  }

  async saveLines(context: CartContext, lines: CartLine[]): Promise<void> {
    let cartRes = await query(
      'SELECT id FROM carts WHERE actor_type = $1 AND actor_id = $2',
      [context.actorType, context.actorId]
    );

    let cartId: string;
    if (!cartRes.rowCount || cartRes.rowCount === 0) {
      const insertRes = await query(
        'INSERT INTO carts (actor_type, actor_id) VALUES ($1, $2) RETURNING id',
        [context.actorType, context.actorId]
      );
      cartId = insertRes.rows[0].id;
    } else {
      cartId = cartRes.rows[0].id;
    }

    await query('DELETE FROM cart_lines WHERE cart_id = $1', [cartId]);

    for (const line of lines) {
      await query(
        'INSERT INTO cart_lines (cart_id, line_id, product_id, variant_id, storefront_id, data) VALUES ($1, $2, $3, $4, $5, $6)',
        [cartId, line.lineId, line.productId, line.variantId, line.storefrontId, JSON.stringify(line)]
      );
    }
    
    await query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [cartId]);
  }

  async clear(context: CartContext): Promise<void> {
    const cartRes = await query(
      'SELECT id FROM carts WHERE actor_type = $1 AND actor_id = $2',
      [context.actorType, context.actorId]
    );

    if (cartRes.rowCount && cartRes.rowCount > 0) {
      const cartId = cartRes.rows[0].id;
      await query('DELETE FROM cart_lines WHERE cart_id = $1', [cartId]);
      await query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [cartId]);
    }
  }
}

export class PostgresCheckoutRepository implements ICheckoutRepository {
  async save(checkout: CheckoutReviewResponse): Promise<void> {
    const { checkoutId, cartContext, state, validationState } = checkout;
    
    await query(
      `INSERT INTO checkout_sessions (id, actor_type, actor_id, state, validation_state, data)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         state = EXCLUDED.state,
         validation_state = EXCLUDED.validation_state,
         data = EXCLUDED.data,
         updated_at = NOW()`,
      [
        checkoutId, 
        cartContext.actorType, 
        cartContext.actorId, 
        state, 
        validationState, 
        JSON.stringify(checkout)
      ]
    );
  }

  async getById(checkoutId: string): Promise<CheckoutReviewResponse | undefined> {
    const res = await query('SELECT data FROM checkout_sessions WHERE id = $1', [checkoutId]);
    if (!res.rowCount || res.rowCount === 0) return undefined;
    return res.rows[0].data;
  }
}
