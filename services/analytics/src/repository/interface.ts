import { 
  AnalyticsEventRecord, 
  MetricSnapshotRecord, 
  DashboardSeedRecord,
  AnalyticsMetricFamily,
  AnalyticsMetricType,
  GetMetricSnapshotQuery,
  ListMetricSnapshotsQuery
} from '@hx/contracts';

export interface IAnalyticsRepository {
  createEvent(event: Omit<AnalyticsEventRecord, 'id' | 'ingestedAt'>): Promise<AnalyticsEventRecord>;
  getEventById(id: string): Promise<AnalyticsEventRecord | null>;
  getEventByIdempotencyKey(key: string): Promise<AnalyticsEventRecord | null>;
  saveIdempotencyKey(key: string, eventId: string): Promise<void>;
  upsertMetricSnapshot(snapshot: Omit<MetricSnapshotRecord, 'id' | 'calculatedAt'>): Promise<MetricSnapshotRecord>;
  getMetricSnapshot(query: GetMetricSnapshotQuery): Promise<MetricSnapshotRecord | null>;
  listMetricSnapshots(query: ListMetricSnapshotsQuery): Promise<MetricSnapshotRecord[]>;
  getDashboardSeed(dashboardKey: string): Promise<DashboardSeedRecord | null>;
}
