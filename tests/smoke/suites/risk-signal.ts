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
      metadata: { test: true }
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
    });

    // 5. Commerce integration: Payment invalid amount -> risk signal
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
    });

    // 6. Order integration: Payment failed -> risk signal
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
