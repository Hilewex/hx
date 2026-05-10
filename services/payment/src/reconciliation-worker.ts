import {
  createProviderBoundaryFlags,
  NormalizedPaytrStatusInquiryCandidate,
  PaymentCallbackOwnerCommand,
  PaymentReconciliationDecision,
  PaymentReconciliationTaskCandidate,
  PaytrStatusInquiryResponse,
  ProviderBoundaryFlags,
  ProviderResultEnvelope,
  ReconciliationStatus,
  decidePaymentReconciliationAction,
} from '@hx/contracts';
import {
  AuditEventRepositories,
  AuditLogRecord,
  getAuditEventRepositories,
  OutboxEventRecord,
  PaymentReconciliationTaskRepository,
} from '@hx/persistence';
import {
  ApplyPaymentCallbackOwnerCommandResult,
  applyPaymentCallbackOwnerCommand,
} from './payment';
import { PaymentProviderAdapter } from './provider-adapter';

const DEFAULT_DRY_RUN_STATUSES: readonly ReconciliationStatus[] = [
  'reconciliation_required',
  'status_query_inconclusive',
  'status_query_failed',
];

export interface PaymentReconciliationOwnerCommandEligibility {
  readonly status:
    | 'command_ready'
    | 'not_eligible'
    | 'requires_manual_review'
    | 'requires_retry'
    | 'rejected';
  readonly commandType?: 'MARK_PAYMENT_SUCCEEDED';
  readonly paymentAttemptId?: string;
  readonly paymentId?: string;
  readonly checkoutId?: string;
  readonly providerName: string;
  readonly providerReference?: string;
  readonly callbackRecordId?: string;
  readonly reconciliationRef?: string;
  readonly normalizedStatus?: NormalizedPaytrStatusInquiryCandidate['normalizedStatus'];
  readonly shouldProcessPaymentMutation: boolean;
  readonly reason: string;
  readonly boundary: ProviderBoundaryFlags;
}

export interface PaymentReconciliationOwnerCommandCandidate {
  readonly commandType: 'MARK_PAYMENT_SUCCEEDED';
  readonly providerName: string;
  readonly providerReference?: string;
  readonly callbackRecordId: string;
  readonly paymentAttemptId: string;
  readonly paymentId?: string;
  readonly checkoutId?: string;
  readonly normalizedStatus: 'succeeded';
  readonly idempotencyKey: string;
  readonly occurredAt: Date;
  readonly source: 'reconciliation_worker';
  readonly boundary: ProviderBoundaryFlags;
}

export interface PaymentReconciliationTaskDryRunInput {
  readonly task: PaymentReconciliationTaskCandidate;
  readonly repository: PaymentReconciliationTaskRepository;
  readonly providerAdapter: PaymentProviderAdapter;
  readonly now: Date;
  readonly expectedAmountMinor: number;
  readonly expectedCurrency: string;
  readonly simulationResponse?: PaytrStatusInquiryResponse;
  readonly correlationId?: string;
  readonly idempotencyKey?: string;
  readonly enableOwnerCommandApplication?: boolean;
}

export interface PaymentReconciliationTaskDryRunResult {
  readonly task: PaymentReconciliationTaskCandidate;
  readonly providerEnvelope?: ProviderResultEnvelope<NormalizedPaytrStatusInquiryCandidate>;
  readonly decision: PaymentReconciliationDecision;
  readonly ownerCommandEligibility: PaymentReconciliationOwnerCommandEligibility;
  readonly ownerCommandCandidate?: PaymentReconciliationOwnerCommandCandidate;
  readonly dryRun: true;
  readonly mutationApplied: false;
  readonly warnings: readonly string[];
  readonly boundary: ProviderBoundaryFlags;
}

export interface PaymentReconciliationWorkerDryRunInput {
  readonly repository: PaymentReconciliationTaskRepository;
  readonly providerAdapter: PaymentProviderAdapter;
  readonly statuses?: readonly ReconciliationStatus[];
  readonly limit?: number;
  readonly now: Date;
  readonly expectedAmountMinorByProviderReference?: Readonly<Record<string, number>>;
  readonly expectedCurrencyByProviderReference?: Readonly<Record<string, string>>;
  readonly defaultExpectedAmountMinor?: number;
  readonly defaultExpectedCurrency?: string;
  readonly simulationResponsesByProviderReference?: Readonly<Record<string, PaytrStatusInquiryResponse>>;
  readonly defaultSimulationResponse?: PaytrStatusInquiryResponse;
  readonly correlationId?: string;
  readonly enableOwnerCommandApplication?: boolean;
}

export interface PaymentReconciliationWorkerDryRunResult {
  readonly results: readonly PaymentReconciliationTaskDryRunResult[];
  readonly dryRun: true;
  readonly mutationApplied: false;
  readonly boundary: ProviderBoundaryFlags;
}

export interface PaymentReconciliationTaskControlledMutationInput
  extends PaymentReconciliationTaskDryRunInput {
  readonly enableOwnerCommandApplication: true;
  readonly auditEventRepositories?: AuditEventRepositories;
}

export interface PaymentReconciliationTaskControlledMutationResult
  extends Omit<PaymentReconciliationTaskDryRunResult, 'mutationApplied'> {
  readonly ownerCommandApplyResult?: ApplyPaymentCallbackOwnerCommandResult;
  readonly mutationApplied: boolean;
  readonly taskFinalized?: boolean;
  readonly auditAppended?: boolean;
  readonly outboxAppended?: boolean;
  readonly auditRecord?: AuditLogRecord;
  readonly outboxRecord?: OutboxEventRecord;
  readonly evidenceWarnings?: readonly string[];
}

function taskIdempotencyKey(task: PaymentReconciliationTaskCandidate): string {
  return `payment-reconciliation-dry-run:${task.reconciliationRef ?? task.taskId ?? task.providerReference ?? 'unresolved'}`;
}

function taskMerchantOid(task: PaymentReconciliationTaskCandidate): string {
  return task.merchantOid ?? task.providerReference ?? task.reconciliationRef ?? task.taskId ?? 'unknown-merchant-oid';
}

function nextAttemptAt(now: Date): Date {
  return new Date(now.getTime() + 5 * 60 * 1000);
}

function manualReviewRequired(decision: PaymentReconciliationDecision): boolean | undefined {
  return decision.shouldRequireManualReview ? true : undefined;
}

function nextStatusForDecision(
  decision: PaymentReconciliationDecision,
  currentStatus: ReconciliationStatus,
): ReconciliationStatus {
  if (decision.decisionType === 'no_action') {
    return currentStatus;
  }

  return decision.status;
}

function decideOwnerCommandEligibility(input: {
  readonly decision: PaymentReconciliationDecision;
  readonly task: PaymentReconciliationTaskCandidate;
  readonly candidate?: NormalizedPaytrStatusInquiryCandidate;
}): PaymentReconciliationOwnerCommandEligibility {
  const normalizedStatus = input.candidate?.normalizedStatus ?? input.decision.normalizedStatus;
  const providerReference =
    input.task.providerReference ?? input.candidate?.merchantOid ?? input.task.merchantOid;
  const base = {
    ...(input.task.paymentAttemptId ? { paymentAttemptId: input.task.paymentAttemptId } : {}),
    ...(input.task.paymentId ? { paymentId: input.task.paymentId } : {}),
    ...(input.task.checkoutId ? { checkoutId: input.task.checkoutId } : {}),
    providerName: input.task.providerName,
    ...(providerReference ? { providerReference } : {}),
    ...(input.task.reconciliationRef ? { reconciliationRef: input.task.reconciliationRef } : {}),
    ...(normalizedStatus ? { normalizedStatus } : {}),
    boundary: createProviderBoundaryFlags(),
  };

  if (
    input.decision.decisionType === 'mark_reconciled_candidate' &&
    normalizedStatus === 'succeeded_candidate'
  ) {
    if (!input.task.paymentAttemptId) {
      return {
        ...base,
        status: 'not_eligible',
        shouldProcessPaymentMutation: false,
        reason: 'payment_attempt_missing',
      };
    }

    return {
      ...base,
      status: 'command_ready',
      commandType: 'MARK_PAYMENT_SUCCEEDED',
      shouldProcessPaymentMutation: true,
      reason: 'succeeded_candidate_guarded_command_ready',
    };
  }

  if (
    normalizedStatus === 'rejected_amount_mismatch' ||
    input.decision.reason === 'amount_mismatch' ||
    normalizedStatus === 'rejected_currency_mismatch' ||
    input.decision.reason === 'currency_mismatch' ||
    input.decision.status === 'manual_review_required'
  ) {
    return {
      ...base,
      status: 'requires_manual_review',
      shouldProcessPaymentMutation: false,
      reason: String(normalizedStatus ?? input.decision.reason),
    };
  }

  if (
    input.decision.decisionType === 'retry_status_query' ||
    normalizedStatus === 'status_query_inconclusive' ||
    normalizedStatus === 'status_query_failed'
  ) {
    return {
      ...base,
      status: 'requires_retry',
      shouldProcessPaymentMutation: false,
      reason: String(normalizedStatus ?? input.decision.reason),
    };
  }

  if (input.decision.decisionType === 'reject_reconciliation') {
    return {
      ...base,
      status: 'rejected',
      shouldProcessPaymentMutation: false,
      reason: String(input.decision.reason),
    };
  }

  return {
    ...base,
    status: 'not_eligible',
    shouldProcessPaymentMutation: false,
    reason: input.decision.decisionType,
  };
}

function createOwnerCommandCandidate(input: {
  readonly eligibility: PaymentReconciliationOwnerCommandEligibility;
  readonly occurredAt: Date;
}): PaymentReconciliationOwnerCommandCandidate | undefined {
  const eligibility = input.eligibility;

  if (
    eligibility.status !== 'command_ready' ||
    eligibility.commandType !== 'MARK_PAYMENT_SUCCEEDED' ||
    !eligibility.paymentAttemptId
  ) {
    return undefined;
  }

  const reconciliationIdentity =
    eligibility.reconciliationRef ?? eligibility.providerReference ?? 'unresolved';

  return {
    commandType: 'MARK_PAYMENT_SUCCEEDED',
    providerName: eligibility.providerName,
    ...(eligibility.providerReference ? { providerReference: eligibility.providerReference } : {}),
    callbackRecordId:
      eligibility.callbackRecordId ?? `reconciliation:${reconciliationIdentity}`,
    paymentAttemptId: eligibility.paymentAttemptId,
    ...(eligibility.paymentId ? { paymentId: eligibility.paymentId } : {}),
    ...(eligibility.checkoutId ? { checkoutId: eligibility.checkoutId } : {}),
    normalizedStatus: 'succeeded',
    idempotencyKey:
      `payment-reconciliation:${eligibility.providerName}:${reconciliationIdentity}:${eligibility.paymentAttemptId}:MARK_PAYMENT_SUCCEEDED`,
    occurredAt: input.occurredAt,
    source: 'reconciliation_worker',
    boundary: eligibility.boundary,
  };
}

function canApplyOwnerCommand(input: {
  readonly enableOwnerCommandApplication?: boolean;
  readonly decision: PaymentReconciliationDecision;
  readonly candidate?: NormalizedPaytrStatusInquiryCandidate;
  readonly eligibility: PaymentReconciliationOwnerCommandEligibility;
  readonly command?: PaymentReconciliationOwnerCommandCandidate;
  readonly task: PaymentReconciliationTaskCandidate;
}): input is {
  readonly enableOwnerCommandApplication: true;
  readonly decision: PaymentReconciliationDecision;
  readonly candidate: NormalizedPaytrStatusInquiryCandidate & {
    readonly normalizedStatus: 'succeeded_candidate';
  };
  readonly eligibility: PaymentReconciliationOwnerCommandEligibility & {
    readonly status: 'command_ready';
    readonly commandType: 'MARK_PAYMENT_SUCCEEDED';
    readonly paymentAttemptId: string;
  };
  readonly command: PaymentReconciliationOwnerCommandCandidate;
  readonly task: PaymentReconciliationTaskCandidate & {
    readonly paymentAttemptId: string;
  };
} {
  return Boolean(
    input.enableOwnerCommandApplication === true &&
      input.command &&
      input.eligibility.status === 'command_ready' &&
      input.eligibility.commandType === 'MARK_PAYMENT_SUCCEEDED' &&
      input.eligibility.shouldProcessPaymentMutation &&
      input.command.commandType === 'MARK_PAYMENT_SUCCEEDED' &&
      input.decision.decisionType === 'mark_reconciled_candidate' &&
      input.candidate?.normalizedStatus === 'succeeded_candidate' &&
      input.task.paymentAttemptId,
  );
}

function toPaymentOwnerCommand(
  command: PaymentReconciliationOwnerCommandCandidate,
): PaymentCallbackOwnerCommand {
  return command;
}

function reconciliationCompletedEvidenceIdempotencyKey(input: {
  readonly reconciliationRef?: string;
  readonly providerReference?: string;
  readonly paymentAttemptId: string;
}): string {
  return `payment-reconciliation-completed:${input.reconciliationRef ?? input.providerReference ?? 'unresolved'}:${input.paymentAttemptId}`;
}

function shouldFinalizeControlledReconciliation(input: {
  readonly decision: PaymentReconciliationDecision;
  readonly command?: PaymentReconciliationOwnerCommandCandidate;
  readonly applyResult: ApplyPaymentCallbackOwnerCommandResult;
}): boolean {
  if (
    input.decision.decisionType !== 'mark_reconciled_candidate' ||
    input.command?.commandType !== 'MARK_PAYMENT_SUCCEEDED'
  ) {
    return false;
  }

  if (input.applyResult.applied === true) {
    return true;
  }

  return (
    input.applyResult.alreadyApplied === true &&
    input.applyResult.nextState === 'SUCCEEDED' &&
    input.applyResult.nextAttemptState === 'SUCCEEDED'
  );
}

async function appendControlledReconciliationEvidence(input: {
  readonly task: PaymentReconciliationTaskCandidate;
  readonly command: PaymentReconciliationOwnerCommandCandidate;
  readonly applyResult: ApplyPaymentCallbackOwnerCommandResult;
  readonly candidate?: NormalizedPaytrStatusInquiryCandidate;
  readonly correlationId: string;
  readonly idempotencyKey: string;
  readonly occurredAt: Date;
  readonly repositories?: AuditEventRepositories;
}): Promise<{
  readonly auditAppended: boolean;
  readonly outboxAppended: boolean;
  readonly auditRecord?: AuditLogRecord;
  readonly outboxRecord?: OutboxEventRecord;
  readonly evidenceWarnings: readonly string[];
}> {
  const evidenceWarnings: string[] = [];
  let auditRecord: AuditLogRecord | undefined;
  let outboxRecord: OutboxEventRecord | undefined;
  const repositories = input.repositories ?? getAuditEventRepositories();
  const reconciliationIdentity =
    input.task.reconciliationRef ?? input.command.providerReference ?? 'unresolved';
  const evidenceIdempotencyKey = reconciliationCompletedEvidenceIdempotencyKey({
    reconciliationRef: input.task.reconciliationRef,
    providerReference: input.command.providerReference,
    paymentAttemptId: input.command.paymentAttemptId,
  });

  try {
    auditRecord = await repositories.audit.appendAuditLog({
      auditId: `${evidenceIdempotencyKey}:audit`,
      actorType: 'SYSTEM',
      actorId: 'reconciliation-worker',
      actionType: 'payment.reconciliation.completed',
      ownerService: 'payment',
      entityType: 'payment',
      entityId: input.applyResult.paymentId,
      beforeState: {
        state: input.applyResult.previousState,
        attemptState: input.applyResult.previousAttemptState,
      },
      afterState: {
        state: input.applyResult.nextState,
        attemptState: input.applyResult.nextAttemptState,
      },
      reason: 'controlled_reconciliation_payment_mutation_completed',
      idempotencyKey: evidenceIdempotencyKey,
      correlationId: input.correlationId,
      createdAt: input.occurredAt.toISOString(),
      metadata: {
        reconciliationRef: reconciliationIdentity,
        paymentAttemptId: input.command.paymentAttemptId,
        providerName: input.command.providerName,
        providerReference: input.command.providerReference,
        normalizedStatus: input.candidate?.normalizedStatus ?? 'succeeded_candidate',
        ownerCommandType: input.command.commandType,
        orderCreated: false,
        orderHandoff: false,
        financeMutation: false,
        riskMutation: false,
      },
    });
  } catch (error) {
    evidenceWarnings.push('AUDIT_APPEND_FAILED_AFTER_PAYMENT_MUTATION');
  }

  try {
    outboxRecord = await repositories.outbox.appendOutboxEvent({
      topic: 'payment.reconciliation.completed',
      payloadSchema: 'payment.reconciliation.completed.v1',
      payload: {
        paymentId: input.applyResult.paymentId,
        paymentAttemptId: input.command.paymentAttemptId,
        checkoutId: input.command.checkoutId,
        reconciliationRef: reconciliationIdentity,
        providerName: input.command.providerName,
        providerReference: input.command.providerReference,
        state: input.applyResult.nextState,
        orderCreated: false,
        orderHandoff: false,
      },
      ownerService: 'payment',
      entityType: 'payment',
      entityId: input.applyResult.paymentId,
      occurredAt: input.occurredAt.toISOString(),
      idempotencyKey: evidenceIdempotencyKey,
      correlationId: input.correlationId,
      causationId: input.idempotencyKey,
    });
  } catch (error) {
    evidenceWarnings.push('OUTBOX_APPEND_FAILED_AFTER_PAYMENT_MUTATION');
  }

  return {
    auditAppended: Boolean(auditRecord),
    outboxAppended: Boolean(outboxRecord),
    ...(auditRecord ? { auditRecord } : {}),
    ...(outboxRecord ? { outboxRecord } : {}),
    evidenceWarnings,
  };
}

async function updateTaskFromDecision(input: {
  readonly repository: PaymentReconciliationTaskRepository;
  readonly task: PaymentReconciliationTaskCandidate;
  readonly decision: PaymentReconciliationDecision;
  readonly candidate?: NormalizedPaytrStatusInquiryCandidate;
  readonly now: Date;
  readonly warnings: string[];
}): Promise<PaymentReconciliationTaskCandidate> {
  const { task, repository, decision, candidate, now, warnings } = input;

  if (!task.taskId) {
    warnings.push('TASK_ID_MISSING_REPOSITORY_UPDATE_SKIPPED');
    return task;
  }

  const attemptCount = task.attemptCount + 1;
  const shouldRetry = decision.shouldRetry || decision.shouldScheduleStatusQuery;
  const markedAttempt = await repository.markTaskAttempt(task.taskId, {
    attemptCount,
    ...(shouldRetry ? { nextAttemptAt: nextAttemptAt(now) } : {}),
    ...(candidate ? { lastInquiryRef: candidate.inquiryRef, lastCandidate: candidate } : {}),
  });

  const statusUpdated = await repository.updateTaskStatus(task.taskId, {
    status: nextStatusForDecision(decision, task.status),
    ...(shouldRetry ? { nextAttemptAt: nextAttemptAt(now) } : {}),
    ...(manualReviewRequired(decision) !== undefined
      ? { manualReviewRequired: manualReviewRequired(decision) }
      : {}),
  });

  return statusUpdated ?? markedAttempt ?? task;
}

export async function processPaymentReconciliationTaskDryRun(
  input: PaymentReconciliationTaskDryRunInput,
): Promise<PaymentReconciliationTaskDryRunResult> {
  const boundary = createProviderBoundaryFlags();
  const warnings: string[] = [];
  const idempotencyKey = input.idempotencyKey ?? taskIdempotencyKey(input.task);
  const correlationId = input.correlationId ?? idempotencyKey;

  const providerEnvelope = await input.providerAdapter.statusInquiry({
    merchantOid: taskMerchantOid(input.task),
    expectedAmountMinor: input.expectedAmountMinor,
    expectedCurrency: input.expectedCurrency,
    idempotencyKey,
    correlationId,
    ...(input.simulationResponse ? { simulationResponse: input.simulationResponse } : {}),
  });

  const decision = decidePaymentReconciliationAction({
    currentStatus: input.task.status,
    triggerReason: input.task.triggerReason,
    statusInquiryCandidate: providerEnvelope.normalized,
    attemptCount: input.task.attemptCount,
    maxAttempts: input.task.maxAttempts,
    now: input.now,
    nextAttemptAt: input.task.nextAttemptAt,
  });

  if (decision.shouldProcessPaymentMutation) {
    warnings.push('PAYMENT_MUTATION_DECISION_IGNORED_IN_DRY_RUN');
  }

  const ownerCommandEligibility = decideOwnerCommandEligibility({
    decision,
    task: input.task,
    candidate: providerEnvelope.normalized,
  });
  const ownerCommandCandidate = createOwnerCommandCandidate({
    eligibility: ownerCommandEligibility,
    occurredAt: input.now,
  });

  const task = await updateTaskFromDecision({
    repository: input.repository,
    task: input.task,
    decision,
    candidate: providerEnvelope.normalized,
    now: input.now,
    warnings,
  });

  return {
    task,
    providerEnvelope,
    decision,
    ownerCommandEligibility,
    ...(ownerCommandCandidate ? { ownerCommandCandidate } : {}),
    dryRun: true,
    mutationApplied: false,
    warnings,
    boundary,
  };
}

export async function processPaymentReconciliationTaskControlledMutation(
  input: PaymentReconciliationTaskControlledMutationInput,
): Promise<PaymentReconciliationTaskControlledMutationResult> {
  const dryRunResult = await processPaymentReconciliationTaskDryRun(input);
  const candidate = dryRunResult.providerEnvelope?.normalized;
  const ownerCommandCandidate = dryRunResult.ownerCommandCandidate;
  const idempotencyKey = input.idempotencyKey ?? taskIdempotencyKey(input.task);
  const correlationId = input.correlationId ?? idempotencyKey;

  if (
    !ownerCommandCandidate ||
    !canApplyOwnerCommand({
      enableOwnerCommandApplication: input.enableOwnerCommandApplication,
      decision: dryRunResult.decision,
      candidate,
      eligibility: dryRunResult.ownerCommandEligibility,
      command: ownerCommandCandidate,
      task: input.task,
    })
  ) {
    return {
      ...dryRunResult,
      mutationApplied: false,
    };
  }

  const ownerCommandApplyResult = await applyPaymentCallbackOwnerCommand(
    toPaymentOwnerCommand(ownerCommandCandidate),
  );
  const taskFinalizationAllowed = shouldFinalizeControlledReconciliation({
    decision: dryRunResult.decision,
    command: ownerCommandCandidate,
    applyResult: ownerCommandApplyResult,
  });
  const evidenceWarnings: string[] = [];
  let finalizedTask = dryRunResult.task;
  let taskFinalized = false;
  let evidence:
    | Awaited<ReturnType<typeof appendControlledReconciliationEvidence>>
    | undefined;

  if (taskFinalizationAllowed) {
    if (dryRunResult.task.taskId) {
      const updatedTask = await input.repository.updateTaskStatus(dryRunResult.task.taskId, {
        status: 'reconciled',
        manualReviewRequired: false,
      });
      finalizedTask = updatedTask ?? dryRunResult.task;
      taskFinalized = finalizedTask.status === 'reconciled';
      if (!updatedTask) {
        evidenceWarnings.push('TASK_FINALIZATION_UPDATE_FAILED');
      }
    } else {
      evidenceWarnings.push('TASK_ID_MISSING_FINALIZATION_SKIPPED');
    }

    if (taskFinalized) {
      evidence = await appendControlledReconciliationEvidence({
        task: finalizedTask,
        command: ownerCommandCandidate,
        applyResult: ownerCommandApplyResult,
        candidate,
        correlationId,
        idempotencyKey,
        occurredAt: input.now,
        repositories: input.auditEventRepositories,
      });
      evidenceWarnings.push(...evidence.evidenceWarnings);
    }
  }

  return {
    ...dryRunResult,
    task: finalizedTask,
    ownerCommandApplyResult,
    mutationApplied: ownerCommandApplyResult.applied === true,
    taskFinalized,
    auditAppended: evidence?.auditAppended ?? false,
    outboxAppended: evidence?.outboxAppended ?? false,
    ...(evidence?.auditRecord ? { auditRecord: evidence.auditRecord } : {}),
    ...(evidence?.outboxRecord ? { outboxRecord: evidence.outboxRecord } : {}),
    evidenceWarnings,
  };
}

export async function runPaymentReconciliationWorkerDryRun(
  input: PaymentReconciliationWorkerDryRunInput,
): Promise<PaymentReconciliationWorkerDryRunResult> {
  const statuses = input.statuses ?? DEFAULT_DRY_RUN_STATUSES;
  const tasksToProcess: PaymentReconciliationTaskCandidate[] = [];
  const results: PaymentReconciliationTaskDryRunResult[] = [];

  for (const status of statuses) {
    tasksToProcess.push(...await input.repository.listTasksByStatus(status, input.limit ?? 100));
  }

  for (const task of tasksToProcess) {
    const providerReference = task.providerReference ?? task.merchantOid ?? task.reconciliationRef;
    const expectedAmountMinor = providerReference
      ? input.expectedAmountMinorByProviderReference?.[providerReference] ?? input.defaultExpectedAmountMinor
      : input.defaultExpectedAmountMinor;
    const expectedCurrency = providerReference
      ? input.expectedCurrencyByProviderReference?.[providerReference] ?? input.defaultExpectedCurrency
      : input.defaultExpectedCurrency;

    if (expectedAmountMinor === undefined || !expectedCurrency) {
      const decision = decidePaymentReconciliationAction({
        currentStatus: task.status,
        triggerReason: 'manual_review',
        attemptCount: task.attemptCount,
        maxAttempts: task.maxAttempts,
        now: input.now,
        nextAttemptAt: task.nextAttemptAt,
      });
      const ownerCommandEligibility = decideOwnerCommandEligibility({
        decision,
        task,
      });

      results.push({
        task,
        decision,
        ownerCommandEligibility,
        dryRun: true,
        mutationApplied: false,
        warnings: ['EXPECTED_AMOUNT_OR_CURRENCY_MISSING_STATUS_INQUIRY_SKIPPED'],
        boundary: createProviderBoundaryFlags(),
      });
      continue;
    }

    results.push(
      await processPaymentReconciliationTaskDryRun({
        task,
        repository: input.repository,
        providerAdapter: input.providerAdapter,
        now: input.now,
        expectedAmountMinor,
        expectedCurrency,
        simulationResponse: providerReference
          ? input.simulationResponsesByProviderReference?.[providerReference] ??
            input.defaultSimulationResponse
          : input.defaultSimulationResponse,
        correlationId: input.correlationId,
      }),
    );
  }

  return {
    results,
    dryRun: true,
    mutationApplied: false,
    boundary: createProviderBoundaryFlags(),
  };
}
