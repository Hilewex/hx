"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendLedgerEntry = appendLedgerEntry;
exports.getLedgerEntries = getLedgerEntries;
exports._clearLedger = _clearLedger;
// In-memory array for ledger
// Append-only, immutable list
const ledger = [];
function appendLedgerEntry(command) {
    // Enforce idempotency
    const existing = ledger.find((e) => e.idempotencyKey === command.idempotencyKey);
    if (existing) {
        throw new Error('DUPLICATE_IDEMPOTENCY_KEY');
    }
    const entry = {
        ledgerEntryId: `ld-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...command,
        createdAt: new Date().toISOString(),
        immutable: true,
    };
    ledger.push(entry);
    return entry;
}
function getLedgerEntries(query = {}) {
    return ledger.filter((entry) => {
        if (query.sourceType && entry.sourceType !== query.sourceType)
            return false;
        if (query.sourceId && entry.sourceId !== query.sourceId)
            return false;
        if (query.entryType && entry.entryType !== query.entryType)
            return false;
        if (query.direction && entry.direction !== query.direction)
            return false;
        return true;
    });
}
// Strictly for tests
function _clearLedger() {
    ledger.length = 0;
}
