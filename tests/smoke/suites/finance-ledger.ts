import { appendLedgerEntry, getLedgerEntries, _clearLedger } from '@hx/persistence';
export interface SmokeSuiteResult {
  result: 'PASS' | 'FAIL';
  message?: string;
}

export interface SmokeSuite {
  name: string;
  run: (baseUrl: string) => Promise<SmokeSuiteResult>;
}

export const financeLedgerSmoke: SmokeSuite = {
  name: 'finance-ledger-foundation',
  run: async (baseUrl: string): Promise<SmokeSuiteResult> => {
    try {
      _clearLedger();

      // 1. Valid ledger entry append
      const entry = appendLedgerEntry({
        idempotencyKey: 'test-idem-1',
        sourceType: 'PAYMENT',
        sourceId: 'pay-1',
        direction: 'CREDIT',
        entryType: 'PAYMENT_CAPTURE',
        amount: 100,
        currency: 'TRY',
      });

      if (!entry.ledgerEntryId || entry.idempotencyKey !== 'test-idem-1' || entry.immutable !== true) {
        return { result: 'FAIL', message: 'Failed to append valid ledger entry' };
      }

      // 2. Duplicate same key same payload -> prevent duplicate
      let errorThrown = false;
      try {
        appendLedgerEntry({
          idempotencyKey: 'test-idem-1',
          sourceType: 'PAYMENT',
          sourceId: 'pay-1',
          direction: 'CREDIT',
          entryType: 'PAYMENT_CAPTURE',
          amount: 100,
          currency: 'TRY',
        });
      } catch (err: any) {
        if (err.message === 'DUPLICATE_IDEMPOTENCY_KEY') {
          errorThrown = true;
        }
      }
      
      if (!errorThrown) {
        return { result: 'FAIL', message: 'Failed to prevent duplicate idempotency key' };
      }

      // 3. list/read expected entries
      appendLedgerEntry({
        idempotencyKey: 'test-idem-3',
        sourceType: 'REFUND',
        sourceId: 'ref-1',
        direction: 'DEBIT',
        entryType: 'REFUND',
        amount: 20,
        currency: 'TRY',
      });

      const entries = getLedgerEntries({ sourceType: 'REFUND' });
      if (entries.length !== 1 || entries[0].amount !== 20) {
        return { result: 'FAIL', message: 'Failed to get ledger entries by criteria' };
      }
      
      return { result: 'PASS' };
    } catch (e: any) {
      return { result: 'FAIL', message: e.message };
    }
  }
};
