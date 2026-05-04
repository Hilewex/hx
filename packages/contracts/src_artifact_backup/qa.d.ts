export type QaActorType = 'CUSTOMER' | 'ADMIN' | 'OPERATOR' | 'SUPPLIER' | 'SYSTEM';
export type QaQuestionStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'HIDDEN' | 'ARCHIVED';
export type QaAnswerStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'HIDDEN' | 'ARCHIVED';
export type QaModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type QaVisibilityState = 'NOT_VISIBLE' | 'VISIBLE' | 'HIDDEN_BY_MODERATION' | 'ARCHIVED';
export type QaQuestionSource = 'PDP' | 'ORDER_DETAIL' | 'ACCOUNT' | 'SYSTEM';
export type QaAnswerAuthorType = 'PLATFORM' | 'SUPPLIER' | 'ADMIN' | 'OPERATOR' | 'SYSTEM';
export interface QaProductTag {
    productId: string;
    storefrontId?: string;
    variantId?: string;
}
export interface QaAnswerRecord {
    answerId: string;
    questionId: string;
    authorType: QaAnswerAuthorType;
    authorId: string;
    body: string;
    status: QaAnswerStatus;
    moderationStatus: QaModerationStatus;
    visibilityState: QaVisibilityState;
    createdAt: string;
    updatedAt: string;
    submittedAt?: string;
    publishedAt?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    hiddenAt?: string;
    archivedAt?: string;
    officialAnswer: true;
    customerGenerated: false;
    errors: string[];
    warnings: string[];
}
export interface QaQuestionRecord {
    questionId: string;
    actorId: string;
    actorType: QaActorType;
    productTag: QaProductTag;
    source: QaQuestionSource;
    body: string;
    status: QaQuestionStatus;
    moderationStatus: QaModerationStatus;
    visibilityState: QaVisibilityState;
    answers: QaAnswerRecord[];
    createdAt: string;
    updatedAt: string;
    submittedAt?: string;
    publishedAt?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    hiddenAt?: string;
    archivedAt?: string;
    idempotencyKey?: string;
    reviewProcess: false;
    ratingProcess: false;
    ugcStory: false;
    storePost: false;
    supportProcess: false;
    socialThreadEnabled: false;
    errors: string[];
    warnings: string[];
}
export interface CreateQaQuestionCommand {
    actorId: string;
    actorType?: QaActorType;
    productTag: QaProductTag;
    body: string;
    source?: QaQuestionSource;
    idempotencyKey?: string;
}
export interface CreateQaAnswerCommand {
    questionId: string;
    authorType: QaAnswerAuthorType;
    authorId: string;
    body: string;
    idempotencyKey?: string;
}
export interface QaQuestionListQuery {
    productId?: string;
    actorId?: string;
    status?: QaQuestionStatus;
    visibilityState?: QaVisibilityState;
    includeAnswers?: boolean;
    limit?: number;
    cursor?: string;
}
export interface QaQuestionListResponse {
    items: QaQuestionRecord[];
    nextCursor?: string;
    warnings?: string[];
}
export interface QaQuestionTransitionCommand {
    questionId: string;
    targetStatus: QaQuestionStatus;
    actorType?: string;
    actorId?: string;
    reasonCode?: string;
    note?: string;
}
export interface QaAnswerTransitionCommand {
    questionId: string;
    answerId: string;
    targetStatus: QaAnswerStatus;
    actorType?: string;
    actorId?: string;
    reasonCode?: string;
    note?: string;
}
export interface QaMutationResult {
    success: boolean;
    question?: QaQuestionRecord;
    answer?: QaAnswerRecord;
    errors?: string[];
    warnings?: string[];
}
//# sourceMappingURL=qa.d.ts.map