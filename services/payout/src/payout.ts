import { createPayoutProviderAdapter } from './provider-adapter';
import {
  CreatePayoutItemsFromSettlementCommand,
  CreatePayoutBatchCommand,
  ApplyPayoutItemActionCommand,
  ApplyPayoutBatchActionCommand,
  GetPayoutItemQuery,
  GetPayoutBatchQuery,
  ListPayoutItemsQuery,
  ListPayoutBatchesQuery,
  PayoutMutationResult,
  PayoutItemResponse,
  PayoutBatchResponse,
  PayoutItemListResponse,
  PayoutBatchListResponse,
  PayoutItem,
  PayoutBatch,
  PayoutItemStatus,
  PayoutHoldReasonCode,
  PayoutBeneficiaryType
} from '@hx/contracts';
import { getPayoutRepository } from './repository';
import { getSettlementLine } from '@hx/settlement';
import { getAuditEventRepositories } from '@hx/persistence';
import { v4 as uuidv4 } from 'uuid';

function determineBeneficiaryType(partyType: string): PayoutBeneficiaryType {
  switch (partyType) {
    case 'CREATOR': return 'CREATOR';
    case 'SUPPLIER': return 'SUPPLIER';
    case 'PLATFORM': return 'PLATFORM';
    default: return 'UNKNOWN';
  }
}

export async function createPayoutItemsFromSettlement(command: CreatePayoutItemsFromSettlementCommand): Promise<PayoutMutationResult> {
  const { settlementLineIds, minimumThresholdAmount, idempotencyKey, correlationId } = command;

  if (!settlementLineIds || settlementLineIds.length === 0) {
    return { success: false, errors: ['PAYOUT_SETTLEMENT_LINE_IDS_REQUIRED'] };
  }

  const repo = getPayoutRepository();

  if (idempotencyKey) {
    const existingIds = await repo.getItemIdsByIdempotencyKey(idempotencyKey);
    if (existingIds && existingIds.length > 0) {
      const items: PayoutItem[] = [];
      for (const id of existingIds) {
        const item = await repo.getItemById(id);
        if (item) items.push(item);
      }
      return { success: true, payoutItems: items };
    }
  }

  const newItems: PayoutItem[] = [];
  const errors: string[] = [];

  for (const lineId of settlementLineIds) {
    try {
      const res = await getSettlementLine({ settlementLineId: lineId });
      const settlementLine = res?.settlementLine;
      if (!settlementLine) {
        errors.push(`PAYOUT_SETTLEMENT_LINE_NOT_FOUND: ${lineId}`);
        continue;
      }

      let status: PayoutItemStatus = 'ELIGIBLE';
      let holdReasonCode: PayoutHoldReasonCode | undefined = undefined;

      if (settlementLine.status !== 'SETTLED') {
        status = 'ON_HOLD';
      }

      const impact = settlementLine.impactSummary;
      if (impact.payoutBlocked) {
        status = 'ON_HOLD';
      } else if (impact.riskHoldActive) {
        status = 'ON_HOLD';
        holdReasonCode = 'RISK_REVIEW_OPEN';
      } else if (impact.refundImpactPending) {
        status = 'ON_HOLD';
        holdReasonCode = 'REFUND_OR_RETURN_RISK';
      } else if (impact.financeCorrectionPending) {
        status = 'ON_HOLD';
        holdReasonCode = 'FINANCE_CORRECTION_PENDING';
      }

      const payableAmount = settlementLine.amountSummary.netAmount;
      let thresholdPassed = true;

      if (minimumThresholdAmount !== undefined && payableAmount < minimumThresholdAmount) {
        status = 'BELOW_THRESHOLD';
        thresholdPassed = false;
        if (!holdReasonCode) holdReasonCode = 'BELOW_MINIMUM_THRESHOLD';
      }

      const payoutItemId = `pyi_${uuidv4().replace(/-/g, '')}`;
      const now = new Date().toISOString();

      const item: PayoutItem = {
        payoutItemId,
        beneficiaryType: determineBeneficiaryType(settlementLine.partyType),
        beneficiaryId: settlementLine.partyId,
        settlementLineId: lineId,
        orderId: settlementLine.orderId,
        orderLineId: settlementLine.orderLineId,
        status,
        holdReasonCode,
        amountSummary: {
          currency: settlementLine.amountSummary.currency,
          grossPayableAmount: settlementLine.amountSummary.grossAmount,
          heldAmount: status === 'ON_HOLD' ? payableAmount : 0,
          payableAmount,
          paidAmount: 0,
          minimumThresholdAmount,
          thresholdPassed
        },
        executionSummary: {
          foundationInstructionOnly: true,
          actualProviderPayoutPerformed: false,
          paymentInstructionCreated: false,
          retryRequired: false
        },
        boundaryFlags: {
          settlementTruthMutated: false,
          paymentTruthMutated: false,
          refundTruthMutated: false,
          orderTruthMutated: false,
          cancelReturnTruthMutated: false,
          financeCorrectionTruthMutated: false,
          riskTruthMutated: false,
          actualProviderPayoutPerformed: false,
          paymentInstructionCreated: false
        },
        sourceRefs: [{
          sourceType: 'SETTLEMENT_LINE',
          sourceId: lineId,
          sourceState: settlementLine.status
        }],
        idempotencyKey,
        createdAt: now,
        updatedAt: now,
        errors: [],
        warnings: []
      };

      newItems.push(item);
    } catch (e: any) {
       errors.push(`PAYOUT_SETTLEMENT_LINE_NOT_FOUND: ${lineId}`);
    }
  }

  if (errors.length > 0 && newItems.length === 0) {
    return { success: false, errors };
  }

  await repo.createItems(newItems);

  if (idempotencyKey) {
    await repo.saveItemIdempotencyKey(idempotencyKey, newItems.map(i => i.payoutItemId));
  }

  const warnings = [...errors];

  try {
    const { audit, outbox } = getAuditEventRepositories();
    await audit.appendAuditLog({
      auditId: uuidv4(),
      actorType: 'SYSTEM',
      actorId: 'payout',
      actionType: 'payout.items_created',
      ownerService: 'payout',
      entityType: 'payout_item',
      entityId: newItems[0]?.payoutItemId || 'none',
      afterState: newItems,
      reason: 'SETTLEMENT_TO_PAYOUT_FOUNDATION',
      idempotencyKey,
      correlationId,
      metadata: {
        settlementLineIds,
        payoutTruthMutated: true,
        businessTruthMutated: false,
        actualProviderPayoutPerformed: false
      }
    });
    await outbox.appendOutboxEvent({
      eventId: uuidv4(),
      topic: 'payout.items_created',
      payloadSchema: 'payout.items_created.v1',
      payload: {
        payoutItems: newItems,
        boundarySummary: {
          settlementTruthMutated: false,
          paymentTruthMutated: false,
          refundTruthMutated: false,
          orderTruthMutated: false,
          cancelReturnTruthMutated: false,
          financeCorrectionTruthMutated: false,
          riskTruthMutated: false,
          payoutTruthMutated: true,
          actualProviderPayoutPerformed: false,
          paymentInstructionCreated: false,
          foundationOnly: true
        }
      },
      ownerService: 'payout',
      entityType: 'payout_item',
      entityId: newItems[0]?.payoutItemId || 'none',
      correlationId
    });
  } catch (err) {
    warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
  }

  return { success: true, payoutItems: newItems, warnings: warnings.length > 0 ? warnings : undefined };
}

export async function createPayoutBatch(command: CreatePayoutBatchCommand): Promise<PayoutMutationResult> {
  const { payoutItemIds, batchType, scheduledExecutionAt, ownerAdminId, idempotencyKey, correlationId } = command;

  if (!payoutItemIds || payoutItemIds.length === 0) {
    return { success: false, errors: ['PAYOUT_ITEM_IDS_REQUIRED'] };
  }

  const repo = getPayoutRepository();

  if (idempotencyKey) {
    const existingId = await repo.getBatchIdByIdempotencyKey(idempotencyKey);
    if (existingId) {
      const batch = await repo.getBatchById(existingId);
      if (batch) return { success: true, batchId: batch.batchId, batch };
    }
  }

  const eligibleItems: PayoutItem[] = [];
  let totalAmount = 0;
  let currency = 'TRY';
  let beneficiaryType: PayoutBeneficiaryType | undefined;

  for (const id of payoutItemIds) {
    const item = await repo.getItemById(id);
    if (item && item.status === 'ELIGIBLE') {
      eligibleItems.push(item);
      totalAmount += item.amountSummary.payableAmount;
      currency = item.amountSummary.currency;
      if (!beneficiaryType) beneficiaryType = item.beneficiaryType;
    }
  }

  if (eligibleItems.length === 0) {
    return { success: false, errors: ['PAYOUT_NO_ELIGIBLE_ITEMS'] };
  }

  const batchId = `pyb_${uuidv4().replace(/-/g, '')}`;
  const now = new Date().toISOString();

  const batch: PayoutBatch = {
    batchId,
    batchType,
    status: 'CREATED',
    beneficiaryType,
    itemIds: eligibleItems.map(i => i.payoutItemId),
    totalAmount,
    currency,
    scheduledExecutionAt,
    ownerAdminId,
    foundationOnly: true,
    actualProviderPayoutPerformed: false,
    paymentInstructionCreated: false,
    idempotencyKey,
    createdAt: now,
    updatedAt: now,
    errors: [],
    warnings: []
  };

  await repo.createBatch(batch);

  for (const item of eligibleItems) {
    await repo.updateItem(item.payoutItemId, { status: 'BATCHED', batchId });
  }

  if (idempotencyKey) {
    await repo.saveBatchIdempotencyKey(idempotencyKey, batchId);
  }

  const warnings: string[] = [];

  try {
    const { audit, outbox } = getAuditEventRepositories();
    await audit.appendAuditLog({
      auditId: uuidv4(),
      actorType: ownerAdminId ? 'ADMIN' : 'SYSTEM',
      actorId: ownerAdminId || 'payout',
      actionType: 'payout.batch_created',
      ownerService: 'payout',
      entityType: 'payout_batch',
      entityId: batchId,
      afterState: batch,
      reason: 'PAYOUT_BATCH_FOUNDATION',
      idempotencyKey,
      correlationId,
      metadata: {
        payoutItemIds: eligibleItems.map(i => i.payoutItemId),
        payoutTruthMutated: true,
        businessTruthMutated: false,
        actualProviderPayoutPerformed: false
      }
    });
    await outbox.appendOutboxEvent({
      eventId: uuidv4(),
      topic: 'payout.batch_created',
      payloadSchema: 'payout.batch_created.v1',
      payload: {
        batch,
        boundarySummary: {
          settlementTruthMutated: false,
          paymentTruthMutated: false,
          refundTruthMutated: false,
          orderTruthMutated: false,
          cancelReturnTruthMutated: false,
          financeCorrectionTruthMutated: false,
          riskTruthMutated: false,
          payoutTruthMutated: true,
          actualProviderPayoutPerformed: false,
          paymentInstructionCreated: false,
          foundationOnly: true
        }
      },
      ownerService: 'payout',
      entityType: 'payout_batch',
      entityId: batchId,
      correlationId
    });
  } catch (err) {
    warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
  }

  return { success: true, batchId, batch, warnings: warnings.length > 0 ? warnings : undefined };
}

export async function applyPayoutItemAction(command: ApplyPayoutItemActionCommand): Promise<PayoutMutationResult> {
  const { payoutItemId, action, actorId, reasonCode, note, correlationId } = command;
  const repo = getPayoutRepository();

  const item = await repo.getItemById(payoutItemId);
  if (!item) {
    return { success: false, errors: ['PAYOUT_ITEM_NOT_FOUND'] };
  }

  let newStatus = item.status;
  let newHoldReasonCode = item.holdReasonCode;

  switch (action) {
    case 'PLACE_HOLD':
      newStatus = 'ON_HOLD';
      newHoldReasonCode = reasonCode || 'MANUAL_HOLD';
      break;
    case 'RELEASE_HOLD':
    case 'MARK_ELIGIBLE':
      newStatus = 'ELIGIBLE';
      newHoldReasonCode = undefined;
      break;
    case 'ADD_TO_BATCH':
      newStatus = 'BATCHED';
      break;
    case 'MARK_PROCESSING':
      newStatus = 'PROCESSING';
      break;
    case 'MARK_PAID':
      newStatus = 'PAID';
      break;
    case 'MARK_FAILED':
      newStatus = 'FAILED';
      break;
    case 'MARK_RETURNED':
      newStatus = 'RETURNED';
      break;
    case 'CANCEL':
      newStatus = 'CANCELLED';
      break;
    case 'CLOSE':
      newStatus = 'CLOSED';
      break;
  }

  await repo.updateItem(payoutItemId, { status: newStatus, holdReasonCode: newHoldReasonCode });

  const updatedItem = await repo.getItemById(payoutItemId);
  const warnings: string[] = [];

  try {
    const { audit, outbox } = getAuditEventRepositories();
    await audit.appendAuditLog({
      auditId: uuidv4(),
      actorType: 'ADMIN',
      actorId: actorId || 'payout',
      actionType: 'payout.item_action_applied',
      ownerService: 'payout',
      entityType: 'payout_item',
      entityId: payoutItemId,
      beforeState: item,
      afterState: updatedItem,
      reason: reasonCode || note || action,
      correlationId,
      metadata: {
        action,
        reasonCode,
        payoutTruthMutated: true,
        businessTruthMutated: false,
        actualProviderPayoutPerformed: false
      }
    });
    await outbox.appendOutboxEvent({
      eventId: uuidv4(),
      topic: 'payout.item_action_applied',
      payloadSchema: 'payout.item_action_applied.v1',
      payload: {
        payoutItemId,
        action,
        actorId,
        note,
        item: updatedItem,
        boundarySummary: {
          settlementTruthMutated: false,
          paymentTruthMutated: false,
          refundTruthMutated: false,
          orderTruthMutated: false,
          cancelReturnTruthMutated: false,
          financeCorrectionTruthMutated: false,
          riskTruthMutated: false,
          payoutTruthMutated: true,
          actualProviderPayoutPerformed: false,
          paymentInstructionCreated: false,
          foundationOnly: true
        }
      },
      ownerService: 'payout',
      entityType: 'payout_item',
      entityId: payoutItemId,
      correlationId
    });
  } catch (err) {
    warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
  }

  return { success: true, payoutItemId, payoutItem: updatedItem!, warnings: warnings.length > 0 ? warnings : undefined };
}

export async function applyPayoutBatchAction(command: ApplyPayoutBatchActionCommand): Promise<PayoutMutationResult> {
  const { batchId, targetStatus, actorId, note, correlationId } = command;
  const repo = getPayoutRepository();

  const batch = await repo.getBatchById(batchId);
  if (!batch) {
    return { success: false, errors: ['PAYOUT_BATCH_NOT_FOUND'] };
  }

  await repo.updateBatch(batchId, { status: targetStatus });

  if (targetStatus === 'APPROVED') {
    const providerAdapter = createPayoutProviderAdapter();
    for (const itemId of batch.itemIds) {
      const item = await repo.getItemById(itemId);
      if (item) {
        const result = await providerAdapter.submitPayout({
          payoutId: item.payoutItemId,
          amount: item.amountSummary.payableAmount,
          currency: item.amountSummary.currency,
          beneficiary: { id: item.beneficiaryId, type: item.beneficiaryType },
          idempotencyKey: item.idempotencyKey,
        });

        // Provider sonucunu kaydet, ama paid_out durumunu DEĞİŞTİRME
        await repo.updateItem(itemId, {
          status: 'PROCESSING', // Durumu 'PROCESSING' olarak güncelle
          providerEnvelope: result as any,
          providerMode: result.providerMode,
          providerName: result.providerName,
          providerReference: result.providerReference,
        });
      }
    }
    // Batch status'u da guncellemek mantikli olabilir, ornegin PROCESSING
    await repo.updateBatch(batchId, { status: 'PROCESSING' });
  }

  const updatedBatch = await repo.getBatchById(batchId);
  const warnings: string[] = [];

  try {
    const { audit, outbox } = getAuditEventRepositories();
    await audit.appendAuditLog({
      auditId: uuidv4(),
      actorType: 'ADMIN',
      actorId: actorId || 'payout',
      actionType: 'payout.batch_action_applied',
      ownerService: 'payout',
      entityType: 'payout_batch',
      entityId: batchId,
      beforeState: batch,
      afterState: updatedBatch,
      reason: note || targetStatus,
      correlationId,
      metadata: {
        targetStatus,
        payoutTruthMutated: true,
        businessTruthMutated: false,
        actualProviderPayoutPerformed: false
      }
    });
    await outbox.appendOutboxEvent({
      eventId: uuidv4(),
      topic: 'payout.batch_action_applied',
      payloadSchema: 'payout.batch_action_applied.v1',
      payload: {
        batchId,
        targetStatus,
        actorId,
        note,
        batch: updatedBatch,
        boundarySummary: {
          settlementTruthMutated: false,
          paymentTruthMutated: false,
          refundTruthMutated: false,
          orderTruthMutated: false,
          cancelReturnTruthMutated: false,
          financeCorrectionTruthMutated: false,
          riskTruthMutated: false,
          payoutTruthMutated: true,
          actualProviderPayoutPerformed: false,
          paymentInstructionCreated: false,
          foundationOnly: true
        }
      },
      ownerService: 'payout',
      entityType: 'payout_batch',
      entityId: batchId,
      correlationId
    });
  } catch (err) {
    warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
  }

  return { success: true, batchId, batch: updatedBatch!, warnings: warnings.length > 0 ? warnings : undefined };
}

export async function getPayoutItem(query: GetPayoutItemQuery): Promise<PayoutItemResponse> {
  const repo = getPayoutRepository();
  const item = await repo.getItemById(query.payoutItemId);
  if (!item) throw new Error('PAYOUT_ITEM_NOT_FOUND');
  return { payoutItem: item };
}

export async function getPayoutBatch(query: GetPayoutBatchQuery): Promise<PayoutBatchResponse> {
  const repo = getPayoutRepository();
  const batch = await repo.getBatchById(query.batchId);
  if (!batch) throw new Error('PAYOUT_BATCH_NOT_FOUND');
  return { batch };
}

export async function listPayoutItems(query: ListPayoutItemsQuery): Promise<PayoutItemListResponse> {
  return getPayoutRepository().listItems(query);
}

export async function listPayoutBatches(query: ListPayoutBatchesQuery): Promise<PayoutBatchListResponse> {
  return getPayoutRepository().listBatches(query);
}

export async function createTestPayoutItem(body: any): Promise<PayoutMutationResult> {
    const repo = getPayoutRepository();
    const payoutItemId = `pyi_smoke_${Date.now()}`;
    const now = new Date().toISOString();

    const item: PayoutItem = {
        payoutItemId,
        beneficiaryType: body.beneficiaryType || 'CREATOR',
        beneficiaryId: body.beneficiaryId || 'smoke-beneficiary',
        settlementLineId: `stl_smoke_${Date.now()}`,
        status: 'ELIGIBLE',
        amountSummary: {
            currency: 'TRY',
            grossPayableAmount: 100,
            heldAmount: 0,
            payableAmount: 100,
            paidAmount: 0,
            thresholdPassed: true,
        },
        executionSummary: {
            foundationInstructionOnly: true,
            actualProviderPayoutPerformed: false,
            paymentInstructionCreated: false,
            retryRequired: false,
        },
        boundaryFlags: { settlementTruthMutated: false, paymentTruthMutated: false, refundTruthMutated: false, orderTruthMutated: false, cancelReturnTruthMutated: false, financeCorrectionTruthMutated: false, riskTruthMutated: false, actualProviderPayoutPerformed: false, paymentInstructionCreated: false },
        sourceRefs: [{ sourceType: 'MANUAL_FOUNDATION', sourceId: 'smoke-test' }],
        createdAt: now,
        updatedAt: now,
        errors: [],
        warnings: [],
    };

    await repo.createItems([item]);
    return { success: true, payoutItems: [item] };
}
