export type OrderViewState = 
  | 'IDLE' 
  | 'CREATING' 
  | 'CREATED' 
  | 'DETAIL_LOADING' 
  | 'DETAIL_READY' 
  | 'DETAIL_NOT_FOUND' 
  | 'ERROR';

export async function simulateOrderFlow(paymentId: string, paymentAttemptId: string, checkoutId: string): Promise<string | undefined> {
  console.log('\n--- SIMULATING ORDER FLOW ---');

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
      console.error(`[ORDER ${method} ${path}] Failed`, err);
      return { status: 500, data: null };
    }
  }

  console.log('1. Call POST /payment/simulate-success');
  const simRes = await request('/payment/simulate-success', 'POST', { paymentAttemptId });
  console.log('Status:', simRes.status);
  console.log('Data:', JSON.stringify(simRes.data, null, 2));

  if (simRes.data?.state === 'SUCCEEDED') {
    console.log('2. Call POST /order/create-from-payment');
    const orderRes = await request('/order/create-from-payment', 'POST', {
      paymentId,
      paymentAttemptId,
      checkoutId
    });
    console.log('Status:', orderRes.status);
    console.log('Order Data:', JSON.stringify(orderRes.data, null, 2));
    
    if (orderRes.data?.orderId) {
      const orderId = orderRes.data.orderId;

      console.log('3. Call POST /order/create-from-payment again (Idempotency check)');
      const orderRes2 = await request('/order/create-from-payment', 'POST', {
        paymentId,
        paymentAttemptId,
        checkoutId
      });
      console.log('Status:', orderRes2.status);
      console.log('Order Data (2nd call):', orderRes2.data.orderId === orderId ? 'MATCH (OK)' : 'MISMATCH (FAIL)');

      console.log(`4. Call GET /order/${orderId} (Detail Read)`);
      renderOrderShell('DETAIL_LOADING');
      const detailRes = await request(`/order/${orderId}`, 'GET');
      console.log('Status:', detailRes.status);
      console.log('Detail Data:', JSON.stringify(detailRes.data, null, 2));
      renderOrderShell(detailRes.status === 200 ? 'DETAIL_READY' : 'ERROR');

      console.log('--- END ORDER FLOW ---\n');
      return orderId;
    }
  } else {
    console.log('Payment simulation failed, skipping order creation.');
  }

  console.log('5. Call GET /order/unknown-order-id (Unknown Order Scenario)');
  const unknownRes = await request('/order/unknown-order-id', 'GET');
  console.log('Status:', unknownRes.status);
  console.log('Unknown Order Data:', JSON.stringify(unknownRes.data, null, 2));
  if (unknownRes.status === 404) {
    console.log('Expected: 404 ORDER_NOT_FOUND (OK)');
  }

  console.log('--- END ORDER FLOW ---\n');
}

export function renderOrderShell(state: OrderViewState) {
  console.log(`[UI] Rendering Order Shell in state: ${state}`);
}
