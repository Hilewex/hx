import { LedgerEntry, AppendLedgerEntryCommand, GetLedgerQuery } from '@hx/contracts';
export interface FinanceLedgerRepository {
    appendLedgerEntry(command: AppendLedgerEntryCommand): Promise<LedgerEntry>;
    getLedgerEntries(query?: GetLedgerQuery): Promise<LedgerEntry[]>;
}
export declare class InMemoryFinanceLedgerRepository implements FinanceLedgerRepository {
    appendLedgerEntry(command: AppendLedgerEntryCommand): Promise<LedgerEntry>;
    getLedgerEntries(input?: GetLedgerQuery): Promise<LedgerEntry[]>;
}
export declare class PostgresFinanceLedgerRepository implements FinanceLedgerRepository {
    appendLedgerEntry(command: AppendLedgerEntryCommand): Promise<LedgerEntry>;
    getLedgerEntries(input?: GetLedgerQuery): Promise<LedgerEntry[]>;
    private findByIdempotencyKey;
}
export declare function getFinanceLedgerRepository(): FinanceLedgerRepository;
export declare function resetFinanceLedgerRepositoryForTesting(): void;
export declare function appendLedgerEntry(command: AppendLedgerEntryCommand): LedgerEntry;
export declare function getLedgerEntries(query?: GetLedgerQuery): LedgerEntry[];
export declare function _clearLedger(): void;
//# sourceMappingURL=finance-ledger.d.ts.map
