export interface AuditMetadata {
  actorId: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface ProtectedActionRequest<T = unknown> {
  actionId: string;
  payload: T;
  reason: string; // Required for protected actions
  auditMeta?: AuditMetadata; // Populated by BFF
}

export type ProtectedActionStatus = 'ACCEPTED' | 'REJECTED' | 'PENDING_EXECUTION' | 'EXECUTED' | 'FAILED';

export interface ProtectedActionResult {
  actionId: string;
  status: ProtectedActionStatus;
  correlationId: string;
  message?: string;
  executedAt?: string; // Empty if only ACCEPTED
}
