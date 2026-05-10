import { 
  ModerationCase, 
  ListModerationCasesQuery,
  ModerationDecisionResult
} from '@hx/contracts';
import { query } from '@hx/persistence';
import { IModerationRepository } from './interface';

export class PostgresModerationRepository implements IModerationRepository {
  async create(mCase: ModerationCase, contentText?: string, mediaAssetIds?: string[]): Promise<void> {
    const { caseId, target, status, source, riskLevel, reasonCodes, createdAt, updatedAt } = mCase;
    
    // Insert case
    await query(`
      INSERT INTO moderation_cases (
        case_id, target_type, target_id, owner_actor_id, storefront_id, product_id,
        status, source, risk_level, reason_codes, created_at, updated_at, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      caseId, target.targetType, target.targetId, target.ownerActorId, target.storefrontId, target.productId,
      status, source, riskLevel, reasonCodes, createdAt, updatedAt, JSON.stringify(mCase)
    ]);

    // Insert initial snapshot
    if (mCase.snapshots && mCase.snapshots.length > 0) {
      const snap = mCase.snapshots[0];
      await query(`
        INSERT INTO moderation_snapshots (
          snapshot_id, case_id, content_text, media_asset_ids, source, risk_level, created_at, raw_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        snap.snapshotId, caseId, contentText, mediaAssetIds, snap.source, snap.riskLevel, snap.createdAt, JSON.stringify(snap)
      ]);
    }
  }

  async update(mCase: ModerationCase): Promise<void> {
    const { caseId, status, decision, decisionNote, updatedAt, reviewedAt, closedAt } = mCase;
    
    await query(`
      UPDATE moderation_cases SET
        status = $1,
        decision = $2,
        decision_note = $3,
        updated_at = $4,
        reviewed_at = $5,
        closed_at = $6,
        raw_data = $7
      WHERE case_id = $8
    `, [
      status, decision, decisionNote, updatedAt, reviewedAt, closedAt, JSON.stringify(mCase), caseId
    ]);
  }

  async getById(caseId: string): Promise<ModerationCase | null> {
    const res = await query('SELECT raw_data FROM moderation_cases WHERE case_id = $1', [caseId]);
    if (res.rowCount === 0) return null;
    return res.rows[0].raw_data as ModerationCase;
  }

  async list(q: ListModerationCasesQuery): Promise<ModerationCase[]> {
    let sql = 'SELECT raw_data FROM moderation_cases WHERE 1=1';
    const params: any[] = [];
    
    if (q.targetType) {
      params.push(q.targetType);
      sql += ` AND target_type = $${params.length}`;
    }
    if (q.status) {
      params.push(q.status);
      sql += ` AND status = $${params.length}`;
    }
    if (q.riskLevel) {
      params.push(q.riskLevel);
      sql += ` AND risk_level = $${params.length}`;
    }
    if (q.source) {
      params.push(q.source);
      sql += ` AND source = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';
    
    if (q.limit) {
      params.push(q.limit);
      sql += ` LIMIT $${params.length}`;
    } else {
      sql += ' LIMIT 10';
    }

    const res = await query(sql, params);
    return res.rows.map((r: any) => r.raw_data as ModerationCase);
  }

  async findByIdempotencyKey(key: string): Promise<string | null> {
    // Ensure table exists (simple approach for foundation)
    await query('CREATE TABLE IF NOT EXISTS _idempotency (key TEXT PRIMARY KEY, case_id TEXT NOT NULL)');
    const res = await query('SELECT case_id FROM _idempotency WHERE key = $1', [key]);
    if (res.rowCount === 0) return null;
    return res.rows[0].case_id;
  }

  async saveIdempotencyKey(key: string, caseId: string): Promise<void> {
    // Ensure table exists (simple approach for foundation)
    await query('CREATE TABLE IF NOT EXISTS _idempotency (key TEXT PRIMARY KEY, case_id TEXT NOT NULL)');
    await query('INSERT INTO _idempotency (key, case_id) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING', [key, caseId]);
  }

  async findDecisionByIdempotencyKey(key: string): Promise<{ fingerprint: string; result: ModerationDecisionResult } | null> {
    await query('CREATE TABLE IF NOT EXISTS _moderation_decision_idempotency (key TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, result JSONB NOT NULL)');
    const res = await query('SELECT fingerprint, result FROM _moderation_decision_idempotency WHERE key = $1', [key]);
    if (res.rowCount === 0) return null;
    return {
      fingerprint: res.rows[0].fingerprint,
      result: res.rows[0].result as ModerationDecisionResult,
    };
  }

  async saveDecisionIdempotencyKey(key: string, fingerprint: string, result: ModerationDecisionResult): Promise<void> {
    await query('CREATE TABLE IF NOT EXISTS _moderation_decision_idempotency (key TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, result JSONB NOT NULL)');
    await query(
      'INSERT INTO _moderation_decision_idempotency (key, fingerprint, result) VALUES ($1, $2, $3) ON CONFLICT (key) DO NOTHING',
      [key, fingerprint, JSON.stringify(result)]
    );
  }
}
