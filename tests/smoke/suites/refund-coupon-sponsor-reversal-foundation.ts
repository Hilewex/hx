import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { CheckoutDiscountLineAllocation } from '../../../packages/contracts/src';
import {
  calculateRefundCouponSponsorReversal,
  resetRefundCouponSponsorReversalGuardForTesting,
} from '../../../services/refund/src';
import { SmokeResult, SmokeRunner } from '../types';

function allocation(
  sponsorType: 'PLATFORM' | 'CREATOR' | 'SUPPLIER' | 'BRAND',
  allocatedAmount: number,
  lineId = `line-${randomUUID()}`,
): CheckoutDiscountLineAllocation {
  return {
    allocationId: `dla_${randomUUID()}`,
    discountSnapshotId: `dds_${randomUUID()}`,
    discountKind: 'COUPON',
    sponsorType,
    sponsorId: sponsorType === 'PLATFORM' ? 'platform:hx' : `${sponsorType.toLowerCase()}:foundation`,
    lineId,
    cartLineId: lineId,
    orderLineId: `ol-${lineId}`,
    allocatedAmount,
    currency: 'TRY',
    allocationMethod: 'SINGLE_LINE',
    createdAt: new Date().toISOString(),
  };
}

export const refundCouponSponsorReversalFoundationSmoke: SmokeRunner = {
  name: 'refund-coupon-sponsor-reversal-foundation',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    try {
      resetRefundCouponSponsorReversalGuardForTesting();

      const platformAllocation = allocation('PLATFORM', 10);
      const platform = calculateRefundCouponSponsorReversal({
        refundId: 'refund-platform',
        idempotencyKey: 'refund-platform-reversal',
        refundLines: [{
          refundLineId: 'refund-line-platform',
          lineId: platformAllocation.lineId,
          cartLineId: platformAllocation.cartLineId,
          orderLineId: platformAllocation.orderLineId,
          currency: 'TRY',
        }],
        discountLineAllocations: [platformAllocation],
      });
      assert.equal(platform.status, 'CALCULATED');
      assert.equal(platform.reversals.length, 1);
      assert.equal(platform.summary.platformReversalAmount, 10);
      assert.equal(platform.summary.totalReversalAmount, 10);
      assert.equal(platform.summary.settlementAdjustedCreated, false);
      assert.equal(platform.summary.payoutReversalCreated, false);
      assert.equal(platform.summary.ledgerEntryCreated, false);
      assert.equal(platform.summary.orderStateMutated, false);
      assert.equal(platform.summary.paymentStateMutated, false);
      assert.equal(platform.summary.refundStateMutated, false);

      const creatorAllocation = allocation('CREATOR', 30);
      const creator = calculateRefundCouponSponsorReversal({
        refundId: 'refund-creator',
        idempotencyKey: 'refund-creator-reversal',
        refundLines: [{
          refundLineId: 'refund-line-creator',
          lineId: creatorAllocation.lineId,
          cartLineId: creatorAllocation.cartLineId,
          orderLineId: creatorAllocation.orderLineId,
          refundAmount: 50,
          originalLineAmount: 100,
          currency: 'TRY',
        }],
        discountLineAllocations: [creatorAllocation],
      });
      assert.equal(creator.status, 'CALCULATED');
      assert.equal(creator.summary.creatorReversalAmount, 15);
      assert.equal(creator.summary.totalReversalAmount, 15);
      assert.ok(creator.summary.totalReversalAmount <= creatorAllocation.allocatedAmount);

      const supplier = calculateRefundCouponSponsorReversal({
        refundId: 'refund-supplier',
        idempotencyKey: 'refund-supplier-reversal',
        refundLines: [{ lineId: 'line-supplier', currency: 'TRY' }],
        discountLineAllocations: [allocation('SUPPLIER', 25, 'line-supplier')],
      });
      assert.equal(supplier.status, 'BLOCKED');
      assert.ok(supplier.errors.includes('FIRST_PHASE_REFUND_COUPON_SPONSOR_REVERSAL_UNSUPPORTED'));
      assert.equal(supplier.reversals.length, 0);

      const brand = calculateRefundCouponSponsorReversal({
        refundId: 'refund-brand',
        idempotencyKey: 'refund-brand-reversal',
        refundLines: [{ lineId: 'line-brand', currency: 'TRY' }],
        discountLineAllocations: [allocation('BRAND', 20, 'line-brand')],
      });
      assert.equal(brand.status, 'BLOCKED');
      assert.ok(brand.errors.includes('FIRST_PHASE_REFUND_COUPON_SPONSOR_REVERSAL_UNSUPPORTED'));
      assert.equal(brand.reversals.length, 0);

      const duplicateSame = calculateRefundCouponSponsorReversal({
        refundId: 'refund-platform',
        idempotencyKey: 'refund-platform-reversal',
        refundLines: [{
          refundLineId: 'refund-line-platform',
          lineId: platformAllocation.lineId,
          cartLineId: platformAllocation.cartLineId,
          orderLineId: platformAllocation.orderLineId,
          currency: 'TRY',
        }],
        discountLineAllocations: [platformAllocation],
      });
      assert.equal(duplicateSame.status, 'CALCULATED');
      assert.deepEqual(duplicateSame.reversals, platform.reversals);

      const duplicateConflict = calculateRefundCouponSponsorReversal({
        refundId: 'refund-platform',
        idempotencyKey: 'refund-platform-reversal',
        refundLines: [{
          refundLineId: 'refund-line-platform',
          lineId: platformAllocation.lineId,
          currency: 'TRY',
        }],
        discountLineAllocations: [{ ...platformAllocation, allocatedAmount: 9 }],
      });
      assert.equal(duplicateConflict.status, 'CONFLICT');
      assert.ok(duplicateConflict.errors.includes('DUPLICATE_IDEMPOTENCY_KEY_CONFLICT'));
      assert.equal(duplicateConflict.reversals.length, 0);

      return {
        result: 'PASS',
        message:
          'refund coupon sponsor reversal foundation passed with platform/creator evidence, partial ratio, idempotency guard, and no settlement/payout/ledger mutation.',
      };
    } catch (error) {
      return { result: 'FAIL', message: (error as Error).message };
    } finally {
      resetRefundCouponSponsorReversalGuardForTesting();
    }
  },
};
