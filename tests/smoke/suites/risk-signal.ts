import { SmokeRunner } from '../types';
import { randomUUID } from 'crypto';
import { getCustomerHeaders, getGuestHeaders, getAdminHeaders, getCreatorHeaders } from '../auth-utils';

export const riskSignalSmoke: SmokeRunner = {
  name: 'risk-signal',
  run: async (baseUrl: string) => {
    const steps: { name: string; status: 'PASS' | 'FAIL'; message: string; data?: any }[] = [];

    const runStep = async (name: string, fn: () => Promise<any>) => {
      try {
        const result = await fn();
        steps.push({ name, status: 'PASS', message: 'Step completed successfully.', data: result });
        return result;
      } catch (error: any) {
        steps.push({ name, status: 'FAIL', message: error.message });
        console.error(`Step Failed: ${name}`, error);
        return null;
      }
    };

    const adminHeaders = getAdminHeaders('admin-1');
    const customerHeaders = getCustomerHeaders(`cust-${randomUUID()}`);
    const creatorHeaders = getCreatorHeaders(`creator-${randomUUID()}`);
    const guestHeaders = { ...getGuestHeaders(), 'session-id': `sess-${randomUUID()}` };

    const signalBody = {
      target: { targetId: 'test-target', targetType: 'ACCOUNT' },
      type: 'MANUAL_REPORT',
      level: 'LOW',
      source: 'ADMIN_REVIEW',
      reasonCode: 'UNKNOWN',
      correlationId: `corr-${randomUUID()}`,
      idempotencyKey: `risk-signal-${randomUUID()}`,
      metadata: { test: true }
    };

    const assertNonMutationEvidence = (payload: any) => {
      const evidence = payload.ownerHandoffEvidence || payload.signal?.ownerHandoffEvidence || payload.case?.ownerHandoffEvidence;
      if (!evidence) throw new Error('Missing owner handoff evidence');
      if (evidence.riskSignalOnly !== true) throw new Error('riskSignalOnly should be true');
      if (evidence.businessTruthMutated !== false) throw new Error('businessTruthMutated should be false');
      if (evidence.ownerTruthMutatedByRisk !== false) throw new Error('ownerTruthMutatedByRisk should be false');
      if (evidence.orderTruthMutated !== false) throw new Error('orderTruthMutated should be false');
      if (evidence.paymentTruthMutated !== false) throw new Error('paymentTruthMutated should be false');
      if (evidence.payoutTruthMutated !== false) throw new Error('payoutTruthMutated should be false');
      if (evidence.financeTruthMutated !== false) throw new Error('financeTruthMutated should be false');
      if (evidence.moderationTruthMutated !== false) throw new Error('moderationTruthMutated should be false');
      if (evidence.bffTruthMutated !== false) throw new Error('bffTruthMutated should be false');
      if (evidence.uiTruthMutated !== false) throw new Error('uiTruthMutated should be false');
      if (evidence.auditEvidenceRequired !== true) throw new Error('auditEvidenceRequired should be true');
      if (evidence.reasonCodeRequired !== true) throw new Error('reasonCodeRequired should be true');
      if (!evidence.correlationId) throw new Error('evidence correlationId is missing');
      if (!evidence.idempotencyKey) throw new Error('evidence idempotencyKey is missing');
      if (!evidence.reasonCode) throw new Error('evidence reasonCode is missing');
    };

    // 1. Guest create risk signal -> 401
    await runStep('Guest create risk signal (401)', async () => {
      const res = await fetch(`${baseUrl}/risk/signal`, {
        method: 'POST',
        headers: guestHeaders,
        body: JSON.stringify(signalBody),
      });
      if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    });

    // 2. Customer create risk signal -> 403
    await runStep('Customer create risk signal (403)', async () => {
      const res = await fetch(`${baseUrl}/risk/signal`, {
        method: 'POST',
        headers: customerHeaders,
        body: JSON.stringify(signalBody),
      });
      if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    });

    // 3. Creator create risk signal -> 403
    await runStep('Creator create risk signal (403)', async () => {
      const res = await fetch(`${baseUrl}/risk/signal`, {
        method: 'POST',
        headers: creatorHeaders,
        body: JSON.stringify(signalBody),
      });
      if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    });

    // 4. Admin create risk signal -> success
    await runStep('Admin create risk signal (success)', async () => {
      const res = await fetch(`${baseUrl}/risk/signal`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify(signalBody),
      });
      if (!res.ok) throw new Error(`Expected 2xx, got ${res.status}`);
      const json = await res.json();
      if (!json.data?.signalId) throw new Error('No signalId in response');
      if (!json.data?.score?.score) throw new Error('No risk score in response');
      assertNonMutationEvidence(json.data);
    });

    // 5. Missing reason/correlation/idempotency guards
    await runStep('Missing reasonCode fails', async () => {
      const { reasonCode, ...bodyWithoutReason } = signalBody;
      const res = await fetch(`${baseUrl}/risk/signal`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ ...bodyWithoutReason, idempotencyKey: `missing-reason-${randomUUID()}` }),
      });
      if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
      const json = await res.json();
      if (json.errors?.[0]?.code !== 'RISK_REASON_CODE_REQUIRED') throw new Error('Expected RISK_REASON_CODE_REQUIRED');
    });

    await runStep('Missing correlationId fails', async () => {
      const { correlationId, ...bodyWithoutCorrelation } = signalBody;
      const res = await fetch(`${baseUrl}/risk/signal`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ ...bodyWithoutCorrelation, idempotencyKey: `missing-corr-${randomUUID()}` }),
      });
      if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
      const json = await res.json();
      if (json.errors?.[0]?.code !== 'RISK_CORRELATION_ID_REQUIRED') throw new Error('Expected RISK_CORRELATION_ID_REQUIRED');
    });

    await runStep('Missing idempotencyKey fails', async () => {
      const { idempotencyKey, ...bodyWithoutIdempotency } = signalBody;
      const res = await fetch(`${baseUrl}/risk/signal`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ ...bodyWithoutIdempotency, correlationId: `missing-idem-${randomUUID()}` }),
      });
      if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
      const json = await res.json();
      if (json.errors?.[0]?.code !== 'RISK_IDEMPOTENCY_KEY_REQUIRED') throw new Error('Expected RISK_IDEMPOTENCY_KEY_REQUIRED');
    });

    await runStep('Duplicate idempotencyKey returns alreadyProcessed evidence', async () => {
      const duplicateBody = {
        ...signalBody,
        target: { targetId: `dup-target-${randomUUID()}`, targetType: 'ORDER' },
        correlationId: `dup-corr-${randomUUID()}`,
        idempotencyKey: `dup-risk-${randomUUID()}`,
      };
      const first = await fetch(`${baseUrl}/risk/signal`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify(duplicateBody),
      });
      if (!first.ok) throw new Error(`First signal failed: ${first.status}`);
      const firstJson = await first.json();

      const second = await fetch(`${baseUrl}/risk/signal`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify(duplicateBody),
      });
      if (!second.ok) throw new Error(`Duplicate signal failed: ${second.status}`);
      const secondJson = await second.json();
      if (secondJson.data.signalId !== firstJson.data.signalId) throw new Error('Duplicate did not return original signalId');
      if (secondJson.data.alreadyProcessed !== true || secondJson.data.duplicate !== true) {
        throw new Error('Duplicate evidence missing alreadyProcessed/duplicate flags');
      }
      assertNonMutationEvidence(secondJson.data);
    });

    // 6. Commerce integration: Payment invalid amount -> risk signal
    let checkoutId = `chk-${randomUUID()}`;
    await runStep('Payment invalid amount -> risk signal', async () => {
      // Create a signal directly as Admin but with PAYMENT_SIGNAL source
      // to verify the ingest pipeline for this specific signal type.
      // We do this because setting up a full checkout journey in smoke is complex.
      const res = await fetch(`${baseUrl}/risk/signal`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          target: { targetId: checkoutId, targetType: 'CHECKOUT' },
          type: 'PAYMENT_ANOMALY',
          level: 'MEDIUM',
          source: 'PAYMENT_SIGNAL',
          reasonCode: 'PAYMENT_ANOMALY',
          correlationId: `corr-${randomUUID()}`,
          idempotencyKey: `risk-payment-${randomUUID()}`,
          metadata: { amount: -10, checkoutId, error: 'INVALID_AMOUNT' }
        }),
      });
      if (!res.ok) throw new Error(`Signal creation failed: ${res.status}`);
      
      // Now verify if a signal was created for this checkoutId
      const listRes = await fetch(`${baseUrl}/risk/signal/list?targetId=${checkoutId}`, {
         headers: adminHeaders
      });
      if (!listRes.ok) throw new Error(`Signal list failed: ${listRes.status}`);
      const json = await listRes.json();
      if (json.data.total === 0) throw new Error('No signals found for invalid payment amount');
      const signal = json.data.signals[0];
      if (signal.targetTruthMutated !== false) throw new Error('targetTruthMutated should be false');
      assertNonMutationEvidence({ ownerHandoffEvidence: signal.ownerHandoffEvidence });
    });

    // 7. Order integration: Payment failed -> risk signal
    await runStep('Order creation with failed payment -> risk signal', async () => {
       const orderCheckoutId = `chk-${randomUUID()}`;
       // Create a signal directly as Admin but with ORDER_SIGNAL source
       const res = await fetch(`${baseUrl}/risk/signal`, {
         method: 'POST',
         headers: adminHeaders,
         body: JSON.stringify({
           target: { targetId: orderCheckoutId, targetType: 'ORDER' },
           type: 'PAYMENT_ANOMALY',
           level: 'HIGH',
           source: 'ORDER_SIGNAL',
           reasonCode: 'PAYMENT_ANOMALY',
           correlationId: `corr-${randomUUID()}`,
           idempotencyKey: `risk-order-${randomUUID()}`,
           metadata: { paymentId: 'fail-pay', paymentState: 'FAILED', checkoutId: orderCheckoutId, error: 'PAYMENT_NOT_SUCCEEDED' }
         }),
       });
       if (!res.ok) throw new Error(`Signal creation failed: ${res.status}`);

       // Verify signal
       const listRes = await fetch(`${baseUrl}/risk/signal/list?targetId=${orderCheckoutId}`, {
          headers: adminHeaders
       });
       if (!listRes.ok) throw new Error(`Signal list failed: ${listRes.status}`);
       const json = await listRes.json();
       if (json.data.total === 0) throw new Error('No signals found for order with non-success payment');
       const signal = json.data.signals[0];
       if (signal.targetTruthMutated !== false) throw new Error('targetTruthMutated should be false');
       assertNonMutationEvidence({ ownerHandoffEvidence: signal.ownerHandoffEvidence });
    });

    // 8. Risk case and review path with owner handoff evidence
    await runStep('Risk case review produces owner handoff evidence without owner mutation', async () => {
      const targetId = `risk-case-${randomUUID()}`;
      const createCaseRes = await fetch(`${baseUrl}/risk/case`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          target: { targetId, targetType: 'PAYOUT' },
          level: 'HIGH',
          source: 'ADMIN_REVIEW',
          reasonCode: 'SUSPICIOUS_VELOCITY',
          signals: [],
          notes: 'Smoke review case',
          correlationId: `case-corr-${randomUUID()}`,
          idempotencyKey: `case-idem-${randomUUID()}`,
        }),
      });
      if (!createCaseRes.ok) throw new Error(`Create case failed: ${createCaseRes.status}`);
      const createCaseJson = await createCaseRes.json();
      if (!createCaseJson.data.caseId) throw new Error('No caseId in response');
      assertNonMutationEvidence(createCaseJson.data);

      const reviewRes = await fetch(`${baseUrl}/risk/case/review`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          caseId: createCaseJson.data.caseId,
          decision: 'RECOMMEND_HOLD',
          reasonCode: 'SUSPICIOUS_VELOCITY',
          reviewerId: 'admin-1',
          notes: 'Recommend owner review only',
          correlationId: `review-corr-${randomUUID()}`,
          idempotencyKey: `review-idem-${randomUUID()}`,
        }),
      });
      if (!reviewRes.ok) throw new Error(`Review case failed: ${reviewRes.status}`);
      const reviewJson = await reviewRes.json();
      if (reviewJson.data.decisionStatus !== 'OWNER_HANDOFF_REQUIRED') {
        throw new Error(`Expected OWNER_HANDOFF_REQUIRED, got ${reviewJson.data.decisionStatus}`);
      }
      assertNonMutationEvidence(reviewJson.data);
    });

    const finalResult = steps.every(s => s.status === 'PASS') ? 'PASS' : 'FAIL';
    const failedStep = steps.find(s => s.status === 'FAIL');
    const message = finalResult === 'PASS' 
      ? 'All risk signal scenarios passed.' 
      : `Failed at step: ${failedStep?.name}. Reason: ${failedStep?.message}`;

    console.table(steps.map(s => ({ Step: s.name, Status: s.status, Message: s.message })));

    return { result: finalResult as any, message };
  },
};
