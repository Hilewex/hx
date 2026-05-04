import { randomUUID } from 'node:crypto';
import {
  CreateFinanceCorrectionCommand,
  ReviewFinanceCorrectionCommand,
  GetFinanceCorrectionQuery,
  ListFinanceCorrectionsQuery,
  FinanceCorrectionMutationResult,
  FinanceCorrectionResponse,
  FinanceCorrectionListResponse,
  FinanceCorrectionRecord,
  FinanceCorrectionReasonCode,
} from '@hx/contracts';
import { getFinanceCorrectionRepository } from './repository';
import { getAuditEventRepositories } from '@hx/persistence';
import { getRefundById, getRefundDetail } from '@hx/refund';

export async function createFinanceCorrection(
  command: CreateFinanceCorrectionCommand
): Promise<FinanceCorrectionMutationResult> {
  const {
    target,
    reasonCode,
    severity = 'WARNING',
    sourceRefs = [],
    amountSummary: partialAmountSummary = {},
    notes,
    idempotencyKey,
  } = command;

  if (!target || !target.targetType || !target.targetId) {
    return { success: false, errors: ['FINANCE_CORRECTION_TARGET_REQUIRED'] };
  }

  if (!reasonCode) {
    return { success: false, errors: ['FINANCE_CORRECTION_REASON_REQUIRED'] };
  }

  const repo = getFinanceCorrectionRepository();

  if (idempotencyKey) {
    const existingId = await repo.getByIdempotencyKey(idempotencyKey);
    if (existingId) {
      const existingRecord = await repo.getById(existingId);
      if (existingRecord) {
        return { success: true, correctionId: existingId, correction: existingRecord };
      }
    }
  }

  const amountSummary = {
    currency: partialAmountSummary.currency || 'TRY',
    expectedAmount: partialAmountSummary.expectedAmount,
    actualAmount: partialAmountSummary.actualAmount,
    deltaAmount: partialAmountSummary.deltaAmount,
    amountSourceAvailable: partialAmountSummary.amountSourceAvailable ?? false,
  };

  const impactSummary = {
    settlementCorrectionRequired: false,
    payoutCorrectionRequired: false,
    paymentCorrectionRequired: false,
    refundCorrectionRequired: false,
    advisoryOnly: true as const,
    actualSettlementMutationPerformed: false as const,
    actualPayoutMutationPerformed: false as const,
    actualPaymentMutationPerformed: false as const,
    actualRefundMutationPerformed: false as const,
    actualOrderMutationPerformed: false as const,
    actualCancelReturnMutationPerformed: false as const,
    actualRiskMutationPerformed: false as const,
  };

  const correctionId = `fc_${randomUUID()}`;
  const now = new Date().toISOString();

  const record: FinanceCorrectionRecord = {
    correctionId,
    target,
    status: 'CREATED',
    severity,
    reasonCode,
    sourceRefs,
    amountSummary,
    impactSummary,
    notes,
    idempotencyKey,
    createdAt: now,
    updatedAt: now,
    errors: [],
    warnings: [],
  };

  await repo.create(record);

  if (idempotencyKey) {
    await repo.saveIdempotencyKey(idempotencyKey, correctionId);
  }

  const warnings: string[] = [];
  try {
    const auditEvent = getAuditEventRepositories();
    await auditEvent.audit.appendAuditLog({
      actorType: 'SYSTEM',
      actorId: 'finance-correction',
      actionType: 'finance_correction.created',
      ownerService: 'finance-correction',
      entityType: 'finance_correction',
      entityId: correctionId,
      afterState: record,
      correlationId: command.correlationId || correctionId,
      metadata: {
        paymentTruthMutated: false,
        refundTruthMutated: false,
        orderTruthMutated: false,
        cancelReturnTruthMutated: false,
        riskTruthMutated: false,
        settlementTruthMutated: false,
        payoutTruthMutated: false,
        advisoryOnly: true,
      },
    });

    await auditEvent.outbox.appendOutboxEvent({
      topic: 'finance_correction.created',
      payloadSchema: 'finance_correction.created.v1',
      payload: {
        correctionId,
        target,
        status: record.status,
        reasonCode,
        paymentTruthMutated: false,
        refundTruthMutated: false,
        orderTruthMutated: false,
        cancelReturnTruthMutated: false,
        riskTruthMutated: false,
        settlementTruthMutated: false,
        payoutTruthMutated: false,
        advisoryOnly: true,
      },
      ownerService: 'finance-correction',
      entityType: 'finance_correction',
      entityId: correctionId,
      idempotencyKey: idempotencyKey ? `outbox:${idempotencyKey}` : undefined,
      correlationId: command.correlationId || correctionId,
    });
  } catch (error) {
    warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
  }

  return { success: true, correctionId, correction: record, warnings };
}

export async function createFinanceCorrectionFromRefund(
  refundId: string,
  idempotencyKey?: string
): Promise<FinanceCorrectionMutationResult> {
  const actualIdempotencyKey = idempotencyKey || `finance-correction:refund:${refundId}`;
  
  const refund = await getRefundDetail(refundId);
  if (!refund) {
    return { success: false, errors: ['FINANCE_CORRECTION_REFUND_NOT_FOUND'] };
  }

  let reasonCode: FinanceCorrectionReasonCode = 'UNKNOWN';
  if (refund.state === 'RECONCILIATION_REQUIRED') {
    reasonCode = 'REFUND_SOURCE_PAYMENT_REFERENCE_MISSING';
  } else if (refund.warnings?.includes('REFUND_AMOUNT_SOURCE_NOT_AVAILABLE')) {
    reasonCode = 'REFUND_AMOUNT_SOURCE_NOT_AVAILABLE';
  } else {
    reasonCode = 'MANUAL_FINANCE_REVIEW';
  }

  const expectedAmount = refund.amountSummary?.requestedAmount;
  const currency = refund.amountSummary?.currency || 'TRY';

  const amountSummary = {
    currency,
    expectedAmount,
    amountSourceAvailable: expectedAmount !== undefined,
  };

  const record = await createFinanceCorrection({
    target: {
      targetType: 'REFUND',
      targetId: refundId,
    },
    reasonCode,
    severity: 'WARNING',
    sourceRefs: [
      {
        sourceType: 'REFUND',
        sourceId: refundId,
        sourceState: refund.state,
      },
      {
        sourceType: 'PAYMENT',
        sourceId: refund.paymentSummary?.originalPaymentId || 'UNKNOWN_PAYMENT_ID',
      }
    ],
    amountSummary,
    idempotencyKey: actualIdempotencyKey,
  });

  if (record.success && record.correction) {
    // Update impact summary post-creation since it defaults to all false
    const repo = getFinanceCorrectionRepository();
    const impactSummary = { ...record.correction.impactSummary };
    
    if (refund.settlementImpactSummary?.settlementAdjustmentRequired) {
      impactSummary.settlementCorrectionRequired = true;
    }
    if (refund.payoutImpactSummary?.payoutAdjustmentRequired) {
      impactSummary.payoutCorrectionRequired = true;
    }

    if (impactSummary.settlementCorrectionRequired || impactSummary.payoutCorrectionRequired) {
      record.correction.impactSummary = impactSummary;
      await repo.update(record.correction.correctionId, { impactSummary });
    }
  }

  return record;
}

export async function reviewFinanceCorrection(
  command: ReviewFinanceCorrectionCommand
): Promise<FinanceCorrectionMutationResult> {
  const repo = getFinanceCorrectionRepository();
  const record = await repo.getById(command.correctionId);

  if (!record) {
    return { success: false, errors: ['FINANCE_CORRECTION_NOT_FOUND'] };
  }

  const oldStatus = record.status;
  
  switch (command.action) {
    case 'RECORD_ADVISORY':
      record.status = 'ADVISORY_RECORDED';
      break;
    case 'MARK_REVIEW_REQUIRED':
      record.status = 'UNDER_REVIEW';
      break;
    case 'MARK_RESOLVED':
      record.status = 'RESOLVED';
      break;
    case 'REJECT':
      record.status = 'REJECTED';
      break;
    case 'CLOSE':
      record.status = 'CLOSED';
      break;
  }

  record.updatedAt = new Date().toISOString();
  if (command.note) {
    record.notes = record.notes ? `${record.notes}\n${command.note}` : command.note;
  }

  await repo.update(record.correctionId, { 
    status: record.status, 
    updatedAt: record.updatedAt,
    notes: record.notes
  });

  const warnings: string[] = [];
  try {
    const auditEvent = getAuditEventRepositories();
    await auditEvent.audit.appendAuditLog({
      actorType: 'SYSTEM',
      actorId: command.reviewerId,
      actionType: 'finance_correction.reviewed',
      ownerService: 'finance-correction',
      entityType: 'finance_correction',
      entityId: record.correctionId,
      beforeState: { status: oldStatus },
      afterState: record,
      correlationId: command.correlationId || record.correctionId,
      metadata: {
        action: command.action,
        paymentTruthMutated: false,
        refundTruthMutated: false,
        orderTruthMutated: false,
        cancelReturnTruthMutated: false,
        riskTruthMutated: false,
        settlementTruthMutated: false,
        payoutTruthMutated: false,
        advisoryOnly: true,
      },
    });

    await auditEvent.outbox.appendOutboxEvent({
      topic: 'finance_correction.reviewed',
      payloadSchema: 'finance_correction.reviewed.v1',
      payload: {
        correctionId: record.correctionId,
        action: command.action,
        status: record.status,
        paymentTruthMutated: false,
        refundTruthMutated: false,
        orderTruthMutated: false,
        cancelReturnTruthMutated: false,
        riskTruthMutated: false,
        settlementTruthMutated: false,
        payoutTruthMutated: false,
        advisoryOnly: true,
      },
      ownerService: 'finance-correction',
      entityType: 'finance_correction',
      entityId: record.correctionId,
      correlationId: command.correlationId || record.correctionId,
    });
  } catch (error) {
    warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
  }

  return { success: true, correctionId: record.correctionId, correction: record, warnings };
}

export async function getFinanceCorrection(
  query: GetFinanceCorrectionQuery
): Promise<FinanceCorrectionResponse> {
  const repo = getFinanceCorrectionRepository();
  const record = await repo.getById(query.correctionId);

  if (!record) {
    throw new Error('FINANCE_CORRECTION_NOT_FOUND');
  }

  return { correction: record };
}

export async function listFinanceCorrections(
  query: ListFinanceCorrectionsQuery
): Promise<FinanceCorrectionListResponse> {
  const repo = getFinanceCorrectionRepository();
  return await repo.list(query);
}
