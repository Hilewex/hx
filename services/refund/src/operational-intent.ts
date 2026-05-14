import {
  getLatestOperationalAuditOutboxByTarget,
  getLatestOperationalIntentByTarget,
  recordOperationalIntent,
  resetOperationalIntentRepository,
  type RecordOperationalIntentInput,
} from '@hx/persistence';

export function recordRefundOperationalIntent(input: Omit<RecordOperationalIntentInput, 'domain'>) {
  return recordOperationalIntent({ ...input, domain: 'refund' });
}

export function getLatestRefundOperationalIntent(refundId: string) {
  return getLatestOperationalIntentByTarget('refund', refundId);
}

export function getLatestRefundAuditIntentOutbox(refundId: string) {
  return getLatestOperationalAuditOutboxByTarget('refund', refundId);
}

export function resetRefundOperationalIntentPersistenceForTesting() {
  resetOperationalIntentRepository();
}
