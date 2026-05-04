export type CheckoutViewState = 'LOADING' | 'REVIEW_READY' | 'BLOCKED' | 'ERROR';

export async function simulateCheckoutFlow(): Promise<string | undefined> {
  console.log('\n--- SIMULATING CHECKOUT FLOW ---');
  
  async function request(path: string, method: string, body?: any) {
    try {
      const res = await fetch(`http://localhost:3000${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer guest-token' },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json();
      return { status: res.status, data };
    } catch (err) {
      console.error(`[CHECKOUT ${method} ${path}] Failed`, err);
      return { status: 500, data: null };
    }
  }

  console.log('1. Call POST /checkout/start');
  const res = await request('/checkout/start', 'POST');
  console.log('Status:', res.status);
  console.log('Data:', JSON.stringify(res.data, null, 2));

  console.log('--- END CHECKOUT FLOW ---\n');
  return res.data?.checkoutId;
}

export function renderCheckoutShell(state: CheckoutViewState) {
  console.log(`[UI] Rendering Checkout Shell in state: ${state}`);
  if (state === 'LOADING') {
    console.log('   -> Spinner showing (Validating Context...)');
  } else if (state === 'REVIEW_READY') {
    console.log('   -> Checkout review ready. Payment section active.');
  } else if (state === 'BLOCKED') {
    console.log('   -> Checkout blocked. Returning to cart or showing issues.');
  } else if (state === 'ERROR') {
    console.log('   -> Generic error banner displayed.');
  }
}
