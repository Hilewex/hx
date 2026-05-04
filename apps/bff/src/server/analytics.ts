import { AnalyticsService } from '@hx/analytics';
import {
  ActorContext,
  AnalyticsActorRef,
  AnalyticsSubjectRef,
  IngestAnalyticsEventCommand,
  GetMetricSnapshotQuery,
  ListMetricSnapshotsQuery,
  GetDashboardSeedQuery
} from '@hx/contracts';
import * as response from './response';

const analyticsService = new AnalyticsService();
const ANONYMOUS_SAFE_EVENTS = new Set([
  'surface_opened',
  'product_card_impression',
  'product_card_clicked',
  'pdp_opened',
  'search_submitted'
]);

export async function handleIngestAnalyticsEvent(context: any, body: any) {
  try {
    const guard = buildGuardedAnalyticsCommand(context as ActorContext, body);
    if (!guard.allowed) return guard.response;
    const command = guard.command;
    const result = await analyticsService.ingestAnalyticsEvent(command);
    return response.created(result);
  } catch (error: any) {
    if (typeof error?.message === 'string' && error.message.startsWith('ANALYTICS_')) {
      return response.badRequest(error.message, 'Invalid analytics ingest command');
    }
    return response.internalError('ANALYTICS_INGEST_FAILED', 'Failed to ingest analytics event');
  }
}

export async function handleGetMetricSnapshot(context: any, queryParams: any) {
  try {
    let tags;
    try {
      tags = queryParams.tags ? JSON.parse(queryParams.tags as string) : undefined;
    } catch (e) {
      return response.badRequest('REQUEST_INVALID_QUERY', 'Invalid tags format in query');
    }

    const query: GetMetricSnapshotQuery = {
      metricName: queryParams.metricName as string,
      metricFamily: queryParams.metricFamily as any,
      window: queryParams.window as string,
      grain: queryParams.grain as string,
      tags
    };
    const result = await analyticsService.getMetricSnapshot(query);
    if (!result) {
      return response.notFound('RESOURCE_NOT_FOUND', 'Metric snapshot not found');
    }
    return response.ok(result);
  } catch (error: any) {
    if (error.message === 'METRIC_SNAPSHOT_NOT_FOUND' || response.isNotFoundError(error)) {
      return response.notFound('RESOURCE_NOT_FOUND', 'Metric snapshot not found');
    }
    return response.badRequest('ANALYTICS_QUERY_FAILED', 'Failed to query metric snapshot');
  }
}

export async function handleListMetricSnapshots(context: any, queryParams: any) {
  try {
    const query: ListMetricSnapshotsQuery = {
      metricFamily: queryParams.metricFamily as any,
      metricType: queryParams.metricType as any,
      limit: queryParams.limit ? parseInt(queryParams.limit as string) : undefined
    };
    const result = await analyticsService.listMetricSnapshots(query);
    return response.ok(result);
  } catch (error: any) {
    return response.badRequest('ANALYTICS_LIST_FAILED', 'Failed to list metric snapshots');
  }
}

export async function handleGetDashboardSeed(context: any, queryParams: any) {
  try {
    if (!queryParams.dashboardKey) {
      return response.badRequest('REQUEST_MISSING_FIELD', 'dashboardKey is required');
    }
    const query: GetDashboardSeedQuery = {
      dashboardKey: queryParams.dashboardKey as string
    };
    const result = await analyticsService.getDashboardSeed(query);
    if (!result) {
      return response.notFound('RESOURCE_NOT_FOUND', 'Dashboard seed not found');
    }
    return response.ok(result);
  } catch (error: any) {
    if (error.message === 'DASHBOARD_SEED_NOT_FOUND' || response.isNotFoundError(error)) {
      return response.notFound('RESOURCE_NOT_FOUND', 'Dashboard seed not found');
    }
    return response.badRequest('ANALYTICS_SEED_FAILED', 'Failed to get dashboard seed');
  }
}

type AnalyticsGuardResult =
  | { allowed: true; command: IngestAnalyticsEventCommand }
  | { allowed: false; response: response.BffResponse };

function buildGuardedAnalyticsCommand(context: ActorContext, body: any): AnalyticsGuardResult {
  const eventName = normalizeSafeString(body?.eventName);
  if (!eventName) {
    return { allowed: false, response: response.badRequest('ANALYTICS_EVENT_NAME_REQUIRED', 'eventName is required') };
  }

  const requestedActor = readRequestedActor(body);
  const requestedSubject = readRequestedSubject(body);
  const correlationId = normalizeSafeString(body?.correlationId) || normalizeSafeString(body?.metadata?.correlationId);
  const causationId = normalizeSafeString(body?.causationId) || normalizeSafeString(body?.metadata?.causationId);
  const schemaVersion = normalizeSafeString(body?.schemaVersion) || normalizeSafeString(body?.metadata?.schemaVersion) || 'v1';

  if (!context.isAuthenticated) {
    if (!ANONYMOUS_SAFE_EVENTS.has(eventName)) {
      return {
        allowed: false,
        response: response.unauthorized('AUTH_REQUIRED', 'Authentication is required for this analytics event')
      };
    }

    if (requestedActor.actorId || requestedActor.actorType) {
      return {
        allowed: false,
        response: response.forbidden('ACTOR_NOT_ALLOWED', 'Anonymous analytics cannot submit an authenticated actor')
      };
    }

    const anonymousId = context.sessionId || normalizeSafeString(body?.anonymousId) || 'anonymous';
    return {
      allowed: true,
      command: normalizeCommand(body, {
        eventName,
        actor: { actorType: 'ANONYMOUS', actorId: anonymousId, authState: 'ANONYMOUS' },
        subject: requestedSubject || { subjectType: 'ANONYMOUS', subjectId: anonymousId },
        source: 'BFF_CONTEXT',
        correlationId,
        causationId,
        schemaVersion,
        submittedBy: { actorType: 'ANONYMOUS', actorId: anonymousId }
      })
    };
  }

  if (context.role === 'CUSTOMER' || context.role === 'CREATOR') {
    const actorType = context.role;
    const actorId = context.actorId;
    if ((requestedActor.actorType && requestedActor.actorType !== actorType) || (requestedActor.actorId && requestedActor.actorId !== actorId)) {
      return {
        allowed: false,
        response: response.forbidden('ACTOR_NOT_ALLOWED', 'Analytics actor must match the authenticated context')
      };
    }
    const subjectMismatch = requestedSubject && isActorSubject(requestedSubject.subjectType) && requestedSubject.subjectId && requestedSubject.subjectId !== actorId;
    if (subjectMismatch) {
      return {
        allowed: false,
        response: response.forbidden('FORBIDDEN_OWNERSHIP', 'Analytics subject must match the authenticated actor for actor-owned events')
      };
    }
    return {
      allowed: true,
      command: normalizeCommand(body, {
        eventName,
        actor: { actorType, actorId, authState: 'AUTHENTICATED' },
        subject: requestedSubject || { subjectType: actorType, subjectId: actorId },
        source: 'BFF_CONTEXT',
        correlationId,
        causationId,
        schemaVersion,
        submittedBy: { actorType, actorId }
      })
    };
  }

  if (context.role === 'ADMIN' || context.role === 'OPERATOR') {
    const wantsSystemActor = requestedActor.actorType === 'SYSTEM';
    const actor: AnalyticsActorRef = wantsSystemActor
      ? { actorType: 'SYSTEM', actorId: requestedActor.actorId || 'system', authState: 'SYSTEM' }
      : { actorType: context.role, actorId: context.actorId, authState: 'AUTHENTICATED' };

    return {
      allowed: true,
      command: normalizeCommand(body, {
        eventName,
        actor,
        subject: requestedSubject,
        source: wantsSystemActor ? 'SYSTEM' : 'ADMIN_PANEL',
        correlationId,
        causationId,
        schemaVersion,
        submittedBy: { actorType: context.role, actorId: context.actorId }
      })
    };
  }

  return {
    allowed: false,
    response: response.forbidden('ACTOR_NOT_ALLOWED', `Actor type ${context.role} is not allowed to ingest analytics events`)
  };
}

function normalizeCommand(
  body: any,
  options: {
    eventName: string;
    actor: AnalyticsActorRef;
    subject?: AnalyticsSubjectRef;
    source: IngestAnalyticsEventCommand['source'];
    correlationId: string;
    causationId: string;
    schemaVersion: string;
    submittedBy: { actorType: string; actorId?: string };
  }
): IngestAnalyticsEventCommand {
  const metadata = {
    ...(isPlainObject(body?.metadata) ? body.metadata : {}),
    actorSource: 'BFF_CONTEXT',
    submittedBy: options.submittedBy,
    businessTruthMutated: false,
    ownerStateMutated: false,
    permissionTruth: false,
    eligibilityTruth: false,
    riskDecisionTruth: false,
    eventTruthMutated: false
  };

  return {
    eventName: options.eventName,
    eventType: normalizeSafeString(body?.eventType) || options.eventName,
    metricFamily: body?.metricFamily,
    metricType: body?.metricType,
    occurredAt: normalizeSafeString(body?.occurredAt) || undefined,
    source: options.source,
    surface: normalizeSafeString(body?.surface) || normalizeSafeString(body?.metadata?.surface) || 'unknown',
    actor: options.actor,
    subject: options.subject,
    target: isPlainObject(body?.target) ? body.target : undefined,
    correlationId: options.correlationId || undefined,
    causationId: options.causationId || undefined,
    schemaVersion: options.schemaVersion,
    payload: isPlainObject(body?.payload) ? body.payload : {},
    idempotencyKey: normalizeSafeString(body?.idempotencyKey) || undefined,
    metadata,
    dataQualityState: body?.dataQualityState
  };
}

function readRequestedActor(body: any): { actorType?: string; actorId?: string } {
  const actor = isPlainObject(body?.actor) ? body.actor : {};
  return {
    actorType: normalizeSafeString(actor.actorType || body?.actorType) || undefined,
    actorId: normalizeSafeString(actor.actorId || body?.actorId) || undefined
  };
}

function readRequestedSubject(body: any): AnalyticsSubjectRef | undefined {
  const subject = isPlainObject(body?.subject) ? body.subject : undefined;
  const subjectType = normalizeSafeString(subject?.subjectType || body?.subjectType);
  const subjectId = normalizeSafeString(subject?.subjectId || body?.subjectId);
  if (!subjectType && !subjectId) return undefined;
  return { subjectType: subjectType || 'UNKNOWN', subjectId: subjectId || undefined };
}

function isActorSubject(subjectType: string): boolean {
  return subjectType === 'CUSTOMER' || subjectType === 'CREATOR';
}

function normalizeSafeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
