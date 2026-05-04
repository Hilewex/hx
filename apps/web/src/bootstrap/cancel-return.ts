import { 
  OrderResponse, 
  ShipmentResponse
} from '@hx/contracts';

export async function simulateCancelReturnFlow(order: OrderResponse): Promise<string | undefined> {
  async function request(path: string, method: string, body?: any) {
    try {
      const res = await fetch(`http://localhost:3000${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer guest-token',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      return { status: res.status, data };
    } catch (err) {
      console.error(`[CANCEL-RETURN ${method} ${path}] Failed`, err);
      return { status: 500, data: null };
    }
  }

  console.log('\n--- SIMULATING CANCEL-RETURN FLOW (SOURCE REVIEW FIX) ---');

  // 1. Create shipment (But stay in CREATED state)
  const shipmentRes = await request('/shipment/create-from-order', 'POST', { orderId: order.orderId });
  const shipment = shipmentRes.data as ShipmentResponse;
  console.log('Shipment created (Initial state):', shipment.state);

  const lineId = order.lines[0].orderLineId;

  console.log('\n--- SCENARIO-1: Cancel before delivered ---');
  const cancelRes = await request('/cancel-return/cancel', 'POST', {
    orderId: order.orderId,
    orderLineIds: [lineId],
    reasonCode: 'CUSTOMER_DECISION'
  });
  console.log('Cancel Request Result (Expected 200):', cancelRes.status, cancelRes.data?.type);

  console.log('\n--- SCENARIO-2: Duplicate cancel ---');
  const dupCancelRes = await request('/cancel-return/cancel', 'POST', {
    orderId: order.orderId,
    orderLineIds: [lineId]
  });
  console.log('Duplicate Cancel Result (Should be same ID):', dupCancelRes.data?.requestId === cancelRes.data?.requestId ? 'PASS' : 'FAIL');

  console.log('\n--- SCENARIO-3: Return before delivered rejected ---');
  const earlyReturnRes = await request('/cancel-return/return', 'POST', {
    orderId: order.orderId,
    orderLineIds: [lineId]
  });
  console.log('Early Return Result (Expected 400):', earlyReturnRes.status, earlyReturnRes.data?.errors);

  // 4. Transition to DELIVERED
  console.log('\n--- TRANSITIONING SHIPMENT TO DELIVERED ---');
  await request('/shipment/transition', 'POST', { shipmentId: shipment.shipmentId, targetState: 'PREPARING' });
  await request('/shipment/transition', 'POST', { shipmentId: shipment.shipmentId, targetState: 'SHIPPED', carrierData: { carrierName: 'X', trackingNumber: 'Y' } });
  await request('/shipment/transition', 'POST', { shipmentId: shipment.shipmentId, targetState: 'IN_TRANSIT' });
  await request('/shipment/transition', 'POST', { shipmentId: shipment.shipmentId, targetState: 'OUT_FOR_DELIVERY' });
  await request('/shipment/transition', 'POST', { shipmentId: shipment.shipmentId, targetState: 'DELIVERED' });
  console.log('Shipment is now DELIVERED.');

  console.log('\n--- SCENARIO-4: Return after delivered allowed ---');
  const returnRes = await request('/cancel-return/return', 'POST', {
    orderId: order.orderId,
    orderLineIds: [lineId],
    reasonCode: 'SIZE_MISMATCH'
  });
  console.log('Return Request Result (Expected 400 due to Active Cancel):', returnRes.status, returnRes.data?.errors);

  console.log('Closing the active cancel request...');
  await request('/cancel-return/transition', 'POST', { requestId: cancelRes.data.requestId, targetState: 'REJECTED' });
  await request('/cancel-return/transition', 'POST', { requestId: cancelRes.data.requestId, targetState: 'CLOSED' });

  console.log('Retrying return request after cancel is closed...');
  const returnRes2 = await request('/cancel-return/return', 'POST', {
    orderId: order.orderId,
    orderLineIds: [lineId],
    reasonCode: 'SIZE_MISMATCH'
  });
  console.log('Return Request Result (Expected 200):', returnRes2.status, returnRes2.data?.type);

  console.log('\n--- SCENARIO-5: Cancel after delivered rejected ---');
  const lateCancelRes = await request('/cancel-return/cancel', 'POST', {
    orderId: order.orderId,
    orderLineIds: [lineId]
  });
  console.log('Late Cancel Result (Expected 400):', lateCancelRes.status, lateCancelRes.data?.errors);

  console.log('\n--- SCENARIO-7: Duplicate return ---');
  const dupReturnRes = await request('/cancel-return/return', 'POST', {
    orderId: order.orderId,
    orderLineIds: [lineId]
  });
  console.log('Duplicate Return Result (Should be same ID):', dupReturnRes.data?.requestId === returnRes2.data?.requestId ? 'PASS' : 'FAIL');

  console.log('\n--- SCENARIO-8: Invalid transition ---');
  const invTrRes = await request('/cancel-return/transition', 'POST', {
    requestId: returnRes2.data?.requestId,
    targetState: 'REFUNDED'
  });
  console.log('Invalid Transition Result (Expected 400):', invTrRes.status, invTrRes.data?.error);

  console.log('\n--- SCENARIO-9: Unknown request ---');
  const unknownRes = await request('/cancel-return/unknown-id', 'GET');
  console.log('Unknown Request Result (Expected 404):', unknownRes.status);

  // To test Refund, we need an APPROVED request
  console.log('\n--- TRANSITIONING RETURN TO APPROVED FOR REFUND SIMULATION ---');
  const approvedRes = await request('/cancel-return/transition', 'POST', { 
    requestId: returnRes2.data?.requestId, 
    targetState: 'APPROVED' 
  });
  console.log('Transition to APPROVED result:', approvedRes.status);

  console.log('--- END CANCEL-RETURN FLOW ---\n');
  
  return returnRes2.data?.requestId;
}
