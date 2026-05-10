import { calculateSettlement, resetSettlementCalculationGuardForTesting } from '@hx/settlement';
import { SmokeRunner, SmokeResult } from '../types';

export const creatorMarginSettlementFoundationSmoke: SmokeRunner = {
  name: 'creator-margin-settlement-foundation',
  run: async (): Promise<{ result: SmokeResult; message?: string }> => {
    try {
      resetSettlementCalculationGuardForTesting();

      const valid = await calculateSettlement({
        idempotencyKey: 'creator-margin-settlement-smoke-1',
        sourceType: 'ORDER_LINE',
        sourceId: 'creator-order-line-1',
        currency: 'TRY',
        grossAmount: 1500,
        platformCommissionRate: 0.1,
        selectedSalePrice: 1500,
        poolBasePriceAmount: 1200,
        poolBasePriceSourceId: 'pool-base-price-snapshot-1',
        priceSelectionId: 'price-selection-1',
        commercialProductId: 'commercial-product-1',
        supplierId: 'supplier-1',
        creatorId: 'creator-1',
        creatorStoreId: 'creator-store-1',
        brandId: 'brand-unsupported-1',
        couponSponsorType: 'PLATFORM',
        couponSponsorId: 'coupon-unsupported-1',
      });

      if (valid.status !== 'CALCULATED') {
        return { result: 'FAIL', message: `Expected CALCULATED, got ${valid.status}` };
      }
      if (valid.creatorMarginAmount !== 300 || valid.creatorShareAmount !== 300) {
        return { result: 'FAIL', message: 'Creator margin was not selectedSalePrice - poolBasePriceAmount' };
      }
      if (!valid.lines.some((line) => line.type === 'CREATOR_MARGIN' && line.amount === 300)) {
        return { result: 'FAIL', message: 'CREATOR_MARGIN line was not created' };
      }
      if (valid.limitationFlags?.includes('CREATOR_SHARE_NOT_CALCULATED')) {
        return { result: 'FAIL', message: 'Creator share still reported as not calculated' };
      }
      if (
        !valid.limitationFlags?.includes('BRAND_SHARE_NOT_CALCULATED') ||
        !valid.limitationFlags?.includes('COUPON_SPONSOR_IMPACT_NOT_CALCULATED') ||
        valid.brandShareAmount !== 0
      ) {
        return { result: 'FAIL', message: 'Brand/coupon first phase limitations were not visible' };
      }
      if (valid.summary.ledgerEntryCreated || valid.summary.payoutCreated || valid.summary.payableCreated || valid.summary.paidOutCreated) {
        return { result: 'FAIL', message: 'Settlement calculation created ledger, payout, payable, or paid_out state' };
      }
      if (valid.summary.orderStateMutated || valid.summary.paymentStateMutated || valid.summary.refundStateMutated) {
        return { result: 'FAIL', message: 'Settlement calculation mutated owner state' };
      }
      if ('supplierBasePriceAmount' in valid || 'supplierBasePriceSnapshot' in valid) {
        return { result: 'FAIL', message: 'Supplier base price leaked in settlement calculation result' };
      }

      const belowPoolBase = await calculateSettlement({
        idempotencyKey: 'creator-margin-settlement-smoke-2',
        sourceType: 'ORDER_LINE',
        sourceId: 'creator-order-line-2',
        currency: 'TRY',
        grossAmount: 1100,
        platformCommissionRate: 0.1,
        selectedSalePrice: 1100,
        poolBasePriceAmount: 1200,
        supplierId: 'supplier-1',
        creatorId: 'creator-1',
      });

      if (belowPoolBase.status !== 'BLOCKED' || !belowPoolBase.errors?.includes('SETTLEMENT_CREATOR_MARGIN_NEGATIVE')) {
        return { result: 'FAIL', message: 'selectedSalePrice below poolBasePriceAmount was not blocked' };
      }

      const zeroMargin = await calculateSettlement({
        idempotencyKey: 'creator-margin-settlement-smoke-3',
        sourceType: 'ORDER_LINE',
        sourceId: 'creator-order-line-3',
        currency: 'TRY',
        grossAmount: 1200,
        platformCommissionRate: 0.1,
        selectedSalePrice: 1200,
        poolBasePriceAmount: 1200,
        supplierId: 'supplier-1',
        creatorId: 'creator-1',
      });

      if (zeroMargin.status !== 'CALCULATED' || zeroMargin.creatorMarginAmount !== 0) {
        return { result: 'FAIL', message: 'Zero creator margin was not safely accepted' };
      }

      return { result: 'PASS', message: 'Creator margin settlement foundation smoke passed.' };
    } catch (error: any) {
      return { result: 'FAIL', message: error.message };
    }
  },
};
