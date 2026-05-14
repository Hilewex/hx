import { randomUUID } from 'crypto';
import { LedgerEntry, AppendLedgerEntryCommand, GetLedgerQuery } from '@hx/contracts';
import { query } from './index';

// In-memory array for ledger
// Append-only, immutable list
const ledger: LedgerEntry[] = [];

const POSTGRES_UNIQUE_VIOLATION = '23505';

interface FinanceLedgerEntryRow {
  ledger_entry_id: string;
  idempotency_key: string;
  source_type: LedgerEntry['sourceType'];
  source_id: string;
  source_event_id: string | null;
  direction: LedgerEntry['direction'];
  entry_type: LedgerEntry['entryType'];
  amount: string | number;
  currency: string;
  account_type: string | null;
  account_key: string | null;
  counterparty_type: string | null;
  counterparty_id: string | null;
  metadata: Record<string, any> | null;
  created_at: Date | string;
  immutable: boolean;
}

export interface FinanceLedgerRepository {
  appendLedgerEntry(command: AppendLedgerEntryCommand): Promise<LedgerEntry>;
  getLedgerEntries(query?: GetLedgerQuery): Promise<LedgerEntry[]>;
}

function stableValue(value: any): any {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, any>>((acc, key) => {
        acc[key] = stableValue(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function stableJson(value: any): string {
  return JSON.stringify(stableValue(value ?? null));
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === POSTGRES_UNIQUE_VIOLATION
  );
}

function mapRowToLedgerEntry(row: FinanceLedgerEntryRow): LedgerEntry {
  return {
    ledgerEntryId: row.ledger_entry_id,
    idempotencyKey: row.idempotency_key,
    sourceType: row.source_type,
    sourceId: row.source_id,
    sourceEventId: row.source_event_id ?? undefined,
    direction: row.direction,
    entryType: row.entry_type,
    amount: Number(row.amount),
    currency: row.currency,
    accountType: row.account_type ?? undefined,
    accountKey: row.account_key ?? undefined,
    counterpartyType: row.counterparty_type ?? undefined,
    counterpartyId: row.counterparty_id ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
    immutable: true,
  };
}

function commandMatchesEntry(command: AppendLedgerEntryCommand, entry: LedgerEntry): boolean {
  return (
    command.idempotencyKey === entry.idempotencyKey &&
    command.sourceType === entry.sourceType &&
    command.sourceId === entry.sourceId &&
    (command.sourceEventId ?? undefined) === (entry.sourceEventId ?? undefined) &&
    command.direction === entry.direction &&
    command.entryType === entry.entryType &&
    command.amount === entry.amount &&
    command.currency === entry.currency &&
    (command.accountType ?? undefined) === (entry.accountType ?? undefined) &&
    (command.accountKey ?? undefined) === (entry.accountKey ?? undefined) &&
    (command.counterpartyType ?? undefined) === (entry.counterpartyType ?? undefined) &&
    (command.counterpartyId ?? undefined) === (entry.counterpartyId ?? undefined) &&
    stableJson(command.metadata) === stableJson(entry.metadata)
  );
}

export class InMemoryFinanceLedgerRepository implements FinanceLedgerRepository {
  async appendLedgerEntry(command: AppendLedgerEntryCommand): Promise<LedgerEntry> {
    return appendLedgerEntry(command);
  }

  async getLedgerEntries(input: GetLedgerQuery = {}): Promise<LedgerEntry[]> {
    return getLedgerEntries(input);
  }
}

export class PostgresFinanceLedgerRepository implements FinanceLedgerRepository {
  async appendLedgerEntry(command: AppendLedgerEntryCommand): Promise<LedgerEntry> {
    const existing = await this.findByIdempotencyKey(command.idempotencyKey);
    if (existing) {
      if (!commandMatchesEntry(command, existing)) {
        throw new Error('DUPLICATE_IDEMPOTENCY_KEY_CONFLICT');
      }
      return existing;
    }

    const entryId = `ld-${randomUUID()}`;
    const createdAt = new Date();
    const sql = `
      INSERT INTO finance_ledger_entries (
        ledger_entry_id,
        idempotency_key,
        source_type,
        source_id,
        source_event_id,
        direction,
        entry_type,
        amount,
        currency,
        account_type,
        account_key,
        counterparty_type,
        counterparty_id,
        metadata,
        created_at,
        immutable
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, TRUE
      )
      RETURNING *;
    `;

    try {
      const result = await query<FinanceLedgerEntryRow>(sql, [
        entryId,
        command.idempotencyKey,
        command.sourceType,
        command.sourceId,
        command.sourceEventId ?? null,
        command.direction,
        command.entryType,
        command.amount,
        command.currency,
        command.accountType ?? null,
        command.accountKey ?? null,
        command.counterpartyType ?? null,
        command.counterpartyId ?? null,
        command.metadata ? JSON.stringify(command.metadata) : null,
        createdAt,
      ]);
      return mapRowToLedgerEntry(result.rows[0]);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const duplicate = await this.findByIdempotencyKey(command.idempotencyKey);
      if (duplicate && commandMatchesEntry(command, duplicate)) {
        return duplicate;
      }
      throw new Error('DUPLICATE_IDEMPOTENCY_KEY_CONFLICT');
    }
  }

  async getLedgerEntries(input: GetLedgerQuery = {}): Promise<LedgerEntry[]> {
    const clauses: string[] = [];
    const values: any[] = [];

    if (input.sourceType) {
      values.push(input.sourceType);
      clauses.push(`source_type = $${values.length}`);
    }
    if (input.sourceId) {
      values.push(input.sourceId);
      clauses.push(`source_id = $${values.length}`);
    }
    if (input.entryType) {
      values.push(input.entryType);
      clauses.push(`entry_type = $${values.length}`);
    }
    if (input.direction) {
      values.push(input.direction);
      clauses.push(`direction = $${values.length}`);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const result = await query<FinanceLedgerEntryRow>(
      `SELECT * FROM finance_ledger_entries ${where} ORDER BY created_at ASC, ledger_entry_id ASC`,
      values,
    );
    return result.rows.map(mapRowToLedgerEntry);
  }

  private async findByIdempotencyKey(idempotencyKey: string): Promise<LedgerEntry | null> {
    const result = await query<FinanceLedgerEntryRow>(
      'SELECT * FROM finance_ledger_entries WHERE idempotency_key = $1 LIMIT 1',
      [idempotencyKey],
    );
    return result.rows[0] ? mapRowToLedgerEntry(result.rows[0]) : null;
  }
}

let financeLedgerRepository: FinanceLedgerRepository | null = null;

export function getFinanceLedgerRepository(): FinanceLedgerRepository {
  if (financeLedgerRepository) return financeLedgerRepository;
  financeLedgerRepository =
    process.env.PERSISTENCE_MODE === 'postgres'
      ? new PostgresFinanceLedgerRepository()
      : new InMemoryFinanceLedgerRepository();
  return financeLedgerRepository;
}

export function resetFinanceLedgerRepositoryForTesting(): void {
  financeLedgerRepository = null;
}

export function appendLedgerEntry(command: AppendLedgerEntryCommand): LedgerEntry {
  // Enforce idempotency
  const existing = ledger.find((e) => e.idempotencyKey === command.idempotencyKey);
  if (existing) {
    throw new Error('DUPLICATE_IDEMPOTENCY_KEY');
  }

  const entry: LedgerEntry = {
    ledgerEntryId: `ld-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    ...command,
    createdAt: new Date().toISOString(),
    immutable: true,
  };

  ledger.push(entry);
  return entry;
}

export function getLedgerEntries(query: GetLedgerQuery = {}): LedgerEntry[] {
  return ledger.filter((entry) => {
    if (query.sourceType && entry.sourceType !== query.sourceType) return false;
    if (query.sourceId && entry.sourceId !== query.sourceId) return false;
    if (query.entryType && entry.entryType !== query.entryType) return false;
    if (query.direction && entry.direction !== query.direction) return false;
    return true;
  });
}

// Strictly for tests
export function _clearLedger(): void {
  ledger.length = 0;
}
