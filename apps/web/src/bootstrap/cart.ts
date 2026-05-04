export type CartViewState = 'LOADING' | 'EMPTY' | 'SUCCESS' | 'ERROR';

export async function simulateCartFlow() {
  console.log('\n--- SIMULATING CART FLOW ---');
  
  const endpoint = 'http://localhost:3000/cart';

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
      console.error(`[CART ${method} ${path}] Failed`, err);
      return { status: 500, data: null };
    }
  }

  // 1. Initial Get
  console.log('1. Initial GET /cart');
  let res = await request('/cart', 'GET');
  console.log(JSON.stringify(res.data, null, 2));

  // 2. Add Item 1
  console.log('\n2. Add item to cart');
  res = await request('/cart/items', 'POST', { productId: 'p_101', storefrontId: 'sf_tr', quantity: 1 });
  console.log(JSON.stringify(res.data, null, 2));
  
  const lineId = res.data.lines?.[0]?.lineId;

  if (lineId) {
    // 3. Update Item 1 Quantity
    console.log(`\n3. Update quantity of line ${lineId} to 3`);
    res = await request('/cart/items', 'PATCH', { lineId, quantity: 3 });
    console.log(JSON.stringify(res.data, null, 2));

    // 4. Remove Item 1
    console.log(`\n4. Remove line ${lineId}`);
    res = await request('/cart/items', 'DELETE', { lineId });
    console.log(JSON.stringify(res.data, null, 2));
  }

  // 5. Variant required test
  console.log('\n5. Add item missing required variant');
  res = await request('/cart/items', 'POST', { productId: 'p_variant_req', storefrontId: 'sf_tr', quantity: 1 });
  console.log('Status:', res.status, 'Data:', JSON.stringify(res.data, null, 2));

  console.log('--- END CART FLOW ---\n');
}

export function renderCartShell(state: CartViewState) {
  console.log(`[UI] Rendering Cart Shell in state: ${state}`);
  if (state === 'LOADING') {
    console.log('   -> Spinner showing');
  } else if (state === 'EMPTY') {
    console.log('   -> Cart is empty. Continue shopping button.');
  } else if (state === 'SUCCESS') {
    console.log('   -> Cart lines and summary displayed');
  } else if (state === 'ERROR') {
    console.log('   -> Error banner displayed');
  }
}
