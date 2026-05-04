import { ICancelReturnRepository } from './interface';
import { CancelReturnResponse, CancelReturnLine } from '@hx/contracts';
import { query } from '@hx/persistence';

export class PostgresCancelReturnRepository implements ICancelReturnRepository {
  async save(request: CancelReturnResponse, idempotencyKey?: string): Promise<void> {
    await query('BEGIN');

    try {
      const existingRes = await query('SELECT request_id FROM cancel_return_requests WHERE request_id = $1', [request.requestId]);
      
      if (existingRes.rowCount && existingRes.rowCount > 0) {
        await query(
          `UPDATE cancel_return_requests 
           SET state = $1, updated_at = NOW() 
           WHERE request_id = $2`,
          [request.state, request.requestId]
        );
      } else {
        await query(
          `INSERT INTO cancel_return_requests (request_id, order_id, type, state) 
           VALUES ($1, $2, $3, $4)`,
          [request.requestId, request.orderId, request.type, request.state]
        );
      }

      for (const line of request.lines) {
        const lineRes = await query('SELECT request_line_id FROM cancel_return_lines WHERE request_line_id = $1', [line.requestLineId]);
        if (lineRes.rowCount && lineRes.rowCount > 0) {
          await query(
            `UPDATE cancel_return_lines
             SET state = $1, reason_code = $2, updated_at = NOW()
             WHERE request_line_id = $3`,
            [line.state, line.reasonCode || null, line.requestLineId]
          );
        } else {
          await query(
            `INSERT INTO cancel_return_lines (request_line_id, request_id, order_line_id, product_id, variant_id, storefront_id, quantity, reason_code, state)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [line.requestLineId, request.requestId, line.orderLineId, line.productId, line.variantId, line.storefrontId, line.quantity, line.reasonCode || null, line.state]
          );
        }
      }

      if (idempotencyKey) {
        await query(
          `INSERT INTO idempotency (idempotency_key, response) 
           VALUES ($1, $2)
           ON CONFLICT (idempotency_key) DO UPDATE SET response = EXCLUDED.response`,
          [idempotencyKey, JSON.stringify(request)]
        );
      }

      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  async getById(requestId: string): Promise<CancelReturnResponse | undefined> {
    const rRes = await query('SELECT * FROM cancel_return_requests WHERE request_id = $1', [requestId]);
    if (!rRes.rowCount || rRes.rowCount === 0) return undefined;
    
    return this.mapToResponse(rRes.rows[0], requestId);
  }

  async getByIdempotencyKey(key: string): Promise<CancelReturnResponse | undefined> {
    const res = await query('SELECT response FROM idempotency WHERE idempotency_key = $1', [key]);
    if (res.rowCount && res.rowCount > 0) {
      return res.rows[0].response as CancelReturnResponse;
    }
    return undefined;
  }

  async getByOrderId(orderId: string): Promise<CancelReturnResponse[]> {
    const rRes = await query('SELECT request_id FROM cancel_return_requests WHERE order_id = $1', [orderId]);
    const results: CancelReturnResponse[] = [];
    for (const row of rRes.rows) {
      const req = await this.getById(row.request_id);
      if (req) results.push(req);
    }
    return results;
  }

  private async mapToResponse(row: any, requestId: string): Promise<CancelReturnResponse> {
    const lRes = await query('SELECT * FROM cancel_return_lines WHERE request_id = $1', [requestId]);

    const lines: CancelReturnLine[] = lRes.rows.map((r: any) => ({
      requestLineId: r.request_line_id,
      orderLineId: r.order_line_id,
      productId: r.product_id,
      variantId: r.variant_id,
      storefrontId: r.storefront_id,
      quantity: r.quantity,
      reasonCode: r.reason_code,
      state: r.state
    }));

    return {
      requestId,
      orderId: row.order_id,
      type: row.type as any,
      state: row.state as any,
      lines,
      refundImpactSummary: {
        refundRequired: true,
        refundState: 'PENDING',
        actualRefundExecutionPerformed: false
      },
      postDeliveryEntitlementImpactSummary: {
        reviewImpactPending: row.type === 'RETURN',
        storyImpactPending: row.type === 'RETURN',
        verifiedPurchaseImpactPending: row.type === 'RETURN',
        actualEntitlementMutationPerformed: false
      },
      errors: [],
      warnings: []
    };
  }
}
