import {
  getLatestOperationalAuditOutboxByTarget,
  getLatestOperationalIntentByTarget,
  recordOperationalIntent,
  resetOperationalIntentRepository,
  type RecordOperationalIntentInput,
} from '@hx/persistence';

export function recordModerationOperationalIntent(input: Omit<RecordOperationalIntentInput, 'domain'>) {
  return recordOperationalIntent({ ...input, domain: 'moderation' });
}

export function getLatestModerationOperationalIntent(caseId: string) {
  return getLatestOperationalIntentByTarget('moderation', caseId);
}

export function getLatestModerationAuditIntentOutbox(caseId: string) {
  return getLatestOperationalAuditOutboxByTarget('moderation', caseId);
}

export function resetModerationOperationalIntentPersistenceForTesting() {
  resetOperationalIntentRepository();
}
