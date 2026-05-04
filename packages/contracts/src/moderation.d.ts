export type ModerationTargetType = 'STORE_POST' | 'UGC' | 'STORY' | 'REVIEW' | 'QA_QUESTION' | 'QA_ANSWER' | 'INTERACTION_SIGNAL' | 'STOREFRONT_PROFILE';
export type ModerationCaseStatus = 'OPEN' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'RESTRICTED' | 'ACTION_REQUIRED' | 'CLOSED';
export type ModerationDecision = 'APPROVE' | 'REJECT' | 'RESTRICT_VISIBILITY' | 'HIDE' | 'ARCHIVE' | 'NO_ACTION' | 'ESCALATE';
export type ModerationRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ModerationSource = 'SYSTEM_RULE' | 'USER_REPORT' | 'SUPPORT_ESCALATION' | 'ADMIN_REVIEW' | 'FOUNDATION_SIMULATION';
export type ModerationReasonCode = 'SPAM' | 'MISLEADING_CLAIM' | 'OFF_PLATFORM_REDIRECT' | 'ABUSE' | 'INAPPROPRIATE_MEDIA' | 'POLICY_VIOLATION' | 'BOT_LIKE_BEHAVIOR' | 'UNKNOWN';
export interface ModerationTargetRef {
    targetType: ModerationTargetType;
    targetId: string;
    ownerActorId?: string;
    storefrontId?: string;
    productId?: string;
}
export interface ModerationSnapshot {
    snapshotId: string;
    target: ModerationTargetRef;
    contentText?: string;
    mediaAssetIds?: string[];
    source: ModerationSource;
    riskLevel: ModerationRiskLevel;
    createdAt: string;
    moderationTruth: true;
    targetTruthMutated: false;
    mediaTruthMutated: false;
    supportTruthMutated: false;
    warnings?: string[];
}
export interface ModerationCase {
    caseId: string;
    target: ModerationTargetRef;
    status: ModerationCaseStatus;
    source: ModerationSource;
    riskLevel: ModerationRiskLevel;
    reasonCodes: ModerationReasonCode[];
    snapshots: ModerationSnapshot[];
    decision?: ModerationDecision;
    decisionNote?: string;
    createdAt: string;
    updatedAt: string;
    reviewedAt?: string;
    closedAt?: string;
    moderationTruth: true;
    targetTruthMutated: false;
    postTruthMutated: false;
    ugcTruthMutated: false;
    storyTruthMutated: false;
    reviewTruthMutated: false;
    qaTruthMutated: false;
    interactionTruthMutated: false;
    warnings?: string[];
}
export interface CreateModerationCaseCommand {
    target: ModerationTargetRef;
    source: ModerationSource;
    riskLevel?: ModerationRiskLevel;
    reasonCodes?: ModerationReasonCode[];
    contentText?: string;
    mediaAssetIds?: string[];
    idempotencyKey?: string;
}
export interface ReviewModerationCaseCommand {
    caseId: string;
    decision: ModerationDecision;
    note?: string;
}
export interface GetModerationCaseQuery {
    caseId: string;
}
export interface ListModerationCasesQuery {
    targetType?: ModerationTargetType;
    status?: ModerationCaseStatus;
    riskLevel?: ModerationRiskLevel;
    source?: ModerationSource;
    limit?: number;
    cursor?: string;
}
export interface ModerationMutationResult {
    success: boolean;
    caseId?: string;
    warnings?: string[];
}
export interface ModerationCaseResponse {
    data: ModerationCase;
    warnings?: string[];
}
export interface ModerationCaseListResponse {
    items: ModerationCase[];
    nextCursor?: string;
    warnings?: string[];
}
//# sourceMappingURL=moderation.d.ts.map