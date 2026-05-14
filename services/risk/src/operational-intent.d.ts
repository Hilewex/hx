import { type RecordOperationalIntentInput } from '@hx/persistence';
export declare function recordRiskOperationalIntent(input: Omit<RecordOperationalIntentInput, 'domain'>): Promise<import("@hx/persistence").OperationalIntentRecordResult>;
export declare function getLatestRiskOperationalIntent(caseId: string): Promise<import("@hx/persistence").OperationalIntentRecord | null>;
export declare function getLatestRiskAuditIntentOutbox(caseId: string): Promise<import("@hx/persistence").AuditIntentOutboxRecord | null>;
export declare function resetRiskOperationalIntentPersistenceForTesting(): void;
