const http = require('http');

const request = (path, method, body, headers = {}) => {
  return new Promise((resolve) => {
    const options = {
      hostname: '127.0.0.1',
      port: 54114,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: JSON.parse(data || '{}'),
        });
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runTests() {
  console.log('--- CHECKOUT RUNTIME VERIFICATION ---');

  // 1. Empty cart -> BLOCKED
  console.log('\n--- 1. Testing checkout with empty cart ---');
  // First, make sure the cart is empty by creating a new guest session
  const guestToken1 = 'Bearer guest-token-' + Date.now();
  let res = await request('/checkout/start', 'POST', null, { Authorization: guestToken1 });
  console.log('Response:', JSON.stringify(res.data, null, 2));

  // 2. Valid cart -> REVIEW_READY / VALID
  console.log('\n--- 2. Testing checkout with a valid cart ---');
  const guestToken2 = 'Bearer guest-token-' + Date.now();
  await request('/cart/items', 'POST', { productId: 'p_101', storefrontId: 'sf_tr', quantity: 1 }, { Authorization: guestToken2 });
  res = await request('/checkout/start', 'POST', null, { Authorization: guestToken2 });
  console.log('Response:', JSON.stringify(res.data, null, 2));

  // 3. Out of stock cart -> BLOCKED / STOCK_MISMATCH
  console.log('\n--- 3. Testing checkout with an out-of-stock item ---');
  const guestToken3 = 'Bearer guest-token-' + Date.now();
  await request('/cart/items', 'POST', { productId: 'p_out_of_stock', storefrontId: 'sf_tr', quantity: 1 }, { Authorization: guestToken3 });
  res = await request('/checkout/start', 'POST', null, { Authorization: guestToken3 });
  console.log('Response:', JSON.stringify(res.data, null, 2));

  // 4. Unavailable price -> BLOCKED / PRICE_MISMATCH
  console.log('\n--- 4. Testing checkout with an item with no price ---');
  const guestToken4 = 'Bearer guest-token-' + Date.now();
  await request('/cart/items', 'POST', { productId: 'p_unavailable', storefrontId: 'sf_tr', quantity: 1 }, { Authorization: guestToken4 });
  res = await request('/checkout/start', 'POST', null, { Authorization: guestToken4 });
  console.log('Response:', JSON.stringify(res.data, null, 2));

  console.log('\n--- VERIFICATION COMPLETE ---');
}

runTests();
