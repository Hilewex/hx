import { SmokeRunner, SmokeResult } from '../types';
import { randomUUID } from 'crypto';
import { getCustomerHeaders, getAdminHeaders, getCreatorHeaders } from '../auth-utils';

// Helper to create a unique customer and storefront for the test run
async function createCustomerAndStorefront(baseUrl: string) {
  const actorId = `smoke-ppb-${randomUUID()}`;
  const customerEmail = `${actorId}@example.com`;

  // Create Customer
  const createCustomerRes = await fetch(new URL('/customer/profile', baseUrl).toString(), {
    method: 'POST',
    headers: getCustomerHeaders(actorId),
    body: JSON.stringify({
      firstName: 'Core',
      lastName: 'Commerce',
      email: customerEmail,
      phone: '+905551112233',
      locale: 'tr-TR',
      currency: 'TRY',
    }),
  });

  if (!createCustomerRes.ok) {
    throw new Error(`Failed to create customer: ${await createCustomerRes.text()}`);
  }
  const customerData = await createCustomerRes.json();
  const customerId = customerData.data?.id;
  if (!customerId) {
    throw new Error('Customer ID not found in creation response');
  }

  // Create Storefront
  const createStorefrontRes = await fetch(new URL('/storefront/creator/profile', baseUrl).toString(), {
      method: 'POST',
      headers: getCreatorHeaders(actorId),
      body: JSON.stringify({
        handle: `smoke-store-${randomUUID()}`,
        name: 'Provider Boundary Smoke Store',
        description: 'A store for provider boundary smoke tests.',
        ownerActorId: actorId,
      }),
    });

  if (!createStorefrontRes.ok) {
    throw new Error(`Failed to create storefront: ${await createStorefrontRes.text()}`);
  }
  const storefrontData = await createStorefrontRes.json();
  const storefrontId = storefrontData.data?.id;
   if (!storefrontId) {
    throw new Error('Storefront ID not found in creation response');
  }

  return { actorId, customerId, storefrontId, customerEmail };
}


export const paymentProviderBoundarySmoke: SmokeRunner = {
  name: 'payment-provider-boundary',
  run: async (baseUrl: string): Promise<{ result: SmokeResult; message: string }> => {
    let context: any = {};
    const steps: { name: string; status: 'PASS' | 'FAIL' | 'SKIPPED'; message: string, data?: any }[] = [];

    const runStep = async (name: string, fn: () => Promise<any>) => {
      if (steps.some(s => s.status === 'FAIL')) {
        steps.push({ name, status: 'SKIPPED', message: 'Skipped due to previous step failure.' });
        return;
      }
      try {
        const result = await fn();
        steps.push({ name, status: 'PASS', message: 'Step completed successfully.', data: result });
        return result;
      } catch (error: any) {
        steps.push({ name, status: 'FAIL', message: error.message });
      }
    };

    await runStep('Setup: Create Customer, Storefront & Cart', async () => {
      const { actorId, storefrontId } = await createCustomerAndStorefront(baseUrl);
      context.actorId = actorId;
      context.storefrontId = storefrontId;
      context.productId = 'prod-smoke-1';
      context.variantId = 'var-smoke-1-a';

      const addToCartRes = await fetch(new URL('/cart/items', baseUrl).toString(), {
        method: 'POST',
        headers: getCustomerHeaders(actorId),
        body: JSON.stringify({ productId: context.productId, variantId: context.variantId, quantity: 1, storefrontId: context.storefrontId }),
      });
      if (!addToCartRes.ok) throw new Error(`Add to cart failed: ${addToCartRes.status} ${await addToCartRes.text()}`);
      const cartJson = await addToCartRes.json();
      context.cartId = cartJson.data?.data?.context?.actorId;
      if (!context.cartId) throw new Error('Cart ID not found after adding item.');
      return { actorId, storefrontId, cartId: context.cartId };
    });

    await runStep('Start Checkout', async () => {
      const res = await fetch(new URL('/checkout/start', baseUrl).toString(), {
        method: 'POST',
        headers: getCustomerHeaders(context.actorId),
        body: JSON.stringify({ cartId: context.cartId }),
      });
      if (!res.ok) throw new Error(`Checkout start failed: ${res.status} ${await res.text()}`);
      const checkoutJson = await res.json();
      context.checkoutId = checkoutJson.data?.checkoutId;
      if (!context.checkoutId) throw new Error('Checkout ID not found.');
      return checkoutJson.data;
    });

    await runStep('Initiate Payment & Verify Envelope', async () => {
      const res = await fetch(new URL('/payment/initiate', baseUrl).toString(), {
        method: 'POST',
        headers: getCustomerHeaders(context.actorId),
        body: JSON.stringify({ checkoutId: context.checkoutId, paymentMethod: 'CARD' }),
      });
      if (!res.ok) throw new Error(`Payment initiation failed: ${res.status} ${await res.text()}`);
      const paymentJson = await res.json();
      const paymentData = paymentJson.data;
      context.paymentId = paymentData?.paymentId;
      context.paymentAttemptId = paymentData?.attempt?.paymentAttemptId;

      const envelope = paymentData?.providerEnvelope;
      if (!envelope) throw new Error('ProviderResultEnvelope not found in payment initiation response.');
      if (envelope.providerDomain !== 'payment') throw new Error(`Incorrect providerDomain: ${envelope.providerDomain}`);
      if (envelope.providerMode !== 'simulation') throw new Error(`Incorrect providerMode: ${envelope.providerMode}`);
      if (envelope.boundary.businessTruthMutated !== false) throw new Error('businessTruthMutated flag was not false');
      if (envelope.boundary.ownerStateMutated !== false) throw new Error('ownerStateMutated flag was not false');
      if (envelope.boundary.providerTruth !== false) throw new Error('providerTruth flag was not false');

      return envelope;
    });

    // HARDENING-09C: Test Pending Scenario
    await runStep('Initiate Payment (Pending) & Verify Envelope', async () => {
      const res = await fetch(new URL('/payment/initiate', baseUrl).toString(), {
        method: 'POST',
        headers: getCustomerHeaders(context.actorId),
        body: JSON.stringify({ 
            checkoutId: context.checkoutId, 
            paymentMethod: 'CARD', 
            simulationScenario: 'pending' 
        }),
      });
      if (!res.ok) throw new Error(`Payment initiation (pending) failed: ${res.status} ${await res.text()}`);
      const paymentJson = await res.json();
      const envelope = paymentJson.data?.providerEnvelope;

      if (!envelope) throw new Error('ProviderResultEnvelope not found for pending scenario.');
      if (envelope.operationStatus !== 'pending') throw new Error(`Incorrect operationStatus for pending: ${envelope.operationStatus}`);
      if (envelope.boundary.businessTruthMutated !== false) throw new Error('businessTruthMutated flag was not false for pending');
      if (envelope.boundary.ownerStateMutated !== false) throw new Error('ownerStateMutated flag was not false for pending');

      const paymentState = paymentJson.data?.state;
      if (paymentState === 'SUCCEEDED') throw new Error('Payment state incorrectly became SUCCEEDED for pending scenario.');

      return { envelope, paymentState };
    });

    // HARDENING-09C: Test Unknown Result Scenario
    await runStep('Initiate Payment (Unknown Result) & Verify Envelope', async () => {
      const res = await fetch(new URL('/payment/initiate', baseUrl).toString(), {
        method: 'POST',
        headers: getCustomerHeaders(context.actorId),
        body: JSON.stringify({ 
            checkoutId: context.checkoutId, 
            paymentMethod: 'CARD', 
            simulationScenario: 'unknown_result' 
        }),
      });
      if (!res.ok) throw new Error(`Payment initiation (unknown) failed: ${res.status} ${await res.text()}`);
      const paymentJson = await res.json();
      const envelope = paymentJson.data?.providerEnvelope;

      if (!envelope) throw new Error('ProviderResultEnvelope not found for unknown_result scenario.');
      if (envelope.operationStatus !== 'unknown_result') throw new Error(`Incorrect operationStatus for unknown_result: ${envelope.operationStatus}`);
      if (envelope.boundary.businessTruthMutated !== false) throw new Error('businessTruthMutated flag was not false for unknown_result');
      if (envelope.boundary.ownerStateMutated !== false) throw new Error('ownerStateMutated flag was not false for unknown_result');

      const paymentState = paymentJson.data?.state;
      if (paymentState === 'SUCCEEDED') throw new Error('Payment state incorrectly became SUCCEEDED for unknown_result scenario.');

      return { envelope, paymentState };
    });

    await runStep('Simulate Payment Success (Boundary)', async () => {
      const res = await fetch(new URL('/payment/simulate-success', baseUrl).toString(), {
        method: 'POST',
        headers: getAdminHeaders('system-internal'),
        body: JSON.stringify({ paymentAttemptId: context.paymentAttemptId }),
      });
      if (!res.ok) throw new Error(`Payment simulation failed: ${res.status} ${await res.text()}`);
      const simJson = await res.json();
      if (simJson.data?.state !== 'SUCCEEDED') throw new Error(`Payment simulation did not return SUCCEEDED state. State was ${simJson.data?.state}`);
      return simJson.data;
    });

    await runStep('Verify Order Can Be Created After Success', async () => {
        const res = await fetch(new URL('/order/create-from-payment', baseUrl).toString(), {
            method: 'POST',
            headers: getCustomerHeaders(context.actorId),
            body: JSON.stringify({ 
                paymentId: context.paymentId, 
                paymentAttemptId: context.paymentAttemptId,
                checkoutId: context.checkoutId,
            }),
        });
        if (!res.ok) throw new Error(`Order creation failed unexpectedly: ${res.status} ${await res.text()}`);
        const orderJson = await res.json();
        const orderData = orderJson.data;
        if (!orderData || !orderData.orderId) throw new Error('Order ID not found in response.');
        // This confirms order creation is a separate step and not automatic.
        return orderData;
    });

    const finalResult: 'PASS' | 'FAIL' = steps.every(s => s.status === 'PASS') ? 'PASS' : 'FAIL';
    const failedStep = steps.find(s => s.status === 'FAIL');
    const message = finalResult === 'PASS' 
      ? 'Payment provider boundary contracts are correctly implemented.' 
      : `Failed at step: ${failedStep?.name}. Reason: ${failedStep?.message}`;
      
    return { result: finalResult, message };
  },
};
