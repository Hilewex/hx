
import {
  ProviderBoundaryFlags,
  ProviderCallbackProcessingStatus,
  ProviderCallbackRecord,
} from '@hx/contracts';
import { query } from './index';

const POSTGRES_UNIQUE_VIOLATION = '23505';

// Veritabanı satırını temsil eden arayüz
interface ProviderCallbackEventRow {
  id: string;
  provider_domain: string;
  provider_name: string;
  provider_mode: string;
  callback_type: string;
  provider_event_id: string | null;
  provider_reference: string | null;
  idempotency_key: string | null;
  correlation_id: string | null;
  causation_id: string | null;
  request_id: string | null;
  verification_status: string;
  processing_status: string;
  replay_status: string;
  signature_verified: boolean;
  replay_detected: boolean;
  raw_payload: Record<string, unknown> | null;
  normalized_payload: Record<string, unknown> | null;
  error: Record<string, unknown> | null;
  boundary: Record<string, unknown>;
  received_at: Date;
  processed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Veritabanı satırını ProviderCallbackRecord'a dönüştüren yardımcı fonksiyon
function mapRowToRecord(row: ProviderCallbackEventRow): ProviderCallbackRecord {
  return {
    id: row.id,
    providerDomain: row.provider_domain,
    providerName: row.provider_name,
    providerMode: row.provider_mode,
    callbackType: row.callback_type,
    providerEventId: row.provider_event_id ?? undefined,
    providerReference: row.provider_reference ?? undefined,
    idempotencyKey: row.idempotency_key ?? undefined,
    correlationId: row.correlation_id ?? undefined,
    causationId: row.causation_id ?? undefined,
    requestId: row.request_id ?? undefined,
    verificationStatus: row.verification_status,
    processingStatus: row.processing_status,
    replayStatus: row.replay_status,
    signatureVerified: row.signature_verified,
    replayDetected: row.replay_detected,
    rawPayload: row.raw_payload ?? undefined,
    normalizedPayload: row.normalized_payload ?? undefined,
    error: row.error ?? undefined,
    boundary: row.boundary as unknown as ProviderBoundaryFlags,
    receivedAt: row.received_at,
    processedAt: row.processed_at ?? undefined,
  } as ProviderCallbackRecord;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === POSTGRES_UNIQUE_VIOLATION
  );
}

export interface ProviderCallbackEventRepository {
  insertProviderCallbackEvent(
    record: Omit<ProviderCallbackRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ProviderCallbackRecord>;

  getProviderCallbackEventById(id: string): Promise<ProviderCallbackRecord | null>;

  findProviderCallbackEventByProviderEventId(
    providerDomain: string,
    providerName: string,
    providerEventId: string
  ): Promise<ProviderCallbackRecord | null>;

  findProviderCallbackEventByIdempotencyKey(
    providerDomain: string,
    providerName: string,
    idempotencyKey: string
  ): Promise<ProviderCallbackRecord | null>;

  markProviderCallbackEventProcessed(
    id: string,
    processingStatus: ProviderCallbackProcessingStatus,
    processedAt?: Date
  ): Promise<ProviderCallbackRecord | null>;

  listProviderCallbackEventsByProcessingStatus(
    processingStatus: ProviderCallbackProcessingStatus,
    limit?: number
  ): Promise<ProviderCallbackRecord[]>;
}

// In-memory repository implementasyonu
export class InMemoryProviderCallbackEventRepository
  implements ProviderCallbackEventRepository
{
  private events = new Map<string, ProviderCallbackRecord>();
  private eventIdIndex = new Map<string, string>();
  private idempotencyKeyIndex = new Map<string, string>();

  async insertProviderCallbackEvent(
    record: Omit<ProviderCallbackRecord, 'id'>
  ): Promise<ProviderCallbackRecord> {
    const id = (this.events.size + 1).toString();
    const newRecord: ProviderCallbackRecord = {
      ...record,
      id,
      receivedAt: record.receivedAt || new Date(),
    };

    if (record.providerEventId) {
      const key = `${record.providerDomain}-${record.providerName}-${record.providerEventId}`;
      if (this.eventIdIndex.has(key)) {
        return this.events.get(this.eventIdIndex.get(key)!)!;
      }
      this.eventIdIndex.set(key, id);
    }

    if (record.idempotencyKey) {
      const key = `${record.providerDomain}-${record.providerName}-${record.idempotencyKey}`;
      if (this.idempotencyKeyIndex.has(key)) {
        return this.events.get(this.idempotencyKeyIndex.get(key)!)!;
      }
      this.idempotencyKeyIndex.set(key, id);
    }

    this.events.set(id, newRecord);
    return newRecord;
  }

  async getProviderCallbackEventById(
    id: string
  ): Promise<ProviderCallbackRecord | null> {
    return this.events.get(id) || null;
  }

  async findProviderCallbackEventByProviderEventId(
    providerDomain: string,
    providerName: string,
    providerEventId: string
  ): Promise<ProviderCallbackRecord | null> {
    const key = `${providerDomain}-${providerName}-${providerEventId}`;
    const id = this.eventIdIndex.get(key);
    return id ? this.events.get(id) || null : null;
  }

  async findProviderCallbackEventByIdempotencyKey(
    providerDomain: string,
    providerName: string,
    idempotencyKey: string
  ): Promise<ProviderCallbackRecord | null> {
    const key = `${providerDomain}-${providerName}-${idempotencyKey}`;
    const id = this.idempotencyKeyIndex.get(key);
    return id ? this.events.get(id) || null : null;
  }

  async markProviderCallbackEventProcessed(
    id: string,
    processingStatus: ProviderCallbackProcessingStatus,
    processedAt: Date = new Date()
  ): Promise<ProviderCallbackRecord | null> {
    const event = this.events.get(id);
    if (!event) return null;
    const updatedEvent = { ...event, processingStatus, processedAt };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async listProviderCallbackEventsByProcessingStatus(
    processingStatus: ProviderCallbackProcessingStatus,
    limit = 100
  ): Promise<ProviderCallbackRecord[]> {
    return Array.from(this.events.values())
      .filter((event) => event.processingStatus === processingStatus)
      .slice(0, limit);
  }
}

// Postgres repository implementasyonu
export class PostgresProviderCallbackEventRepository
  implements ProviderCallbackEventRepository
{
  constructor() {}

  async insertProviderCallbackEvent(
    record: Omit<ProviderCallbackRecord, 'id'>
  ): Promise<ProviderCallbackRecord> {
    if (record.providerEventId) {
      const existingByProviderEventId =
        await this.findProviderCallbackEventByProviderEventId(
          record.providerDomain,
          record.providerName,
          record.providerEventId
        );
      if (existingByProviderEventId) {
        return existingByProviderEventId;
      }
    }

    if (record.idempotencyKey) {
      const existingByIdempotencyKey =
        await this.findProviderCallbackEventByIdempotencyKey(
          record.providerDomain,
          record.providerName,
          record.idempotencyKey
        );
      if (existingByIdempotencyKey) {
        return existingByIdempotencyKey;
      }
    }

    const sql = `
      INSERT INTO provider_callback_events (
        provider_domain, provider_name, provider_mode, callback_type, provider_event_id,
        provider_reference, idempotency_key, correlation_id, causation_id, request_id,
        verification_status, processing_status, replay_status, signature_verified,
        replay_detected, raw_payload, normalized_payload, error, boundary, received_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      ON CONFLICT (provider_domain, provider_name, provider_event_id) WHERE provider_event_id IS NOT NULL
      DO UPDATE SET updated_at = NOW()
      RETURNING *;
    `;
    // Not: ON CONFLICT for idempotency_key is handled separately to return the existing record.
    // A more robust implementation might use a single query with COALESCE.

    try {
      const res = await query(sql, [
        record.providerDomain,
        record.providerName,
        record.providerMode,
        record.callbackType,
        record.providerEventId,
        record.providerReference,
        record.idempotencyKey,
        record.correlationId,
        record.causationId,
        record.requestId,
        record.verificationStatus,
        record.processingStatus,
        record.replayStatus,
        record.signatureVerified,
        record.replayDetected,
        JSON.stringify(record.rawPayload || null),
        JSON.stringify(record.normalizedPayload || null),
        JSON.stringify(record.error || null),
        JSON.stringify(record.boundary),
        record.receivedAt,
      ]);

      return mapRowToRecord(res.rows[0]);
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }

      if (record.providerEventId) {
        const existingByProviderEventId =
          await this.findProviderCallbackEventByProviderEventId(
            record.providerDomain,
            record.providerName,
            record.providerEventId
          );
        if (existingByProviderEventId) {
          return existingByProviderEventId;
        }
      }

      if (record.idempotencyKey) {
        const existingByIdempotencyKey =
          await this.findProviderCallbackEventByIdempotencyKey(
            record.providerDomain,
            record.providerName,
            record.idempotencyKey
          );
        if (existingByIdempotencyKey) {
          return existingByIdempotencyKey;
        }
      }

      throw error;
    }
  }

  async getProviderCallbackEventById(
    id: string
  ): Promise<ProviderCallbackRecord | null> {
    const res = await query(
      'SELECT * FROM provider_callback_events WHERE id = $1',
      [id]
    );
    if (res.rowCount === 0) return null;
    return mapRowToRecord(res.rows[0]);
  }

  async findProviderCallbackEventByProviderEventId(
    providerDomain: string,
    providerName: string,
    providerEventId: string
  ): Promise<ProviderCallbackRecord | null> {
    const res = await query(
      'SELECT * FROM provider_callback_events WHERE provider_domain = $1 AND provider_name = $2 AND provider_event_id = $3',
      [providerDomain, providerName, providerEventId]
    );
    if (res.rowCount === 0) return null;
    return mapRowToRecord(res.rows[0]);
  }

  async findProviderCallbackEventByIdempotencyKey(
    providerDomain: string,
    providerName: string,
    idempotencyKey: string
  ): Promise<ProviderCallbackRecord | null> {
    const res = await query(
      'SELECT * FROM provider_callback_events WHERE provider_domain = $1 AND provider_name = $2 AND idempotency_key = $3',
      [providerDomain, providerName, idempotencyKey]
    );
    if (res.rowCount === 0) return null;
    return mapRowToRecord(res.rows[0]);
  }

  async markProviderCallbackEventProcessed(
    id: string,
    processingStatus: ProviderCallbackProcessingStatus,
    processedAt: Date = new Date()
  ): Promise<ProviderCallbackRecord | null> {
    const res = await query(
      'UPDATE provider_callback_events SET processing_status = $1, processed_at = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [processingStatus, processedAt, id]
    );
    if (res.rowCount === 0) return null;
    return mapRowToRecord(res.rows[0]);
  }

  async listProviderCallbackEventsByProcessingStatus(
    processingStatus: ProviderCallbackProcessingStatus,
    limit = 100
  ): Promise<ProviderCallbackRecord[]> {
    const res = await query(
      'SELECT * FROM provider_callback_events WHERE processing_status = $1 ORDER BY received_at ASC LIMIT $2',
      [processingStatus, limit]
    );
    return res.rows.map(mapRowToRecord);
  }
}

// Factory function
let repo: ProviderCallbackEventRepository | null = null;

export function getProviderCallbackEventRepository(): ProviderCallbackEventRepository {
  if (repo) {
    return repo;
  }

  const mode = process.env.PERSISTENCE_MODE || 'memory';
  if (mode === 'postgres') {
    repo = new PostgresProviderCallbackEventRepository();
  } else {
    repo = new InMemoryProviderCallbackEventRepository();
  }

  return repo;
}

