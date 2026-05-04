import { 
  NotificationRecord, 
  NotificationListQuery, 
  NotificationDeliveryAttempt 
} from '@hx/contracts';
import { INotificationRepository } from './interface';

export class InMemoryNotificationRepository implements INotificationRepository {
  private notifications: Map<string, NotificationRecord> = new Map();
  private idempotency: Map<string, string> = new Map();
  private deliveryAttempts: Map<string, NotificationDeliveryAttempt[]> = new Map();

  async create(notification: NotificationRecord): Promise<void> {
    this.notifications.set(notification.notificationId, { ...notification });
  }

  async findById(notificationId: string): Promise<NotificationRecord | null> {
    const record = this.notifications.get(notificationId);
    if (!record) return null;
    return {
      ...record,
      deliveryAttempts: await this.getDeliveryAttempts(notificationId)
    };
  }

  async list(query: NotificationListQuery): Promise<{ items: NotificationRecord[]; unreadCount: number; nextCursor?: string }> {
    let items = Array.from(this.notifications.values())
      .filter(n => n.actorType === query.actorType && n.actorId === query.actorId);

    if (query.state) {
      items = items.filter(n => n.state === query.state);
    }
    if (query.category) {
      items = items.filter(n => n.category === query.category);
    }

    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const unreadCount = items.filter(n => n.state === 'UNREAD').length;

    if (query.limit) {
      items = items.slice(0, query.limit);
    }

    // Wrap items with delivery attempts
    const fullItems = await Promise.all(items.map(async item => ({
      ...item,
      deliveryAttempts: await this.getDeliveryAttempts(item.notificationId)
    })));

    return { items: fullItems, unreadCount };
  }

  async updateState(notificationId: string, state: 'READ' | 'ARCHIVED', timestamp: string): Promise<void> {
    const record = this.notifications.get(notificationId);
    if (record) {
      record.state = state;
      if (state === 'READ') record.readAt = timestamp;
      if (state === 'ARCHIVED') record.archivedAt = timestamp;
    }
  }

  async checkIdempotency(key: string): Promise<string | null> {
    return this.idempotency.get(key) || null;
  }

  async saveIdempotency(key: string, notificationId: string): Promise<void> {
    this.idempotency.set(key, notificationId);
  }

  async addDeliveryAttempt(attempt: NotificationDeliveryAttempt): Promise<void> {
    const attempts = this.deliveryAttempts.get(attempt.notificationId) || [];
    attempts.push({ ...attempt });
    this.deliveryAttempts.set(attempt.notificationId, attempts);
  }

  async getDeliveryAttempts(notificationId: string): Promise<NotificationDeliveryAttempt[]> {
    return this.deliveryAttempts.get(notificationId) || [];
  }
}
