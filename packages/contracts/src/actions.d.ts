export interface AuditMetadata {
    actorId: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: string;
}
export interface ProtectedActionRequest<T = unknown> {
    actionId: string;
    payload: T;
    reason: string;
    auditMeta?: AuditMetadata;
}
export type ProtectedActionStatus = 'ACCEPTED' | 'REJECTED' | 'PENDING_EXECUTION' | 'EXECUTED' | 'FAILED';
export interface ProtectedActionResult {
    actionId: string;
    status: ProtectedActionStatus;
    correlationId: string;
    message?: string;
    executedAt?: string;
}
//# sourceMappingURL=actions.d.ts.map