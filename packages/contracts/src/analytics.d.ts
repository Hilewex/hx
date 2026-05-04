export type AnalyticsMetricType = 'RAW_COUNT' | 'DERIVED_RATE' | 'DURATION' | 'DISTRIBUTION' | 'QUALITY' | 'DECISION_SIGNAL';
export type AnalyticsMetricFamily = 'NAVIGATION' | 'SEARCH' | 'COMMERCE' | 'PAYMENT' | 'ORDER' | 'SHIPMENT' | 'RETURN' | 'REFUND' | 'NOTIFICATION' | 'SUPPORT' | 'MODERATION' | 'RISK' | 'SETTLEMENT' | 'PAYOUT' | 'CONTENT' | 'UGC' | 'PERFORMANCE' | 'ERROR' | 'DEGRADATION';
export type AnalyticsDataQualityState = 'VALID' | 'DUPLICATE_IGNORED' | 'REPLAY_IGNORED' | 'UNKNOWN_RESULT' | 'CORRECTED' | 'DEGRADED' | 'INVALID';
export type AnalyticsIngestionSource = 'API' | 'EVENT_OUTBOX' | 'AUDIT_LOG' | 'SYSTEM_SMOKE' | 'FOUNDATION_SIMULATION';
export interface AnalyticsEventRecord {
    id: string;
    eventName: string;
    metricFamily: AnalyticsMetricFamily;
    metricType: AnalyticsMetricType;
    occurredAt: string;
    ingestedAt: string;
    source: AnalyticsIngestionSource;
    dataQualityState: AnalyticsDataQualityState;
    payload: Record<string, any>;
    idempotencyKey?: string;
    metadata?: Record<string, any>;
}
export interface MetricSnapshotRecord {
    id: string;
    metricName: string;
    metricFamily: AnalyticsMetricFamily;
    metricType: AnalyticsMetricType;
    value: number;
    window: string;
    grain: string;
    calculatedAt: string;
    tags: Record<string, string>;
    warnings?: string[];
}
export interface DashboardSeedRecord {
    id: string;
    dashboardKey: string;
    title: string;
    data: Record<string, any>;
    generatedAt: string;
    isDegraded: boolean;
}
export interface IngestAnalyticsEventCommand {
    eventName: string;
    metricFamily: AnalyticsMetricFamily;
    metricType: AnalyticsMetricType;
    occurredAt?: string;
    source: AnalyticsIngestionSource;
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
    warnings?: string[];
}
//# sourceMappingURL=analytics.d.ts.map