export type AnalyticsMetricType =
  | 'RAW_COUNT'
  | 'DERIVED_RATE'
  | 'DURATION'
  | 'DISTRIBUTION'
  | 'QUALITY'
  | 'DECISION_SIGNAL';

export type AnalyticsMetricFamily =
  | 'NAVIGATION'
  | 'SEARCH'
  | 'COMMERCE'
  | 'PAYMENT'
  | 'ORDER'
  | 'SHIPMENT'
  | 'RETURN'
  | 'REFUND'
  | 'NOTIFICATION'
  | 'SUPPORT'
  | 'MODERATION'
  | 'RISK'
  | 'SETTLEMENT'
  | 'PAYOUT'
  | 'CONTENT'
  | 'UGC'
  | 'PERFORMANCE'
  | 'ERROR'
  | 'DEGRADATION';

export type AnalyticsDataQualityState =
  | 'VALID'
  | 'DUPLICATE_IGNORED'
  | 'REPLAY_IGNORED'
  | 'UNKNOWN_RESULT'
  | 'CORRECTED'
  | 'DEGRADED'
  | 'INVALID';

export type AnalyticsIngestionSource =
  | 'API'
  | 'EVENT_OUTBOX'
  | 'AUDIT_LOG'
  | 'BFF_CONTEXT'
  | 'ADMIN_PANEL'
  | 'SYSTEM'
  | 'SYSTEM_SMOKE'
  | 'FOUNDATION_SIMULATION';

export type AnalyticsActorType =
  | 'ANONYMOUS'
  | 'CUSTOMER'
  | 'CREATOR'
  | 'ADMIN'
  | 'OPERATOR'
  | 'SYSTEM'
  | 'INTERNAL_SERVICE';

export interface AnalyticsActorRef {
  actorType: AnalyticsActorType;
  actorId?: string;
  authState: 'ANONYMOUS' | 'AUTHENTICATED' | 'SYSTEM';
}

export interface AnalyticsSubjectRef {
  subjectType: string;
  subjectId?: string;
}

export interface AnalyticsTargetRef {
  targetType: string;
  targetId?: string;
}

export interface AnalyticsEventRecord {
  id: string;
  eventName: string;
  eventType: string;
  metricFamily: AnalyticsMetricFamily;
  metricType: AnalyticsMetricType;
  occurredAt: string;
  ingestedAt: string;
  source: AnalyticsIngestionSource;
  surface: string;
  actor: AnalyticsActorRef;
  subject?: AnalyticsSubjectRef;
  target?: AnalyticsTargetRef;
  correlationId: string;
  causationId?: string;
  schemaVersion: string;
  dataQualityState: AnalyticsDataQualityState;
  payload: Record<string, any>;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
  analyticsTruth: true;
  businessTruthMutated: false;
  ownerStateMutated: false;
  permissionTruth: false;
  eligibilityTruth: false;
  riskDecisionTruth: false;
  eventTruthMutated: false;
  outboxDeliveryGuaranteed: false;
}

export interface MetricSnapshotRecord {
  id: string;
  metricName: string;
  metricFamily: AnalyticsMetricFamily;
  metricType: AnalyticsMetricType;
  value: number;
  window: string; // e.g., "1h", "24h"
  grain: string; // e.g., "minute", "hour"
  calculatedAt: string;
  tags: Record<string, string>;
  warnings?: string[];
  analyticsTruth: true;
  businessTruthMutated: false;
  ownerStateMutated: false;
  permissionTruth: false;
  eligibilityTruth: false;
  riskDecisionTruth: false;
  eventTruthMutated: false;
}

export interface DashboardSeedRecord {
  id: string;
  dashboardKey: string;
  title: string;
  data: Record<string, any>;
  generatedAt: string;
  isDegraded: boolean;
  analyticsTruth: false;
  businessTruthMutated: false;
  ownerStateMutated: false;
  permissionTruth: false;
  eligibilityTruth: false;
  riskDecisionTruth: false;
  eventTruthMutated: false;
}

export interface IngestAnalyticsEventCommand {
  eventName: string;
  eventType?: string;
  metricFamily: AnalyticsMetricFamily;
  metricType: AnalyticsMetricType;
  occurredAt?: string;
  source: AnalyticsIngestionSource;
  surface?: string;
  actor?: AnalyticsActorRef;
  subject?: AnalyticsSubjectRef;
  target?: AnalyticsTargetRef;
  correlationId?: string;
  causationId?: string;
  schemaVersion?: string;
  payload: Record<string, any>;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
  dataQualityState?: AnalyticsDataQualityState;
}

export interface GetMetricSnapshotQuery {
  metricName: string;
  metricFamily: AnalyticsMetricFamily;
  window?: string;
  grain?: string;
  tags?: Record<string, string>;
}

export interface ListMetricSnapshotsQuery {
  metricFamily?: AnalyticsMetricFamily;
  metricType?: AnalyticsMetricType;
  limit?: number;
}

export interface GetDashboardSeedQuery {
  dashboardKey: string;
}

export interface AnalyticsMutationResult {
  success: boolean;
  eventId?: string;
  dataQualityState: AnalyticsDataQualityState;
  analyticsTruthMutated: boolean;
  paymentTruthMutated: false;
  orderTruthMutated: false;
  refundTruthMutated: false;
  settlementTruthMutated: false;
  payoutTruthMutated: false;
  notificationTruthMutated: false;
  riskTruthMutated: false;
  businessTruthMutated: false;
  ownerStateMutated: false;
  permissionTruth: false;
  eligibilityTruth: false;
  riskDecisionTruth: false;
  eventTruthMutated: false;
  outboxDeliveryGuaranteed: false;
  warnings?: string[];
}

export interface AnalyticsEventResponse {
  event: AnalyticsEventRecord;
}

export interface MetricSnapshotResponse {
  snapshot: MetricSnapshotRecord;
  analyticsTruthMutated: boolean;
  paymentTruthMutated: false;
  orderTruthMutated: false;
  refundTruthMutated: false;
  settlementTruthMutated: false;
  payoutTruthMutated: false;
  notificationTruthMutated: false;
  riskTruthMutated: false;
  businessTruthMutated: false;
  ownerStateMutated: false;
  permissionTruth: false;
  eligibilityTruth: false;
  riskDecisionTruth: false;
  eventTruthMutated: false;
}

export interface MetricSnapshotListResponse {
  snapshots: MetricSnapshotRecord[];
}

export interface DashboardSeedResponse {
  seed: DashboardSeedRecord;
  analyticsTruthMutated: boolean;
  paymentTruthMutated: false;
  orderTruthMutated: false;
  refundTruthMutated: false;
  settlementTruthMutated: false;
  payoutTruthMutated: false;
  notificationTruthMutated: false;
  riskTruthMutated: false;
  businessTruthMutated: false;
  ownerStateMutated: false;
  permissionTruth: false;
  eligibilityTruth: false;
  riskDecisionTruth: false;
  eventTruthMutated: false;
  warnings?: string[];
}
