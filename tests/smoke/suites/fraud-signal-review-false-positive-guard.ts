import { randomUUID } from 'crypto';
import { getAdminHeaders, getCreatorHeaders, getCustomerHeaders, getGuestHeaders, getInternalServiceHeaders } from '../auth-utils';
import { SmokeRunner } from '../types';

export const fraudSignalReviewFalsePositiveGuardSmoke: SmokeRunner = {
  name: 'fraud-signal-review-false-positive-guard',
  run: async (baseUrl: string) => {
    const steps: { name: string; status: 'PASS' | 'FAIL'; message: string }[] = [];

    const runStep = async (name: string, fn: () => Promise<void>) => {
      try {
        await fn();
        steps.push({ name, status: 'PASS', message: 'Step completed successfully.' });
      } catch (error: any) {
        steps.push({ name, status: 'FAIL', message: error.message });
        console.error(`Step Failed: ${name}`, error);
      }
    };

    const adminHeaders = getAdminHeaders('admin-1');
    const internalHeaders = getInternalServiceHeaders('fraud-owner-internal-1');
    const customerHeaders = getCustomerHeaders(`cust-${randomUUID()}`);
    const creatorHeaders = getCreatorHeaders(`creator-${randomUUID()}`);
    const guestHeaders = { ...getGuestHeaders(), 'session-id': `sess-${randomUUID()}` };

    const signalBody = {
      target: { targetId: `fraud-target-${randomUUID()}`, targetType: 'PAYMENT' },
      signalType: 'PAYMENT_FRAUD_PATTERN',
      severity: 'HIGH',
      source: 'PAYMENT_SIGNAL',
      reasonCode: 'PAYMENT_FRAUD',
      correlationId: `fraud-corr-${randomUUID()}`,
      idempotencyKey: `fraud-signal-${randomUUID()}`,
      riskSignalReferenceId: `rsig_${randomUUID()}`,
      metadata: { smoke: true }
    };

    const assertNonMutationEvidence = (payload: any) => {
      const evidence = payload.ownerHandoffEvidence;
      if (!evidence) throw new Error('Missing fraud owner handoff evidence');
      if (evidence.fraudSignalOnly !== true) throw new Error('fraudSignalOnly should be true');
      if (evidence.businessTruthMutated !== false) throw new Error('businessTruthMutated should be false');
      if (evidence.ownerTruthMutatedByFraud !== false) throw new Error('ownerTruthMutatedByFraud should be false');
      if (evidence.orderTruthMutated !== false) throw new Error('orderTruthMutated should be false');
      if (evidence.paymentTruthMutated !== false) throw new Error('paymentTruthMutated should be false');
      if (evidence.payoutTruthMutated !== false) throw new Error('payoutTruthMutated should be false');
      if (evidence.financeTruthMutated !== false) throw new Error('financeTruthMutated should be false');
      if (evidence.moderationTruthMutated !== false) throw new Error('moderationTruthMutated should be false');
      if (evidence.bffTruthMutated !== false) throw new Error('bffTruthMutated should be false');
      if (evidence.uiTruthMutated !== false) throw new Error('uiTruthMutated should be false');
      if (evidence.falsePositiveReviewAvailable !== true) throw new Error('falsePositiveReviewAvailable should be true');
      if (evidence.auditEvidenceRequired !== true) throw new Error('auditEvidenceRequired should be true');
      if (evidence.reasonCodeRequired !== true) throw new Error('reasonCodeRequired should be true');
      if (!evidence.correlationId) throw new Error('evidence correlationId is missing');
      if (!evidence.idempotencyKey) throw new Error('evidence idempotencyKey is missing');
      if (!evidence.reasonCode) throw new Error('evidence reasonCode is missing');
      if (payload.auditEvidence?.businessTruthMutated === true) {
        throw new Error('Audit evidence must not be business mutation');
      }
    };

    await runStep('Guest create fraud signal (401)', async () => {
      const res = await fetch(`${baseUrl}/fraud/signal`, {
        method: 'POST',
        headers: guestHeaders,
        body: JSON.stringify(signalBody),
      });
      if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    });

    await runStep('Customer create fraud signal (403)', async () => {
      const res = await fetch(`${baseUrl}/fraud/signal`, {
        method: 'POST',
        headers: customerHeaders,
        body: JSON.stringify(signalBody),
      });
      if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    });

    await runStep('Creator create fraud signal (403)', async () => {
      const res = await fetch(`${baseUrl}/fraud/signal`, {
        method: 'POST',
        headers: creatorHeaders,
        body: JSON.stringify(signalBody),
      });
      if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    });

    await runStep('Admin create fraud signal with owner handoff evidence', async () => {
      const res = await fetch(`${baseUrl}/fraud/signal`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify(signalBody),
      });
      if (!res.ok) throw new Error(`Expected 2xx, got ${res.status}`);
      const json = await res.json();
      if (!json.data?.fraudSignalId) throw new Error('No fraudSignalId in response');
      if (json.data.decisionStatus !== 'FRAUD_OWNER_HANDOFF_REQUIRED') {
        throw new Error(`Expected FRAUD_OWNER_HANDOFF_REQUIRED, got ${json.data.decisionStatus}`);
      }
      assertNonMutationEvidence(json.data);
    });

    await runStep('Missing reasonCode fails', async () => {
      const { reasonCode, ...bodyWithoutReason } = signalBody;
      const res = await fetch(`${baseUrl}/fraud/signal`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ ...bodyWithoutReason, idempotencyKey: `missing-reason-${randomUUID()}` }),
      });
      if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
      const json = await res.json();
      if (json.errors?.[0]?.code !== 'FRAUD_REASON_CODE_REQUIRED') throw new Error('Expected FRAUD_REASON_CODE_REQUIRED');
    });

    await runStep('Missing correlationId fails', async () => {
      const { correlationId, ...bodyWithoutCorrelation } = signalBody;
      const res = await fetch(`${baseUrl}/fraud/signal`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ ...bodyWithoutCorrelation, idempotencyKey: `missing-corr-${randomUUID()}` }),
      });
      if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
      const json = await res.json();
      if (json.errors?.[0]?.code !== 'FRAUD_CORRELATION_ID_REQUIRED') throw new Error('Expected FRAUD_CORRELATION_ID_REQUIRED');
    });

    await runStep('Missing idempotencyKey fails', async () => {
      const { idempotencyKey, ...bodyWithoutIdempotency } = signalBody;
      const res = await fetch(`${baseUrl}/fraud/signal`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ ...bodyWithoutIdempotency, correlationId: `missing-idem-${randomUUID()}` }),
      });
      if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
      const json = await res.json();
      if (json.errors?.[0]?.code !== 'FRAUD_IDEMPOTENCY_KEY_REQUIRED') throw new Error('Expected FRAUD_IDEMPOTENCY_KEY_REQUIRED');
    });

    await runStep('Duplicate idempotencyKey returns alreadyProcessed evidence', async () => {
      const duplicateBody = {
        ...signalBody,
        target: { targetId: `dup-fraud-${randomUUID()}`, targetType: 'ORDER' },
        correlationId: `dup-fraud-corr-${randomUUID()}`,
        idempotencyKey: `dup-fraud-${randomUUID()}`,
      };
      const first = await fetch(`${baseUrl}/fraud/signal`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify(duplicateBody),
      });
      if (!first.ok) throw new Error(`First fraud signal failed: ${first.status}`);
      const firstJson = await first.json();

      const second = await fetch(`${baseUrl}/fraud/signal`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify(duplicateBody),
      });
      if (!second.ok) throw new Error(`Duplicate fraud signal failed: ${second.status}`);
      const secondJson = await second.json();
      if (secondJson.data.fraudSignalId !== firstJson.data.fraudSignalId) {
        throw new Error('Duplicate did not return original fraudSignalId');
      }
      if (secondJson.data.alreadyProcessed !== true || secondJson.data.duplicate !== true) {
        throw new Error('Duplicate evidence missing alreadyProcessed/duplicate flags');
      }
      assertNonMutationEvidence(secondJson.data);
    });

    let fraudCaseId = '';
    await runStep('Fraud case creation produces review evidence without owner mutation', async () => {
      const res = await fetch(`${baseUrl}/fraud/case`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          target: { targetId: `payout-${randomUUID()}`, targetType: 'PAYOUT' },
          signalType: 'PAYOUT_ABUSE_PATTERN',
          severity: 'HIGH',
          source: 'PAYOUT_SIGNAL',
          reasonCode: 'PAYOUT_ABUSE',
          correlationId: `case-corr-${randomUUID()}`,
          idempotencyKey: `case-idem-${randomUUID()}`,
          fraudSignals: [],
          riskSignalReferenceId: `rsig_${randomUUID()}`,
          notes: 'Smoke fraud case'
        }),
      });
      if (!res.ok) throw new Error(`Create fraud case failed: ${res.status}`);
      const json = await res.json();
      if (!json.data?.fraudCaseId) throw new Error('No fraudCaseId in response');
      fraudCaseId = json.data.fraudCaseId;
      if (json.data.decisionStatus !== 'FRAUD_REVIEW_REQUIRED') {
        throw new Error(`Expected FRAUD_REVIEW_REQUIRED, got ${json.data.decisionStatus}`);
      }
      assertNonMutationEvidence(json.data);
    });

    await runStep('Fraud legacy review is internal-only', async () => {
      const adminRes = await fetch(`${baseUrl}/fraud/review`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          fraudCaseId,
          decision: 'FRAUD_RECOMMEND_OWNER_ACTION',
          reviewerId: 'admin-1',
          reasonCode: 'PAYOUT_ABUSE',
          correlationId: `review-corr-${randomUUID()}`,
          idempotencyKey: `review-idem-${randomUUID()}`,
          notes: 'Recommend owner action only'
        }),
      });
      if (adminRes.status !== 403) throw new Error(`Admin fraud review should be internal-only 403, got ${adminRes.status}`);

      const res = await fetch(`${baseUrl}/fraud/review`, {
        method: 'POST',
        headers: internalHeaders,
        body: JSON.stringify({
          fraudCaseId,
          decision: 'FRAUD_RECOMMEND_OWNER_ACTION',
          reviewerId: 'fraud-owner-internal-1',
          reasonCode: 'PAYOUT_ABUSE',
          correlationId: `review-internal-corr-${randomUUID()}`,
          idempotencyKey: `review-internal-idem-${randomUUID()}`,
          notes: 'Internal owner-domain fraud review only'
        }),
      });
      if (!res.ok) throw new Error(`Review fraud case failed: ${res.status}`);
      const json = await res.json();
      if (json.data.decisionStatus !== 'FRAUD_OWNER_HANDOFF_REQUIRED') {
        throw new Error(`Expected FRAUD_OWNER_HANDOFF_REQUIRED, got ${json.data.decisionStatus}`);
      }
      if (json.data.routeClassification !== 'owner-domain internal route') {
        throw new Error('Internal fraud review missing owner-domain route classification');
      }
      assertNonMutationEvidence(json.data);
    });

    await runStep('False-positive review creates evidence without owner restore', async () => {
      const res = await fetch(`${baseUrl}/fraud/false-positive/review`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          fraudCaseId,
          requestedByActorId: 'admin-1',
          reasonCode: 'FALSE_POSITIVE_APPEAL',
          correlationId: `fp-corr-${randomUUID()}`,
          idempotencyKey: `fp-idem-${randomUUID()}`,
          notes: 'False-positive review request only'
        }),
      });
      if (!res.ok) throw new Error(`False-positive review failed: ${res.status}`);
      const json = await res.json();
      if (!json.data.falsePositiveReviewId) throw new Error('No falsePositiveReviewId in response');
      if (json.data.decisionStatus !== 'FRAUD_FALSE_POSITIVE_REVIEW_REQUIRED') {
        throw new Error(`Expected FRAUD_FALSE_POSITIVE_REVIEW_REQUIRED, got ${json.data.decisionStatus}`);
      }
      if (json.data.auditEvidence?.ownerTruthRestoredByFraud !== false) {
        throw new Error('False-positive review must not restore owner truth');
      }
      assertNonMutationEvidence(json.data);
    });

    const finalResult = steps.every(s => s.status === 'PASS') ? 'PASS' : 'FAIL';
    const failedStep = steps.find(s => s.status === 'FAIL');
    const message = finalResult === 'PASS'
      ? 'All fraud signal/review/false-positive guard scenarios passed.'
      : `Failed at step: ${failedStep?.name}. Reason: ${failedStep?.message}`;

    console.table(steps.map(s => ({ Step: s.name, Status: s.status, Message: s.message })));

    return { result: finalResult as any, message };
  },
};
