import { Pool } from 'pg';
import { RiskSignal, RiskCase } from '@hx/contracts';
import { IRiskRepository } from './interface';

export class PostgresRiskRepository implements IRiskRepository {
  constructor(private pool: Pool) {}

  async createSignal(signal: RiskSignal): Promise<void> {
    await this.pool.query(
      `INSERT INTO risk_signals (
        signal_id, target_id, target_type, type, level, source, reason_code, metadata, idempotency_key, created_at,
        risk_truth_mutated, target_truth_mutated, payment_truth_mutated, order_truth_mutated, refund_truth_mutated, finance_truth_mutated, moderation_truth_mutated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        signal.signalId,
        signal.target.targetId,
        signal.target.targetType,
        signal.type,
        signal.level,
        signal.source,
        signal.reasonCode,
        signal.metadata || null,
        signal.idempotencyKey || null,
        signal.createdAt,
        signal.riskTruthMutated,
        signal.targetTruthMutated,
        signal.paymentTruthMutated,
        signal.orderTruthMutated,
        signal.refundTruthMutated,
        signal.financeTruthMutated,
        signal.moderationTruthMutated,
      ]
    );
  }

  async createCase(riskCase: RiskCase): Promise<void> {
    await this.pool.query(
      `INSERT INTO risk_cases (
        case_id, target_id, target_type, status, level, source, decision, reason_code, notes, signals, idempotency_key, created_at, updated_at,
        risk_truth_mutated, target_truth_mutated, payment_truth_mutated, order_truth_mutated, refund_truth_mutated, finance_truth_mutated, moderation_truth_mutated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
      [
        riskCase.caseId,
        riskCase.target.targetId,
        riskCase.target.targetType,
        riskCase.status,
        riskCase.level,
        riskCase.source,
        riskCase.decision || null,
        riskCase.reasonCode,
        riskCase.notes || null,
        JSON.stringify(riskCase.signals),
        riskCase.idempotencyKey || null,
        riskCase.createdAt,
        riskCase.updatedAt,
        riskCase.riskTruthMutated,
        riskCase.targetTruthMutated,
        riskCase.paymentTruthMutated,
        riskCase.orderTruthMutated,
        riskCase.refundTruthMutated,
        riskCase.financeTruthMutated,
        riskCase.moderationTruthMutated,
      ]
    );
  }

  async updateCase(caseId: string, updates: Partial<RiskCase>): Promise<void> {
    const setClause: string[] = [];
    const values: any[] = [];
    let i = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'caseId') continue;
      
      const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      setClause.push(`${dbKey} = $${i}`);
      values.push(Array.isArray(value) ? JSON.stringify(value) : value);
      i++;
    }

    if (setClause.length === 0) return;

    values.push(caseId);
    await this.pool.query(
      `UPDATE risk_cases SET ${setClause.join(', ')} WHERE case_id = $${i}`,
      values
    );
  }

  async getCase(caseId: string): Promise<RiskCase | null> {
    const result = await this.pool.query('SELECT * FROM risk_cases WHERE case_id = $1', [caseId]);
    if (result.rows.length === 0) return null;
    return this.mapToDomain(result.rows[0]);
  }

  async listCases(query: any): Promise<{ cases: RiskCase[]; total: number }> {
    let whereClause: string[] = [];
    let values: any[] = [];
    let i = 1;

    if (query.targetId) {
      whereClause.push(`target_id = $${i++}`);
      values.push(query.targetId);
    }
    if (query.targetType) {
      whereClause.push(`target_type = $${i++}`);
      values.push(query.targetType);
    }
    if (query.status) {
      whereClause.push(`status = $${i++}`);
      values.push(query.status);
    }
    if (query.level) {
      whereClause.push(`level = $${i++}`);
      values.push(query.level);
    }

    const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';
    const offset = query.offset || 0;
    const limit = query.limit || 50;

    const [countResult, rowsResult] = await Promise.all([
      this.pool.query(`SELECT COUNT(*) FROM risk_cases ${whereString}`, values),
      this.pool.query(
        `SELECT * FROM risk_cases ${whereString} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`,
        [...values, limit, offset]
      ),
    ]);

    return {
      total: parseInt(countResult.rows[0].count, 10),
      cases: rowsResult.rows.map(row => this.mapToDomain(row)),
    };
  }

  async listSignals(query: any): Promise<{ signals: RiskSignal[]; total: number }> {
    let whereClause: string[] = [];
    let values: any[] = [];
    let i = 1;

    if (query.targetId) {
      whereClause.push(`target_id = $${i++}`);
      values.push(query.targetId);
    }
    if (query.targetType) {
      whereClause.push(`target_type = $${i++}`);
      values.push(query.targetType);
    }

    const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';
    const offset = query.offset || 0;
    const limit = query.limit || 50;

    const [countResult, rowsResult] = await Promise.all([
      this.pool.query(`SELECT COUNT(*) FROM risk_signals ${whereString}`, values),
      this.pool.query(
        `SELECT * FROM risk_signals ${whereString} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`,
        [...values, limit, offset]
      ),
    ]);

    return {
      total: parseInt(countResult.rows[0].count, 10),
      signals: rowsResult.rows.map(row => ({
        signalId: row.signal_id,
        target: {
          targetId: row.target_id,
          targetType: row.target_type,
        },
        type: row.type,
        level: row.level,
        source: row.source,
        reasonCode: row.reason_code,
        metadata: row.metadata,
        idempotencyKey: row.idempotency_key || undefined,
        createdAt: row.created_at,
        riskTruthMutated: row.risk_truth_mutated,
        targetTruthMutated: row.target_truth_mutated,
        paymentTruthMutated: row.payment_truth_mutated,
        orderTruthMutated: row.order_truth_mutated,
        refundTruthMutated: row.refund_truth_mutated,
        financeTruthMutated: row.finance_truth_mutated,
        moderationTruthMutated: row.moderation_truth_mutated,
      })),
    };
  }

  async checkIdempotency(key: string): Promise<string | null> {
    const res = await this.pool.query('SELECT result_id FROM risk_idempotency WHERE idempotency_key = $1', [key]);
    return res.rows.length > 0 ? res.rows[0].result_id : null;
  }

  async saveIdempotency(key: string, result: string): Promise<void> {
    await this.pool.query(
      'INSERT INTO risk_idempotency (idempotency_key, result_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [key, result]
    );
  }

  private mapToDomain(row: any): RiskCase {
    return {
      caseId: row.case_id,
      target: {
        targetId: row.target_id,
        targetType: row.target_type,
      },
      status: row.status,
      level: row.level,
      source: row.source,
      decision: row.decision || undefined,
      reasonCode: row.reason_code,
      notes: row.notes || undefined,
      signals: typeof row.signals === 'string' ? JSON.parse(row.signals) : row.signals,
      idempotencyKey: row.idempotency_key || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      riskTruthMutated: row.risk_truth_mutated,
      targetTruthMutated: row.target_truth_mutated,
      paymentTruthMutated: row.payment_truth_mutated,
      orderTruthMutated: row.order_truth_mutated,
      refundTruthMutated: row.refund_truth_mutated,
      financeTruthMutated: row.finance_truth_mutated,
      moderationTruthMutated: row.moderation_truth_mutated,
    };
  }
}
