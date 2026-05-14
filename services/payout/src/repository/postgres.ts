import { Pool } from 'pg';
import {
  PayoutItem,
  PayoutBatch,
  ListPayoutItemsQuery,
  ListPayoutBatchesQuery,
  PayoutItemListResponse,
  PayoutBatchListResponse,
  PayoutCandidate,
  PayoutCandidateListResponse
} from '@hx/contracts';
import { IPayoutRepository } from './interface';

export class PostgresPayoutRepository implements IPayoutRepository {
  constructor(private pool: Pool) {}

  private mapItemRow(row: any): PayoutItem {
    const executionSummary = row.execution_summary || {};

    return {
      payoutItemId: row.payout_item_id,
      beneficiaryType: row.beneficiary_type,
      beneficiaryId: row.beneficiary_id,
      settlementLineId: row.settlement_line_id,
      orderId: row.order_id,
      orderLineId: row.order_line_id,
      storefrontId: row.storefront_id,
      status: row.status,
      holdReasonCode: row.hold_reason_code,
      amountSummary: row.amount_summary,
      executionSummary,
      boundaryFlags: row.boundary_flags,
      sourceRefs: row.source_refs,
      batchId: row.batch_id,
      idempotencyKey: row.idempotency_key,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      errors: row.errors,
      warnings: row.warnings,
      providerEnvelope: executionSummary.providerEnvelope,
      providerMode: executionSummary.providerMode,
      providerName: executionSummary.providerName,
      providerReference: executionSummary.providerReference
    };
  }

  private mapBatchRow(row: any): PayoutBatch {
    return {
      batchId: row.batch_id,
      batchType: row.batch_type,
      status: row.status,
      beneficiaryType: row.beneficiary_type,
      itemIds: row.item_ids,
      totalAmount: Number(row.total_amount),
      currency: row.currency,
      scheduledExecutionAt: row.scheduled_execution_at ? row.scheduled_execution_at.toISOString() : undefined,
      ownerAdminId: row.owner_admin_id,
      foundationOnly: row.foundation_only,
      actualProviderPayoutPerformed: row.actual_provider_payout_performed,
      paymentInstructionCreated: row.payment_instruction_created,
      idempotencyKey: row.idempotency_key,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      errors: row.errors,
      warnings: row.warnings
    };
  }

  async createItems(items: PayoutItem[]): Promise<void> {
    if (items.length === 0) return;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of items) {
        await client.query(`
          INSERT INTO payout_items (
            payout_item_id, beneficiary_type, beneficiary_id, settlement_line_id,
            order_id, order_line_id, storefront_id, status, hold_reason_code,
            amount_summary, execution_summary, boundary_flags, source_refs,
            batch_id, idempotency_key, errors, warnings, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        `, [
          item.payoutItemId, item.beneficiaryType, item.beneficiaryId, item.settlementLineId,
          item.orderId, item.orderLineId, item.storefrontId, item.status, item.holdReasonCode,
          item.amountSummary, item.executionSummary, item.boundaryFlags, JSON.stringify(item.sourceRefs),
          item.batchId, item.idempotencyKey, JSON.stringify(item.errors), JSON.stringify(item.warnings),
          item.createdAt, item.updatedAt
        ]);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateItem(payoutItemId: string, updates: Partial<PayoutItem>): Promise<void> {
    const normalizedUpdates: Partial<PayoutItem> = { ...updates };
    const providerUpdateKeys = ['providerEnvelope', 'providerMode', 'providerName', 'providerReference'] as const;
    const hasProviderUpdates = providerUpdateKeys.some(key => key in normalizedUpdates);

    if (hasProviderUpdates) {
      const existing = await this.getItemById(payoutItemId);
      const currentExecutionSummary = existing?.executionSummary || {};
      normalizedUpdates.executionSummary = {
        ...currentExecutionSummary,
        ...normalizedUpdates.executionSummary,
        providerEnvelope: normalizedUpdates.providerEnvelope ?? existing?.providerEnvelope,
        providerMode: normalizedUpdates.providerMode ?? existing?.providerMode,
        providerName: normalizedUpdates.providerName ?? existing?.providerName,
        providerReference: normalizedUpdates.providerReference ?? existing?.providerReference,
      } as any;

      for (const key of providerUpdateKeys) {
        delete (normalizedUpdates as any)[key];
      }
    }

    const keys = Object.keys(normalizedUpdates);
    if (keys.length === 0) return;
    
    const setClause = keys.map((k, i) => {
      const dbKey = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      return `${dbKey} = $${i + 2}`;
    }).join(', ') + `, updated_at = NOW()`;

    const values = keys.map(k => {
      const val = (normalizedUpdates as any)[k];
      return (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val;
    });

    await this.pool.query(
      `UPDATE payout_items SET ${setClause} WHERE payout_item_id = $1`,
      [payoutItemId, ...values]
    );
  }

  async getItemById(payoutItemId: string): Promise<PayoutItem | null> {
    const res = await this.pool.query('SELECT * FROM payout_items WHERE payout_item_id = $1', [payoutItemId]);
    if (res.rows.length === 0) return null;
    return this.mapItemRow(res.rows[0]);
  }

  async listItems(query: ListPayoutItemsQuery): Promise<PayoutItemListResponse> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (query.beneficiaryType) {
      conditions.push(`beneficiary_type = $${idx++}`);
      values.push(query.beneficiaryType);
    }
    if (query.beneficiaryId) {
      conditions.push(`beneficiary_id = $${idx++}`);
      values.push(query.beneficiaryId);
    }
    if (query.settlementLineId) {
      conditions.push(`settlement_line_id = $${idx++}`);
      values.push(query.settlementLineId);
    }
    if (query.batchId) {
      conditions.push(`batch_id = $${idx++}`);
      values.push(query.batchId);
    }
    if (query.status) {
      conditions.push(`status = $${idx++}`);
      values.push(query.status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countRes = await this.pool.query(`SELECT COUNT(*) FROM payout_items ${where}`, values);
    const total = parseInt(countRes.rows[0].count, 10);

    let sql = `SELECT * FROM payout_items ${where} ORDER BY created_at DESC`;
    if (query.limit !== undefined) {
      sql += ` LIMIT $${idx++}`;
      values.push(query.limit);
    }
    if (query.offset !== undefined) {
      sql += ` OFFSET $${idx++}`;
      values.push(query.offset);
    }

    const res = await this.pool.query(sql, values);
    return {
      payoutItems: res.rows.map((r: any) => this.mapItemRow(r)),
      total
    };
  }

  async createBatch(batch: PayoutBatch): Promise<void> {
    await this.pool.query(`
      INSERT INTO payout_batches (
        batch_id, batch_type, status, beneficiary_type, item_ids, total_amount, currency,
        scheduled_execution_at, owner_admin_id, foundation_only, actual_provider_payout_performed,
        payment_instruction_created, idempotency_key, errors, warnings, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `, [
      batch.batchId, batch.batchType, batch.status, batch.beneficiaryType, JSON.stringify(batch.itemIds),
      batch.totalAmount, batch.currency, batch.scheduledExecutionAt, batch.ownerAdminId, batch.foundationOnly,
      batch.actualProviderPayoutPerformed, batch.paymentInstructionCreated, batch.idempotencyKey,
      JSON.stringify(batch.errors), JSON.stringify(batch.warnings), batch.createdAt, batch.updatedAt
    ]);
  }

  async updateBatch(batchId: string, updates: Partial<PayoutBatch>): Promise<void> {
    const keys = Object.keys(updates);
    if (keys.length === 0) return;
    
    const setClause = keys.map((k, i) => {
      const dbKey = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      return `${dbKey} = $${i + 2}`;
    }).join(', ') + `, updated_at = NOW()`;

    const values = keys.map(k => {
      const val = (updates as any)[k];
      return (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val;
    });

    await this.pool.query(
      `UPDATE payout_batches SET ${setClause} WHERE batch_id = $1`,
      [batchId, ...values]
    );
  }

  async getBatchById(batchId: string): Promise<PayoutBatch | null> {
    const res = await this.pool.query('SELECT * FROM payout_batches WHERE batch_id = $1', [batchId]);
    if (res.rows.length === 0) return null;
    return this.mapBatchRow(res.rows[0]);
  }

  async listBatches(query: ListPayoutBatchesQuery): Promise<PayoutBatchListResponse> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (query.batchType) {
      conditions.push(`batch_type = $${idx++}`);
      values.push(query.batchType);
    }
    if (query.status) {
      conditions.push(`status = $${idx++}`);
      values.push(query.status);
    }
    if (query.beneficiaryType) {
      conditions.push(`beneficiary_type = $${idx++}`);
      values.push(query.beneficiaryType);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countRes = await this.pool.query(`SELECT COUNT(*) FROM payout_batches ${where}`, values);
    const total = parseInt(countRes.rows[0].count, 10);

    let sql = `SELECT * FROM payout_batches ${where} ORDER BY created_at DESC`;
    if (query.limit !== undefined) {
      sql += ` LIMIT $${idx++}`;
      values.push(query.limit);
    }
    if (query.offset !== undefined) {
      sql += ` OFFSET $${idx++}`;
      values.push(query.offset);
    }

    const res = await this.pool.query(sql, values);
    return {
      batches: res.rows.map((r: any) => this.mapBatchRow(r)),
      total
    };
  }

  async getItemIdsByIdempotencyKey(idempotencyKey: string): Promise<string[] | null> {
    const res = await this.pool.query('SELECT payout_item_ids FROM payout_idempotency WHERE idempotency_key = $1 AND scope = $2', [idempotencyKey, 'item']);
    if (res.rows.length === 0) return null;
    return res.rows[0].payout_item_ids;
  }

  async getBatchIdByIdempotencyKey(idempotencyKey: string): Promise<string | null> {
    const res = await this.pool.query('SELECT batch_id FROM payout_idempotency WHERE idempotency_key = $1 AND scope = $2', [idempotencyKey, 'batch']);
    if (res.rows.length === 0) return null;
    return res.rows[0].batch_id;
  }

  async saveItemIdempotencyKey(idempotencyKey: string, payoutItemIds: string[]): Promise<void> {
    await this.pool.query(`
      INSERT INTO payout_idempotency (idempotency_key, scope, payout_item_ids) 
      VALUES ($1, $2, $3) ON CONFLICT (idempotency_key) DO NOTHING
    `, [idempotencyKey, 'item', JSON.stringify(payoutItemIds)]);
  }

  async saveBatchIdempotencyKey(idempotencyKey: string, batchId: string): Promise<void> {
    await this.pool.query(`
      INSERT INTO payout_idempotency (idempotency_key, scope, batch_id) 
      VALUES ($1, $2, $3) ON CONFLICT (idempotency_key) DO NOTHING
    `, [idempotencyKey, 'batch', batchId]);
  }

  async createPayoutCandidate(_candidate: PayoutCandidate): Promise<void> {
    throw new Error('PAYOUT_CANDIDATE_POSTGRES_FOUNDATION_UNAVAILABLE');
  }

  async updatePayoutCandidate(_payoutCandidateId: string, _updates: Partial<PayoutCandidate>): Promise<void> {
    throw new Error('PAYOUT_CANDIDATE_POSTGRES_FOUNDATION_UNAVAILABLE');
  }

  async getPayoutCandidateById(_payoutCandidateId: string): Promise<PayoutCandidate | null> {
    throw new Error('PAYOUT_CANDIDATE_POSTGRES_FOUNDATION_UNAVAILABLE');
  }

  async getPayoutCandidateBySourceFingerprint(_sourceFingerprint: string): Promise<PayoutCandidate | null> {
    throw new Error('PAYOUT_CANDIDATE_POSTGRES_FOUNDATION_UNAVAILABLE');
  }

  async savePayoutCandidateSourceFingerprint(_sourceFingerprint: string, _payoutCandidateId: string): Promise<void> {
    throw new Error('PAYOUT_CANDIDATE_POSTGRES_FOUNDATION_UNAVAILABLE');
  }

  async listPayoutCandidates(): Promise<PayoutCandidateListResponse> {
    throw new Error('PAYOUT_CANDIDATE_POSTGRES_FOUNDATION_UNAVAILABLE');
  }
}
