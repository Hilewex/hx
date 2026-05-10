import { ProviderResultEnvelope } from './provider';
export type NotificationActorType = 'CUSTOMER' | 'CREATOR' | 'SUPPLIER' | 'ADMIN' | 'OPERATOR' | 'SYSTEM';
export type NotificationCategory = 'TRANSACTION' | 'MESSAGE' | 'SOCIAL' | 'OPERATION' | 'SECURITY' | 'SUPPORT' | 'DELIVERY_ENTITLEMENT' | 'REFUND' | 'CANCEL_RETURN';
export type NotificationPriority = 'MANDATORY' | 'CRITICAL' | 'IMPORTANT' | 'NORMAL' | 'DIGEST';
export type NotificationChannel = 'IN_APP' | 'PUSH' | 'EMAIL' | 'SMS' | 'PANEL_TASK';
export type NotificationState = 'UNREAD' | 'READ' | 'ARCHIVED';
export type NotificationDeliveryMode = 'IMMEDIATE' | 'DIGEST' | 'AGGREGATED';
export type NotificationDeliveryState = 'PENDING' | 'SANDBOX_DELIVERED' | 'DELIVERY_FAILED' | 'PROVIDER_NOT_CONFIGURED' | 'PUSH_PROVIDER_PARKED' | 'SKIPPED_DIGEST';
export type NotificationProviderType = 'IN_APP' | 'EMAIL_SANDBOX' | 'PUSH_PARKED' | 'PANEL_TASK' | 'SMS_PARKED';
export interface NotificationDeliveryAttempt {
    attemptId: string;
    notificationId: string;
    providerType: NotificationProviderType;
    state: NotificationDeliveryState;
    attemptedAt: string;
    error?: string;
    actualProviderDeliveryPerformed: boolean;
    deliveryTruth: false;
    providerBoundary: 'SANDBOX' | 'PARKED' | 'NOT_CONFIGURED' | 'LOCAL_ONLY';
    providerEnvelope?: ProviderResultEnvelope;
}
export interface NotificationDeliverySummary {
    deliveryAttempts: NotificationDeliveryAttempt[];
    notificationTruthMutated: boolean;
    businessTruthMutated: false;
    ownerStateMutated: false;
    deliveryTruth: false;
    actualProviderDeliveryPerformed: false;
    outboxDeliveryGuaranteed: false;
    paymentTruthMutated: false;
    orderTruthMutated: false;
    refundTruthMutated: false;
    settlementTruthMutated: false;
    payoutTruthMutated: false;
}
export interface NotificationRecord extends NotificationDeliverySummary {
    notificationId: string;
    actorType: NotificationActorType;
    actorId: string;
    recipientActorType: NotificationActorType;
    recipientActorId: string;
    submittedByActorType?: NotificationActorType;
    submittedByActorId?: string;
    actorContextSource?: 'BFF_CONTEXT' | 'SERVICE_COMMAND' | 'INTERNAL';
    category: NotificationCategory;
    priority: NotificationPriority;
    state: NotificationState;
    deliveryMode: NotificationDeliveryMode;
    channels: NotificationChannel[];
    title: string;
    body: string;
    objectType?: string;
    objectId?: string;
    correlationId?: string;
    causationId?: string;
    schemaVersion?: string;
    idempotencyKey?: string;
    createdAt: string;
    readAt?: string;
    archivedAt?: string;
    isMandatory: boolean;
    preferenceOverridable: boolean;
    errors?: string[];
    warnings?: string[];
}
export interface CreateNotificationCommand {
    actorType: NotificationActorType;
    actorId: string;
    recipientActorType?: NotificationActorType;
    recipientActorId?: string;
    submittedByActorType?: NotificationActorType;
    submittedByActorId?: string;
    actorContextSource?: 'BFF_CONTEXT' | 'SERVICE_COMMAND' | 'INTERNAL';
    category: NotificationCategory;
    priority: NotificationPriority;
    title: string;
    body: string;
    objectType?: string;
    objectId?: string;
    correlationId?: string;
    causationId?: string;
    schemaVersion?: string;
    idempotencyKey?: string;
    deliveryMode?: NotificationDeliveryMode;
    channels?: NotificationChannel[];
}
export interface NotificationListQuery {
    actorType: NotificationActorType;
    actorId: string;
    state?: NotificationState;
    category?: NotificationCategory;
    limit?: number;
    cursor?: string;
}
export interface NotificationListResponse {
    items: NotificationRecord[];
    unreadCount: number;
    nextCursor?: string;
    errors?: string[];
    warnings?: string[];
}
export interface MarkNotificationReadCommand {
    notificationId: string;
}
export interface ArchiveNotificationCommand {
    notificationId: string;
}
export interface NotificationPreferenceSnapshot {
    mandatoryAllowed: true;
    criticalAllowed: true;
    socialAllowed?: boolean;
    marketingAllowed?: boolean;
    digestAllowed?: boolean;
}
export interface NotificationMutationResult {
    success: boolean;
    record?: NotificationRecord;
    errors?: string[];
    warnings?: string[];
    notificationTruthMutated?: boolean;
    businessTruthMutated?: false;
    ownerStateMutated?: false;
    deliveryTruth?: false;
    actualProviderDeliveryPerformed?: false;
    outboxDeliveryGuaranteed?: false;
}
//# sourceMappingURL=notification.d.ts.map