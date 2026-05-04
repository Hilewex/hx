import { OrderResponse } from '@hx/contracts';
import { query } from '@hx/persistence';
import { IOrderRepository } from './interface';

export class PostgresOrderRepository implements IOrderRepository {
  async save(order: OrderResponse): Promise<void> {
    const { orderId, orderNumber, checkoutId, paymentId, paymentAttemptId, state, lines } = order;

    // Transactional save for order and lines
    await query('BEGIN', []);
    try {
      await query(
        `INSERT INTO orders (id, order_number, checkout_id, payment_id, payment_attempt_id, state, data)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           state = EXCLUDED.state,
           data = EXCLUDED.data,
           updated_at = NOW()`,
        [orderId, orderNumber, checkoutId, paymentId, paymentAttemptId, state, JSON.stringify(order)]
      );

      // Simple sync for lines: delete and re-insert
      await query('DELETE FROM order_lines WHERE order_id = $1', [orderId]);
      
      for (const line of lines) {
        await query(
          `INSERT INTO order_lines (id, order_id, product_id, variant_id, storefront_id, quantity, unit_price, line_total, product_name_snapshot)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            line.orderLineId,
            orderId,
            line.productId,
            line.variantId,
            line.storefrontId,
            line.quantity,
            line.unitPriceSnapshot,
            line.lineTotalSnapshot,
            line.productNameSnapshot
          ]
        );
      }

      await query('COMMIT', []);
    } catch (e) {
      await query('ROLLBACK', []);
      throw e;
    }
  }

  async getById(orderId: string): Promise<OrderResponse | undefined> {
    const res = await query('SELECT data FROM orders WHERE id = $1', [orderId]);
    if (!res.rowCount || res.rowCount === 0) return undefined;
    return res.rows[0].data;
  }

  async getByPaymentAttemptId(paymentAttemptId: string): Promise<OrderResponse | undefined> {
    const res = await query('SELECT data FROM orders WHERE payment_attempt_id = $1', [paymentAttemptId]);
    if (!res.rowCount || res.rowCount === 0) return undefined;
    return res.rows[0].data;
  }

  async getByIdempotencyKey(namespace: string, key: string): Promise<OrderResponse | undefined> {
    const res = await query(
      'SELECT response_data FROM idempotency_records WHERE namespace = $1 AND idempotency_key = $2',
      [namespace, key]
    );
    if (!res.rowCount || res.rowCount === 0) return undefined;
    return res.rows[0].response_data;
  }

  async saveWithIdempotency(namespace: string, key: string, order: OrderResponse): Promise<void> {
    await this.save(order);
    await query(
      `INSERT INTO idempotency_records (namespace, idempotency_key, response_data)
       VALUES ($1, $2, $3)
       ON CONFLICT (namespace, idempotency_key) DO UPDATE SET
         response_data = EXCLUDED.response_data`,
      [namespace, key, JSON.stringify(order)]
    );
  }
}
