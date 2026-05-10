import { PaymentInitiationResponse } from '@hx/contracts';
import { query } from '@hx/persistence';
import { IPaymentRepository } from './interface';

export class PostgresPaymentRepository implements IPaymentRepository {
  async save(payment: PaymentInitiationResponse): Promise<void> {
    await query(
      `INSERT INTO payments (id, checkout_id, state, data)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         state = EXCLUDED.state,
         data = EXCLUDED.data,
         updated_at = NOW()`,
      [payment.paymentId, payment.checkoutId, payment.state, JSON.stringify(payment)]
    );
  }

  async getById(paymentId: string): Promise<PaymentInitiationResponse | undefined> {
    const res = await query('SELECT data FROM payments WHERE id = $1', [paymentId]);
    if (!res.rowCount || res.rowCount === 0) return undefined;
    return res.rows[0].data;
  }

  async getByPaymentAttemptId(paymentAttemptId: string): Promise<PaymentInitiationResponse | undefined> {
    const res = await query("SELECT data FROM payments WHERE data->'attempt'->>'paymentAttemptId' = $1", [paymentAttemptId]);
    if (!res.rowCount || res.rowCount === 0) return undefined;
    return res.rows[0].data;
  }

  async getByProviderReference(
    providerName: string,
    providerReference: string,
  ): Promise<PaymentInitiationResponse | undefined> {
    const byProviderReference = await query(
      `SELECT data FROM payments
       WHERE data->'attempt'->>'providerName' = $1
         AND data->'attempt'->>'providerReference' = $2
       LIMIT 1`,
      [providerName, providerReference]
    );
    if (byProviderReference.rowCount && byProviderReference.rowCount > 0) {
      return byProviderReference.rows[0].data;
    }

    const byProviderEventId = await query(
      `SELECT data FROM payments
       WHERE data->'attempt'->>'providerName' = $1
         AND data->'attempt'->>'providerEventId' = $2
       LIMIT 1`,
      [providerName, providerReference]
    );
    if (!byProviderEventId.rowCount || byProviderEventId.rowCount === 0) return undefined;
    return byProviderEventId.rows[0].data;
  }

  async getByIdempotencyKey(namespace: string, key: string): Promise<PaymentInitiationResponse | undefined> {
    const res = await query(
      'SELECT response_data FROM idempotency_records WHERE namespace = $1 AND idempotency_key = $2',
      [namespace, key]
    );
    if (!res.rowCount || res.rowCount === 0) return undefined;
    return res.rows[0].response_data;
  }

  async saveWithIdempotency(namespace: string, key: string, payment: PaymentInitiationResponse): Promise<void> {
    // Transactional save would be better but following the pattern for now
    await this.save(payment);
    await query(
      `INSERT INTO idempotency_records (namespace, idempotency_key, response_data)
       VALUES ($1, $2, $3)
       ON CONFLICT (namespace, idempotency_key) DO UPDATE SET
         response_data = EXCLUDED.response_data`,
      [namespace, key, JSON.stringify(payment)]
    );
  }
}
