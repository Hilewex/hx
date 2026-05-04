import {
  OrderOpsContextQuery,
  OrderOpsResponse,
  OrderOpsOverview,
  OrderOpsStatus,
  OrderOpsIssue,
  OrderOpsSuggestedAction,
  OrderOpsIssueType,
  OrderOpsSuggestedActionType,
  OrderOpsSeverity,
  ShipmentResponse,
  CancelReturnResponse
} from '@hx/contracts';
import { getOrderDetail } from '@hx/order';
import { getShipmentsByOrderId } from '@hx/shipment';
import { getCancelReturnRequestsByOrderId } from '@hx/cancel-return';
import { getRefundByCancelReturnRequestId } from '@hx/refund';
import { listSupportTickets } from '@hx/support';
import { listRiskCases } from '@hx/risk';

export async function getOrderOpsOverview(query: OrderOpsContextQuery): Promise<OrderOpsResponse> {
  const warnings: string[] = [];

  if (!query.orderId) {
    return { errors: ['ORDER_OPS_ORDER_ID_REQUIRED'] };
  }

  const order = await getOrderDetail(query.orderId);
  if (order.errors?.length || !order.orderId) {
    return { errors: ['ORDER_OPS_ORDER_NOT_FOUND'] };
  }

  const shipments: ShipmentResponse[] = await getShipmentsByOrderId(query.orderId);
  const cancelReturns: CancelReturnResponse[] = await getCancelReturnRequestsByOrderId(query.orderId);

  let activeRefundCount = 0;
  for (const cr of cancelReturns) {
    const refund = await getRefundByCancelReturnRequestId(cr.requestId);
    if (refund && !['SUCCEEDED', 'FAILED', 'CANCELLED', 'CLOSED'].includes(refund.state)) {
      activeRefundCount++;
    }
  }

  let activeSupportTicketCount = 0;
  let supportEscalated = false;
  if (query.includeSupport) {
    if (query.actorType && query.actorId) {
      const ticketsRes = await listSupportTickets({
        actorType: query.actorType,
        actorId: query.actorId,
        category: 'ORDER'
      });
      const tickets = ticketsRes.items || [];
      const orderTickets = tickets.filter((t: any) => t.context?.contextId === query.orderId || t.title.includes(query.orderId) || t.description.includes(query.orderId)); // Simplified ticket matching since SupportTicketRecord doesn't directly have orderId at root level
      activeSupportTicketCount = orderTickets.filter((t: any) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
      supportEscalated = orderTickets.some((t: any) => t.status === 'ESCALATED');
    } else {
      warnings.push('SUPPORT_ACTOR_CONTEXT_NOT_PROVIDED');
    }
  }

  let activeRiskCaseCount = 0;
  let activeRisk = false;
  if (query.includeRisk) {
    const risksRes = await listRiskCases({ targetType: 'ORDER', targetId: query.orderId });
    const risks = risksRes.cases || [];
    const activeRisks = risks.filter((r: any) => ['OPEN', 'UNDER_REVIEW', 'REVIEW_REQUIRED', 'ADVISORY_HOLD_RECOMMENDED', 'ESCALATED'].includes(r.status));
    activeRiskCaseCount = activeRisks.length;
    activeRisk = activeRisks.length > 0;
  }

  let status: OrderOpsStatus = 'UNKNOWN';
  const issues: OrderOpsIssue[] = [];
  const suggestedActions: OrderOpsSuggestedAction[] = [];

  const activeCancelReturnCount = cancelReturns.filter((cr: any) => !['REJECTED', 'REFUNDED', 'REFUNDED_PARTIALLY', 'REFUNDED_FULLY', 'CLOSED'].includes(cr.state)).length;
  const hasActiveCancelReturn = activeCancelReturnCount > 0;
  const hasActiveRefund = activeRefundCount > 0;

  const isDeliveryFailed = shipments.some((s: any) => s.state === 'DELIVERY_FAILED' || s.state === 'RETURNED' || s.state === 'RETURNED_TO_SENDER');
  const isDelivered = shipments.length > 0 && shipments.every((s: any) => s.state === 'DELIVERED');
  const isShipped = shipments.length > 0 && shipments.some((s: any) => ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s.state));
  const isPreparing = shipments.length > 0 && shipments.some((s: any) => ['CREATED', 'PREPARING'].includes(s.state));

  if (isDeliveryFailed) {
    status = 'OPERATION_BLOCKED';
    issues.push({ type: 'SHIPMENT_DELIVERY_FAILED', severity: 'HIGH', message: 'Shipment delivery failed', source: 'shipment' });
    suggestedActions.push({ type: 'CHECK_SHIPMENT_STATUS', label: 'Check Shipment Status', targetOwner: 'shipment', advisoryOnly: true, commandExecuted: false });
  } else if (hasActiveRefund) {
    status = 'REFUND_ACTIVE';
    issues.push({ type: 'PARTIAL_OPERATION', severity: 'WARNING', message: 'Active refund in progress', source: 'refund' });
    suggestedActions.push({ type: 'REVIEW_REFUND', label: 'Review Refund', targetOwner: 'refund', advisoryOnly: true, commandExecuted: false });
  } else if (hasActiveCancelReturn) {
    status = 'CANCEL_OR_RETURN_ACTIVE';
    issues.push({ type: 'CANCEL_RETURN_ACTIVE', severity: 'WARNING', message: 'Active cancel/return request', source: 'cancel-return' });
    suggestedActions.push({ type: 'REVIEW_CANCEL_RETURN', label: 'Review Cancel/Return', targetOwner: 'cancel-return', advisoryOnly: true, commandExecuted: false });
  } else if (activeRisk) {
    status = 'REQUIRES_RISK_REVIEW';
    issues.push({ type: 'RISK_REVIEW_REQUIRED', severity: 'CRITICAL', message: 'Active risk case requires review', source: 'risk' });
    suggestedActions.push({ type: 'REVIEW_RISK_CASE', label: 'Review Risk Case', targetOwner: 'risk', advisoryOnly: true, commandExecuted: false });
  } else if (supportEscalated) {
    status = 'REQUIRES_SUPPORT_REVIEW';
    issues.push({ type: 'SUPPORT_ESCALATED', severity: 'HIGH', message: 'Support ticket escalated', source: 'support' });
    suggestedActions.push({ type: 'REVIEW_SUPPORT_TICKET', label: 'Review Support Ticket', targetOwner: 'support', advisoryOnly: true, commandExecuted: false });
  } else if (isDelivered) {
    status = 'DELIVERED';
  } else if (isShipped) {
    status = 'SHIPMENT_IN_PROGRESS';
  } else if (isPreparing) {
    status = 'FULFILLMENT_IN_PROGRESS';
  } else if (shipments.length === 0 && ['CREATED', 'CONFIRMED'].includes(order.state)) {
    status = 'READY_FOR_FULFILLMENT';
    issues.push({ type: 'SHIPMENT_NOT_CREATED', severity: 'INFO', message: 'Shipment not created yet', source: 'shipment' });
    suggestedActions.push({ type: 'CREATE_SHIPMENT_ADVISORY', label: 'Create Shipment Advisory', targetOwner: 'shipment', advisoryOnly: true, commandExecuted: false });
  } else {
    status = 'UNKNOWN';
  }

  if (issues.length === 0 && suggestedActions.length === 0) {
    suggestedActions.push({ type: 'NO_ACTION', label: 'No Action Needed', targetOwner: 'none', advisoryOnly: true, commandExecuted: false });
  }

  const overview: OrderOpsOverview = {
    orderId: query.orderId,
    orderState: order.state,
    shipmentStateSummary: shipments.length ? shipments[0].state : undefined,
    activeCancelReturnCount,
    activeRefundCount,
    activeSupportTicketCount,
    activeRiskCaseCount,
    status,
    issues,
    suggestedActions,
    boundaryFlags: {
      orderTruthMutated: false,
      shipmentTruthMutated: false,
      cancelReturnTruthMutated: false,
      refundTruthMutated: false,
      supportTruthMutated: false,
      riskTruthMutated: false,
      financeTruthMutated: false
    }
  };

  return {
    data: overview,
    warnings: warnings.length ? warnings : undefined
  };
}
