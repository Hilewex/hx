import { SmokeRunner } from '../types';
import { randomUUID } from 'crypto';
import { getCustomerHeaders, getGuestHeaders, getAdminHeaders, getCreatorHeaders } from '../auth-utils';

export const commercePermissionSmoke: SmokeRunner = {
  name: 'commerce-permission',
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

    const guestSessionHeader = { 'session-id': `sess-${randomUUID()}` };
    const guestHeaders = { ...getGuestHeaders(), ...guestSessionHeader };

    const customerA = `cust-A-${randomUUID()}`;
    const customerB = `cust-B-${randomUUID()}`;
    const headersA = getCustomerHeaders(customerA);
    const headersB = getCustomerHeaders(customerB);

    const testProductId = 'prod-smoke-1';
    const testVariantId = 'var-smoke-1-a';
    const testStorefrontId = `store-${randomUUID()}`;

    // Helper for add to cart
    const addToCart = async (headers: Record<string, string>) => {
      const res = await fetch(`${baseUrl}/cart/items`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ productId: testProductId, variantId: testVariantId, quantity: 1, storefrontId: testStorefrontId }),
      });
      if (!res.ok) throw new Error(`Add to cart failed: ${res.status}`);
      const json = await res.json();
      return json.data?.context?.actorId; // Context actorId
    };

    const startCheckout = async (headers: Record<string, string>) => {
      const res = await fetch(`${baseUrl}/checkout/start`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) throw new Error(`Checkout start failed: ${res.status}`);
      const json = await res.json();
      return json.data?.checkoutId;
    };

    // 1. Guest add cart (success)
    await runStep('Guest add cart (success)', async () => {
      await addToCart(guestHeaders);
    });

    // 2. Customer add cart (success)
    await runStep('Customer A add cart (success)', async () => {
      await addToCart(headersA);
    });

    await runStep('Customer B add cart (setup)', async () => {
      await addToCart(headersB);
    });

    // 3. Guest checkout own cart (success)
    let guestCheckoutId: string;
    await runStep('Guest checkout own cart (success)', async () => {
      guestCheckoutId = await startCheckout(guestHeaders);
      if (!guestCheckoutId) throw new Error('No checkout ID returned');
    });

    // 4. Customer B checkout own cart (success)
    let customerBCheckoutId: string;
    await runStep('Customer B checkout own cart (success)', async () => {
      customerBCheckoutId = await startCheckout(headersB);
      if (!customerBCheckoutId) throw new Error('No checkout ID returned');
    });

    // 5. Customer A payment initiate Customer B checkout (403 Forbidden)
    await runStep('Customer A payment initiate Customer B checkout (403/404)', async () => {
      if (!customerBCheckoutId) throw new Error('Customer B checkout not created');
      const res = await fetch(`${baseUrl}/payment/initiate`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({ checkoutId: customerBCheckoutId, method: 'CARD' }),
      });
      if (res.status !== 403 && res.status !== 404) {
        throw new Error(`Expected 403 or 404, got ${res.status}`);
      }
    });

    // Create a payment for B to test order creation
    let customerBPaymentData: any;
    await runStep('Customer B initiate payment (setup)', async () => {
        const res = await fetch(`${baseUrl}/payment/initiate`, {
            method: 'POST',
            headers: headersB,
            body: JSON.stringify({ checkoutId: customerBCheckoutId, method: 'CARD' }),
        });
        if (!res.ok) throw new Error(`Payment initiation failed: ${res.status}`);
        const json = await res.json();
        customerBPaymentData = json.data;
    });

    // 6. Customer A create order from Customer B payment (403 Forbidden)
    await runStep('Customer A create order from Customer B payment (403/404)', async () => {
        if (!customerBPaymentData) throw new Error('Payment not created');
        const res = await fetch(`${baseUrl}/order/create-from-payment`, {
            method: 'POST',
            headers: headersA,
            body: JSON.stringify({ 
                paymentId: customerBPaymentData.paymentId,
                paymentAttemptId: customerBPaymentData.attempt?.paymentAttemptId,
                checkoutId: customerBCheckoutId,
            }),
        });
        // We expect 403 because context.actorId != payment/checkout owner
        if (res.status !== 403 && res.status !== 404 && res.status !== 400) {
            throw new Error(`Expected 403/404/400, got ${res.status}`);
        }
    });

    // System simulate payment success
    await runStep('System simulate payment success (setup)', async () => {
         if (!customerBPaymentData) throw new Error('Payment not created');
         const res = await fetch(`${baseUrl}/payment/simulate-success`, {
             method: 'POST',
             headers: getAdminHeaders('system-internal'), 
             body: JSON.stringify({ paymentAttemptId: customerBPaymentData.attempt?.paymentAttemptId }),
         });
         if (!res.ok) throw new Error(`Payment simulation failed: ${res.status}`);
    });

    let customerBOrderId: string;
    await runStep('Customer B create order (setup)', async () => {
         if (!customerBPaymentData) throw new Error('Payment not created');
         const res = await fetch(`${baseUrl}/order/create-from-payment`, {
            method: 'POST',
            headers: headersB,
            body: JSON.stringify({ 
                paymentId: customerBPaymentData.paymentId,
                paymentAttemptId: customerBPaymentData.attempt?.paymentAttemptId,
                checkoutId: customerBCheckoutId,
            }),
        });
        if (!res.ok) {
            const body = await res.text();
            throw new Error(`Order creation failed: ${res.status} ${body}`);
        }
        const json = await res.json();
        customerBOrderId = json.data?.orderId;
    });

    // 7. Customer A read Customer B order (403 Forbidden)
    await runStep('Customer A read Customer B order (403/404)', async () => {
        if (!customerBOrderId) throw new Error('Order not created');
        const res = await fetch(`${baseUrl}/order/${customerBOrderId}`, {
            headers: headersA,
        });
        if (res.status !== 403 && res.status !== 404) {
            throw new Error(`Expected 403 or 404, got ${res.status}`);
        }
    });

    // 8. Owner read own order (success)
    await runStep('Owner read own order (success)', async () => {
        if (!customerBOrderId) throw new Error('Order not created');
        const res = await fetch(`${baseUrl}/order/${customerBOrderId}`, {
            headers: headersB,
        });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Read order failed: ${res.status} ${txt}`);
        }
    });

    const finalResult = steps.every(s => s.status === 'PASS') ? 'PASS' : 'FAIL';
    const failedStep = steps.find(s => s.status === 'FAIL');
    const message = finalResult === 'PASS' 
      ? 'All commerce permission scenarios passed.' 
      : `Failed at step: ${failedStep?.name}. Reason: ${failedStep?.message}`;

    console.table(steps.map(s => ({ Step: s.name, Status: s.status, Message: s.message })));

    return { result: finalResult as any, message };
  },
};
