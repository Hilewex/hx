import { 
  AnalyticsEventRecord, 
  MetricSnapshotRecord, 
  DashboardSeedRecord,
  GetMetricSnapshotQuery,
  ListMetricSnapshotsQuery
} from '@hx/contracts';
import { IAnalyticsRepository } from './interface';
import { Pool } from 'pg';

export class PostgresAnalyticsRepository implements IAnalyticsRepository {
  constructor(private pool: Pool) {}

  async createEvent(event: Omit<AnalyticsEventRecord, 'id' | 'ingestedAt'>): Promise<AnalyticsEventRecord> {
    const query = `
      INSERT INTO analytics_events (
        event_name, metric_family, metric_type, occurred_at, source, 
        data_quality_state, payload, idempotency_key, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      event.eventName, event.metricFamily, event.metricType, event.occurredAt,
      event.source, event.dataQualityState, event.payload, event.idempotencyKey, event.metadata
    ];
    const res = await this.pool.query(query, values);
    return this.mapEvent(res.rows[0]);
  }

  async getEventById(id: string): Promise<AnalyticsEventRecord | null> {
    const res = await this.pool.query('SELECT * FROM analytics_events WHERE id = $1', [id]);
    return res.rows[0] ? this.mapEvent(res.rows[0]) : null;
  }

  async getEventByIdempotencyKey(key: string): Promise<AnalyticsEventRecord | null> {
    const res = await this.pool.query(`
      SELECT e.* FROM analytics_events e
      JOIN analytics_idempotency i ON e.id = i.event_id
      WHERE i.key = $1
    `, [key]);
    return res.rows[0] ? this.mapEvent(res.rows[0]) : null;
  }

  async saveIdempotencyKey(key: string, eventId: string): Promise<void> {
    await this.pool.query(
      'INSERT INTO analytics_idempotency (key, event_id) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
      [key, eventId]
    );
  }

  async upsertMetricSnapshot(snapshot: Omit<MetricSnapshotRecord, 'id' | 'calculatedAt'>): Promise<MetricSnapshotRecord> {
    // Basic implementation: check if exists, then update or insert
    // In production, use UPSERT with proper unique constraint if available
    const checkQuery = `
      SELECT id FROM metric_snapshots 
      WHERE metric_name = $1 AND metric_family = $2 AND "window" = $3 AND grain = $4 AND tags = $5
    `;
    const checkRes = await this.pool.query(checkQuery, [
      snapshot.metricName, snapshot.metricFamily, snapshot.window, snapshot.grain, snapshot.tags
    ]);

    if (checkRes.rows[0]) {
      const updateQuery = `
        UPDATE metric_snapshots 
        SET value = $1, calculated_at = NOW(), warnings = $2
        WHERE id = $3
        RETURNING *
      `;
      const res = await this.pool.query(updateQuery, [snapshot.value, snapshot.warnings, checkRes.rows[0].id]);
      return this.mapSnapshot(res.rows[0]);
    } else {
      const insertQuery = `
        INSERT INTO metric_snapshots (metric_name, metric_family, metric_type, value, "window", grain, tags, warnings)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const res = await this.pool.query(insertQuery, [
        snapshot.metricName, snapshot.metricFamily, snapshot.metricType, 
        snapshot.value, snapshot.window, snapshot.grain, snapshot.tags, snapshot.warnings
      ]);
      return this.mapSnapshot(res.rows[0]);
    }
  }

  async getMetricSnapshot(query: GetMetricSnapshotQuery): Promise<MetricSnapshotRecord | null> {
    let sql = 'SELECT * FROM metric_snapshots WHERE metric_name = $1 AND metric_family = $2';
    const params: any[] = [query.metricName, query.metricFamily];
    
    if (query.window) {
      params.push(query.window);
      sql += ` AND "window" = $${params.length}`;
    }
    if (query.grain) {
      params.push(query.grain);
      sql += ` AND grain = $${params.length}`;
    }
    if (query.tags) {
      params.push(query.tags);
      sql += ` AND tags = $${params.length}`;
    }

    const res = await this.pool.query(sql, params);
    return res.rows[0] ? this.mapSnapshot(res.rows[0]) : null;
  }

  async listMetricSnapshots(query: ListMetricSnapshotsQuery): Promise<MetricSnapshotRecord[]> {
    let sql = 'SELECT * FROM metric_snapshots WHERE 1=1';
    const params: any[] = [];

    if (query.metricFamily) {
      params.push(query.metricFamily);
      sql += ` AND metric_family = $${params.length}`;
    }
    if (query.metricType) {
      params.push(query.metricType);
      sql += ` AND metric_type = $${params.length}`;
    }

    sql += ` ORDER BY calculated_at DESC LIMIT $${params.length + 1}`;
    params.push(query.limit || 100);

    const res = await this.pool.query(sql, params);
    return res.rows.map(r => this.mapSnapshot(r));
  }

  async getDashboardSeed(dashboardKey: string): Promise<DashboardSeedRecord | null> {
    const res = await this.pool.query('SELECT * FROM dashboard_seeds WHERE dashboard_key = $1', [dashboardKey]);
    if (res.rows[0]) return this.mapSeed(res.rows[0]);

    // Initial seeds if not found in DB
    if (dashboardKey === 'commerce_funnel') {
      return {
        id: 'seed-commerce',
        dashboardKey: 'commerce_funnel',
        title: 'Commerce Funnel',
        data: { funnel: [100, 80, 50, 20], status: 'healthy' },
        generatedAt: new Date().toISOString(),
        isDegraded: false,
        analyticsTruth: false,
        businessTruthMutated: false,
        ownerStateMutated: false,
        permissionTruth: false,
        eligibilityTruth: false,
        riskDecisionTruth: false,
        eventTruthMutated: false
      };
    }
    if (dashboardKey === 'degraded_error') {
      return {
        id: 'seed-error',
        dashboardKey: 'degraded_error',
        title: 'Degraded & Error Overview',
        data: { errors: 5, degradations: 2 },
        generatedAt: new Date().toISOString(),
        isDegraded: false,
        analyticsTruth: false,
        businessTruthMutated: false,
        ownerStateMutated: false,
        permissionTruth: false,
        eligibilityTruth: false,
        riskDecisionTruth: false,
        eventTruthMutated: false
      };
    }
    return null;
  }

  private mapEvent(row: any): AnalyticsEventRecord {
    const metadata = row.metadata || {};
    return {
      id: row.id,
      eventName: row.event_name,
      eventType: metadata.eventType || row.event_name,
      metricFamily: row.metric_family,
      metricType: row.metric_type,
      occurredAt: row.occurred_at.toISOString(),
      ingestedAt: row.ingested_at.toISOString(),
      source: row.source,
      surface: metadata.surface || 'unknown',
      actor: metadata.actor || { actorType: 'SYSTEM', actorId: 'system', authState: 'SYSTEM' },
      subject: metadata.subject,
      target: metadata.target,
      correlationId: metadata.correlationId || `analytics_${row.id}`,
      causationId: metadata.causationId,
      schemaVersion: metadata.schemaVersion || 'v1',
      dataQualityState: row.data_quality_state,
      payload: row.payload,
      idempotencyKey: row.idempotency_key,
      metadata,
      analyticsTruth: true,
      businessTruthMutated: false,
      ownerStateMutated: false,
      permissionTruth: false,
      eligibilityTruth: false,
      riskDecisionTruth: false,
      eventTruthMutated: false,
      outboxDeliveryGuaranteed: false
    };
  }

  private mapSnapshot(row: any): MetricSnapshotRecord {
    return {
      id: row.id,
      metricName: row.metric_name,
      metricFamily: row.metric_family,
      metricType: row.metric_type,
      value: parseFloat(row.value),
      window: row.window,
      grain: row.grain,
      calculatedAt: row.calculated_at.toISOString(),
      tags: row.tags,
      warnings: row.warnings,
      analyticsTruth: true,
      businessTruthMutated: false,
      ownerStateMutated: false,
      permissionTruth: false,
      eligibilityTruth: false,
      riskDecisionTruth: false,
      eventTruthMutated: false
    };
  }

  private mapSeed(row: any): DashboardSeedRecord {
    return {
      id: row.id,
      dashboardKey: row.dashboard_key,
      title: row.title,
      data: row.data,
      generatedAt: row.generated_at.toISOString(),
      isDegraded: row.is_degraded,
      analyticsTruth: false,
      businessTruthMutated: false,
      ownerStateMutated: false,
      permissionTruth: false,
      eligibilityTruth: false,
      riskDecisionTruth: false,
      eventTruthMutated: false
    };
  }
}
