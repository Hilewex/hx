import { SupportActorType } from './support';

export type OrderOpsStatus =
  | 'NOT_STARTED'
  | 'READY_FOR_FULFILLMENT'
  | 'FULFILLMENT_IN_PROGRESS'
  | 'SHIPMENT_IN_PROGRESS'
  | 'DELIVERED'
  | 'CANCEL_OR_RETURN_ACTIVE'
  | 'REFUND_ACTIVE'
  | 'REQUIRES_SUPPORT_REVIEW'
  | 'REQUIRES_RISK_REVIEW'
  | 'OPERATION_BLOCKED'
  | 'COMPLETED'
  | 'UNKNOWN';

export type OrderOpsSeverity =
  | 'INFO'
  | 'WARNING'
  | 'HIGH'
  | 'CRITICAL';

export type OrderOpsIssueType =
  | 'ORDER_NOT_FOUND'
  | 'SHIPMENT_NOT_CREATED'
  | 'SHIPMENT_DELIVERY_FAILED'
  | 'CANCEL_RETURN_ACTIVE'
  | 'REFUND_RECONCILIATION_REQUIRED'
  | 'SUPPORT_ESCALATED'
  | 'RISK_REVIEW_REQUIRED'
  | 'PARTIAL_OPERATION'
  | 'DATA_INCOMPLETE';

export type OrderOpsSuggestedActionType =
  | 'CREATE_SHIPMENT_ADVISORY'
  | 'CHECK_SHIPMENT_STATUS'
  | 'REVIEW_CANCEL_RETURN'
  | 'REVIEW_REFUND'
  | 'REVIEW_SUPPORT_TICKET'
  | 'REVIEW_RISK_CASE'
  | 'NO_ACTION';

export interface OrderOpsContextQuery {
  orderId: string;
  actorType?: SupportActorType;
  actorId?: string;
  includeSupport?: boolean;
  includeRisk?: boolean;
}

export interface OrderOpsIssue {
  type: OrderOpsIssueType;
  severity: OrderOpsSeverity;
  message: string;
  source: string;
  targetId?: string;
}

export interface OrderOpsSuggestedAction {
  type: OrderOpsSuggestedActionType;
  label: string;
  targetOwner: string;
  advisoryOnly: true;
  commandExecuted: false;
}

export interface OrderOpsOverview {
  orderId: string;
  orderState?: string;
  shipmentStateSummary?: string;
  activeCancelReturnCount: number;
  activeRefundCount: number;
  activeSupportTicketCount: number;
  activeRiskCaseCount: number;
  status: OrderOpsStatus;
  issues: OrderOpsIssue[];
  suggestedActions: OrderOpsSuggestedAction[];
  boundaryFlags: {
    orderTruthMutated: false;
    shipmentTruthMutated: false;
    cancelReturnTruthMutated: false;
    refundTruthMutated: false;
    supportTruthMutated: false;
    riskTruthMutated: false;
    financeTruthMutated: false;
  };
}

export interface OrderOpsResponse {
  data?: OrderOpsOverview;
  errors?: string[];
  warnings?: string[];
}
