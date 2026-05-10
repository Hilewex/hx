import { strict as assert } from 'node:assert';
import {
  CustomerRewardEligibilityAction,
  CustomerRewardEventType,
  RewardPointSourceType,
  RewardPointState,
} from '../../../packages/contracts/src';
import {
  checkCustomerRewardEligibility,
  getRewardPointSummary,
  grantPendingRewardPoints,
  promotePendingRewardPoints,
  redeemSpendableRewardPoints,
  resetRewardPointLifecycleForTesting,
  reverseRewardPointsForRefund,
} from '../../../services/customer-reward/src';
import { SmokeResult, SmokeRunner } from '../types';

export const rewardPointLifecycleFoundationSmoke: SmokeRunner = {
  name: 'reward-point-lifecycle-foundation',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    try {
      resetRewardPointLifecycleForTesting();

      const pending = grantPendingRewardPoints({
        customerId: 'customer-reward-1',
        sourceType: RewardPointSourceType.ORDER_DELIVERY,
        sourceId: 'delivery-1',
        orderId: 'order-1',
        orderLineId: 'order-line-1',
        pointAmount: 100,
        idempotencyKey: 'reward-grant-1',
        delivered: true,
        notReturned: true,
      });
      assert.equal(pending.status, 'RECORDED');
      assert.equal(pending.entry?.state, RewardPointState.PENDING);
      assert.equal(pending.summary.pendingPoints, 100);
      assert.equal(pending.summary.spendablePoints, 0);
      assert.equal(pending.entry?.cashEquivalent, false);
      assert.equal(pending.entry?.payoutEligible, false);

      const promoted = promotePendingRewardPoints({
        customerId: 'customer-reward-1',
        rewardPointEntryId: pending.entry?.rewardPointEntryId ?? '',
        idempotencyKey: 'reward-promote-1',
      });
      assert.equal(promoted.status, 'RECORDED');
      assert.equal(promoted.entry?.state, RewardPointState.SPENDABLE);
      assert.equal(promoted.summary.pendingPoints, 0);
      assert.equal(promoted.summary.spendablePoints, 100);

      const pendingBeforeRefund = grantPendingRewardPoints({
        customerId: 'customer-reward-1',
        sourceType: RewardPointSourceType.ORDER_DELIVERY,
        sourceId: 'delivery-2',
        orderId: 'order-2',
        orderLineId: 'order-line-2',
        pointAmount: 40,
        idempotencyKey: 'reward-grant-2',
        delivered: true,
        notReturned: true,
      });
      const reversedPending = reverseRewardPointsForRefund({
        customerId: 'customer-reward-1',
        refundId: 'refund-before-spendable',
        rewardPointEntryId: pendingBeforeRefund.entry?.rewardPointEntryId,
        idempotencyKey: 'reward-reverse-pending-1',
      });
      assert.equal(reversedPending.status, 'RECORDED');
      assert.equal(reversedPending.entry?.state, RewardPointState.REVERSED);
      assert.equal(reversedPending.summary.reversedPoints, 40);

      const reversedSpendable = reverseRewardPointsForRefund({
        customerId: 'customer-reward-1',
        refundId: 'refund-after-spendable',
        rewardPointEntryId: promoted.entry?.rewardPointEntryId,
        idempotencyKey: 'reward-reverse-spendable-1',
      });
      assert.equal(reversedSpendable.status, 'RECORDED');
      assert.equal(reversedSpendable.entry?.state, RewardPointState.REVERSED);
      assert.equal(reversedSpendable.summary.spendablePoints, 0);
      assert.equal(reversedSpendable.summary.reversedPoints, 140);

      const redeemedSource = grantPendingRewardPoints({
        customerId: 'customer-reward-1',
        sourceType: RewardPointSourceType.CAMPAIGN,
        sourceId: 'campaign-1',
        pointAmount: 25,
        idempotencyKey: 'reward-grant-3',
      });
      const redeemedPromoted = promotePendingRewardPoints({
        customerId: 'customer-reward-1',
        rewardPointEntryId: redeemedSource.entry?.rewardPointEntryId ?? '',
        idempotencyKey: 'reward-promote-3',
      });
      const redeemed = redeemSpendableRewardPoints({
        customerId: 'customer-reward-1',
        rewardPointEntryId: redeemedPromoted.entry?.rewardPointEntryId ?? '',
        idempotencyKey: 'reward-redeem-3',
      });
      assert.equal(redeemed.status, 'RECORDED');
      assert.equal(redeemed.entry?.state, RewardPointState.REDEEMED);

      const redeemedRefund = reverseRewardPointsForRefund({
        customerId: 'customer-reward-1',
        refundId: 'refund-after-redeemed',
        rewardPointEntryId: redeemed.entry?.rewardPointEntryId,
        idempotencyKey: 'reward-reverse-redeemed-1',
      });
      assert.equal(redeemedRefund.status, 'REVERSAL_REQUIRED');
      assert.equal(redeemedRefund.entry?.state, RewardPointState.BLOCKED);
      assert.equal(redeemedRefund.summary.reversalRequired, true);
      assert.ok(redeemedRefund.errors.includes('REDEEMED_REWARD_POINT_REVERSAL_REQUIRED'));

      const duplicateSame = grantPendingRewardPoints({
        customerId: 'customer-reward-1',
        sourceType: RewardPointSourceType.ORDER_DELIVERY,
        sourceId: 'delivery-2',
        orderId: 'order-2',
        orderLineId: 'order-line-2',
        pointAmount: 40,
        idempotencyKey: 'reward-grant-2',
        delivered: true,
        notReturned: true,
      });
      assert.equal(duplicateSame.entry?.rewardPointEntryId, pendingBeforeRefund.entry?.rewardPointEntryId);
      assert.equal(getRewardPointSummary('customer-reward-1').reversedPoints, 140);

      const duplicateConflict = grantPendingRewardPoints({
        customerId: 'customer-reward-1',
        sourceType: RewardPointSourceType.ORDER_DELIVERY,
        sourceId: 'delivery-2',
        orderId: 'order-2',
        orderLineId: 'order-line-2',
        pointAmount: 41,
        idempotencyKey: 'reward-grant-2',
        delivered: true,
        notReturned: true,
      });
      assert.equal(duplicateConflict.status, 'CONFLICT');
      assert.ok(duplicateConflict.errors.includes('DUPLICATE_IDEMPOTENCY_KEY_CONFLICT'));

      const summary = getRewardPointSummary('customer-reward-1');
      assert.equal(summary.cashEquivalent, false);
      assert.equal(summary.payoutEligible, false);
      assert.equal(summary.payoutCreated, false);
      assert.equal(summary.payableCreated, false);
      assert.equal(summary.paidOutCreated, false);
      assert.equal(summary.ledgerCashEntryCreated, false);
      assert.equal(summary.orderStateMutated, false);
      assert.equal(summary.paymentStateMutated, false);
      assert.equal(summary.refundStateMutated, false);

      const eligibility = await checkCustomerRewardEligibility({
        actorId: 'customer-reward-1',
        actorType: 'USER',
        customerStatus: 'ACTIVE',
        eventType: CustomerRewardEventType.PURCHASE_DELIVERED,
        action: CustomerRewardEligibilityAction.EARN_POINTS,
        delivered: true,
        notReturned: true,
      });
      assert.equal(eligibility.allowed, true);

      return {
        result: 'PASS',
        message:
          'reward point lifecycle foundation passed with pending/spendable/redeemed/reversed states, refund reversal guard, idempotency, and no cash/payout/owner mutation boundary crossing.',
      };
    } catch (error) {
      return { result: 'FAIL', message: (error as Error).message };
    } finally {
      resetRewardPointLifecycleForTesting();
    }
  },
};
