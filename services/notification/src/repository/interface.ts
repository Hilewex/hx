import { 
  NotificationRecord, 
  NotificationListQuery, 
  NotificationDeliveryAttempt 
} from '@hx/contracts';

export interface INotificationRepository {
  create(notification: NotificationRecord): Promise<void>;
  findById(notificationId: string): Promise<NotificationRecord | null>;
  list(query: NotificationListQuery): Promise<{ items: NotificationRecord[]; unreadCount: number; nextCursor?: string }>;
  updateState(notificationId: string, state: 'READ' | 'ARCHIVED', timestamp: string): Promise<void>;
  
  // Idempotency
  checkIdempotency(key: string): Promise<string | null>; // Returns notificationId if exists
  saveIdempotency(key: string, notificationId: string): Promise<void>;

  // Delivery Attempts
  addDeliveryAttempt(attempt: NotificationDeliveryAttempt): Promise<void>;
  getDeliveryAttempts(notificationId: string): Promise<NotificationDeliveryAttempt[]>;
}
