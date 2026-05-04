export type PaymentViewState =
  | 'IDLE'
  | 'INITIATING'
  | 'REDIRECT_READY'
  | 'ERROR';

export async function simulatePaymentInitiationFlow(checkoutId: string): Promise<{ paymentId: string, paymentAttemptId: string } | undefined> {
  console.log('\n--- SIMULATING PAYMENT INITIATION FLOW ---');

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
      console.error(`[PAYMENT ${method} ${path}] Failed`, err);
      return { status: 500, data: null };
    }
  }

  const payload = {
    checkoutId,
    paymentMethod: 'CARD',
  };

  console.log('1. Call POST /payment/initiate with valid checkoutId');
  const res = await request('/payment/initiate', 'POST', payload);
  console.log('Status:', res.status);
  console.log('Data:', JSON.stringify(res.data, null, 2));

  console.log('--- END PAYMENT INITIATION FLOW ---\n');

  if (res.data?.paymentId) {
    return {
      paymentId: res.data.paymentId,
      paymentAttemptId: res.data.attempt.paymentAttemptId
    };
  }
  return undefined;
}
