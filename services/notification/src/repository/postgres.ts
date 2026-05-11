import { 
  NotificationRecord, 
  NotificationListQuery, 
  NotificationDeliveryAttempt 
} from '@hx/contracts';
import { INotificationRepository } from './interface';
// @ts-ignore
import { Pool } from 'pg';

export class PostgresNotificationRepository implements INotificationRepository {
  constructor(private pool: Pool) {}

  async create(n: NotificationRecord): Promise<void> {
    const query = `
      INSERT INTO notifications (
        notification_id, actor_type, actor_id, category, priority, 
        state, delivery_mode, channels, title, body, 
        object_type, object_id, correlation_id, idempotency_key, 
        created_at, is_mandatory, preference_overridable,
        notification_truth_mutated, payment_truth_mutated, 
        order_truth_mutated, refund_truth_mutated, 
        settlement_truth_mutated, payout_truth_mutated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
    `;
    await this.pool.query(query, [
      n.notificationId, n.actorType, n.actorId, n.category, n.priority,
      n.state, n.deliveryMode, JSON.stringify(n.channels), n.title, n.body,
      n.objectType, n.objectId, n.correlationId, n.idempotencyKey,
      n.createdAt, n.isMandatory, n.preferenceOverridable,
      n.notificationTruthMutated, n.paymentTruthMutated,
      n.orderTruthMutated, n.refundTruthMutated,
      n.settlementTruthMutated, n.payoutTruthMutated
    ]);
  }

  async findById(notificationId: string): Promise<NotificationRecord | null> {
    const res = await this.pool.query('SELECT * FROM notifications WHERE notification_id = $1', [notificationId]);
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    const attempts = await this.getDeliveryAttempts(notificationId);
    return this.mapRowToRecord(row, attempts);
  }

  async list(query: NotificationListQuery): Promise<{ items: NotificationRecord[]; unreadCount: number; nextCursor?: string }> {
    let sql = 'SELECT * FROM notifications WHERE actor_type = $1 AND actor_id = $2';
    const params: any[] = [query.actorType, query.actorId];
    
    if (query.state) {
      params.push(query.state);
      sql += ` AND state = $${params.length}`;
    }
    if (query.category) {
      params.push(query.category);
      sql += ` AND category = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';

    if (query.limit) {
      params.push(query.limit);
      sql += ` LIMIT $${params.length}`;
    }

    const res = await this.pool.query(sql, params);
    
    const unreadRes = await this.pool.query(
      'SELECT count(*) FROM notifications WHERE actor_type = $1 AND actor_id = $2 AND state = \'UNREAD\'',
      [query.actorType, query.actorId]
    );

    const items = await Promise.all(res.rows.map(async (row: any) => {
      const attempts = await this.getDeliveryAttempts(row.notification_id);
      return this.mapRowToRecord(row, attempts);
    }));

    return {
      items,
      unreadCount: parseInt(unreadRes.rows[0].count, 10)
    };
  }

  async updateState(notificationId: string, state: 'READ' | 'ARCHIVED', timestamp: string): Promise<void> {
    const field = state === 'READ' ? 'read_at' : 'archived_at';
    await this.pool.query(
      `UPDATE notifications SET state = $1, ${field} = $2 WHERE notification_id = $3`,
      [state, timestamp, notificationId]
    );
  }

  async checkIdempotency(key: string): Promise<string | null> {
    const res = await this.pool.query('SELECT notification_id FROM notification_idempotency WHERE idempotency_key = $1', [key]);
    return res.rows.length > 0 ? res.rows[0].notification_id : null;
  }

  async saveIdempotency(key: string, notificationId: string): Promise<void> {
    await this.pool.query(
      'INSERT INTO notification_idempotency (idempotency_key, notification_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [key, notificationId]
    );
  }

  async addDeliveryAttempt(attempt: NotificationDeliveryAttempt): Promise<void> {
    await this.pool.query(
      `INSERT INTO notification_delivery_attempts (
        attempt_id, notification_id, provider_type, state, attempted_at, error, actual_provider_delivery_performed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        attempt.attemptId, attempt.notificationId, attempt.providerType, 
        attempt.state, attempt.attemptedAt, attempt.error, attempt.actualProviderDeliveryPerformed
      ]
    );
  }

  async getDeliveryAttempts(notificationId: string): Promise<NotificationDeliveryAttempt[]> {
    const res = await this.pool.query(
      'SELECT * FROM notification_delivery_attempts WHERE notification_id = $1 ORDER BY attempted_at ASC',
      [notificationId]
    );
    return res.rows.map((row: any) => ({
      attemptId: row.attempt_id,
      notificationId: row.notification_id,
      providerType: row.provider_type,
      state: row.state,
      attemptedAt: row.attempted_at,
      error: row.error,
      actualProviderDeliveryPerformed: row.actual_provider_delivery_performed,
      deliveryTruth: false,
      providerBoundary: mapProviderBoundary(row.provider_type, row.state)
    }));
  }

  private mapRowToRecord(row: any, attempts: NotificationDeliveryAttempt[]): NotificationRecord {
    return {
      notificationId: row.notification_id,
      actorType: row.actor_type,
      actorId: row.actor_id,
      recipientActorType: row.actor_type,
      recipientActorId: row.actor_id,
      actorContextSource: 'SERVICE_COMMAND',
      category: row.category,
      priority: row.priority,
      state: row.state,
      deliveryMode: row.delivery_mode,
      channels: typeof row.channels === 'string' ? JSON.parse(row.channels) : row.channels,
      title: row.title,
      body: row.body,
      objectType: row.object_type,
      objectId: row.object_id,
      correlationId: row.correlation_id,
      schemaVersion: 'v1',
      idempotencyKey: row.idempotency_key,
      createdAt: row.created_at,
      readAt: row.read_at,
      archivedAt: row.archived_at,
      isMandatory: row.is_mandatory,
      preferenceOverridable: row.preference_overridable,
      notificationTruthMutated: row.notification_truth_mutated,
      businessTruthMutated: false,
      ownerStateMutated: false,
      ownerTruthMutatedByNotification: false,
      deliveryTruth: false,
      actualProviderDeliveryPerformed: false,
      outboxDeliveryGuaranteed: false,
      paymentTruthMutated: false,
      orderTruthMutated: false,
      refundTruthMutated: false,
      settlementTruthMutated: false,
      payoutTruthMutated: false,
      financeTruthMutated: false,
      moderationTruthMutated: false,
      customerTruthMutated: false,
      supportTruthMutated: false,
      bffTruthMutated: false,
      uiTruthMutated: false,
      providerBoundaryChecked: true,
      templateRendered: true,
      piiDetected: false,
      piiMasked: false,
      piiMinimized: false,
      piiDroppedFields: [],
      deliveryAttempts: attempts
    };
  }
}

function mapProviderBoundary(providerType: string, state: string): 'SANDBOX' | 'PARKED' | 'NOT_CONFIGURED' | 'LOCAL_ONLY' {
  if (providerType === 'EMAIL_SANDBOX') return 'SANDBOX';
  if (state === 'PUSH_PROVIDER_PARKED') return 'PARKED';
  if (state === 'PROVIDER_NOT_CONFIGURED') return 'NOT_CONFIGURED';
  return 'LOCAL_ONLY';
}
