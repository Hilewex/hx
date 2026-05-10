import { LedgerEntry, AppendLedgerEntryCommand, GetLedgerQuery } from '@hx/contracts';
export declare function appendLedgerEntry(command: AppendLedgerEntryCommand): LedgerEntry;
export declare function getLedgerEntries(query?: GetLedgerQuery): LedgerEntry[];
export declare function _clearLedger(): void;
//# sourceMappingURL=finance-ledger.d.ts.map