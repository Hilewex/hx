import {
  CreatePayoutItemsFromSettlementCommand,
  CreatePayoutItemFromSourceCommand,
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
  PayoutCandidate,
  PayoutCandidateBoundaryFlags,
  PayoutCandidateBlockingReason,
  PayoutCandidatePreparationResult,
  PayoutCandidateReviewActionResult,
  PayoutCandidateReviewReasonCode,
  PayoutCandidateReviewStatus,
  PayoutCandidateWarning,
  PayoutItemStatus,
  PayoutHoldReasonCode,
  PayoutBeneficiaryType,
  PayoutBoundaryLimitationFlag,
  PayoutBoundarySummary,
  BlockPayoutCandidateForReviewCommand,
  PreparePayoutCandidatesCommand,
  SettlementCreatorEarning,
  SettlementSourceRef,
  SettlementSupplierPayable
} from '@hx/contracts';
import { getPayoutRepository } from './repository';
import { getSettlementLine, listSettlementCreatorEarnings, listSettlementSupplierPayables } from '@hx/settlement';
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

const payoutSourceFingerprintMap = new Map<string, string>();
const payoutIdempotencyFingerprintMap = new Map<string, string>();
const payoutIdempotencyItemMap = new Map<string, PayoutItem>();

const payoutCandidateBoundaryFlags: PayoutCandidateBoundaryFlags = {
  payoutExecuted: false,
  providerInstructionCreated: false,
  ledgerEntryCreated: false,
};

function stableValue(value: any): any {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, any>>((acc, key) => {
        acc[key] = stableValue(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function createPayoutSourceKey(command: CreatePayoutItemFromSourceCommand): string {
  return `${command.sourceType}:${command.sourceId}:${command.counterpartyType}:${command.counterpartyId}`;
}

function createPayoutFingerprint(command: CreatePayoutItemFromSourceCommand): string {
  return JSON.stringify(stableValue({
    sourceType: command.sourceType,
    sourceId: command.sourceId,
    settlementId: command.settlementId,
    settlementLineId: command.settlementLineId,
    counterpartyType: command.counterpartyType,
    counterpartyId: command.counterpartyId,
    amount: command.amount,
    currency: command.currency,
    holdReason: command.holdReason,
    riskHold: command.riskHold ?? false,
    metadata: command.metadata ?? {},
  }));
}

function createPayoutBoundarySummary(
  payableCreated: boolean,
  payoutRequested: boolean,
  duplicatePayout: boolean
): PayoutBoundarySummary {
  return {
    payableCreated,
    payoutRequested,
    duplicatePayout,
    actualProviderPayoutPerformed: false,
    settlementTruthMutated: false,
    ledgerTruthMutated: false,
    paymentTruthMutated: false,
    refundTruthMutated: false,
    orderTruthMutated: false,
  };
}

function payoutBoundaryLimitationFlags(): PayoutBoundaryLimitationFlag[] {
  return [
    'PROVIDER_PAYOUT_EXECUTION_NOT_PERFORMED',
    'PAYABLE_LIFECYCLE_FOUNDATION_ONLY',
    'SETTLEMENT_TRUTH_NOT_MUTATED',
    'LEDGER_TRUTH_NOT_MUTATED',
    'APPROVAL_WORKFLOW_NOT_IMPLEMENTED',
    'AUDIT_WORKFLOW_NOT_ENFORCED',
  ];
}

export function resetPayoutBoundaryGuardForTesting(): void {
  payoutSourceFingerprintMap.clear();
  payoutIdempotencyFingerprintMap.clear();
  payoutIdempotencyItemMap.clear();
}

function normalizeIds(ids: string[] | undefined): string[] {
  return [...new Set((ids ?? []).filter(Boolean))].sort();
}

function createCandidateFingerprint(payableIds: string[], earningIds: string[]): string {
  return JSON.stringify({
    payableIds: normalizeIds(payableIds),
    earningIds: normalizeIds(earningIds),
  });
}

function hasDuplicateSourceRefs(payableIds: string[], earningIds: string[]): boolean {
  return payableIds.length !== normalizeIds(payableIds).length
    || earningIds.length !== normalizeIds(earningIds).length;
}

function hasConsistentSourceChain(sourceRefs: SettlementSourceRef[]): boolean {
  const sourceTypes = new Set(sourceRefs.map(ref => ref.sourceType));
  return sourceTypes.has('ORDER') && sourceTypes.has('ORDER_LINE');
}

function convertCandidateSourceRefs(
  payables: SettlementSupplierPayable[],
  earnings: SettlementCreatorEarning[],
): PayoutCandidate['sourceRefs'] {
  return [
    ...payables.map(payable => ({
      sourceType: 'PAYABLE' as const,
      sourceId: payable.payableId,
      sourceState: payable.status,
      metadata: {
        settlementLineId: payable.settlementLineId,
        orderId: payable.orderId,
        settlementSourceRefs: payable.sourceRefs,
      },
    })),
    ...earnings.map(earning => ({
      sourceType: 'PAYABLE' as const,
      sourceId: earning.earningId,
      sourceState: earning.status,
      metadata: {
        sourceKind: 'CREATOR_EARNING',
        settlementLineId: earning.settlementLineId,
        orderId: earning.orderId,
        settlementSourceRefs: earning.sourceRefs,
      },
    })),
  ];
}

function validatePayoutCandidateRecord(record: {
  sourceId: string;
  status: string;
  partyId?: string;
  amount: number;
  sourceRefs: SettlementSourceRef[];
  riskHoldActive?: boolean;
  refundImpactPending?: boolean;
  financeCorrectionPending?: boolean;
  externalReviewRequired?: boolean;
}): PayoutCandidateBlockingReason[] {
  const blockingReasons: PayoutCandidateBlockingReason[] = [];

  if (record.status !== 'RELEASE_ELIGIBLE') blockingReasons.push('STATUS_NOT_RELEASE_ELIGIBLE');
  if (record.status === 'HELD') blockingReasons.push('RECORD_HELD');
  if (record.status === 'REVERSED') blockingReasons.push('RECORD_REVERSED');
  if (!record.sourceRefs || record.sourceRefs.length === 0) blockingReasons.push('SOURCE_REFS_REQUIRED');
  if (!record.partyId) blockingReasons.push('PARTY_ID_REQUIRED');
  if (!Number.isFinite(record.amount) || record.amount <= 0) blockingReasons.push('AMOUNT_MUST_BE_POSITIVE');
  if (record.riskHoldActive === true) blockingReasons.push('RISK_HOLD_ACTIVE');
  if (record.refundImpactPending === true) blockingReasons.push('REFUND_IMPACT_PENDING');
  if (record.financeCorrectionPending === true) blockingReasons.push('FINANCE_CORRECTION_PENDING');

  return blockingReasons;
}

function evaluateCandidateReview(input: {
  candidateWarnings: PayoutCandidateWarning[];
  externalReviewRequired: boolean;
  totalAmount: number;
  currency: string;
  partyTypeMismatch: boolean;
  partyIdMismatch: boolean;
  currencyMismatch: boolean;
  reviewConfig?: PreparePayoutCandidatesCommand['reviewConfig'];
  now: string;
}): {
  reviewRequired: boolean;
  reviewStatus: PayoutCandidateReviewStatus;
  reviewReasonCodes: PayoutCandidateReviewReasonCode[];
  reviewRequestedAt?: string;
} {
  const reviewReasonCodes = new Set<PayoutCandidateReviewReasonCode>();

  for (const warning of input.candidateWarnings) {
    if (warning === 'INCONSISTENT_SOURCE_CHAIN_REVIEW_REQUIRED') {
      reviewReasonCodes.add('INCONSISTENT_SOURCE_CHAIN_REVIEW_REQUIRED');
    }
    if (warning === 'DUPLICATE_PAYABLE_OR_EARNING_REFS_REVIEW_REQUIRED') {
      reviewReasonCodes.add('DUPLICATE_PAYABLE_OR_EARNING_REFS_REVIEW_REQUIRED');
    }
    if (warning === 'MISSING_REFS_REJECTED') {
      reviewReasonCodes.add('MISSING_REFS_WARNING');
    }
  }

  if (input.externalReviewRequired) reviewReasonCodes.add('EXTERNAL_REVIEW_REQUIRED');
  if (input.partyTypeMismatch || input.partyIdMismatch || input.currencyMismatch) reviewReasonCodes.add('REVIEW_REQUIRED_FLAG');

  const threshold = input.reviewConfig?.highAmountReviewThresholds?.[input.currency];
  if (threshold !== undefined && input.totalAmount >= threshold) {
    reviewReasonCodes.add('HIGH_AMOUNT_THRESHOLD_REVIEW_REQUIRED');
  }

  if (reviewReasonCodes.size === 0) {
    reviewReasonCodes.add('REVIEW_NOT_REQUIRED');
    return {
      reviewRequired: false,
      reviewStatus: 'PENDING_REVIEW',
      reviewReasonCodes: Array.from(reviewReasonCodes),
    };
  }

  return {
    reviewRequired: true,
    reviewStatus: input.externalReviewRequired ? 'REVIEW_BLOCKED' : 'REVIEW_REQUIRED',
    reviewReasonCodes: Array.from(reviewReasonCodes),
    reviewRequestedAt: input.now,
  };
}

async function loadCandidateSources(command: PreparePayoutCandidatesCommand): Promise<{
  payables: SettlementSupplierPayable[];
  earnings: SettlementCreatorEarning[];
}> {
  const requestedPayableIds = normalizeIds(command.supplierPayableIds);
  const requestedEarningIds = normalizeIds(command.creatorEarningIds);
  const hasExplicitSourceSelection = command.supplierPayableIds !== undefined || command.creatorEarningIds !== undefined;

  const payableList = await listSettlementSupplierPayables({
    status: hasExplicitSourceSelection ? undefined : 'RELEASE_ELIGIBLE',
    limit: 1000,
  });
  const earningList = await listSettlementCreatorEarnings({
    status: hasExplicitSourceSelection ? undefined : 'RELEASE_ELIGIBLE',
    limit: 1000,
  });

  return {
    payables: hasExplicitSourceSelection
      ? payableList.supplierPayables.filter(payable => requestedPayableIds.includes(payable.payableId))
      : payableList.supplierPayables,
    earnings: hasExplicitSourceSelection
      ? earningList.creatorEarnings.filter(earning => requestedEarningIds.includes(earning.earningId))
      : earningList.creatorEarnings,
  };
}

export async function preparePayoutCandidates(
  command: PreparePayoutCandidatesCommand = {},
): Promise<PayoutCandidatePreparationResult> {
  const repo = getPayoutRepository();
  const { payables, earnings } = await loadCandidateSources(command);
  const allRecords = [
    ...payables.map(record => ({ ...record, sourceKind: 'PAYABLE' as const, sourceId: record.payableId })),
    ...earnings.map(record => ({ ...record, sourceKind: 'EARNING' as const, sourceId: record.earningId })),
  ];
  const warnings = new Set<PayoutCandidateWarning>();
  const blockingReasons = new Set<PayoutCandidateBlockingReason>();
  const rejectedSourceIds = new Set<string>();
  const createdCandidates: PayoutCandidate[] = [];

  if (hasDuplicateSourceRefs(command.supplierPayableIds ?? [], command.creatorEarningIds ?? [])) {
    warnings.add('DUPLICATE_PAYABLE_OR_EARNING_REFS_REVIEW_REQUIRED');
  }

  for (const record of allRecords) {
    const reasons = validatePayoutCandidateRecord(record);
    for (const reason of reasons) blockingReasons.add(reason);
    if (reasons.length > 0) {
      rejectedSourceIds.add(record.sourceId);
      if (reasons.includes('SOURCE_REFS_REQUIRED')) warnings.add('MISSING_REFS_REJECTED');
      if (reasons.includes('AMOUNT_MUST_BE_POSITIVE')) warnings.add('NEGATIVE_AMOUNT_REJECTED');
    }
  }

  const eligiblePayables = payables.filter(payable => validatePayoutCandidateRecord({ ...payable, sourceId: payable.payableId }).length === 0);
  const eligibleEarnings = earnings.filter(earning => validatePayoutCandidateRecord({ ...earning, sourceId: earning.earningId }).length === 0);
  const groups = new Map<string, { payables: SettlementSupplierPayable[]; earnings: SettlementCreatorEarning[] }>();

  for (const payable of eligiblePayables) {
    const key = command.groupCandidates === false
      ? `SUPPLIER:${payable.payableId}`
      : `${payable.partyType}:${payable.partyId}:${payable.currency}`;
    const group = groups.get(key) ?? { payables: [], earnings: [] };
    group.payables.push(payable);
    groups.set(key, group);
  }

  for (const earning of eligibleEarnings) {
    const key = command.groupCandidates === false
      ? `CREATOR:${earning.earningId}`
      : `${earning.partyType}:${earning.partyId}:${earning.currency}`;
    const group = groups.get(key) ?? { payables: [], earnings: [] };
    group.earnings.push(earning);
    groups.set(key, group);
  }

  for (const group of groups.values()) {
    const groupPayableIds = group.payables.map(payable => payable.payableId);
    const groupEarningIds = group.earnings.map(earning => earning.earningId);
    const fingerprint = createCandidateFingerprint(groupPayableIds, groupEarningIds);
    const existing = await repo.getPayoutCandidateBySourceFingerprint(fingerprint);
    if (existing) {
      createdCandidates.push(existing);
      blockingReasons.add('DUPLICATE_SOURCE_ALREADY_CANDIDATE');
      continue;
    }

    const partyTypes = new Set([
      ...group.payables.map(payable => payable.partyType),
      ...group.earnings.map(earning => earning.partyType),
    ]);
    const partyIds = new Set([
      ...group.payables.map(payable => payable.partyId),
      ...group.earnings.map(earning => earning.partyId),
    ]);
    const currencies = new Set([
      ...group.payables.map(payable => payable.currency),
      ...group.earnings.map(earning => earning.currency),
    ]);
    const sourceRefs = convertCandidateSourceRefs(group.payables, group.earnings);
    const sourceChains = [
      ...group.payables.map(payable => payable.sourceRefs),
      ...group.earnings.map(earning => earning.sourceRefs),
    ];
    const candidateWarnings: PayoutCandidateWarning[] = [];
    const totalAmount = [...group.payables, ...group.earnings].reduce((sum, record) => sum + record.amount, 0);
    const externalReviewRequired = [...group.payables, ...group.earnings].some(record => record.externalReviewRequired === true);

    if (currencies.size > 1) candidateWarnings.push('MIXED_CURRENCY_REVIEW_REQUIRED');
    if (sourceChains.some(refs => !hasConsistentSourceChain(refs))) {
      candidateWarnings.push('INCONSISTENT_SOURCE_CHAIN_REVIEW_REQUIRED');
    }
    if (warnings.has('DUPLICATE_PAYABLE_OR_EARNING_REFS_REVIEW_REQUIRED')) {
      candidateWarnings.push('DUPLICATE_PAYABLE_OR_EARNING_REFS_REVIEW_REQUIRED');
    }
    for (const warning of candidateWarnings) warnings.add(warning);

    const now = new Date().toISOString();
    const reviewEvaluation = evaluateCandidateReview({
      candidateWarnings,
      externalReviewRequired,
      totalAmount,
      currency: group.payables[0]?.currency ?? group.earnings[0]?.currency ?? 'UNKNOWN',
      partyTypeMismatch: partyTypes.size > 1,
      partyIdMismatch: partyIds.size > 1,
      currencyMismatch: currencies.size > 1,
      reviewConfig: command.reviewConfig,
      now,
    });
    const candidate: PayoutCandidate = {
      payoutCandidateId: `pyc_${uuidv4().replace(/-/g, '')}`,
      partyType: (group.payables[0]?.partyType ?? group.earnings[0]?.partyType) as PayoutCandidate['partyType'],
      partyId: group.payables[0]?.partyId ?? group.earnings[0]?.partyId ?? '',
      sourcePayableIds: groupPayableIds,
      sourceEarningIds: groupEarningIds,
      totalAmount,
      currency: group.payables[0]?.currency ?? group.earnings[0]?.currency ?? 'UNKNOWN',
      status: reviewEvaluation.reviewRequired
        ? 'REVIEW_REQUIRED'
        : 'PREPARED',
      blockingReasons: [],
      warnings: candidateWarnings,
      sourceRefs,
      reviewRequired: reviewEvaluation.reviewRequired,
      reviewStatus: reviewEvaluation.reviewStatus,
      reviewReasonCodes: reviewEvaluation.reviewReasonCodes,
      reviewNotes: [],
      blockedByOps: reviewEvaluation.reviewStatus === 'REVIEW_BLOCKED',
      reviewRequestedAt: reviewEvaluation.reviewRequestedAt,
      reviewTrail: reviewEvaluation.reviewRequired
        ? [{
            trailId: `pyrt_${uuidv4().replace(/-/g, '')}`,
            actorId: 'payout-candidate-foundation',
            action: 'REVIEW_REQUESTED',
            reasonCode: reviewEvaluation.reviewReasonCodes[0],
            createdAt: now,
            makerCheckerTruth: false,
          }]
        : [],
      createdAt: now,
      updatedAt: now,
      boundaryFlags: payoutCandidateBoundaryFlags,
    };

    await repo.createPayoutCandidate(candidate);
    await repo.savePayoutCandidateSourceFingerprint(fingerprint, candidate.payoutCandidateId);
    createdCandidates.push(candidate);
  }

  const status = createdCandidates.length > 0 && rejectedSourceIds.size > 0
    ? 'PARTIAL'
    : createdCandidates.length > 0 && blockingReasons.has('DUPLICATE_SOURCE_ALREADY_CANDIDATE')
      ? 'IDEMPOTENT'
      : createdCandidates.length > 0
        ? 'PREPARED'
        : 'REJECTED';

  return {
    success: createdCandidates.length > 0,
    status,
    candidates: createdCandidates,
    rejectedSourceIds: Array.from(rejectedSourceIds),
    blockingReasons: Array.from(blockingReasons),
    warnings: Array.from(warnings),
    boundaryFlags: payoutCandidateBoundaryFlags,
  };
}

export async function listPayoutCandidates() {
  return getPayoutRepository().listPayoutCandidates();
}

export async function blockPayoutCandidateForReview(
  command: BlockPayoutCandidateForReviewCommand,
): Promise<PayoutCandidateReviewActionResult> {
  const repo = getPayoutRepository();
  const candidate = await repo.getPayoutCandidateById(command.payoutCandidateId);
  if (!candidate) {
    return {
      success: false,
      status: 'REJECTED',
      errors: ['PAYOUT_CANDIDATE_NOT_FOUND'],
      boundaryFlags: payoutCandidateBoundaryFlags,
    };
  }

  if (!command.actorId || !command.note) {
    return {
      success: false,
      status: 'REJECTED',
      errors: ['ACTOR_ID_AND_NOTE_REQUIRED'],
      boundaryFlags: payoutCandidateBoundaryFlags,
    };
  }

  const now = new Date().toISOString();
  const reasonCode = command.reasonCode ?? 'OPS_MANUAL_BLOCK';
  const reviewNote = {
    noteId: `pyrn_${uuidv4().replace(/-/g, '')}`,
    actorId: command.actorId,
    note: command.note,
    reasonCode,
    createdAt: now,
    foundationOnly: true as const,
  };
  const reviewTrail = {
    trailId: `pyrt_${uuidv4().replace(/-/g, '')}`,
    actorId: command.actorId,
    action: 'OPS_BLOCKED' as const,
    reasonCode,
    note: command.note,
    createdAt: now,
    makerCheckerTruth: false as const,
  };

  await repo.updatePayoutCandidate(command.payoutCandidateId, {
    reviewRequired: true,
    reviewStatus: 'REVIEW_BLOCKED',
    reviewReasonCodes: Array.from(new Set([...candidate.reviewReasonCodes, reasonCode])),
    reviewNotes: [...candidate.reviewNotes, reviewNote],
    reviewTrail: [...candidate.reviewTrail, reviewTrail],
    blockedByOps: true,
    blockedAt: now,
    blockedBy: command.actorId,
    reviewRequestedAt: candidate.reviewRequestedAt ?? now,
    boundaryFlags: payoutCandidateBoundaryFlags,
  });

  const updated = await repo.getPayoutCandidateById(command.payoutCandidateId);
  return {
    success: true,
    status: 'BLOCKED',
    candidate: updated ?? undefined,
    boundaryFlags: payoutCandidateBoundaryFlags,
  };
}

export async function createPayoutItemFromSource(
  command: CreatePayoutItemFromSourceCommand
): Promise<PayoutMutationResult> {
  const errors: string[] = [];
  if (!command.sourceType) errors.push('PAYOUT_SOURCE_TYPE_REQUIRED');
  if (!command.sourceId) errors.push('PAYOUT_SOURCE_ID_REQUIRED');
  if (!command.counterpartyType) errors.push('PAYOUT_COUNTERPARTY_TYPE_REQUIRED');
  if (!command.counterpartyId) errors.push('PAYOUT_COUNTERPARTY_ID_REQUIRED');
  if (!command.idempotencyKey) errors.push('IDEMPOTENCY_KEY_REQUIRED');
  if (command.amount === undefined || command.amount === null) errors.push('PAYOUT_AMOUNT_REQUIRED');
  if (!command.currency) errors.push('PAYOUT_CURRENCY_REQUIRED');
  if (command.amount !== undefined && (!Number.isFinite(command.amount) || command.amount <= 0)) {
    errors.push('PAYOUT_AMOUNT_MUST_BE_POSITIVE');
  }

  const limitationFlags = payoutBoundaryLimitationFlags();
  if (errors.length > 0) {
    return {
      success: false,
      status: 'REJECTED',
      summary: createPayoutBoundarySummary(false, false, false),
      limitationFlags,
      errors,
    };
  }

  const fingerprint = createPayoutFingerprint(command);
  const sourceKey = createPayoutSourceKey(command);
  const existingByIdempotency = payoutIdempotencyItemMap.get(command.idempotencyKey);

  if (existingByIdempotency) {
    if (payoutIdempotencyFingerprintMap.get(command.idempotencyKey) !== fingerprint) {
      return {
        success: false,
        status: 'REJECTED',
        duplicateOfPayoutItemId: existingByIdempotency.payoutItemId,
        summary: createPayoutBoundarySummary(false, false, true),
        limitationFlags: [...limitationFlags, 'DUPLICATE_IDEMPOTENCY_KEY_CONFLICT'],
        errors: ['DUPLICATE_IDEMPOTENCY_KEY_CONFLICT'],
      };
    }

    return {
      success: true,
      status: 'DUPLICATE',
      payoutItemId: existingByIdempotency.payoutItemId,
      payoutItem: existingByIdempotency,
      payoutItems: [existingByIdempotency],
      duplicateOfPayoutItemId: existingByIdempotency.payoutItemId,
      summary: createPayoutBoundarySummary(false, false, true),
      limitationFlags,
    };
  }

  const existingSourceFingerprint = payoutSourceFingerprintMap.get(sourceKey);
  if (existingSourceFingerprint && existingSourceFingerprint !== fingerprint) {
    return {
      success: false,
      status: 'REJECTED',
      summary: createPayoutBoundarySummary(false, false, true),
      limitationFlags: [...limitationFlags, 'DUPLICATE_PAYOUT_SOURCE_CONFLICT'],
      errors: ['DUPLICATE_PAYOUT_SOURCE_CONFLICT'],
    };
  }

  const repo = getPayoutRepository();
  const payoutItemId = `pyi_${uuidv4().replace(/-/g, '')}`;
  const now = new Date().toISOString();
  const beneficiaryType = determineBeneficiaryType(command.counterpartyType);
  const status: PayoutItemStatus = command.riskHold || command.holdReason ? 'ON_HOLD' : 'ELIGIBLE';

  const item: PayoutItem = {
    payoutItemId,
    sourceType: command.sourceType,
    sourceId: command.sourceId,
    settlementId: command.settlementId,
    settlementLineId: command.settlementLineId ?? command.sourceId,
    counterpartyType: command.counterpartyType,
    counterpartyId: command.counterpartyId,
    amount: command.amount,
    currency: command.currency,
    payableStatus: status === 'ON_HOLD' ? 'ON_HOLD' : 'ELIGIBLE',
    payoutStatus: 'REQUESTED',
    riskHold: command.riskHold ?? false,
    beneficiaryType,
    beneficiaryId: command.counterpartyId,
    status,
    holdReasonCode: command.holdReason,
    amountSummary: {
      currency: command.currency,
      grossPayableAmount: command.amount,
      heldAmount: status === 'ON_HOLD' ? command.amount : 0,
      payableAmount: command.amount,
      paidAmount: 0,
      thresholdPassed: true,
    },
    executionSummary: {
      foundationInstructionOnly: true,
      actualProviderPayoutPerformed: false,
      paymentInstructionCreated: false,
      retryRequired: false,
    },
    boundaryFlags: {
      settlementTruthMutated: false,
      ledgerTruthMutated: false,
      paymentTruthMutated: false,
      refundTruthMutated: false,
      orderTruthMutated: false,
      cancelReturnTruthMutated: false,
      financeCorrectionTruthMutated: false,
      riskTruthMutated: false,
      actualProviderPayoutPerformed: false,
      paymentInstructionCreated: false,
    },
    sourceRefs: [{
      sourceType: command.sourceType,
      sourceId: command.sourceId,
      metadata: {
        ...(command.metadata ?? {}),
        payoutBoundaryFingerprint: fingerprint,
      },
    }],
    idempotencyKey: command.idempotencyKey,
    createdAt: now,
    updatedAt: now,
    errors: [],
    warnings: [],
  };

  await repo.createItems([item]);
  await repo.saveItemIdempotencyKey(command.idempotencyKey, [item.payoutItemId]);
  payoutIdempotencyFingerprintMap.set(command.idempotencyKey, fingerprint);
  payoutIdempotencyItemMap.set(command.idempotencyKey, item);
  payoutSourceFingerprintMap.set(sourceKey, fingerprint);

  return {
    success: true,
    status: 'CREATED',
    payoutItemId,
    payoutItem: item,
    payoutItems: [item],
    summary: createPayoutBoundarySummary(true, true, false),
    limitationFlags,
  };
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
          ledgerTruthMutated: false,
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
    payoutBatchId: batchId,
    batchType,
    status: 'CREATED',
    beneficiaryType,
    itemIds: eligibleItems.map(i => i.payoutItemId),
    items: eligibleItems,
    totalAmount,
    currency,
    providerMode: 'SIMULATION',
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

  if (action === 'MARK_PROCESSING' || action === 'MARK_PAID') {
    return {
      success: false,
      payoutItemId,
      payoutItem: item,
      errors: ['PAYOUT_EXECUTION_STATUS_TRANSITION_DISABLED_IN_FOUNDATION'],
      summary: createPayoutBoundarySummary(false, false, false),
      limitationFlags: payoutBoundaryLimitationFlags(),
    };
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

  if (targetStatus === 'APPROVED' || targetStatus === 'PROCESSING' || targetStatus === 'COMPLETED') {
    return {
      success: false,
      batchId,
      batch,
      errors: ['PAYOUT_BATCH_EXECUTION_TRANSITION_DISABLED_IN_FOUNDATION'],
      summary: createPayoutBoundarySummary(false, false, false),
      limitationFlags: payoutBoundaryLimitationFlags(),
    };
  }

  await repo.updateBatch(batchId, { status: targetStatus });


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
        boundaryFlags: { settlementTruthMutated: false, ledgerTruthMutated: false, paymentTruthMutated: false, refundTruthMutated: false, orderTruthMutated: false, cancelReturnTruthMutated: false, financeCorrectionTruthMutated: false, riskTruthMutated: false, actualProviderPayoutPerformed: false, paymentInstructionCreated: false },
        sourceRefs: [{ sourceType: 'MANUAL_FOUNDATION', sourceId: 'smoke-test' }],
        createdAt: now,
        updatedAt: now,
        errors: [],
        warnings: [],
    };

    await repo.createItems([item]);
    return { success: true, payoutItems: [item] };
}
