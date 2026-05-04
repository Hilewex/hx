export async function simulateRefundFlow(requestId: string, orderRes: any) {
  console.log(`\n--- REFUND SIMULATION START (Source Request: ${requestId}) ---`);

  async function request(path: string, method: string, body?: any) {
    const res = await fetch(`http://localhost:3000${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    return { status: res.status, data };
  }

  // 1A. Unknown cancel-return request
  console.log('\nScenario 1A: Attempting refund create from unknown request...');
  const unknownRes = await request('/refund/create-from-cancel-return', 'POST', { cancelReturnRequestId: 'unknown-id' });
  console.log('Unknown Request Result (Expected 404):', unknownRes.status, unknownRes.data?.errors);

  // 1B. Existing but not approved request
  console.log('\nScenario 1B: Attempting refund create from non-approved request...');
  // Create a new cancel request for Scenario 1B
  const newCancelRes = await request('/cancel-return/cancel', 'POST', {
    orderId: orderRes.orderId,
    orderLineIds: [orderRes.lines[0].orderLineId],
    reasonCode: 'CUSTOMER_DECISION',
    idempotencyKey: `scen-1b-${Date.now()}`
  });
  
  if (newCancelRes.data?.requestId) {
    const nonApprovedRes = await request('/refund/create-from-cancel-return', 'POST', { 
      cancelReturnRequestId: newCancelRes.data.requestId 
    });
    console.log('Non-approved Create Result (Expected 400):', nonApprovedRes.status, nonApprovedRes.data?.errors);
  }

  // 2. Create Refund from approved request (the one passed from app.ts)
  console.log('\nScenario 2: Creating refund from approved request...');
  const createRes = await request('/refund/create-from-cancel-return', 'POST', { cancelReturnRequestId: requestId });
  const refund = createRes.data;
  console.log('Refund Created:', JSON.stringify(refund, null, 2));

  if (refund.refundId) {
    // 3. Duplicate check (cancelReturnRequestId)
    console.log('\nScenario 3: Attempting duplicate refund creation (same requestId)...');
    const dupRes = await request('/refund/create-from-cancel-return', 'POST', { cancelReturnRequestId: requestId });
    console.log('Duplicate Create Result (Should be same ID):', dupRes.data.refundId === refund.refundId ? 'SUCCESS' : 'FAILED');

    // 3. Duplicate check (idempotencyKey)
    console.log('\nScenario 3: Attempting duplicate refund creation (same idempotencyKey)...');
    const iKey = `ikey-${refund.refundId}`;
    // First create with iKey
    await request('/refund/create-from-cancel-return', 'POST', { 
        cancelReturnRequestId: requestId,
        idempotencyKey: iKey
    });
    const dupIKeyRes = await request('/refund/create-from-cancel-return', 'POST', { 
        cancelReturnRequestId: requestId,
        idempotencyKey: iKey
    });
    console.log('Duplicate iKey Result (Should be same ID):', dupIKeyRes.data.refundId === refund.refundId ? 'SUCCESS' : 'FAILED');

    // 4. Read detail
    console.log('\nScenario 4: Reading refund detail...');
    const detailRes = await request(`/refund/${refund.refundId}`, 'GET');
    console.log('Refund Detail:', JSON.stringify(detailRes.data, null, 2));

    // 6. Invalid transition
    console.log('\nScenario 6: Attempting invalid transition (CREATED -> SUCCEEDED)...');
    const transRes = await request('/refund/transition', 'POST', { refundId: refund.refundId, targetState: 'SUCCEEDED' });
    console.log('Invalid Transition Result (Expected 400):', transRes.status, transRes.data?.error);

    // 5. Process simulation
    console.log('\nScenario 5: Processing refund simulation...');
    const processRes = await request('/refund/process', 'POST', { refundId: refund.refundId });
    console.log('Processed Refund:', JSON.stringify(processRes.data, null, 2));
    console.log('Final State:', processRes.data.state);
  }

  // 7. Unknown refund GET
  console.log('\nScenario 7: Attempting to get unknown refund...');
  const unknownGetRes = await request('/refund/unknown-id', 'GET');
  console.log('Unknown Refund status (Expected 404):', unknownGetRes.status);

  console.log('--- REFUND SIMULATION END ---\n');
}
