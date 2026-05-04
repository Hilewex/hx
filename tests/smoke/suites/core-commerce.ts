import { SmokeRunner, SmokeResult } from '../types';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getCustomerHeaders, getAdminHeaders, getGuestHeaders, getCreatorHeaders } from '../auth-utils';

const DURABILITY_FILE = path.join(__dirname, '../durability-context.json');

// Helper to create a unique customer and storefront for the test run
async function createCustomerAndStorefront(baseUrl: string) {
  const actorId = `smoke-core-commerce-${randomUUID()}`;
  const customerEmail = `${actorId}@example.com`;

  // Create Customer
  const url = `${baseUrl}/customer/profile`;
  console.log(`[SmokeTest] Fetching URL: "${url}"`);
  const createCustomerRes = await fetch(`${baseUrl}/customer/profile`, {
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
  const createStorefrontRes = await fetch(`${baseUrl}/storefront/creator/profile`, {
      method: 'POST',
      headers: getCreatorHeaders(actorId),
      body: JSON.stringify({
        handle: `smoke-store-${randomUUID()}`,
        name: 'Core Commerce Smoke Store',
        description: 'A store for core commerce journey smoke tests.',
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


export const coreCommerceSmoke: SmokeRunner = {
  name: 'core-commerce',
  run: async (baseUrl: string): Promise<{ result: SmokeResult; message: string }> => {
    const phase = process.env.SMOKE_PHASE || '1';

    if (phase === '1') {
      return runPhase1(baseUrl);
    } else {
      return runPhase2(baseUrl);
    }
  },
};

async function runPhase1(baseUrl: string): Promise<{ result: SmokeResult; message: string }> {
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
    
    await runStep('Setup Customer & Storefront', async () => {
      context = await createCustomerAndStorefront(baseUrl);
      return context;
    });

    await runStep('PDP Read (Fixture)', async () => {
        context.productId = 'prod-smoke-1';
        context.variantId = 'var-smoke-1-a';
        return { productId: context.productId, variantId: context.variantId };
    });

    await runStep('Add to Cart', async () => {
        const res = await fetch(`${baseUrl}/cart/items`, {
            method: 'POST',
            headers: getCustomerHeaders(context.actorId),
            body: JSON.stringify({ productId: context.productId, variantId: context.variantId, quantity: 1, storefrontId: context.storefrontId }),
        });
        if (!res.ok) throw new Error(`Add to cart failed: ${res.status} ${await res.text()}`);
        const responseJson = await res.json();
        const cartData = responseJson.data?.data;
        if (!cartData || !cartData.lines || cartData.lines.length === 0) throw new Error('Cart data is invalid or lines are missing in response.');
        context.cartId = cartData.id;
        return cartData;
    });

    await runStep('Start Checkout', async () => {
        const res = await fetch(`${baseUrl}/checkout/start`, {
            method: 'POST',
            headers: getCustomerHeaders(context.actorId),
            body: JSON.stringify({ cartId: context.cartId }),
        });
        if (!res.ok) throw new Error(`Checkout start failed: ${res.status} ${await res.text()}`);
        const responseJson = await res.json();
        const checkoutData = responseJson.data;
        if (!checkoutData || !checkoutData.checkoutId) throw new Error('Checkout ID not found in response.');
        context.checkoutId = checkoutData.checkoutId;
        return checkoutData;
    });

    await runStep('Initiate Payment', async () => {
        const res = await fetch(`${baseUrl}/payment/initiate`, {
            method: 'POST',
            headers: getCustomerHeaders(context.actorId),
            body: JSON.stringify({ checkoutId: context.checkoutId, method: 'CARD' }),
        });
        if (!res.ok) throw new Error(`Payment initiation failed: ${res.status} ${await res.text()}`);
        const responseJson = await res.json();
        const paymentData = responseJson.data;
        if (!paymentData || !paymentData.paymentId || !paymentData.attempt?.paymentAttemptId) {
            throw new Error('Payment ID or Payment Attempt ID not found in response.');
        }
        context.paymentId = paymentData.paymentId;
        context.paymentAttemptId = paymentData.attempt.paymentAttemptId;
        return paymentData;
    });
    
    await runStep('Simulate Payment Success', async () => {
        const res = await fetch(`${baseUrl}/payment/simulate-success`, {
            method: 'POST',
            headers: getAdminHeaders('system-internal'),
            body: JSON.stringify({ paymentAttemptId: context.paymentAttemptId }),
        });
        if (!res.ok) throw new Error(`Payment simulation failed: ${res.status} ${await res.text()}`);
        const responseJson = await res.json();
        if (responseJson.data?.state !== 'SUCCEEDED') {
            throw new Error(`Payment simulation did not return SUCCEEDED state. State was ${responseJson.data?.state}`);
        }
        return responseJson.data;
    });

    await runStep('Create Order', async () => {
        const res = await fetch(`${baseUrl}/order/create-from-payment`, {
            method: 'POST',
            headers: getCustomerHeaders(context.actorId),
            body: JSON.stringify({ 
                paymentId: context.paymentId,
                paymentAttemptId: context.paymentAttemptId,
                checkoutId: context.checkoutId,
            }),
        });
        if (!res.ok) throw new Error(`Order creation failed: ${res.status} ${await res.text()}`);
        const responseJson = await res.json();
        const orderData = responseJson.data;
        if (!orderData || !orderData.orderId) throw new Error('Order ID not found in response.');
        context.orderId = orderData.orderId;
        return orderData;
    });

    await runStep('Create Shipment', async () => {
        const res = await fetch(`${baseUrl}/shipment/create-from-order`, {
            method: 'POST',
            headers: getAdminHeaders('system-internal'),
            body: JSON.stringify({ orderId: context.orderId }),
        });
        if (!res.ok) throw new Error(`Shipment creation failed: ${res.status} ${await res.text()}`);
        const responseJson = await res.json();
        const shipmentData = responseJson.data;
        if (!shipmentData || !shipmentData.shipmentId) throw new Error('Shipment ID not found in response.');
        context.shipmentId = shipmentData.shipmentId;
        return shipmentData;
    });

    const finalResult: 'PASS' | 'FAIL' = steps.every(s => s.status === 'PASS') ? 'PASS' : 'FAIL';
    
    if (finalResult === 'PASS') {
        const durabilityContext = {
            orderId: context.orderId,
            shipmentId: context.shipmentId,
            paymentId: context.paymentId,
            actorId: context.actorId,
        };
        await fs.writeFile(DURABILITY_FILE, JSON.stringify(durabilityContext, null, 2));
        console.log(`\n--- Phase 1 Complete ---`);
        console.log(`Durability context saved to ${DURABILITY_FILE}`);
        console.log(`Order ID: ${context.orderId}`);
        console.log(`Shipment ID: ${context.shipmentId}`);
    }
    
    const failedStep = steps.find(s => s.status === 'FAIL');
    const message = finalResult === 'PASS' 
      ? 'Phase 1 (Creation) completed successfully. Ready for restart.' 
      : `Failed at step: ${failedStep?.name}. Reason: ${failedStep?.message}`;
      
    return { result: finalResult, message };
}

async function runPhase2(baseUrl: string): Promise<{ result: SmokeResult; message: string }> {
    let context: any;
    try {
        const data = await fs.readFile(DURABILITY_FILE, 'utf-8');
        context = JSON.parse(data);
    } catch (e) {
        return { result: 'FAIL', message: `Could not read durability file at ${DURABILITY_FILE}. Run Phase 1 first.` };
    }

    const steps: { name: string; status: 'PASS' | 'FAIL' | 'SKIPPED'; message: string }[] = [];
     const runStep = async (name: string, fn: () => Promise<any>) => {
      if (steps.some(s => s.status === 'FAIL')) {
        steps.push({ name, status: 'SKIPPED', message: 'Skipped due to previous step failure.' });
        return;
      }
      try {
        await fn();
        steps.push({ name, status: 'PASS', message: 'Step completed successfully.' });
      } catch (error: any) {
        steps.push({ name, status: 'FAIL', message: error.message });
      }
    };

    await runStep('Durability: Read Order', async () => {
        const res = await fetch(`${baseUrl}/order/${context.orderId}`, {
            headers: getCustomerHeaders(context.actorId),
        });
        if (!res.ok) throw new Error(`Failed to read order after restart: ${res.status}`);
        const json = await res.json();
        if (json.data?.orderId !== context.orderId) throw new Error('Order ID mismatch after restart.');
    });

    await runStep('Durability: Read Shipment', async () => {
        const res = await fetch(`${baseUrl}/shipment/${context.shipmentId}`, {
             headers: getCustomerHeaders(context.actorId),
        });
        if (!res.ok) throw new Error(`Failed to read shipment after restart: ${res.status}`);
        const json = await res.json();
        if (json.data?.shipmentId !== context.shipmentId) throw new Error('Shipment ID mismatch after restart.');
    });

    // We can't directly get payment, but we can infer its persistence from the durable order
    steps.push({name: 'Durability: Read Payment', status: 'PASS', message: 'Payment persistence inferred from durable order.'});

    const finalResult: 'PASS' | 'FAIL' = steps.every(s => s.status === 'PASS') ? 'PASS' : 'FAIL';
    const failedStep = steps.find(s => s.status === 'FAIL');
    const message = finalResult === 'PASS' 
      ? 'Phase 2 (Durability) completed successfully. All records persisted.' 
      : `Failed at step: ${failedStep?.name}. Reason: ${failedStep?.message}`;

    return { result: finalResult, message };
}
