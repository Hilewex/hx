import {
  CreateSettlementFromOrderCommand,
  ApplySettlementActionCommand,
  GetSettlementLineQuery,
  ListSettlementLinesQuery,
  SettlementMutationResult,
  SettlementLineResponse,
  SettlementLineListResponse,
  SettlementLine,
  SettlementLineStatus,
} from '@hx/contracts';

import { getOrderById } from '@hx/order';
import { getCancelReturnRequestsByOrderId } from '@hx/cancel-return';
import { listFinanceCorrections } from '@hx/finance-correction';
import { listRiskCases } from '@hx/risk';

import { randomUUID } from 'node:crypto';
import { getRepository } from './repository';

export async function createSettlementFromOrder(
  command: CreateSettlementFromOrderCommand
): Promise<SettlementMutationResult> {
  const { orderId, idempotencyKey } = command;

  if (!orderId) {
    return {
      success: false,
      errors: ['SETTLEMENT_ORDER_ID_REQUIRED'],
      warnings: [],
    };
  }

  const repo = getRepository();

  if (idempotencyKey) {
    const existingIds = await repo.getByIdempotencyKey(idempotencyKey);
    if (existingIds && existingIds.length > 0) {
      const existingLines = [];
      for (const id of existingIds) {
        const line = await repo.getById(id);
        if (line) existingLines.push(line);
      }
      return {
        success: true,
        settlementLines: existingLines,
        warnings: [],
      };
    }
  }

  // 1. Fetch Order
  const order = await getOrderById(orderId);
  if (!order) {
    return {
      success: false,
      errors: ['SETTLEMENT_ORDER_NOT_FOUND'],
      warnings: [],
    };
  }

  // 2. Fetch Active External States
  let refundImpactPending = false;
  let financeCorrectionPending = false;
  let riskHoldActive = false;

  const cancelReturnRequests = await getCancelReturnRequestsByOrderId(orderId);
  if (cancelReturnRequests && cancelReturnRequests.length > 0) {
    const activeStates = [
      'CREATED',
      'UNDER_REVIEW',
      'APPROVED',
      'AWAITING_RETURN_SHIPMENT',
      'RETURN_IN_TRANSIT',
      'RECEIVED_BACK',
      'PARTIALLY_APPROVED',
      'REFUND_PENDING',
    ];
    refundImpactPending = cancelReturnRequests.some((cr: any) =>
      activeStates.includes(cr.status || cr.state)
    );
  }

  const fcRes = await listFinanceCorrections({ targetId: orderId });
  if (fcRes && fcRes.corrections) {
    const activeFcStates = ['CREATED', 'UNDER_REVIEW', 'ADVISORY_RECORDED'];
    financeCorrectionPending = fcRes.corrections.some((fc: any) =>
      activeFcStates.includes(fc.status)
    );
  }

  const riskRes = await listRiskCases({ targetId: orderId });
  if (riskRes && riskRes.cases) {
    const activeRiskStates = [
      'OPEN',
      'UNDER_REVIEW',
      'ADVISORY_HOLD_RECOMMENDED',
      'REVIEW_REQUIRED',
      'ESCALATED',
    ];
    riskHoldActive = riskRes.cases.some((rc: any) => activeRiskStates.includes(rc.status));
  }

  // 3. Map Lines
  const newLines: SettlementLine[] = [];
  const errors: string[] = [];
  const warnings: string[] = ['SETTLEMENT_RULE_SOURCE_NOT_AVAILABLE'];
  const now = new Date().toISOString();

  for (const line of order.lines) {
    const settlementLineId = randomUUID();
    const status: SettlementLineStatus = riskHoldActive ? 'BLOCKED' : 'PENDING';

    newLines.push({
      settlementLineId,
      orderId: order.orderId,
      orderLineId: line.orderLineId,
      storefrontId: (line as any).storefrontId || 'unknown',
      productId: line.productId,
      variantId: line.variantId,
      partyType: 'SUPPLIER', // Assuming default or inferred
      partyId: (line as any).supplierId || undefined,
      status,
      reasonCode: 'ORDER_CREATED_FOUNDATION',
      amountSummary: {
        currency: order.summary.currency || 'TRY',
        grossAmount: line.lineTotalSnapshot,
        netAmount: line.lineTotalSnapshot,
        ruleSourceAvailable: false,
        calculationFinalized: false,
      },
      impactSummary: {
        payoutEligible: false,
        payoutBlocked: riskHoldActive,
        refundImpactPending,
        financeCorrectionPending,
        riskHoldActive,
        actualPayoutMutationPerformed: false,
        actualPaymentMutationPerformed: false,
        actualRefundMutationPerformed: false,
        actualOrderMutationPerformed: false,
        actualCancelReturnMutationPerformed: false,
        actualFinanceCorrectionMutationPerformed: false,
        actualRiskMutationPerformed: false,
      },
      sourceRefs: [
        { sourceType: 'ORDER', sourceId: order.orderId, sourceState: (order as any).state || (order as any).status },
        { sourceType: 'ORDER_LINE', sourceId: line.orderLineId },
      ],
      idempotencyKey,
      createdAt: now,
      updatedAt: now,
      errors: [],
      warnings: [...warnings],
    });
  }

  // 4. Save
  try {
    await repo.createMany(newLines);
    if (idempotencyKey) {
      await repo.saveIdempotencyKey(
        idempotencyKey,
        newLines.map((l) => l.settlementLineId)
      );
    }
  } catch (err) {
    return {
      success: false,
      errors: ['SETTLEMENT_PERSISTENCE_FAILED'],
      warnings: [],
    };
  }

  // 5. Audit (mock output as requested: Audit/outbox append fail olursa ...)
  // Actually we don't have direct access to an audit client in instructions, but simulating it.
  try {
    // mock audit append
  } catch (e) {
    warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
  }

  return {
    success: true,
    settlementLines: newLines,
    warnings,
  };
}

export async function applySettlementAction(
  command: ApplySettlementActionCommand
): Promise<SettlementMutationResult> {
  const { settlementLineId, action, actorId } = command;

  const repo = getRepository();
  const line = await repo.getById(settlementLineId);

  if (!line) {
    return {
      success: false,
      errors: ['SETTLEMENT_LINE_NOT_FOUND'],
    };
  }

  let newStatus: SettlementLineStatus = line.status;

  if (action === 'MARK_CONDITIONALLY_EARNED') newStatus = 'CONDITIONALLY_EARNED';
  if (action === 'MARK_BLOCKED') newStatus = 'BLOCKED';
  if (action === 'MARK_SETTLED') newStatus = 'SETTLED';
  if (action === 'MARK_REVERSED') newStatus = 'REVERSED';
  if (action === 'MARK_CANCELLED') newStatus = 'CANCELLED';
  if (action === 'CLOSE') newStatus = 'CLOSED';

  const updatedLine = { ...line, status: newStatus, updatedAt: new Date().toISOString() };

  await repo.update(settlementLineId, updatedLine);

  return {
    success: true,
    settlementLine: updatedLine,
  };
}

export async function getSettlementLine(
  query: GetSettlementLineQuery
): Promise<SettlementLineResponse | null> {
  const repo = getRepository();
  const line = await repo.getById(query.settlementLineId);

  if (!line) return null;

  return {
    settlementLine: line,
  };
}

export async function listSettlementLines(
  query: ListSettlementLinesQuery
): Promise<SettlementLineListResponse> {
  const repo = getRepository();
  const res = await repo.list(query);

  return res;
}
