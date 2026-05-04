import { IRefundRepository } from './interface';
import { RefundResponse, RefundLine } from '@hx/contracts';
import { query } from '@hx/persistence';

export class PostgresRefundRepository implements IRefundRepository {
  async save(refund: RefundResponse, idempotencyKey?: string): Promise<void> {
    await query('BEGIN');

    try {
      const existingRes = await query('SELECT refund_id FROM refunds WHERE refund_id = $1', [refund.refundId]);
      
      const originalPaymentId = refund.paymentSummary?.originalPaymentId || null;
      const providerRefundReference = refund.paymentSummary?.providerRefundReference || null;

      if (existingRes.rowCount && existingRes.rowCount > 0) {
        await query(
          `UPDATE refunds 
           SET state = $1, original_payment_id = $2, provider_refund_reference = $3, updated_at = NOW() 
           WHERE refund_id = $4`,
          [refund.state, originalPaymentId, providerRefundReference, refund.refundId]
        );
      } else {
        await query(
          `INSERT INTO refunds (refund_id, cancel_return_request_id, source_type, state, original_payment_id, provider_refund_reference) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [refund.refundId, refund.cancelReturnRequestId, refund.sourceType, refund.state, originalPaymentId, providerRefundReference]
        );
      }

      for (const line of refund.lines) {
        const lineRes = await query('SELECT refund_line_id FROM refund_lines WHERE refund_line_id = $1', [line.refundLineId]);
        
        if (lineRes.rowCount && lineRes.rowCount > 0) {
          await query(
            `UPDATE refund_lines
             SET amount = $1, currency = $2, updated_at = NOW()
             WHERE refund_line_id = $3`,
            [line.amount || 0, line.currency, line.refundLineId]
          );
        } else {
          await query(
            `INSERT INTO refund_lines (refund_line_id, refund_id, request_line_id, order_line_id, product_id, variant_id, storefront_id, quantity, amount, currency)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              line.refundLineId, 
              refund.refundId, 
              (line as any).requestLineId || '', 
              line.orderLineId, 
              line.productId, 
              line.variantId, 
              line.storefrontId, 
              line.quantity, 
              line.amount || 0, 
              line.currency
            ]
          );
        }
      }

      if (idempotencyKey) {
        await query(
          `INSERT INTO idempotency (idempotency_key, response) 
           VALUES ($1, $2)
           ON CONFLICT (idempotency_key) DO UPDATE SET response = EXCLUDED.response`,
          [idempotencyKey, JSON.stringify(refund)]
        );
      }

      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  async getById(refundId: string): Promise<RefundResponse | undefined> {
    const rRes = await query('SELECT * FROM refunds WHERE refund_id = $1', [refundId]);
    if (!rRes.rowCount || rRes.rowCount === 0) return undefined;
    
    return this.mapToResponse(rRes.rows[0], refundId);
  }

  async getByIdempotencyKey(key: string): Promise<RefundResponse | undefined> {
    const res = await query('SELECT response FROM idempotency WHERE idempotency_key = $1', [key]);
    if (res.rowCount && res.rowCount > 0) {
      return res.rows[0].response as RefundResponse;
    }
    return undefined;
  }

  async getByCancelReturnRequestId(requestId: string): Promise<RefundResponse | undefined> {
    const rRes = await query('SELECT refund_id FROM refunds WHERE cancel_return_request_id = $1 LIMIT 1', [requestId]);
    if (!rRes.rowCount || rRes.rowCount === 0) return undefined;
    
    return this.getById(rRes.rows[0].refund_id);
  }

  private async mapToResponse(row: any, refundId: string): Promise<RefundResponse> {
    const lRes = await query('SELECT * FROM refund_lines WHERE refund_id = $1', [refundId]);

    const lines: RefundLine[] = lRes.rows.map((r: any) => ({
      refundLineId: r.refund_line_id,
      requestLineId: r.request_line_id,
      orderLineId: r.order_line_id,
      productId: r.product_id,
      variantId: r.variant_id,
      storefrontId: r.storefront_id,
      quantity: r.quantity,
      amount: Number(r.amount),
      currency: r.currency
    }));

    return {
      refundId,
      cancelReturnRequestId: row.cancel_return_request_id,
      sourceType: row.source_type as any,
      state: row.state as any,
      lines,
      amountSummary: {
        requestedAmount: lines.reduce((sum, l) => sum + l.amount, 0),
        approvedAmount: lines.reduce((sum, l) => sum + l.amount, 0),
        refundedAmount: row.state === 'SUCCEEDED' ? lines.reduce((sum, l) => sum + l.amount, 0) : 0,
        currency: lines[0]?.currency || 'TRY',
      },
      paymentSummary: {
        simulationOnly: true,
        actualProviderRefundPerformed: false,
        originalPaymentId: row.original_payment_id || undefined,
        providerRefundReference: row.provider_refund_reference || undefined
      },
      settlementImpactSummary: {
        settlementAdjustmentRequired: true,
        actualSettlementMutationPerformed: false,
      },
      payoutImpactSummary: {
        payoutAdjustmentRequired: true,
        actualPayoutMutationPerformed: false,
      },
      errors: [],
      warnings: [],
    };
  }
}
