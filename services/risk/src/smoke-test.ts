import { createRiskSignal, createRiskCase, reviewRiskCase, getRiskCase, listRiskCases } from './index';

async function run() {
  console.log('[Smoke Test] Risk Foundation starting...');

  // 1. Create Risk Signal
  const signalKey = 'idemp_sig_1';
  const sigRes1 = await createRiskSignal({
    target: { targetId: 'user_123', targetType: 'ACCOUNT' },
    type: 'ACCOUNT_VELOCITY',
    level: 'HIGH',
    source: 'SYSTEM_RULE',
    reasonCode: 'SUSPICIOUS_VELOCITY',
    idempotencyKey: signalKey,
  });
  console.log('Signal 1 created:', sigRes1.signalId);

  // 2. Duplicate Signal (idempotency)
  const sigRes2 = await createRiskSignal({
    target: { targetId: 'user_123', targetType: 'ACCOUNT' },
    type: 'ACCOUNT_VELOCITY',
    level: 'HIGH',
    source: 'SYSTEM_RULE',
    reasonCode: 'SUSPICIOUS_VELOCITY',
    idempotencyKey: signalKey,
  });
  console.log('Signal 2 (duplicate) created:', sigRes2.signalId);
  if (sigRes1.signalId !== sigRes2.signalId) throw new Error('Idempotency failed for signal');

  // 3. Create Risk Case
  const caseKey = 'idemp_case_1';
  const caseRes1 = await createRiskCase({
    target: { targetId: 'order_456', targetType: 'ORDER' },
    level: 'HIGH',
    source: 'PAYMENT_SIGNAL',
    reasonCode: 'PAYMENT_ANOMALY',
    signals: [sigRes1.signalId!],
    idempotencyKey: caseKey,
  });
  console.log('Case created:', caseRes1.caseId);

  // 4. Review Risk Case
  await reviewRiskCase({
    caseId: caseRes1.caseId!,
    decision: 'RECOMMEND_HOLD',
    notes: 'Advisory hold recommended due to high velocity',
    reviewerId: 'admin_1',
  });
  console.log('Case reviewed with RECOMMEND_HOLD');

  // 5. Get and Verify Flags
  const getRes = await getRiskCase({ caseId: caseRes1.caseId! });
  console.log('Case retrieved:', getRes.case.caseId, 'Status:', getRes.case.status);
  
  if (
    getRes.case.paymentTruthMutated ||
    getRes.case.orderTruthMutated ||
    getRes.case.refundTruthMutated ||
    getRes.case.targetTruthMutated ||
    getRes.case.financeTruthMutated ||
    getRes.case.moderationTruthMutated
  ) {
    throw new Error('Risk case mutated truth unexpectedly!');
  }
  if (!getRes.case.riskTruthMutated) {
    throw new Error('Risk truth mutated flag not set to true');
  }

  // 6. List Cases
  const listRes = await listRiskCases({ targetType: 'ORDER' });
  console.log('List cases count:', listRes.total);
  if (listRes.total === 0) throw new Error('List returned 0 cases');

  console.log('[Smoke Test] Risk Foundation PASS');
}

run().catch(err => {
  console.error('[Smoke Test] FAIL:', err);
  process.exit(1);
});
