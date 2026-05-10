import {
  createProviderBoundaryFlags,
  decidePaymentCallbackOwnerCommand,
  NormalizedPaymentCallbackCandidate,
  PaymentCallbackOwnerCommandDecisionStatus,
  PaymentCallbackOwnerCommandType,
  ProviderBoundaryFlags,
  ProviderCallbackProcessingStatus,
  ProviderCallbackRecord,
} from '@hx/contracts';
import {
  getProviderCallbackEventRepository,
  ProviderCallbackEventRepository,
} from '@hx/persistence';
import { applyPaymentCallbackOwnerCommand } from './payment';
import { getPaymentRepository } from './repository';

export interface PaymentCallbackWorkerRunResult {
  readonly scanned: number;
  readonly commandReady: number;
  readonly rejected: number;
  readonly reconciliationRequired: number;
  readonly ignored: number;
  readonly failed: number;
  readonly decisions: readonly PaymentCallbackWorkerDecisionSummary[];
}

export interface PaymentCallbackWorkerDecisionSummary {
  readonly callbackRecordId: string;
  readonly providerName: string;
  readonly providerEventId?: string;
  readonly processingStatus: ProviderCallbackProcessingStatus;
  readonly decisionStatus:
    | PaymentCallbackOwnerCommandDecisionStatus
    | 'invalid_normalized_payload'
    | 'not_payment_callback';
  readonly ownerCommandType?: PaymentCallbackOwnerCommandType;
  readonly idempotencyKey?: string;
  readonly ownerTransitionApplied?: boolean;
  readonly ownerTransitionAlreadyApplied?: boolean;
  readonly ownerTransitionIgnored?: boolean;
  readonly ownerTransitionErrors?: readonly string[];
  readonly reason?: string;
  readonly boundary: ProviderBoundaryFlags;
}

interface NormalizedPayloadWithCandidate {
  readonly candidate: NormalizedPaymentCallbackCandidate;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasBoundaryFalse(value: unknown): value is ProviderBoundaryFlags {
  if (!isObject(value)) {
    return false;
  }

  return (
    value.providerTruth === false &&
    value.businessTruthMutated === false &&
    value.ownerStateMutated === false &&
    value.eventTruthMutated === false &&
    value.outboxDeliveryGuaranteed === false
  );
}

function parseNormalizedPaymentCallbackPayload(
  normalizedPayload: unknown,
): NormalizedPayloadWithCandidate | null {
  if (!isObject(normalizedPayload)) {
    return null;
  }

  const candidate = normalizedPayload.candidate;
  if (!isObject(candidate)) {
    return null;
  }

  if (
    candidate.providerDomain !== 'payment' ||
    typeof candidate.providerName !== 'string' ||
    candidate.providerName.length === 0 ||
    typeof candidate.normalizedStatus !== 'string' ||
    !hasBoundaryFalse(candidate.boundary)
  ) {
    return null;
  }

  return {
    candidate: candidate as unknown as NormalizedPaymentCallbackCandidate,
  };
}

function summarizeDecision(input: {
  readonly record: ProviderCallbackRecord;
  readonly processingStatus: ProviderCallbackProcessingStatus;
  readonly decisionStatus: PaymentCallbackWorkerDecisionSummary['decisionStatus'];
  readonly ownerCommandType?: PaymentCallbackOwnerCommandType;
  readonly idempotencyKey?: string;
  readonly ownerTransitionApplied?: boolean;
  readonly ownerTransitionAlreadyApplied?: boolean;
  readonly ownerTransitionIgnored?: boolean;
  readonly ownerTransitionErrors?: readonly string[];
  readonly reason?: string;
}): PaymentCallbackWorkerDecisionSummary {
  return {
    callbackRecordId: input.record.id,
    providerName: input.record.providerName,
    ...(input.record.providerEventId ? { providerEventId: input.record.providerEventId } : {}),
    processingStatus: input.processingStatus,
    decisionStatus: input.decisionStatus,
    ...(input.ownerCommandType ? { ownerCommandType: input.ownerCommandType } : {}),
    ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
    ...(input.ownerTransitionApplied !== undefined
      ? { ownerTransitionApplied: input.ownerTransitionApplied }
      : {}),
    ...(input.ownerTransitionAlreadyApplied !== undefined
      ? { ownerTransitionAlreadyApplied: input.ownerTransitionAlreadyApplied }
      : {}),
    ...(input.ownerTransitionIgnored !== undefined
      ? { ownerTransitionIgnored: input.ownerTransitionIgnored }
      : {}),
    ...(input.ownerTransitionErrors ? { ownerTransitionErrors: input.ownerTransitionErrors } : {}),
    ...(input.reason ? { reason: input.reason } : {}),
    boundary: createProviderBoundaryFlags(),
  };
}

export async function processPaymentCallbackRecordsDryRun(input?: {
  readonly limit?: number;
  readonly repository?: ProviderCallbackEventRepository;
  readonly ownerTransitionMode?: 'dry_run' | 'apply_owner_transition';
}): Promise<PaymentCallbackWorkerRunResult> {
  const repository = input?.repository ?? getProviderCallbackEventRepository();
  const ownerTransitionMode = input?.ownerTransitionMode ?? 'dry_run';
  const records = await repository.listProviderCallbackEventsByProcessingStatus(
    'received',
    input?.limit ?? 50,
  );
  const decisions: PaymentCallbackWorkerDecisionSummary[] = [];

  let commandReady = 0;
  let rejected = 0;
  let reconciliationRequired = 0;
  let ignored = 0;
  let failed = 0;

  for (const record of records) {
    if (record.providerDomain !== 'payment') {
      decisions.push(
        summarizeDecision({
          record,
          processingStatus: record.processingStatus,
          decisionStatus: 'not_payment_callback',
          reason: 'provider_domain_not_payment',
        }),
      );
      continue;
    }

    const parsed = parseNormalizedPaymentCallbackPayload(record.normalizedPayload);
    if (!parsed) {
      const updated = await repository.markProviderCallbackEventProcessed(record.id, 'failed');
      failed += 1;
      decisions.push(
        summarizeDecision({
          record,
          processingStatus: updated?.processingStatus ?? 'failed',
          decisionStatus: 'invalid_normalized_payload',
          reason: 'invalid_normalized_payload',
        }),
      );
      continue;
    }

    try {
      const resolvedPayment =
        ownerTransitionMode === 'apply_owner_transition'
          ? await (async () => {
              const paymentRepository = getPaymentRepository();
              const byAttempt = parsed.candidate.paymentAttemptId
                ? await paymentRepository.getByPaymentAttemptId(parsed.candidate.paymentAttemptId)
                : undefined;
              const byProviderReference =
                !byAttempt && parsed.candidate.providerReference
                  ? await paymentRepository.getByProviderReference(
                      parsed.candidate.providerName,
                      parsed.candidate.providerReference,
                    )
                  : undefined;
              return byAttempt ?? byProviderReference;
            })()
          : undefined;
      const decision = decidePaymentCallbackOwnerCommand({
        candidate: parsed.candidate,
        callbackRecordId: record.id,
        resolvedPaymentAttemptId:
          parsed.candidate.paymentAttemptId ?? resolvedPayment?.attempt.paymentAttemptId,
        resolvedPaymentId: parsed.candidate.paymentId ?? resolvedPayment?.paymentId,
        resolvedCheckoutId: parsed.candidate.checkoutId ?? resolvedPayment?.checkoutId,
      });

      if (decision.status === 'command_ready') {
        if (ownerTransitionMode === 'apply_owner_transition' && decision.command) {
          const ownerTransition = await applyPaymentCallbackOwnerCommand(decision.command);
          if (ownerTransition.errors.includes('PAYMENT_NOT_FOUND')) {
            const updated = await repository.markProviderCallbackEventProcessed(record.id, 'ignored');
            reconciliationRequired += 1;
            decisions.push(
              summarizeDecision({
                record,
                processingStatus: updated?.processingStatus ?? 'ignored',
                decisionStatus: 'missing_payment_attempt',
                ownerCommandType: decision.command.commandType,
                idempotencyKey: decision.command.idempotencyKey,
                ownerTransitionApplied: ownerTransition.applied,
                ownerTransitionAlreadyApplied: ownerTransition.alreadyApplied,
                ownerTransitionIgnored: ownerTransition.ignored,
                ownerTransitionErrors: ownerTransition.errors,
                reason: 'payment_lookup_missing',
              }),
            );
            continue;
          }

          const updated = await repository.markProviderCallbackEventProcessed(
            record.id,
            ownerTransition.errors.length > 0 ? 'failed' : 'accepted',
          );
          if (ownerTransition.errors.length > 0) {
            failed += 1;
          } else {
            commandReady += 1;
          }
          decisions.push(
            summarizeDecision({
              record,
              processingStatus: updated?.processingStatus ?? (
                ownerTransition.errors.length > 0 ? 'failed' : 'accepted'
              ),
              decisionStatus: decision.status,
              ownerCommandType: decision.command.commandType,
              idempotencyKey: decision.command.idempotencyKey,
              ownerTransitionApplied: ownerTransition.applied,
              ownerTransitionAlreadyApplied: ownerTransition.alreadyApplied,
              ownerTransitionIgnored: ownerTransition.ignored,
              ownerTransitionErrors: ownerTransition.errors,
              reason: ownerTransition.errors[0] ?? decision.reason,
            }),
          );
          continue;
        }

        const updated = await repository.markProviderCallbackEventProcessed(record.id, 'accepted');
        commandReady += 1;
        decisions.push(
          summarizeDecision({
            record,
            processingStatus: updated?.processingStatus ?? 'accepted',
            decisionStatus: decision.status,
            ownerCommandType: decision.command?.commandType,
            idempotencyKey: decision.command?.idempotencyKey,
            reason: decision.reason,
          }),
        );
        continue;
      }

      if (decision.status === 'candidate_rejected') {
        const updated = await repository.markProviderCallbackEventProcessed(record.id, 'rejected');
        rejected += 1;
        decisions.push(
          summarizeDecision({
            record,
            processingStatus: updated?.processingStatus ?? 'rejected',
            decisionStatus: decision.status,
            reason: decision.reason,
          }),
        );
        continue;
      }

      if (
        decision.status === 'candidate_requires_reconciliation' ||
        decision.status === 'missing_payment_attempt'
      ) {
        const updated = await repository.markProviderCallbackEventProcessed(record.id, 'ignored');
        reconciliationRequired += 1;
        decisions.push(
          summarizeDecision({
            record,
            processingStatus: updated?.processingStatus ?? 'ignored',
            decisionStatus: decision.status,
            reason: decision.reason,
          }),
        );
        continue;
      }

      const updated = await repository.markProviderCallbackEventProcessed(record.id, 'ignored');
      ignored += 1;
      decisions.push(
        summarizeDecision({
          record,
          processingStatus: updated?.processingStatus ?? 'ignored',
          decisionStatus: decision.status,
          reason: decision.reason,
        }),
      );
    } catch (error) {
      const updated = await repository.markProviderCallbackEventProcessed(record.id, 'failed');
      failed += 1;
      decisions.push(
        summarizeDecision({
          record,
          processingStatus: updated?.processingStatus ?? 'failed',
          decisionStatus: 'invalid_normalized_payload',
          reason: (error as Error).message,
        }),
      );
    }
  }

  return {
    scanned: records.length,
    commandReady,
    rejected,
    reconciliationRequired,
    ignored,
    failed,
    decisions,
  };
}
