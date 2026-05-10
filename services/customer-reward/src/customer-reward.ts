import {
  CustomerRewardEligibilityContext,
  CustomerRewardEligibilityResult,
  CustomerRewardEligibilityAction,
  CustomerRewardEventType,
  CustomerRewardEligibilityErrorCode,
  GrantPendingRewardPointsCommand,
  PromotePendingRewardPointsCommand,
  RedeemSpendableRewardPointsCommand,
  ReverseRewardPointsForRefundCommand,
  RewardPointEntry,
  RewardPointEventType,
  RewardPointLifecycleResult,
  RewardPointSourceType,
  RewardPointState,
  RewardPointSummary,
} from '@hx/contracts';
import { randomUUID } from 'node:crypto';

const rewardPointEntries = new Map<string, RewardPointEntry>();
const rewardPointIdempotencyGuard = new Map<string, RewardPointLifecycleResult & { fingerprint: string }>();

function stableFingerprint(value: unknown): string {
  return JSON.stringify(value, (_key, current) => {
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      return Object.keys(current as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = (current as Record<string, unknown>)[key];
          return acc;
        }, {});
    }
    return current;
  });
}

function createEmptySummary(customerId: string): RewardPointSummary {
  return {
    customerId,
    pendingPoints: 0,
    spendablePoints: 0,
    redeemedPoints: 0,
    reversedPoints: 0,
    cashEquivalent: false,
    payoutEligible: false,
    payoutCreated: false,
    payableCreated: false,
    paidOutCreated: false,
    ledgerCashEntryCreated: false,
    orderStateMutated: false,
    paymentStateMutated: false,
    refundStateMutated: false,
  };
}

function calculateSummary(customerId: string, reversalRequired = false): RewardPointSummary {
  const summary = createEmptySummary(customerId);

  for (const entry of rewardPointEntries.values()) {
    if (entry.customerId !== customerId) continue;

    if (entry.state === RewardPointState.PENDING) summary.pendingPoints += entry.pointAmount;
    if (entry.state === RewardPointState.SPENDABLE) summary.spendablePoints += entry.pointAmount;
    if (entry.state === RewardPointState.REDEEMED) summary.redeemedPoints += entry.pointAmount;
    if (entry.state === RewardPointState.REVERSED) summary.reversedPoints += entry.pointAmount;
  }

  if (reversalRequired) summary.reversalRequired = true;
  return summary;
}

function customerEntries(customerId: string): RewardPointEntry[] {
  return [...rewardPointEntries.values()].filter((entry) => entry.customerId === customerId);
}

function result(
  status: RewardPointLifecycleResult['status'],
  customerId: string,
  eventType?: RewardPointEventType,
  entry?: RewardPointEntry,
  errors: string[] = [],
  reversalRequired = false,
): RewardPointLifecycleResult {
  return {
    status,
    eventType,
    entry,
    entries: customerEntries(customerId),
    summary: calculateSummary(customerId, reversalRequired),
    errors,
  };
}

function idempotent<TCommand extends { idempotencyKey: string; customerId: string }>(
  command: TCommand,
  calculate: () => RewardPointLifecycleResult,
): RewardPointLifecycleResult {
  const fingerprint = stableFingerprint(command);
  const existing = rewardPointIdempotencyGuard.get(command.idempotencyKey);
  if (existing) {
    if (existing.fingerprint !== fingerprint) {
      return result('CONFLICT', command.customerId, undefined, undefined, ['DUPLICATE_IDEMPOTENCY_KEY_CONFLICT']);
    }
    const { fingerprint: _fingerprint, ...previous } = existing;
    return previous;
  }

  const calculated = calculate();
  rewardPointIdempotencyGuard.set(command.idempotencyKey, { ...calculated, fingerprint });
  return calculated;
}

export function resetRewardPointLifecycleForTesting(): void {
  rewardPointEntries.clear();
  rewardPointIdempotencyGuard.clear();
}

export function getRewardPointSummary(customerId: string): RewardPointSummary {
  return calculateSummary(customerId);
}

export function grantPendingRewardPoints(command: GrantPendingRewardPointsCommand): RewardPointLifecycleResult {
  return idempotent(command, () => {
    const errors: string[] = [];
    if (!command.customerId) errors.push('CUSTOMER_ID_REQUIRED');
    if (!command.sourceId) errors.push('SOURCE_ID_REQUIRED');
    if (!command.idempotencyKey) errors.push('IDEMPOTENCY_KEY_REQUIRED');
    if (!Number.isFinite(command.pointAmount) || command.pointAmount <= 0) errors.push('POINT_AMOUNT_MUST_BE_POSITIVE');
    if (command.sourceType === RewardPointSourceType.ORDER_DELIVERY && (!command.delivered || !command.notReturned)) {
      errors.push('ORDER_DELIVERY_NOT_ELIGIBLE_FOR_PENDING_REWARD');
    }

    if (errors.length) return result('REJECTED', command.customerId, RewardPointEventType.EARN_PENDING, undefined, errors);

    const entry: RewardPointEntry = {
      rewardPointEntryId: `rpe_${randomUUID()}`,
      customerId: command.customerId,
      sourceType: command.sourceType,
      sourceId: command.sourceId,
      orderId: command.orderId,
      orderLineId: command.orderLineId,
      pointAmount: command.pointAmount,
      state: RewardPointState.PENDING,
      idempotencyKey: command.idempotencyKey,
      createdAt: new Date().toISOString(),
      availableAt: command.availableAt,
      metadata: command.metadata,
      cashEquivalent: false,
      payoutEligible: false,
    };
    rewardPointEntries.set(entry.rewardPointEntryId, entry);
    return result('RECORDED', command.customerId, RewardPointEventType.EARN_PENDING, entry);
  });
}

export function promotePendingRewardPoints(command: PromotePendingRewardPointsCommand): RewardPointLifecycleResult {
  return idempotent(command, () => {
    const entry = rewardPointEntries.get(command.rewardPointEntryId);
    if (!entry || entry.customerId !== command.customerId) {
      return result('REJECTED', command.customerId, RewardPointEventType.PROMOTE_TO_SPENDABLE, undefined, ['REWARD_POINT_ENTRY_NOT_FOUND']);
    }
    if (entry.state !== RewardPointState.PENDING) {
      return result('REJECTED', command.customerId, RewardPointEventType.PROMOTE_TO_SPENDABLE, entry, ['REWARD_POINT_ENTRY_NOT_PENDING']);
    }

    entry.state = RewardPointState.SPENDABLE;
    entry.availableAt = command.availableAt ?? new Date().toISOString();
    rewardPointEntries.set(entry.rewardPointEntryId, entry);
    return result('RECORDED', command.customerId, RewardPointEventType.PROMOTE_TO_SPENDABLE, entry);
  });
}

export function redeemSpendableRewardPoints(command: RedeemSpendableRewardPointsCommand): RewardPointLifecycleResult {
  return idempotent(command, () => {
    const entry = rewardPointEntries.get(command.rewardPointEntryId);
    if (!entry || entry.customerId !== command.customerId) {
      return result('REJECTED', command.customerId, RewardPointEventType.REDEEM, undefined, ['REWARD_POINT_ENTRY_NOT_FOUND']);
    }
    if (entry.state !== RewardPointState.SPENDABLE) {
      return result('REJECTED', command.customerId, RewardPointEventType.REDEEM, entry, ['REWARD_POINT_ENTRY_NOT_SPENDABLE']);
    }

    entry.state = RewardPointState.REDEEMED;
    entry.metadata = { ...(entry.metadata ?? {}), ...(command.metadata ?? {}) };
    rewardPointEntries.set(entry.rewardPointEntryId, entry);
    return result('RECORDED', command.customerId, RewardPointEventType.REDEEM, entry);
  });
}

export function reverseRewardPointsForRefund(command: ReverseRewardPointsForRefundCommand): RewardPointLifecycleResult {
  return idempotent(command, () => {
    if (!command.refundId) {
      return result('REJECTED', command.customerId, undefined, undefined, ['REFUND_ID_REQUIRED']);
    }

    const entry = [...rewardPointEntries.values()].find((candidate) => {
      if (candidate.customerId !== command.customerId) return false;
      if (command.rewardPointEntryId) return candidate.rewardPointEntryId === command.rewardPointEntryId;
      if (command.orderLineId) return candidate.orderLineId === command.orderLineId;
      if (command.orderId) return candidate.orderId === command.orderId;
      return false;
    });

    if (!entry) {
      return result('REJECTED', command.customerId, undefined, undefined, ['REWARD_POINT_ENTRY_NOT_FOUND']);
    }

    if (entry.state === RewardPointState.PENDING) {
      entry.state = RewardPointState.REVERSED;
      entry.metadata = { ...(entry.metadata ?? {}), refundId: command.refundId, ...(command.metadata ?? {}) };
      rewardPointEntries.set(entry.rewardPointEntryId, entry);
      return result('RECORDED', command.customerId, RewardPointEventType.REVERSE_PENDING, entry);
    }

    if (entry.state === RewardPointState.SPENDABLE) {
      entry.state = RewardPointState.REVERSED;
      entry.metadata = { ...(entry.metadata ?? {}), refundId: command.refundId, ...(command.metadata ?? {}) };
      rewardPointEntries.set(entry.rewardPointEntryId, entry);
      return result('RECORDED', command.customerId, RewardPointEventType.REVERSE_SPENDABLE, entry);
    }

    if (entry.state === RewardPointState.REDEEMED) {
      entry.state = RewardPointState.BLOCKED;
      entry.metadata = {
        ...(entry.metadata ?? {}),
        refundId: command.refundId,
        rewardPointReversalRequired: true,
        ...(command.metadata ?? {}),
      };
      rewardPointEntries.set(entry.rewardPointEntryId, entry);
      return result('REVERSAL_REQUIRED', command.customerId, RewardPointEventType.BLOCK, entry, ['REDEEMED_REWARD_POINT_REVERSAL_REQUIRED'], true);
    }

    return result('REJECTED', command.customerId, undefined, entry, ['REWARD_POINT_ENTRY_NOT_REVERSIBLE']);
  });
}

export async function checkCustomerRewardEligibility(
  context: CustomerRewardEligibilityContext
): Promise<CustomerRewardEligibilityResult> {
  // Guest deny guard
  if (context.actorType === 'GUEST') {
    return {
      allowed: false,
      action: context.action,
      eventType: context.eventType,
      reasonCode: CustomerRewardEligibilityErrorCode.GUEST_NOT_ELIGIBLE,
      reason: 'Guests cannot earn or revoke points.',
    };
  }

  if (context.action === CustomerRewardEligibilityAction.EARN_POINTS) {
    // Suspended/Closed deny guard for earn
    if (context.customerStatus === 'SUSPENDED' || context.customerStatus === 'CLOSED') {
      return {
        allowed: false,
        action: context.action,
        eventType: context.eventType,
        reasonCode: CustomerRewardEligibilityErrorCode.CUSTOMER_NOT_ACTIVE,
        reason: `Customer status is ${context.customerStatus}. Cannot earn points.`,
      };
    }

    // Moderation/Risk blocked deny guard for earn
    if (context.moderationBlocked || context.riskBlocked) {
      return {
        allowed: false,
        action: context.action,
        eventType: context.eventType,
        reasonCode: CustomerRewardEligibilityErrorCode.BLOCKED_BY_MODERATION_OR_RISK,
        reason: 'Cannot earn points due to moderation or risk blocks.',
      };
    }

    switch (context.eventType) {
      case CustomerRewardEventType.PURCHASE_DELIVERED:
        if (context.delivered && context.notReturned) {
          return { allowed: true, action: context.action, eventType: context.eventType };
        }
        break;
      case CustomerRewardEventType.REVIEW_APPROVED:
        if (context.reviewApproved) {
          return { allowed: true, action: context.action, eventType: context.eventType };
        }
        break;
      case CustomerRewardEventType.USER_STORY_APPROVED:
        if (context.storyApproved) {
          return { allowed: true, action: context.action, eventType: context.eventType };
        }
        break;
      case CustomerRewardEventType.CAMPAIGN_ACTION:
        if (context.campaignEligible) {
          return { allowed: true, action: context.action, eventType: context.eventType };
        }
        break;
      default:
        break;
    }
  } else if (context.action === CustomerRewardEligibilityAction.REVOKE_POINTS) {
    switch (context.eventType) {
      case CustomerRewardEventType.RETURN_OR_REFUND:
        if (context.returnOrRefund) {
          return { allowed: true, action: context.action, eventType: context.eventType };
        }
        break;
      case CustomerRewardEventType.REVIEW_DELETED:
        if (context.reviewDeleted) {
          return { allowed: true, action: context.action, eventType: context.eventType };
        }
        break;
      case CustomerRewardEventType.USER_STORY_REMOVED:
        if (context.storyRemoved) {
          return { allowed: true, action: context.action, eventType: context.eventType };
        }
        break;
      case CustomerRewardEventType.MODERATION_REJECTED:
        if (context.moderationBlocked) {
          return { allowed: true, action: context.action, eventType: context.eventType };
        }
        break;
      default:
        break;
    }
  }

  return {
    allowed: false,
    action: context.action,
    eventType: context.eventType,
    reasonCode: CustomerRewardEligibilityErrorCode.CONTEXT_REQUIREMENTS_NOT_MET,
    reason: 'Context requirements for the event type were not met.',
  };
}
