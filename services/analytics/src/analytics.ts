import {
  IngestAnalyticsEventCommand,
  AnalyticsMutationResult,
  GetMetricSnapshotQuery,
  MetricSnapshotResponse,
  ListMetricSnapshotsQuery,
  MetricSnapshotListResponse,
  GetDashboardSeedQuery,
  DashboardSeedResponse,
  AnalyticsDataQualityState,
  AnalyticsEventRecord
} from '@hx/contracts';
import { randomUUID } from 'node:crypto';
import { IAnalyticsRepository } from './repository/interface';
import { getAnalyticsRepository } from './repository';
import { getAuditEventRepositories } from '@hx/persistence';

const VALID_METRIC_FAMILIES = new Set([
  'NAVIGATION', 'SEARCH', 'COMMERCE', 'PAYMENT', 'ORDER', 'SHIPMENT', 'RETURN', 'REFUND',
  'NOTIFICATION', 'SUPPORT', 'MODERATION', 'RISK', 'SETTLEMENT', 'PAYOUT', 'CONTENT',
  'UGC', 'PERFORMANCE', 'ERROR', 'DEGRADATION'
]);

const VALID_METRIC_TYPES = new Set(['RAW_COUNT', 'DERIVED_RATE', 'DURATION', 'DISTRIBUTION', 'QUALITY', 'DECISION_SIGNAL']);
const VALID_QUALITY_STATES = new Set(['VALID', 'DUPLICATE_IGNORED', 'REPLAY_IGNORED', 'UNKNOWN_RESULT', 'CORRECTED', 'DEGRADED', 'INVALID']);
const MAX_ANALYTICS_PAYLOAD_BYTES = 16 * 1024;

const ALLOWED_EVENT_NAMES_REGEX = /^[a-z0-9_\-]+$/;
const PII_FIELDS = new Set(['email', 'phone', 'fullname', 'address', 'tckn', 'nationalid', 'card', 'bank', 'ipaddress', 'deviceid', 'password', 'token', 'secret']);

function sanitizePII(payload: Record<string, any>): { sanitized: Record<string, any>, piiDetected: boolean, piiDroppedFields: string[] } {
    let piiDetected = false;
    const piiDroppedFields: string[] = [];
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(payload)) {
        const lowerKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        let isPii = false;
        for (const piiField of PII_FIELDS) {
            if (lowerKey.includes(piiField)) {
                isPii = true;
                break;
            }
        }

        if (isPii) {
            piiDetected = true;
            piiDroppedFields.push(key);
            sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const nested = sanitizePII(value);
            sanitized[key] = nested.sanitized;
            if (nested.piiDetected) {
                piiDetected = true;
                piiDroppedFields.push(...nested.piiDroppedFields.map(k => `${key}.${k}`));
            }
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(v => {
                if (typeof v === 'object' && v !== null) {
                    const nested = sanitizePII(v);
                    if (nested.piiDetected) {
                        piiDetected = true;
                        piiDroppedFields.push(`${key}[]`);
                    }
                    return nested.sanitized;
                }
                return v;
            });
        } else {
            sanitized[key] = value;
        }
    }

    return { sanitized, piiDetected, piiDroppedFields };
}

export class AnalyticsService {
  constructor(private repo: IAnalyticsRepository = getAnalyticsRepository()) {}

  async ingestAnalyticsEvent(command: IngestAnalyticsEventCommand): Promise<AnalyticsMutationResult> {
    const eventName = normalizeSafeString(command.eventName);
    if (!eventName) throw new Error('ANALYTICS_EVENT_NAME_REQUIRED');
    if (!command.metricFamily || !VALID_METRIC_FAMILIES.has(command.metricFamily)) throw new Error('ANALYTICS_METRIC_FAMILY_REQUIRED');
    if (!command.metricType || !VALID_METRIC_TYPES.has(command.metricType)) throw new Error('ANALYTICS_METRIC_TYPE_REQUIRED');
    if (command.dataQualityState && !VALID_QUALITY_STATES.has(command.dataQualityState)) throw new Error('ANALYTICS_DATA_QUALITY_STATE_INVALID');
    if (!command.actor) throw new Error('ANALYTICS_ACTOR_REQUIRED');
    assertJsonObject(command.payload, 'ANALYTICS_PAYLOAD_INVALID');
    assertJsonObject(command.metadata || {}, 'ANALYTICS_METADATA_INVALID');
    assertPayloadSize(command.payload);

    const occurredAt = command.occurredAt || new Date().toISOString();
    let dataQualityState: AnalyticsDataQualityState = command.dataQualityState || 'VALID';
    const warnings: string[] = [];
    const eventType = normalizeSafeString(command.eventType) || eventName;
    const surface = normalizeSafeString(command.surface) || 'unknown';
    const schemaVersion = normalizeSafeString(command.schemaVersion) || 'v1';
    const correlationId = normalizeSafeString(command.correlationId) || `analytics_${randomUUID()}`;
    const causationId = normalizeSafeString(command.causationId);
    
    // Taxonomy check
    if (!ALLOWED_EVENT_NAMES_REGEX.test(eventName)) {
        throw new Error('ANALYTICS_UNKNOWN_EVENT_TYPE');
    }

    const { sanitized: piiSanitizedPayload, piiDetected, piiDroppedFields } = sanitizePII(command.payload);

    const metadata = {
      ...(command.metadata || {}),
      eventType,
      surface,
      correlationId,
      causationId,
      schemaVersion,
      actor: command.actor,
      subject: command.subject,
      target: command.target,
      analyticsTruth: true,
      businessTruthMutated: false,
      ownerStateMutated: false,
      permissionTruth: false,
      eligibilityTruth: false,
      riskDecisionTruth: false,
      eventTruthMutated: false,
      outboxDeliveryGuaranteed: false
    };

    // Idempotency check
    if (command.idempotencyKey) {
      const existing = await this.repo.getEventByIdempotencyKey(command.idempotencyKey);
      if (existing) {
        return {
          success: true,
          eventId: existing.id,
          dataQualityState: 'DUPLICATE_IGNORED',
          analyticsTruthMutated: true,
          paymentTruthMutated: false,
          orderTruthMutated: false,
          refundTruthMutated: false,
          settlementTruthMutated: false,
          payoutTruthMutated: false,
          notificationTruthMutated: false,
          riskTruthMutated: false,
          businessTruthMutated: false,
          ownerStateMutated: false,
          permissionTruth: false,
          eligibilityTruth: false,
          riskDecisionTruth: false,
          eventTruthMutated: false,
          outboxDeliveryGuaranteed: false,
          analyticsEventOnly: true,
          ownerTruthMutatedByAnalytics: false,
          financeTruthMutated: false,
          moderationTruthMutated: false,
          customerTruthMutated: false,
          bffTruthMutated: false,
          uiTruthMutated: false,
          piiDetected: false,
          piiMasked: false,
          piiMinimized: false,
          eventTaxonomyChecked: true,
          auditEvidenceRequired: true,
          duplicate: true,
          alreadyProcessed: true,
          warnings
        };
      }
    }

    const eventRecord: Omit<AnalyticsEventRecord, 'id' | 'ingestedAt'> = {
      eventName,
      eventType,
      metricFamily: command.metricFamily,
      metricType: command.metricType,
      occurredAt,
      source: command.source,
      surface,
      actor: command.actor,
      subject: command.subject,
      target: command.target,
      correlationId,
      causationId,
      schemaVersion,
      dataQualityState,
      payload: piiSanitizedPayload,
      idempotencyKey: command.idempotencyKey,
      metadata,
      analyticsTruth: true,
      businessTruthMutated: false,
      ownerStateMutated: false,
      permissionTruth: false,
      eligibilityTruth: false,
      riskDecisionTruth: false,
      eventTruthMutated: false,
      outboxDeliveryGuaranteed: false,
      analyticsEventOnly: true,
      ownerTruthMutatedByAnalytics: false,
      orderTruthMutated: false,
      paymentTruthMutated: false,
      payoutTruthMutated: false,
      financeTruthMutated: false,
      moderationTruthMutated: false,
      customerTruthMutated: false,
      bffTruthMutated: false,
      uiTruthMutated: false,
      piiDetected,
      piiMasked: piiDetected,
      piiMinimized: piiDetected,
      piiDroppedFields: piiDetected ? piiDroppedFields : [],
      allowedEventType: eventName,
      eventTaxonomyChecked: true,
      auditEvidenceRequired: true
    };

    const savedEvent = await this.repo.createEvent(eventRecord);

    if (command.idempotencyKey) {
      await this.repo.saveIdempotencyKey(command.idempotencyKey, savedEvent.id);
    }

    // Foundation Aggregation logic
    if (command.metricType === 'RAW_COUNT') {
        const excludedStates: AnalyticsDataQualityState[] = ['UNKNOWN_RESULT', 'DEGRADED', 'INVALID', 'CORRECTED'];
        if (!excludedStates.includes(savedEvent.dataQualityState)) {
             const aggregationResult = await this.updateRawCountSnapshot(savedEvent);
             if (aggregationResult.warnings) {
                 warnings.push(...aggregationResult.warnings);
             }
        }
    } else if (command.metricType === 'DERIVED_RATE') {
        const payload = { ...command.payload, ...command.metadata };
        if (!payload.numerator || !payload.denominator) {
            warnings.push('METRIC_NUMERATOR_DENOMINATOR_REQUIRED');
        }
    }

    // Audit & Outbox
    try {
      const { audit, outbox } = getAuditEventRepositories();
      await audit.appendAuditLog({
        entityId: savedEvent.id,
        entityType: 'analytics_event',
        actionType: 'analytics.event_ingested',
        ownerService: 'analytics',
        actorType: savedEvent.actor.actorType,
        actorId: savedEvent.actor.actorId || 'anonymous',
        afterState: savedEvent,
        correlationId: savedEvent.correlationId,
        metadata: {
          causationId: savedEvent.causationId,
          schemaVersion: savedEvent.schemaVersion,
          analyticsTruth: true,
          businessTruthMutated: false,
          ownerStateMutated: false
        }
      });
      await outbox.appendOutboxEvent({
        topic: 'analytics.event_ingested',
        payload: savedEvent as any,
        ownerService: 'analytics',
        entityType: 'analytics_event',
        entityId: savedEvent.id,
        payloadSchema: `analytics.event_ingested.${savedEvent.schemaVersion}`,
        idempotencyKey: command.idempotencyKey ? `analytics:event:${command.idempotencyKey}` : undefined,
        correlationId: savedEvent.correlationId,
        causationId: savedEvent.causationId
      });
    } catch (error) {
      console.warn('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE', error);
      warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
    }

    return {
      success: true,
      eventId: savedEvent.id,
      dataQualityState: savedEvent.dataQualityState,
      analyticsTruthMutated: true,
      paymentTruthMutated: false,
      orderTruthMutated: false,
      refundTruthMutated: false,
      settlementTruthMutated: false,
      payoutTruthMutated: false,
      notificationTruthMutated: false,
      riskTruthMutated: false,
      businessTruthMutated: false,
      ownerStateMutated: false,
      permissionTruth: false,
      eligibilityTruth: false,
      riskDecisionTruth: false,
      eventTruthMutated: false,
      outboxDeliveryGuaranteed: false,
      analyticsEventOnly: true,
      ownerTruthMutatedByAnalytics: false,
      financeTruthMutated: false,
      moderationTruthMutated: false,
      customerTruthMutated: false,
      bffTruthMutated: false,
      uiTruthMutated: false,
      piiDetected,
      piiMasked: piiDetected,
      piiMinimized: piiDetected,
      piiDroppedFields: piiDetected ? piiDroppedFields : [],
      allowedEventType: eventName,
      eventTaxonomyChecked: true,
      auditEvidenceRequired: true,
      warnings
    };
  }

  async getMetricSnapshot(query: GetMetricSnapshotQuery): Promise<MetricSnapshotResponse> {
    const snapshot = await this.repo.getMetricSnapshot(query);
    if (!snapshot) {
      throw new Error('METRIC_SNAPSHOT_NOT_FOUND');
    }

    return {
      snapshot,
      analyticsTruthMutated: false,
      paymentTruthMutated: false,
      orderTruthMutated: false,
      refundTruthMutated: false,
      settlementTruthMutated: false,
      payoutTruthMutated: false,
      notificationTruthMutated: false,
      riskTruthMutated: false,
      businessTruthMutated: false,
      ownerStateMutated: false,
      permissionTruth: false,
      eligibilityTruth: false,
      riskDecisionTruth: false,
      eventTruthMutated: false
    };
  }

  async listMetricSnapshots(query: ListMetricSnapshotsQuery): Promise<MetricSnapshotListResponse> {
    const snapshots = await this.repo.listMetricSnapshots(query);
    return { snapshots };
  }

  async getDashboardSeed(query: GetDashboardSeedQuery): Promise<DashboardSeedResponse> {
    const seed = await this.repo.getDashboardSeed(query.dashboardKey);
    if (!seed) {
      throw new Error('DASHBOARD_SEED_NOT_FOUND');
    }

    const warnings: string[] = [];

    // Post-ingestion audit for seed generation
    try {
       const { audit, outbox } = getAuditEventRepositories();
       await audit.appendAuditLog({
        entityId: seed.id,
        entityType: 'dashboard_seed',
        actionType: 'analytics.dashboard_seed_generated',
        ownerService: 'analytics',
        actorType: 'SYSTEM',
        actorId: 'system',
        afterState: seed
      });
      await outbox.appendOutboxEvent({
        topic: 'analytics.dashboard_seed_generated',
        payload: seed as any,
        ownerService: 'analytics',
        entityType: 'dashboard_seed',
        entityId: seed.id,
        payloadSchema: 'analytics.dashboard_seed_generated.v1'
      });
    } catch (error) {
        console.warn('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE', error);
        warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
    }

    return {
      seed,
      analyticsTruthMutated: false,
      paymentTruthMutated: false,
      orderTruthMutated: false,
      refundTruthMutated: false,
      settlementTruthMutated: false,
      payoutTruthMutated: false,
      notificationTruthMutated: false,
      riskTruthMutated: false,
      businessTruthMutated: false,
      ownerStateMutated: false,
      permissionTruth: false,
      eligibilityTruth: false,
      riskDecisionTruth: false,
      eventTruthMutated: false,
      warnings
    };
  }

  private async updateRawCountSnapshot(event: AnalyticsEventRecord): Promise<{ warnings?: string[] }> {
    const warnings: string[] = [];
    const current = await this.repo.getMetricSnapshot({
      metricName: event.eventName,
      metricFamily: event.metricFamily,
      window: '24h',
      grain: 'hour'
    });

    const newValue = (current?.value || 0) + 1;

    const savedSnapshot = await this.repo.upsertMetricSnapshot({
      metricName: event.eventName,
      metricFamily: event.metricFamily,
      metricType: 'RAW_COUNT',
      value: newValue,
      window: '24h',
      grain: 'hour',
      tags: event.metadata || {},
      warnings: [],
      analyticsTruth: true,
      businessTruthMutated: false,
      ownerStateMutated: false,
      permissionTruth: false,
      eligibilityTruth: false,
      riskDecisionTruth: false,
      eventTruthMutated: false
    });

    try {
      const { audit, outbox } = getAuditEventRepositories();
      await audit.appendAuditLog({
        entityId: event.eventName,
        entityType: 'metric_snapshot',
        actionType: 'analytics.metric_snapshot_updated',
        ownerService: 'analytics',
        actorType: 'SYSTEM',
        actorId: 'system',
        afterState: { metricName: event.eventName, newValue, businessTruthMutated: false },
        correlationId: event.correlationId,
        metadata: {
          causationId: event.causationId,
          schemaVersion: event.schemaVersion,
          analyticsTruth: true,
          businessTruthMutated: false,
          ownerStateMutated: false
        }
      });
      await outbox.appendOutboxEvent({
        topic: 'analytics.metric_snapshot_updated',
        payload: savedSnapshot as any,
        ownerService: 'analytics',
        entityType: 'metric_snapshot',
        entityId: savedSnapshot.id,
        payloadSchema: `analytics.metric_snapshot_updated.${event.schemaVersion}`,
        correlationId: event.correlationId,
        causationId: event.causationId
      });
    } catch (error) {
        console.warn('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE', error);
        warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
    }
    
    return { warnings };
  }
}

function normalizeSafeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function assertJsonObject(value: unknown, errorCode: string): asserts value is Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(errorCode);
  }
}

function assertPayloadSize(payload: Record<string, any>): void {
  const bytes = Buffer.byteLength(JSON.stringify(payload), 'utf8');
  if (bytes > MAX_ANALYTICS_PAYLOAD_BYTES) {
    throw new Error('ANALYTICS_PAYLOAD_TOO_LARGE');
  }
}
