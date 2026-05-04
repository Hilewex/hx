export const DEFAULT_EVENT_SCHEMA_VERSION = 'v1';

export interface EventEnvelope<T = unknown> {
  eventId: string;
  eventType: string;
  topic: string;
  payload: T;
  occurredAt: string;
  metadata: EventMetadata;
  aggregateId?: string;
  aggregateType?: string;
  actorId?: string;
  correlationId?: string;
  causationId?: string;
  traceId?: string;
  schemaVersion?: string;
  eventTruthMutated: false;
  businessTruthMutated: false;
  ownerStateMutated: false;
}

export interface EventMetadata {
  source: string;
  version: string;
  correlationId: string;
  causationId?: string;
  actorId?: string;
  aggregateId?: string;
  aggregateType?: string;
  traceId?: string;
  schemaVersion?: string;
  eventTruthMutated?: false;
  businessTruthMutated?: false;
  ownerStateMutated?: false;
  [key: string]: unknown;
}

export interface CreateEventEnvelopeInput<T = unknown> {
  eventId: string;
  eventType: string;
  topic?: string;
  payload: T;
  occurredAt?: string;
  source: string;
  aggregateId?: string;
  aggregateType?: string;
  actorId?: string;
  correlationId: string;
  causationId?: string;
  traceId?: string;
  schemaVersion?: string;
  metadata?: Record<string, unknown>;
}

export function createEventEnvelope<T = unknown>(input: CreateEventEnvelopeInput<T>): EventEnvelope<T> {
  const schemaVersion = input.schemaVersion || DEFAULT_EVENT_SCHEMA_VERSION;

  return {
    eventId: input.eventId,
    eventType: input.eventType,
    topic: input.topic || input.eventType,
    payload: input.payload,
    occurredAt: input.occurredAt || new Date().toISOString(),
    aggregateId: input.aggregateId,
    aggregateType: input.aggregateType,
    actorId: input.actorId,
    correlationId: input.correlationId,
    causationId: input.causationId,
    traceId: input.traceId,
    schemaVersion,
    eventTruthMutated: false,
    businessTruthMutated: false,
    ownerStateMutated: false,
    metadata: {
      ...(input.metadata || {}),
      source: input.source,
      version: schemaVersion,
      correlationId: input.correlationId,
      causationId: input.causationId,
      actorId: input.actorId,
      aggregateId: input.aggregateId,
      aggregateType: input.aggregateType,
      traceId: input.traceId,
      schemaVersion,
      eventTruthMutated: false,
      businessTruthMutated: false,
      ownerStateMutated: false,
    },
  };
}
