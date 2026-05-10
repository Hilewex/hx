export type SupportActorType = 'CUSTOMER' | 'CREATOR' | 'SUPPLIER' | 'ADMIN' | 'SYSTEM';

export type SupportTicketCategory = 
  | 'ORDER' 
  | 'SHIPMENT' 
  | 'CANCEL_RETURN' 
  | 'REFUND' 
  | 'PAYMENT' 
  | 'ACCOUNT' 
  | 'TECHNICAL' 
  | 'PRODUCT_ISSUE' 
  | 'STORE_COMPLAINT' 
  | 'SAFETY_COMPLAINT' 
  | 'OTHER';

export type SupportTicketSubtopic =
  | 'ORDER_NOT_VISIBLE'
  | 'ORDER_STATUS'
  | 'MISSING_OR_WRONG_ITEM'
  | 'SHIPMENT_DELAYED'
  | 'DELIVERED_NOT_RECEIVED'
  | 'RETURN_STATUS'
  | 'CANCEL_REQUEST'
  | 'PAYMENT_FAILED'
  | 'DOUBLE_CHARGE'
  | 'PAYMENT_SUCCESS_ORDER_MISSING'
  | 'LOGIN_PROBLEM'
  | 'ACCOUNT_RESTRICTED'
  | 'PAGE_NOT_LOADING'
  | 'CHECKOUT_ERROR'
  | 'PRODUCT_MISMATCH'
  | 'DEFECTIVE_PRODUCT'
  | 'STORE_BEHAVIOR_COMPLAINT'
  | 'INAPPROPRIATE_CONTENT'
  | 'SECURITY_CONCERN'
  | 'OTHER';

export type SupportTicketStatus =
  | 'OPEN'
  | 'TRIAGED'
  | 'WAITING_FOR_CUSTOMER'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED';

export type SupportTicketPriority =
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'URGENT';

export type SupportTicketChannel =
  | 'HELP_POCKET'
  | 'ORDER_DETAIL'
  | 'PAYMENT_SCREEN'
  | 'PDP'
  | 'ACCOUNT'
  | 'NOTIFICATION_CENTER'
  | 'SYSTEM';

export type SupportContextType =
  | 'ORDER'
  | 'ORDER_LINE'
  | 'PAYMENT'
  | 'SHIPMENT'
  | 'CANCEL_RETURN'
  | 'REFUND'
  | 'PRODUCT'
  | 'STORE'
  | 'ACCOUNT'
  | 'TECHNICAL'
  | 'MODERATION_ITEM'
  | 'NONE';

export type SupportEscalationTarget =
  | 'SUPPORT'
  | 'OPERATIONS'
  | 'FINANCE'
  | 'TECHNICAL'
  | 'MODERATION'
  | 'SAFETY';

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

export type SupportActor = {
  actorId: string;
  actorRole: string;
  supportRole: SupportRole;
  supportTeam?: SupportTeam;
};

export type SupportRole = 'SUPPORT_L1' | 'SUPPORT_L2' | 'SUPPORT_LEAD' | 'TRUST_AND_SAFETY';

export type SupportTeam = 'CUSTOMER_SUPPORT' | 'ORDER_SUPPORT' | 'PAYMENT_SUPPORT' | 'SAFETY_SUPPORT';

export type SupportActionType =
  | 'VIEW_ORDER_SUPPORT_CONTEXT'
  | 'VIEW_CUSTOMER_SUPPORT_CONTEXT'
  | 'CREATE_SUPPORT_TRIAGE_HANDOFF'
  | 'REQUEST_ORDER_OWNER_REVIEW'
  | 'REQUEST_REFUND_OWNER_REVIEW'
  | 'REQUEST_ESCALATION_REVIEW'
  | 'ASSIGN_SUPPORT_TICKET_FOUNDATION';

export type SupportActionTargetType =
  | 'ORDER'
  | 'CUSTOMER'
  | 'SUPPORT_TICKET'
  | 'REFUND'
  | 'ESCALATION'
  | 'TRIAGE_HANDOFF';

export type SupportPermissionCode =
  | 'CAN_VIEW_ORDER_SUPPORT_CONTEXT'
  | 'CAN_VIEW_CUSTOMER_SUPPORT_CONTEXT'
  | 'CAN_CREATE_SUPPORT_TRIAGE_HANDOFF'
  | 'CAN_REQUEST_ORDER_OWNER_REVIEW'
  | 'CAN_REQUEST_REFUND_OWNER_REVIEW'
  | 'CAN_REQUEST_ESCALATION_REVIEW'
  | 'CAN_ASSIGN_SUPPORT_TICKET_FOUNDATION';

export type SupportVisibilityScope = 'ORDER_SUPPORT_CONTEXT' | 'CUSTOMER_SUPPORT_CONTEXT' | 'TICKET_SUPPORT_CONTEXT';

export type SupportPiiPolicy = 'MASKED_MINIMIZED_ONLY';

export interface SupportActionTarget {
  targetType: SupportActionTargetType;
  targetId: string;
  customerId?: string;
  orderId?: string;
  ticketId?: string;
  refundId?: string;
}

export interface SupportProtectedActionRequest extends SupportActionTarget {
  actorId: string;
  actorRole: string;
  supportRole: SupportRole;
  supportTeam?: SupportTeam;
  actionType: SupportActionType;
  reasonCode: string;
  correlationId: string;
  idempotencyKey: string;
  requestedAt: string;
  scopeId?: string;
  ownerId?: string;
  permissionCode?: SupportPermissionCode;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface SupportVisibilityRequest {
  actorId: string;
  actorRole: string;
  supportRole: SupportRole;
  supportTeam?: SupportTeam;
  visibilityScope: SupportVisibilityScope;
  targetType: SupportActionTargetType;
  targetId: string;
  customerId?: string;
  orderId?: string;
  ticketId?: string;
  reasonCode: string;
  correlationId: string;
  idempotencyKey: string;
  requestedAt: string;
  scopeId?: string;
  permissionCode?: SupportPermissionCode;
  metadata?: Record<string, string | number | boolean | null>;
}

export type SupportActionDecision =
  | 'REJECTED'
  | 'ALLOWED_MASKED_VISIBILITY'
  | 'PENDING_OWNER_DOMAIN'
  | 'DUPLICATE_IDEMPOTENCY_KEY';

export interface SupportProtectedActionEvidence {
  actorId: string;
  actorRole: string;
  supportRole: SupportRole | 'UNKNOWN';
  supportTeam: SupportTeam | null;
  actionType: SupportActionType;
  targetType: SupportActionTargetType;
  targetId: string;
  customerId: string | null;
  orderId: string | null;
  ticketId: string | null;
  refundId: string | null;
  reasonCode: string;
  correlationId: string;
  idempotencyKey: string;
  decision: SupportActionDecision;
  permissionCode: SupportPermissionCode | null;
  visibilityScope: SupportVisibilityScope | null;
  piiPolicy: SupportPiiPolicy;
  ownerDomainHandoff: string | null;
  auditRequired: true;
  supportDirectWrite: false;
  orderTruthMutated: false;
  refundTruthMutated: false;
  financeTruthMutated: false;
  payoutTruthMutated: false;
  customerTruthMutated: false;
  customerPiiExposed: false;
  piiMasked: true;
  piiMinimized: true;
  bffTruthMutated: false;
  uiTruthMutated: false;
  roleSpoofingBlocked: boolean;
  permissionChecked: boolean;
  visibilityScopeChecked: boolean;
  auditEvidenceRequired: true;
  reasonCodeRequired: true;
  businessTruthMutated: false;
}

export interface SupportActionResult {
  success: boolean;
  evidence: SupportProtectedActionEvidence;
  error?: string;
}

export interface SupportVisibilityResult {
  success: boolean;
  evidence: SupportProtectedActionEvidence;
  maskedContext?: {
    targetId: string;
    customerId?: string;
    orderId?: string;
    ticketId?: string;
    piiPolicy: SupportPiiPolicy;
    maskedCustomerRef?: string;
  };
  error?: string;
}
