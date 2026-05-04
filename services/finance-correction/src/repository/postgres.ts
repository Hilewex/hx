import { Pool } from 'pg';
import { 
  FinanceCorrectionRecord, 
  ListFinanceCorrectionsQuery 
} from '@hx/contracts';
import { IFinanceCorrectionRepository } from './interface';

export class PostgresFinanceCorrectionRepository implements IFinanceCorrectionRepository {
  constructor(private pool: Pool) {}

  private mapRowToRecord(row: any): FinanceCorrectionRecord {
    return {
      correctionId: row.correction_id,
      target: {
        targetType: row.target_type,
        targetId: row.target_id,
      },
      status: row.status,
      severity: row.severity,
      reasonCode: row.reason_code,
      sourceRefs: row.source_refs,
      amountSummary: row.amount_summary,
      impactSummary: row.impact_summary,
      notes: row.notes || undefined,
      idempotencyKey: row.idempotency_key || undefined,
      errors: row.errors,
      warnings: row.warnings,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  async create(record: FinanceCorrectionRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO finance_corrections (
        correction_id, target_type, target_id, status, severity, reason_code,
        source_refs, amount_summary, impact_summary, notes, idempotency_key, errors, warnings, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        record.correctionId,
        record.target.targetType,
        record.target.targetId,
        record.status,
        record.severity,
        record.reasonCode,
        JSON.stringify(record.sourceRefs),
        JSON.stringify(record.amountSummary),
        JSON.stringify(record.impactSummary),
        record.notes || null,
        record.idempotencyKey || null,
        JSON.stringify(record.errors),
        JSON.stringify(record.warnings),
        record.createdAt,
        record.updatedAt,
      ]
    );
  }

  async update(correctionId: string, updates: Partial<FinanceCorrectionRecord>): Promise<void> {
    const sets: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (updates.status !== undefined) {
      sets.push(`status = $${i++}`);
      values.push(updates.status);
    }
    if (updates.severity !== undefined) {
      sets.push(`severity = $${i++}`);
      values.push(updates.severity);
    }
    if (updates.reasonCode !== undefined) {
      sets.push(`reason_code = $${i++}`);
      values.push(updates.reasonCode);
    }
    if (updates.sourceRefs !== undefined) {
      sets.push(`source_refs = $${i++}`);
      values.push(JSON.stringify(updates.sourceRefs));
    }
    if (updates.amountSummary !== undefined) {
      sets.push(`amount_summary = $${i++}`);
      values.push(JSON.stringify(updates.amountSummary));
    }
    if (updates.impactSummary !== undefined) {
      sets.push(`impact_summary = $${i++}`);
      values.push(JSON.stringify(updates.impactSummary));
    }
    if (updates.notes !== undefined) {
      sets.push(`notes = $${i++}`);
      values.push(updates.notes);
    }
    if (updates.errors !== undefined) {
      sets.push(`errors = $${i++}`);
      values.push(JSON.stringify(updates.errors));
    }
    if (updates.warnings !== undefined) {
      sets.push(`warnings = $${i++}`);
      values.push(JSON.stringify(updates.warnings));
    }
    if (updates.updatedAt !== undefined) {
      sets.push(`updated_at = $${i++}`);
      values.push(updates.updatedAt);
    }

    if (sets.length === 0) return;

    values.push(correctionId);
    await this.pool.query(
      `UPDATE finance_corrections SET ${sets.join(', ')} WHERE correction_id = $${i}`,
      values
    );
  }

  async getById(correctionId: string): Promise<FinanceCorrectionRecord | undefined> {
    const res = await this.pool.query(
      'SELECT * FROM finance_corrections WHERE correction_id = $1',
      [correctionId]
    );
    if (res.rows.length === 0) return undefined;
    return this.mapRowToRecord(res.rows[0]);
  }

  async list(query: ListFinanceCorrectionsQuery): Promise<{ corrections: FinanceCorrectionRecord[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (query.targetType) {
      conditions.push(`target_type = $${i++}`);
      values.push(query.targetType);
    }
    if (query.targetId) {
      conditions.push(`target_id = $${i++}`);
      values.push(query.targetId);
    }
    if (query.status) {
      conditions.push(`status = $${i++}`);
      values.push(query.status);
    }
    if (query.reasonCode) {
      conditions.push(`reason_code = $${i++}`);
      values.push(query.reasonCode);
    }
    if (query.severity) {
      conditions.push(`severity = $${i++}`);
      values.push(query.severity);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countRes = await this.pool.query(
      `SELECT COUNT(*) FROM finance_corrections ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0].count, 10);

    let sql = `SELECT * FROM finance_corrections ${whereClause} ORDER BY created_at DESC`;
    
    if (query.limit !== undefined) {
      sql += ` LIMIT $${i++}`;
      values.push(query.limit);
    }
    if (query.offset !== undefined) {
      sql += ` OFFSET $${i++}`;
      values.push(query.offset);
    }

    const res = await this.pool.query(sql, values);
    return {
      corrections: res.rows.map(row => this.mapRowToRecord(row)),
      total,
    };
  }

  async getByIdempotencyKey(idempotencyKey: string): Promise<string | undefined> {
    const res = await this.pool.query(
      'SELECT correction_id FROM finance_correction_idempotency WHERE idempotency_key = $1',
      [idempotencyKey]
    );
    if (res.rows.length === 0) return undefined;
    return res.rows[0].correction_id;
  }

  async saveIdempotencyKey(idempotencyKey: string, correctionId: string): Promise<void> {
    await this.pool.query(
      'INSERT INTO finance_correction_idempotency (idempotency_key, correction_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [idempotencyKey, correctionId]
    );
  }
}
