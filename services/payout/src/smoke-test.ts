import {
  createPayoutItemsFromSettlement,
  createPayoutBatch,
  applyPayoutItemAction,
  applyPayoutBatchAction,
  getPayoutItem,
  getPayoutBatch
} from './payout';
import * as settlement from '@hx/settlement';
import * as persistence from '@hx/persistence';

jest.mock('@hx/settlement', () => ({
  getSettlementLine: jest.fn()
}));

jest.mock('@hx/persistence', () => ({
  getAuditEventRepositories: jest.fn(() => ({
    outbox: {
      appendOutboxEvent: jest.fn(() => Promise.resolve({}))
    }
  }))
}));

async function runTests() {
  const mockGetSettlementLine = settlement.getSettlementLine as jest.Mock;

  console.log('Starting Payout Foundation Smoke Test...');

  // 1. Missing settlementLineIds
  const res1 = await createPayoutItemsFromSettlement({ settlementLineIds: [] });
  if (!res1.errors?.includes('PAYOUT_SETTLEMENT_LINE_IDS_REQUIRED')) throw new Error('Test 1 Failed');
  console.log('1. Missing settlement line ids OK');

  // 2. Nonexistent settlement line
  mockGetSettlementLine.mockResolvedValueOnce(null);
  const res2 = await createPayoutItemsFromSettlement({ settlementLineIds: ['missing_1'] });
  if (!res2.errors?.some(e => e.includes('PAYOUT_SETTLEMENT_LINE_NOT_FOUND: missing_1'))) throw new Error('Test 2 Failed');
  console.log('2. Nonexistent settlement line OK');

  // 3. Eligible settlement line
  mockGetSettlementLine.mockResolvedValueOnce({
    settlementLine: {
      settlementLineId: 'stl_1',
      status: 'SETTLED',
      partyType: 'CREATOR',
      partyId: 'creator_1',
      orderId: 'ord_1',
      orderLineId: 'orl_1',
      amountSummary: { netAmount: 1000, currency: 'TRY', grossAmount: 1100 },
      impactSummary: {
        payoutBlocked: false,
        riskHoldActive: false,
        refundImpactPending: false,
        financeCorrectionPending: false
      }
    }
  });

  const res3 = await createPayoutItemsFromSettlement({ settlementLineIds: ['stl_1'], idempotencyKey: 'idemp1' });
  if (!res3.success || !res3.payoutItems || res3.payoutItems.length === 0) throw new Error('Test 3 Failed');
  const pyi1 = res3.payoutItems[0].payoutItemId;
  console.log('3. Eligible item creation OK:', pyi1);

  // 4. BELOW_THRESHOLD
  mockGetSettlementLine.mockResolvedValueOnce({
    settlementLine: {
      settlementLineId: 'stl_2',
      status: 'SETTLED',
      partyType: 'CREATOR',
      partyId: 'creator_1',
      orderId: 'ord_2',
      orderLineId: 'orl_2',
      amountSummary: { netAmount: 50, currency: 'TRY', grossAmount: 50 },
      impactSummary: { payoutBlocked: false, riskHoldActive: false, refundImpactPending: false, financeCorrectionPending: false }
    }
  });
  const res4 = await createPayoutItemsFromSettlement({ settlementLineIds: ['stl_2'], minimumThresholdAmount: 100 });
  if (res4.payoutItems![0].status !== 'BELOW_THRESHOLD') throw new Error('Test 4 Failed');
  console.log('4. BELOW_THRESHOLD OK');

  // 5. ON_HOLD + RISK_REVIEW_OPEN
  mockGetSettlementLine.mockResolvedValueOnce({
    settlementLine: {
      settlementLineId: 'stl_3',
      status: 'SETTLED',
      partyType: 'CREATOR',
      partyId: 'creator_1',
      orderId: 'ord_3',
      orderLineId: 'orl_3',
      amountSummary: { netAmount: 200, currency: 'TRY', grossAmount: 200 },
      impactSummary: { payoutBlocked: false, riskHoldActive: true, refundImpactPending: false, financeCorrectionPending: false }
    }
  });
  const res5 = await createPayoutItemsFromSettlement({ settlementLineIds: ['stl_3'] });
  if (res5.payoutItems![0].status !== 'ON_HOLD' || res5.payoutItems![0].holdReasonCode !== 'RISK_REVIEW_OPEN') throw new Error('Test 5 Failed');
  const pyi_hold = res5.payoutItems![0].payoutItemId;
  console.log('5. RISK_REVIEW_OPEN OK');

  // 6. Idempotency duplicate check
  const res6 = await createPayoutItemsFromSettlement({ settlementLineIds: ['stl_1'], idempotencyKey: 'idemp1' });
  if (res6.payoutItems![0].payoutItemId !== pyi1) throw new Error('Test 6 Failed');
  console.log('6. Idempotency OK');

  // 7 & 8. Batch with eligible and hold
  const res7 = await createPayoutBatch({ payoutItemIds: [pyi1, pyi_hold], batchType: 'CREATOR' });
  if (!res7.success || !res7.batchId) throw new Error('Test 7 Failed');
  const pyb1 = res7.batchId;
  const pyi1_updated = await getPayoutItem({ payoutItemId: pyi1 });
  if (pyi1_updated.payoutItem.status !== 'BATCHED') throw new Error('Test 7.1 Failed');
  const pyi_hold_updated = await getPayoutItem({ payoutItemId: pyi_hold });
  if (pyi_hold_updated.payoutItem.status !== 'ON_HOLD') throw new Error('Test 8 Failed');
  console.log('7 & 8. Batch OK (only ELIGIBLE included)');

  // 9. applyPayoutItemAction PLACE_HOLD
  const res9 = await applyPayoutItemAction({ payoutItemId: pyi1, action: 'PLACE_HOLD', actorId: 'admin1', reasonCode: 'MANUAL_HOLD' });
  if (res9.payoutItem!.status !== 'ON_HOLD') throw new Error('Test 9 Failed');
  console.log('9. Item action PLACE_HOLD OK');

  // 10. applyPayoutBatchAction APPROVED
  const res10 = await applyPayoutBatchAction({ batchId: pyb1, targetStatus: 'APPROVED', actorId: 'admin1' });
  if (res10.batch!.status !== 'APPROVED') throw new Error('Test 10 Failed');
  console.log('10. Batch action APPROVED OK');

  // 11 & 12. Boundary flags & Provider payout check
  const b = await getPayoutBatch({ batchId: pyb1 });
  if (
    !b.batch.foundationOnly ||
    b.batch.actualProviderPayoutPerformed ||
    b.batch.paymentInstructionCreated
  ) throw new Error('Test 11/12 Failed');
  console.log('11 & 12. Boundary checks OK');

  // 13. Static checks
  const fs = require('fs');
  const path = require('path');
  const srcCode = fs.readFileSync(path.join(__dirname, 'payout.ts'), 'utf8');
  const forbidden = [
    'initiatePayment', 'simulatePaymentSuccess', 'simulateProviderRefund',
    'createOrderFromPayment', 'createRefundFromCancelReturn', 'processRefund',
    'transitionRefundState', 'createCancelRequest', 'createReturnRequest',
    'transitionCancelReturnRequest', 'createFinanceCorrection',
    'createRiskSignal', 'createSettlementFromOrder', 'applySettlementAction',
    'providerPayout(', 'bankTransfer('
  ];
  for (const f of forbidden) {
    if (srcCode.includes(f)) {
      throw new Error(`13. Forbidden import/string found: ${f}`);
    }
  }
  console.log('13. Static checks OK');

  // 14. Repo mode
  const repoFile = fs.readFileSync(path.join(__dirname, 'repository/index.ts'), 'utf8');
  if (repoFile.includes("'in-memory'")) {
     if (!repoFile.includes("import { InMemoryPayoutRepository } from './in-memory'")) {
        throw new Error('14. String in-memory used inappropriately');
     }
  }
  console.log('14. Repo check OK');

  console.log('ALL TESTS PASSED');
}

test('Payout Foundation Smoke Test', async () => {
  await runTests();
});
