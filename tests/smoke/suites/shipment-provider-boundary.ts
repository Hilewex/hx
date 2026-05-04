
import { SmokeRunner, SmokeResult } from '../types';
import { randomUUID } from 'crypto';
import { getCustomerHeaders, getAdminHeaders } from '../auth-utils';

// A simplified setup function for this specific test suite
async function setupCoreCommerceFlow(baseUrl: string): Promise<any> {
  const actorId = `smoke-shipment-boundary-${randomUUID()}`;
  const headers = getCustomerHeaders(actorId);

  // Simplified product and storefront IDs for this test
  const productId = 'prod-smoke-1';
  const storefrontId = 'storefront-smoke-1'; // Assuming a fixture storefront exists

  // 1. Add to Cart
  const url = `${baseUrl}/cart/items`;
  console.log(`[SmokeTest] Fetching URL: "${url}"`);
  const cartRes = await fetch(`${baseUrl}/cart/items`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ productId, quantity: 1, storefrontId }),
  });
  if (!cartRes.ok) throw new Error(`Setup: Add to cart failed: ${await cartRes.text()}`);
  const cartData = (await cartRes.json()).data.data;
  const cartId = cartData.id;

  // 2. Start Checkout
  const checkoutRes = await fetch(`${baseUrl}/checkout/start`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ cartId }),
  });
  if (!checkoutRes.ok) throw new Error(`Setup: Checkout start failed: ${await checkoutRes.text()}`);
  const checkoutData = (await checkoutRes.json()).data;
  const checkoutId = checkoutData.checkoutId;

  // 3. Initiate Payment
  const paymentRes = await fetch(`${baseUrl}/payment/initiate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ checkoutId, method: 'CARD' }),
  });
  if (!paymentRes.ok) throw new Error(`Setup: Payment initiation failed: ${await paymentRes.text()}`);
  const paymentData = (await paymentRes.json()).data;
  const paymentAttemptId = paymentData.attempt.paymentAttemptId;

  // 4. Simulate Payment Success
  const simulateRes = await fetch(`${baseUrl}/payment/simulate-success`, {
    method: 'POST',
    headers: getAdminHeaders('system-internal'),
    body: JSON.stringify({ paymentAttemptId }),
  });
  if (!simulateRes.ok) throw new Error(`Setup: Payment simulation failed: ${await simulateRes.text()}`);

  // 5. Create Order
  const orderRes = await fetch(`${baseUrl}/order/create-from-payment`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ checkoutId, paymentId: paymentData.paymentId, paymentAttemptId }),
  });
  if (!orderRes.ok) throw new Error(`Setup: Order creation failed: ${await orderRes.text()}`);
  const orderData = (await orderRes.json()).data;
  const orderId = orderData.orderId;

  // 6. Create Shipment
  const shipmentRes = await fetch(`${baseUrl}/shipment/create-from-order`, {
    method: 'POST',
    headers: getAdminHeaders('system-internal'),
    body: JSON.stringify({ orderId }),
  });
  if (!shipmentRes.ok) throw new Error(`Setup: Shipment creation failed: ${await shipmentRes.text()}`);
  const shipmentData = (await shipmentRes.json()).data;
  const shipmentId = shipmentData.shipmentId;

  return { shipmentId, actorId };
}

export const shipmentProviderBoundarySmoke: SmokeRunner = {
  name: 'shipment-provider-boundary',
  run: async (baseUrl: string): Promise<{ result: SmokeResult; message: string }> => {
    let context: any;
    try {
      context = await setupCoreCommerceFlow(baseUrl);
    } catch (error: any) {
      return { result: 'FAIL', message: `Setup failed: ${error.message}` };
    }

    let finalShipmentState: any;

    try {
      // Transition to PREPARING first
      const prepRes = await fetch(`${baseUrl}/shipment/transition`, {
        method: 'POST',
        headers: getAdminHeaders('system-internal'),
        body: JSON.stringify({
          shipmentId: context.shipmentId,
          targetState: 'PREPARING',
        }),
      });
      if (!prepRes.ok) throw new Error(`Transition to PREPARING failed: ${await prepRes.text()}`);

      // Then transition to SHIPPED to trigger the provider adapter
      const transitionRes = await fetch(`${baseUrl}/shipment/transition`, {
        method: 'POST',
        headers: getAdminHeaders('system-internal'),
        body: JSON.stringify({
          shipmentId: context.shipmentId,
          targetState: 'SHIPPED',
          note: 'Shipped by smoke test',
          carrierData: {
            carrierName: 'SmokeTestCarrier',
            trackingNumber: `SMOKE-${randomUUID()}`,
          },
        }),
      });

      if (!transitionRes.ok) {
        throw new Error(`Transition to SHIPPED failed: ${await transitionRes.text()}`);
      }
      const transitionBody = await transitionRes.json();
      finalShipmentState = transitionBody.data;

      if (!finalShipmentState) {
        throw new Error('Shipment data not found in transition response.');
      }
    } catch (error: any) {
      return { result: 'FAIL', message: `Test execution failed: ${error.message}` };
    }

    // Verification steps
    const checks = [];
    const providerEnvelope = finalShipmentState.packages[0]?.providerEnvelope;

    if (!providerEnvelope) {
      checks.push({ pass: false, message: 'providerEnvelope is missing' });
    } else {
      checks.push({ pass: providerEnvelope.providerDomain === 'shipment', message: `providerDomain should be 'shipment', was '${providerEnvelope.providerDomain}'` });
      checks.push({ pass: ['simulation', 'not_configured'].includes(providerEnvelope.providerMode), message: `providerMode should be 'simulation' or 'not_configured', was '${providerEnvelope.providerMode}'` });
      checks.push({ pass: providerEnvelope.boundary.businessTruthMutated === false, message: 'boundary.businessTruthMutated should be false' });
      checks.push({ pass: providerEnvelope.boundary.ownerStateMutated === false, message: 'boundary.ownerStateMutated should be false' });
      checks.push({ pass: providerEnvelope.boundary.providerTruth === false, message: 'boundary.providerTruth should be false' });
      checks.push({ pass: providerEnvelope.boundary.eventTruthMutated === false, message: 'boundary.eventTruthMutated should be false' });
      checks.push({ pass: providerEnvelope.boundary.outboxDeliveryGuaranteed === false, message: 'boundary.outboxDeliveryGuaranteed should be false' });
    }

    // Check core business logic integrity
    checks.push({ pass: finalShipmentState.state === 'SHIPPED', message: `Shipment state should be 'SHIPPED', was '${finalShipmentState.state}'` });
    checks.push({ pass: finalShipmentState.state !== 'DELIVERED', message: 'Provider result must not directly set state to DELIVERED' });
    checks.push({ pass: finalShipmentState.entitlementTriggerSummary.actualEligibilityMutationPerformed === false, message: 'actualEligibilityMutationPerformed must remain false' });

    const failedChecks = checks.filter(c => !c.pass);

    if (failedChecks.length > 0) {
      const messages = failedChecks.map(c => c.message).join('; ');
      return { result: 'FAIL', message: `Verification failed: ${messages}` };
    }

    return { result: 'PASS', message: 'Shipment provider boundary foundation validated successfully.' };
  },
};
