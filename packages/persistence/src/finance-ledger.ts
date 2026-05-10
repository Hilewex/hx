import { LedgerEntry, AppendLedgerEntryCommand, GetLedgerQuery } from '@hx/contracts';

// In-memory array for ledger
// Append-only, immutable list
const ledger: LedgerEntry[] = [];

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
