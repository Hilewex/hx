import { SettlementLine, ListSettlementLinesQuery, SettlementLineListResponse, SettlementPartyType, SettlementLineStatus, SettlementReasonCode } from '@hx/contracts';
import { ISettlementRepository } from './interface';
import { Pool } from 'pg';

export class PostgresSettlementRepository implements ISettlementRepository {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async createMany(lines: SettlementLine[]): Promise<void> {
    if (lines.length === 0) return;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const queryText = `
        INSERT INTO settlement_lines (
          settlement_line_id, order_id, order_line_id, storefront_id, product_id, variant_id,
          party_type, party_id, status, reason_code, amount_summary, impact_summary, source_refs,
          idempotency_key, errors, warnings, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `;

      for (const line of lines) {
        await client.query(queryText, [
          line.settlementLineId,
          line.orderId,
          line.orderLineId,
          line.storefrontId,
          line.productId,
          line.variantId || null,
          line.partyType,
          line.partyId || null,
          line.status,
          line.reasonCode,
          JSON.stringify(line.amountSummary),
          JSON.stringify(line.impactSummary),
          JSON.stringify(line.sourceRefs),
          line.idempotencyKey || null,
          JSON.stringify(line.errors),
          JSON.stringify(line.warnings),
          line.createdAt,
          line.updatedAt
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

  async update(settlementLineId: string, updates: Partial<SettlementLine>): Promise<void> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let i = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'settlementLineId') continue;
      
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      setClauses.push(`${snakeKey} = $${i}`);
      
      if (typeof value === 'object' && value !== null) {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
      i++;
    }

    if (setClauses.length === 0) return;

    values.push(settlementLineId);
    const queryText = `UPDATE settlement_lines SET ${setClauses.join(', ')} WHERE settlement_line_id = $${i}`;

    await this.pool.query(queryText, values);
  }

  async getById(settlementLineId: string): Promise<SettlementLine | null> {
    const res = await this.pool.query('SELECT * FROM settlement_lines WHERE settlement_line_id = $1', [settlementLineId]);
    if (res.rows.length === 0) return null;
    return this.mapRow(res.rows[0]);
  }

  async list(query: ListSettlementLinesQuery): Promise<SettlementLineListResponse> {
    const conditions: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (query.orderId) {
      conditions.push(`order_id = $${i++}`);
      values.push(query.orderId);
    }
    if (query.orderLineId) {
      conditions.push(`order_line_id = $${i++}`);
      values.push(query.orderLineId);
    }
    if (query.storefrontId) {
      conditions.push(`storefront_id = $${i++}`);
      values.push(query.storefrontId);
    }
    if (query.partyType) {
      conditions.push(`party_type = $${i++}`);
      values.push(query.partyType);
    }
    if (query.status) {
      conditions.push(`status = $${i++}`);
      values.push(query.status);
    }
    if (query.reasonCode) {
      conditions.push(`reason_code = $${i++}`);
      values.push(query.reasonCode);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countRes = await this.pool.query(`SELECT COUNT(*) FROM settlement_lines ${whereClause}`, values);
    const total = parseInt(countRes.rows[0].count, 10);

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    values.push(limit, offset);
    const queryText = `SELECT * FROM settlement_lines ${whereClause} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`;
    
    const res = await this.pool.query(queryText, values);

    return {
      settlementLines: res.rows.map(this.mapRow),
      total
    };
  }

  async getByIdempotencyKey(idempotencyKey: string): Promise<string[] | null> {
    const res = await this.pool.query('SELECT settlement_line_ids FROM settlement_idempotency WHERE idempotency_key = $1', [idempotencyKey]);
    if (res.rows.length === 0) return null;
    return res.rows[0].settlement_line_ids;
  }

  async saveIdempotencyKey(idempotencyKey: string, settlementLineIds: string[]): Promise<void> {
    await this.pool.query(
      'INSERT INTO settlement_idempotency (idempotency_key, settlement_line_ids) VALUES ($1, $2) ON CONFLICT (idempotency_key) DO NOTHING',
      [idempotencyKey, JSON.stringify(settlementLineIds)]
    );
  }

  private mapRow(row: any): SettlementLine {
    return {
      settlementLineId: row.settlement_line_id,
      orderId: row.order_id,
      orderLineId: row.order_line_id,
      storefrontId: row.storefront_id,
      productId: row.product_id,
      variantId: row.variant_id || undefined,
      partyType: row.party_type as SettlementPartyType,
      partyId: row.party_id || undefined,
      status: row.status as SettlementLineStatus,
      reasonCode: row.reason_code as SettlementReasonCode,
      amountSummary: row.amount_summary,
      impactSummary: row.impact_summary,
      sourceRefs: row.source_refs,
      idempotencyKey: row.idempotency_key || undefined,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
      updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
      errors: row.errors,
      warnings: row.warnings
    };
  }
}
