import {
  getLatestOperationalAuditOutboxByTarget,
  getLatestOperationalIntentByTarget,
  recordOperationalIntent,
  resetOperationalIntentRepository,
  type RecordOperationalIntentInput,
} from '@hx/persistence';

export function recordRiskOperationalIntent(input: Omit<RecordOperationalIntentInput, 'domain'>) {
  return recordOperationalIntent({ ...input, domain: 'risk' });
}

export function getLatestRiskOperationalIntent(caseId: string) {
  return getLatestOperationalIntentByTarget('risk', caseId);
}

export function getLatestRiskAuditIntentOutbox(caseId: string) {
  return getLatestOperationalAuditOutboxByTarget('risk', caseId);
}

export function resetRiskOperationalIntentPersistenceForTesting() {
  resetOperationalIntentRepository();
}
