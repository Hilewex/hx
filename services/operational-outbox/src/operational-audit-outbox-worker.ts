import crypto from 'node:crypto';
import type {
  OperationalDeliveryAttemptProjection,
  OperationalOutboxDeliveryProjection,
} from '@hx/contracts';
import type {
  AuditIntentOutboxRecord,
  AuditIntentDeliveryState,
  OperationalIntentRepository,
} from '@hx/persistence';
import { getOperationalIntentRepository } from '@hx/persistence';

export interface OperationalOutboxWorkerInternalCaller {
  readonly callerId: 'operational-audit-outbox-worker';
  readonly serviceName: '@hx/operational-outbox';
  readonly allowlisted: boolean;
  readonly issuedAt: number;
  readonly expiresAt: number;
  readonly allowedAudience: readonly string[];
  readonly routeScope: 'operational-outbox:dry-run';
  readonly signature: string;
  readonly signedToken: string;
}

export interface OperationalOutboxWorkerInput {
  readonly repository?: OperationalIntentRepository;
  readonly limit?: number;
  readonly now?: Date;
  readonly maxRetries?: number;
  readonly retryDelayMs?: number;
  readonly leaseOwner?: string;
  readonly leaseDurationMs?: number;
  readonly simulateFailureForOutboxIds?: readonly string[];
  readonly internalCaller?: OperationalOutboxWorkerInternalCaller;
}

export interface OperationalOutboxWorkerResult {
  readonly scanned: number;
  readonly delivered: number;
  readonly failed: number;
  readonly deadLettered: number;
  readonly claimed: number;
  readonly skippedDuplicateClaims: number;
  readonly attempts: readonly OperationalDeliveryAttemptProjection[];
  readonly deliveries: readonly OperationalOutboxDeliveryProjection[];
  readonly internalCaller: OperationalOutboxWorkerInternalCaller;
  readonly dryRunOwnerHandoff: true;
  readonly enforcementExecuted: false;
  readonly ownerTruthMutated: false;
  readonly payoutBlockedTruth: false;
  readonly refundExecutionTruth: false;
}

function createDefaultInternalCaller(nowSeconds = Math.floor(Date.now() / 1000)): OperationalOutboxWorkerInternalCaller {
  const signedToken = issueWorkerInternalServiceToken({
    callerId: 'operational-audit-outbox-worker',
    serviceName: '@hx/operational-outbox',
    allowedAudience: ['operational-outbox:dry-run'],
    issuedAt: nowSeconds,
    expiresAt: nowSeconds + 300,
  });
  const validation = validateWorkerInternalServiceToken(signedToken, 'operational-outbox:dry-run');
  if (!validation.isValid) throw new Error(`OPERATIONAL_OUTBOX_INTERNAL_TOKEN_INVALID:${validation.error}`);
  return {
    callerId: 'operational-audit-outbox-worker',
    serviceName: '@hx/operational-outbox',
    allowlisted: true,
    issuedAt: validation.claims.issuedAt,
    expiresAt: validation.claims.expiresAt,
    allowedAudience: validation.claims.allowedAudience,
    routeScope: 'operational-outbox:dry-run',
    signature: validation.signature,
    signedToken,
  };
}

const blockedTruthKeys = [
  ['refund', 'completed'],
  ['payout', 'blocked'],
  ['user', 'banned'],
  ['moderation', 'finalized'],
  ['fraud', 'confirmed'],
] as const;

function retryCountForAttempt(outbox: AuditIntentOutboxRecord): number {
  return outbox.retryCount + 1;
}

function nextRetryAt(now: Date, retryDelayMs: number): Date {
  return new Date(now.getTime() + retryDelayMs);
}

function assertInternalCaller(caller: OperationalOutboxWorkerInternalCaller): void {
  if (
    caller.callerId !== 'operational-audit-outbox-worker' ||
    caller.serviceName !== '@hx/operational-outbox' ||
    caller.allowlisted !== true ||
    caller.routeScope !== 'operational-outbox:dry-run'
  ) {
    throw new Error('OPERATIONAL_OUTBOX_INTERNAL_CALLER_NOT_ALLOWLISTED');
  }

  const validation = validateWorkerInternalServiceToken(caller.signedToken, caller.routeScope);
  if (!validation.isValid) {
    throw new Error(`OPERATIONAL_OUTBOX_SIGNED_TOKEN_INVALID:${validation.error}`);
  }
  if (
    validation.claims.callerId !== caller.callerId ||
    validation.claims.serviceName !== caller.serviceName ||
    validation.signature !== caller.signature
  ) {
    throw new Error('OPERATIONAL_OUTBOX_SIGNED_TOKEN_CALLER_MISMATCH');
  }
}

function signWorkerPayload(payload: string): string {
  const secret = process.env.INTERNAL_SERVICE_TOKEN_SECRET || 'hx-dev-local-secret-for-internal-service-token-12345';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('base64url');
}

function issueWorkerInternalServiceToken(input: {
  serviceName: string;
  callerId: string;
  allowedAudience: readonly string[];
  issuedAt: number;
  expiresAt: number;
}): string {
  const payload = Buffer.from(JSON.stringify(input)).toString('base64url');
  return `${payload}.${signWorkerPayload(payload)}`;
}

function validateWorkerInternalServiceToken(token: string, routeScope: string): {
  isValid: true;
  claims: {
    serviceName: string;
    callerId: string;
    issuedAt: number;
    expiresAt: number;
    allowedAudience: string[];
  };
  signature: string;
} | { isValid: false; error: string } {
  const parts = token.split('.');
  if (parts.length !== 2) return { isValid: false, error: 'TOKEN_INVALID' };
  const [payload, signature] = parts;
  if (signature !== signWorkerPayload(payload)) return { isValid: false, error: 'INVALID_SIGNATURE' };
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (!claims.allowedAudience?.includes(routeScope) && !claims.allowedAudience?.includes('*')) {
    return { isValid: false, error: 'AUDIENCE_NOT_ALLOWED' };
  }
  if (claims.expiresAt < Math.floor(Date.now() / 1000)) return { isValid: false, error: 'TOKEN_EXPIRED' };
  return { isValid: true, claims, signature };
}

function assertProjectionBoundary(projection: OperationalOutboxDeliveryProjection): void {
  const serialized = JSON.stringify(projection).toLowerCase();
  for (const blockedParts of blockedTruthKeys) {
    const blocked = blockedParts.join(' ');
    if (serialized.includes(blocked)) {
      throw new Error(`OPERATIONAL_OUTBOX_BLOCKED_TRUTH_PROJECTION:${blocked}`);
    }
  }
}

function attemptProjection(input: {
  outbox: AuditIntentOutboxRecord;
  attemptedAt: Date;
  attemptState: OperationalDeliveryAttemptProjection['attemptState'];
  retryCount: number;
  lastError?: string | null;
}): OperationalDeliveryAttemptProjection {
  return {
    outboxId: input.outbox.outboxId,
    attemptedAt: input.attemptedAt.toISOString(),
    attemptState: input.attemptState,
    retryCount: input.retryCount,
    lastError: input.lastError ?? null,
    leaseOwner: input.outbox.leaseOwner ?? null,
    leaseState: deriveLeaseState(input.outbox, input.attemptedAt),
    projectionOnly: true,
    enforcementExecuted: false,
    ownerTruthMutated: false,
    payoutBlockedTruth: false,
    refundExecutionTruth: false,
  };
}

function deliveryProjection(input: {
  outbox: AuditIntentOutboxRecord;
  deliveryState: AuditIntentDeliveryState;
  attempts: OperationalDeliveryAttemptProjection[];
}): OperationalOutboxDeliveryProjection {
  const projection: OperationalOutboxDeliveryProjection = {
    outboxId: input.outbox.outboxId,
    intentId: input.outbox.intentId,
    deliveryState: input.deliveryState,
    retryCount: input.outbox.retryCount,
    nextRetryAt: input.outbox.nextRetryAt ?? null,
    lastError: input.outbox.lastError ?? null,
    deadLetterReason: input.outbox.deadLetterReason ?? null,
    lastDeliveryAttemptAt: input.outbox.lastDeliveryAttemptAt ?? null,
    deliveredAt: input.outbox.deliveredAt ?? null,
    leaseOwner: input.outbox.leaseOwner ?? null,
    leaseUntil: input.outbox.leaseUntil ?? null,
    claimedAt: input.outbox.claimedAt ?? null,
    processingStartedAt: input.outbox.processingStartedAt ?? null,
    leaseState: deriveLeaseState(input.outbox, new Date()),
    processingAgeSeconds: deriveProcessingAgeSeconds(input.outbox, new Date()),
    attempts: input.attempts,
    projectionOnly: true,
    enforcementExecuted: false,
    ownerTruthMutated: false,
    payoutBlockedTruth: false,
    refundExecutionTruth: false,
  };
  assertProjectionBoundary(projection);
  return projection;
}

function deriveLeaseState(
  outbox: Pick<AuditIntentOutboxRecord, 'leaseOwner' | 'leaseUntil' | 'deliveryState'>,
  now: Date,
): 'unleased' | 'claimed' | 'expired' | 'released' {
  if (!outbox.leaseOwner || !outbox.leaseUntil) return outbox.deliveryState === 'processing' ? 'released' : 'unleased';
  return new Date(outbox.leaseUntil).getTime() <= now.getTime() ? 'expired' : 'claimed';
}

function deriveProcessingAgeSeconds(
  outbox: Pick<AuditIntentOutboxRecord, 'processingStartedAt'>,
  now: Date,
): number | null {
  if (!outbox.processingStartedAt) return null;
  return Math.max(0, Math.floor((now.getTime() - new Date(outbox.processingStartedAt).getTime()) / 1000));
}

export async function runOperationalAuditOutboxWorkerDryRun(
  input: OperationalOutboxWorkerInput = {},
): Promise<OperationalOutboxWorkerResult> {
  const repository = input.repository ?? getOperationalIntentRepository();
  const now = input.now ?? new Date();
  const maxRetries = input.maxRetries ?? 3;
  const retryDelayMs = input.retryDelayMs ?? 5 * 60 * 1000;
  const leaseOwner = input.leaseOwner ?? 'operational-audit-outbox-worker';
  const leaseDurationMs = input.leaseDurationMs ?? 60_000;
  const internalCaller = input.internalCaller ?? createDefaultInternalCaller();
  const simulateFailureForOutboxIds = new Set(input.simulateFailureForOutboxIds ?? []);

  assertInternalCaller(internalCaller);

  const outboxes = await repository.listDeliverableAuditOutbox({
    limit: input.limit ?? 50,
    now,
    states: ['pending', 'failed'],
  });
  const allAttempts: OperationalDeliveryAttemptProjection[] = [];
  const deliveries: OperationalOutboxDeliveryProjection[] = [];
  let delivered = 0;
  let failed = 0;
  let deadLettered = 0;
  let claimed = 0;
  let skippedDuplicateClaims = 0;

  for (const outbox of outboxes) {
    const leased = await repository.claimAuditOutboxLease(outbox.outboxId, {
      leaseOwner,
      leaseUntil: new Date(now.getTime() + leaseDurationMs),
      now,
    });
    if (!leased) {
      skippedDuplicateClaims += 1;
      continue;
    }
    claimed += 1;

    const processing = await repository.markAuditOutboxProcessing(leased.outboxId, now);
    const processingOutbox = processing ?? outbox;
    const processingAttempt = attemptProjection({
      outbox: processingOutbox,
      attemptedAt: now,
      attemptState: 'handoff_simulated',
      retryCount: processingOutbox.retryCount,
    });
    const attempts = [processingAttempt];

    if (simulateFailureForOutboxIds.has(outbox.outboxId)) {
      const retryCount = retryCountForAttempt(outbox);
      const lastError = 'DRY_RUN_OWNER_HANDOFF_SIMULATED_FAILURE';
      if (retryCount >= maxRetries) {
        const deadLetter = await repository.markAuditOutboxDeadLetter(outbox.outboxId, {
          retryCount,
          lastError,
          deadLetterReason: 'DRY_RUN_RETRY_LIMIT_REACHED',
        });
        const deadLetterOutbox = deadLetter ?? { ...processingOutbox, retryCount, lastError, deadLetterReason: 'DRY_RUN_RETRY_LIMIT_REACHED' };
        const deadLetterAttempt = attemptProjection({
          outbox: deadLetterOutbox,
          attemptedAt: now,
          attemptState: 'dead_lettered',
          retryCount,
          lastError,
        });
        attempts.push(deadLetterAttempt);
        allAttempts.push(...attempts);
        deliveries.push(deliveryProjection({ outbox: deadLetterOutbox, deliveryState: 'dead_letter', attempts }));
        deadLettered += 1;
        continue;
      }

      const failedOutbox = await repository.markAuditOutboxFailed(outbox.outboxId, {
        retryCount,
        lastError,
        nextRetryAt: nextRetryAt(now, retryDelayMs),
      });
      const retryOutbox = failedOutbox ?? { ...processingOutbox, retryCount, lastError, nextRetryAt: nextRetryAt(now, retryDelayMs).toISOString() };
      const retryAttempt = attemptProjection({
        outbox: retryOutbox,
        attemptedAt: now,
        attemptState: 'retry_scheduled',
        retryCount,
        lastError,
      });
      attempts.push(retryAttempt);
      allAttempts.push(...attempts);
      deliveries.push(deliveryProjection({ outbox: retryOutbox, deliveryState: 'failed', attempts }));
      failed += 1;
      continue;
    }

    const acceptedAttempt = attemptProjection({
      outbox: processingOutbox,
      attemptedAt: now,
      attemptState: 'owner_accepted',
      retryCount: processingOutbox.retryCount,
    });
    attempts.push(acceptedAttempt);
    const deliveredOutbox = await repository.markAuditOutboxDelivered(outbox.outboxId, now);
    const finalOutbox = deliveredOutbox ?? { ...processingOutbox, deliveryState: 'delivered' as const, deliveredAt: now.toISOString() };
    const queuedAttempt = attemptProjection({
      outbox: finalOutbox,
      attemptedAt: now,
      attemptState: 'queued_for_owner',
      retryCount: finalOutbox.retryCount,
    });
    attempts.push(queuedAttempt);
    allAttempts.push(...attempts);
    deliveries.push(deliveryProjection({ outbox: finalOutbox, deliveryState: 'delivered', attempts }));
    delivered += 1;
  }

  return {
    scanned: outboxes.length,
    delivered,
    failed,
    deadLettered,
    claimed,
    skippedDuplicateClaims,
    attempts: allAttempts,
    deliveries,
    internalCaller,
    dryRunOwnerHandoff: true,
    enforcementExecuted: false,
    ownerTruthMutated: false,
    payoutBlockedTruth: false,
    refundExecutionTruth: false,
  };
}

export async function runOperationalOutboxSchedulerFoundation(input: OperationalOutboxWorkerInput = {}) {
  return runOperationalAuditOutboxWorkerDryRun({
    ...input,
    limit: input.limit ?? 25,
  });
}
