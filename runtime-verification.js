const { spawn } = require('child_process');
const http = require('http');
const { randomUUID } = require('crypto');

const bff = spawn('npx.cmd', ['tsx', 'apps/bff/src/index.ts'], {
  env: { ...process.env, PORT: '3005' },
  stdio: 'inherit',
  shell: true,
});

const req = (path, method, body, headers = {}) =>
  new Promise((resolve) => {
    const r = http.request(
      `http://127.0.0.1:3005${path}`,
      { method, headers: { 'Content-Type': 'application/json', ...headers } },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve({ status: res.statusCode, data: d }));
      },
    );
    if (body) r.write(JSON.stringify(body));
    r.end();
  });

setTimeout(async () => {
  try {
    console.log('\n--- 1. POST /payment/initiate valid payload ---');
    const validPayload = {
      checkoutId: randomUUID(),
      amount: 150.5,
      currency: 'TRY',
      paymentMethod: 'CARD',
    };
    const validRes = await req('/payment/initiate', 'POST', validPayload);
    console.log(validRes.status, JSON.parse(validRes.data));

    console.log('\n--- 2. POST /payment/initiate amount <= 0 ---');
    const invalidAmountPayload = { ...validPayload, checkoutId: randomUUID(), amount: 0 };
    const invalidAmountRes = await req(
      '/payment/initiate',
      'POST',
      invalidAmountPayload,
    );
    console.log(invalidAmountRes.status, JSON.parse(invalidAmountRes.data));

    console.log('\n--- 3. POST /payment/initiate unsupported currency ---');
    const invalidCurrencyPayload = { ...validPayload, checkoutId: randomUUID(), currency: 'USD' };
    const invalidCurrencyRes = await req(
      '/payment/initiate',
      'POST',
      invalidCurrencyPayload,
    );
    console.log(
      invalidCurrencyRes.status,
      JSON.parse(invalidCurrencyRes.data),
    );

    console.log('\n--- 4. POST /payment/initiate with duplicate idempotencyKey ---');
    const idempotencyKey = randomUUID();
    const idempotentPayload = { ...validPayload, checkoutId: randomUUID(), idempotencyKey };

    const firstIdempotentRes = await req(
      '/payment/initiate',
      'POST',
      idempotentPayload,
    );
    const firstData = JSON.parse(firstIdempotentRes.data);
    console.log('First call:', firstIdempotentRes.status, firstData);

    const secondIdempotentRes = await req(
      '/payment/initiate',
      'POST',
      idempotentPayload,
    );
    const secondData = JSON.parse(secondIdempotentRes.data);
    console.log('Second call:', secondIdempotentRes.status, secondData);

    if (firstData.paymentId === secondData.paymentId && firstData.attempt.paymentAttemptId === secondData.attempt.paymentAttemptId) {
        console.log("SUCCESS: Idempotency check passed!");
    } else {
        console.error("ERROR: Idempotency check failed!");
    }


  } catch (e) {
    console.error('Runtime verification failed', e);
  } finally {
    bff.kill('SIGINT');
    process.exit(0);
  }
}, 5000);
