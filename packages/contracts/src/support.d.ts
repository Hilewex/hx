export type SupportActorType = 'CUSTOMER' | 'CREATOR' | 'SUPPLIER' | 'ADMIN' | 'SYSTEM';
export type SupportTicketCategory = 'ORDER' | 'SHIPMENT' | 'CANCEL_RETURN' | 'REFUND' | 'PAYMENT' | 'ACCOUNT' | 'TECHNICAL' | 'PRODUCT_ISSUE' | 'STORE_COMPLAINT' | 'SAFETY_COMPLAINT' | 'OTHER';
export type SupportTicketSubtopic = 'ORDER_NOT_VISIBLE' | 'ORDER_STATUS' | 'MISSING_OR_WRONG_ITEM' | 'SHIPMENT_DELAYED' | 'DELIVERED_NOT_RECEIVED' | 'RETURN_STATUS' | 'CANCEL_REQUEST' | 'PAYMENT_FAILED' | 'DOUBLE_CHARGE' | 'PAYMENT_SUCCESS_ORDER_MISSING' | 'LOGIN_PROBLEM' | 'ACCOUNT_RESTRICTED' | 'PAGE_NOT_LOADING' | 'CHECKOUT_ERROR' | 'PRODUCT_MISMATCH' | 'DEFECTIVE_PRODUCT' | 'STORE_BEHAVIOR_COMPLAINT' | 'INAPPROPRIATE_CONTENT' | 'SECURITY_CONCERN' | 'OTHER';
export type SupportTicketStatus = 'OPEN' | 'TRIAGED' | 'WAITING_FOR_CUSTOMER' | 'ESCALATED' | 'RESOLVED' | 'CLOSED' | 'REJECTED';
export type SupportTicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type SupportTicketChannel = 'HELP_POCKET' | 'ORDER_DETAIL' | 'PAYMENT_SCREEN' | 'PDP' | 'ACCOUNT' | 'NOTIFICATION_CENTER' | 'SYSTEM';
export type SupportContextType = 'ORDER' | 'ORDER_LINE' | 'PAYMENT' | 'SHIPMENT' | 'CANCEL_RETURN' | 'REFUND' | 'PRODUCT' | 'STORE' | 'ACCOUNT' | 'TECHNICAL' | 'MODERATION_ITEM' | 'NONE';
export type SupportEscalationTarget = 'SUPPORT' | 'OPERATIONS' | 'FINANCE' | 'TECHNICAL' | 'MODERATION' | 'SAFETY';
export interface SupportTicketContextRef {
    contextType: SupportContextType;
    contextId?: string;
    secondaryContextType?: SupportContextType;
    secondaryContextId?: string;
}
export interface SupportTicketMessage {
    messageId: string;
    authorType: SupportActorType;
    authorId: string;
    body: string;
    createdAt: string;
    isInternalNote: boolean;
}
export interface SupportSelfServiceSuggestion {
    suggestionType: 'ROUTE' | 'INFO' | 'CREATE_TICKET';
    title: string;
    body?: string;
    targetRoute?: string;
    escalationTarget?: SupportEscalationTarget;
}
export interface SupportTicketRecord {
    ticketId: string;
    actorType: SupportActorType;
    actorId: string;
    category: SupportTicketCategory;
    subtopic: SupportTicketSubtopic;
    status: SupportTicketStatus;
    priority: SupportTicketPriority;
    channel: SupportTicketChannel;
    context?: SupportTicketContextRef;
    title: string;
    description: string;
    messages: SupportTicketMessage[];
    selfServiceSuggestions: SupportSelfServiceSuggestion[];
    escalationTarget?: SupportEscalationTarget;
    createdAt: string;
    updatedAt: string;
    closedAt?: string;
    idempotencyKey?: string;
    socialMessageBoundary: true;
    officialSupportProcess: true;
    errors?: string[];
    warnings?: string[];
}
export interface CreateSupportTicketCommand {
    actorType: SupportActorType;
    actorId: string;
    category: SupportTicketCategory;
    subtopic: SupportTicketSubtopic;
    title: string;
    description: string;
    channel: SupportTicketChannel;
    context?: SupportTicketContextRef;
    idempotencyKey?: string;
}
export interface SupportTicketListQuery {
    actorType: SupportActorType;
    actorId: string;
    status?: SupportTicketStatus;
    category?: SupportTicketCategory;
    limit?: number;
    cursor?: string;
}
export interface SupportTicketListResponse {
    items: SupportTicketRecord[];
    openCount: number;
    nextCursor?: string;
    errors?: string[];
    warnings?: string[];
}
export interface SupportTicketTransitionCommand {
    ticketId: string;
    targetStatus: SupportTicketStatus;
    actorType?: SupportActorType;
    actorId?: string;
    reasonCode?: string;
    note?: string;
}
export interface AddSupportTicketMessageCommand {
    ticketId: string;
    authorType: SupportActorType;
    authorId: string;
    body: string;
    isInternalNote?: boolean;
}
export interface SupportTicketMutationResult {
    success: boolean;
    ticket?: SupportTicketRecord;
    errors?: string[];
    warnings?: string[];
}
//# sourceMappingURL=support.d.ts.map