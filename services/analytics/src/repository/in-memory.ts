import { 
  AnalyticsEventRecord, 
  MetricSnapshotRecord, 
  DashboardSeedRecord,
  GetMetricSnapshotQuery,
  ListMetricSnapshotsQuery
} from '@hx/contracts';
import { IAnalyticsRepository } from './interface';

export class InMemoryAnalyticsRepository implements IAnalyticsRepository {
  private events: AnalyticsEventRecord[] = [];
  private snapshots: MetricSnapshotRecord[] = [];
  private seeds: DashboardSeedRecord[] = [];
  private idempotency: Map<string, string> = new Map();

  async createEvent(event: Omit<AnalyticsEventRecord, 'id' | 'ingestedAt'>): Promise<AnalyticsEventRecord> {
    const record: AnalyticsEventRecord = {
      ...event,
      id: Math.random().toString(36).substr(2, 9),
      ingestedAt: new Date().toISOString()
    };
    this.events.push(record);
    return record;
  }

  async getEventById(id: string): Promise<AnalyticsEventRecord | null> {
    return this.events.find(e => e.id === id) || null;
  }

  async getEventByIdempotencyKey(key: string): Promise<AnalyticsEventRecord | null> {
    const eventId = this.idempotency.get(key);
    if (!eventId) return null;
    return this.getEventById(eventId);
  }

  async saveIdempotencyKey(key: string, eventId: string): Promise<void> {
    this.idempotency.set(key, eventId);
  }

  async upsertMetricSnapshot(snapshot: Omit<MetricSnapshotRecord, 'id' | 'calculatedAt'>): Promise<MetricSnapshotRecord> {
    const existingIndex = this.snapshots.findIndex(s => 
      s.metricName === snapshot.metricName && 
      s.metricFamily === snapshot.metricFamily &&
      s.window === snapshot.window &&
      s.grain === snapshot.grain &&
      JSON.stringify(s.tags) === JSON.stringify(snapshot.tags)
    );

    const record: MetricSnapshotRecord = {
      ...snapshot,
      id: existingIndex >= 0 ? this.snapshots[existingIndex].id : Math.random().toString(36).substr(2, 9),
      calculatedAt: new Date().toISOString(),
      analyticsTruth: true,
      businessTruthMutated: false,
      ownerStateMutated: false,
      permissionTruth: false,
      eligibilityTruth: false,
      riskDecisionTruth: false,
      eventTruthMutated: false
    };

    if (existingIndex >= 0) {
      this.snapshots[existingIndex] = record;
    } else {
      this.snapshots.push(record);
    }

    return record;
  }

  async getMetricSnapshot(query: GetMetricSnapshotQuery): Promise<MetricSnapshotRecord | null> {
    return this.snapshots.find(s => 
      s.metricName === query.metricName && 
      s.metricFamily === query.metricFamily &&
      (query.window ? s.window === query.window : true) &&
      (query.grain ? s.grain === query.grain : true) &&
      (query.tags ? JSON.stringify(s.tags) === JSON.stringify(query.tags) : true)
    ) || null;
  }

  async listMetricSnapshots(query: ListMetricSnapshotsQuery): Promise<MetricSnapshotRecord[]> {
    let result = this.snapshots;
    if (query.metricFamily) result = result.filter(s => s.metricFamily === query.metricFamily);
    if (query.metricType) result = result.filter(s => s.metricType === query.metricType);
    return result.slice(0, query.limit || 100);
  }

  async getDashboardSeed(dashboardKey: string): Promise<DashboardSeedRecord | null> {
    // Basic seeds for initial phase
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
    return this.seeds.find(s => s.dashboardKey === dashboardKey) || null;
  }
}
