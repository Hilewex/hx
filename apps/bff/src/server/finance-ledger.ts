import {
  appendLedgerEntry,
  getLedgerEntries
} from '@hx/finance';
import * as response from './response';
import { requireFinanceRole } from './guards';

export async function handleAppendLedgerEntry(context: any, body: any) {
  const guardResult = requireFinanceRole(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const result = await appendLedgerEntry(body);

    if (!result.success) {
      if (result.errors?.includes('DUPLICATE_IDEMPOTENCY_KEY')) {
        return response.conflict('DUPLICATE_ENTRY', 'Ledger entry with this idempotency key already exists');
      }
      return response.unprocessable('LEDGER_APPEND_FAILED', result.errors?.join(', ') || 'Failed to append ledger entry');
    }

    return response.created(result);
  } catch (error: any) {
    return response.internalError('LEDGER_APPEND_FAILED', 'Failed to append ledger entry');
  }
}

export async function handleGetLedgerEntries(context: any, query: any) {
  const guardResult = requireFinanceRole(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const entries = await getLedgerEntries(query);
    return response.ok({ entries, total: entries.length });
  } catch (error: any) {
    return response.internalError('LEDGER_GET_FAILED', 'Failed to retrieve ledger entries');
  }
}
