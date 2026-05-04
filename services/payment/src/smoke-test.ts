import { initiatePayment, getPayment, simulatePaymentSuccess } from './payment';
import { createOrderFromPayment, getOrderById } from '../../order/src/order';
import { CartContext } from '@hx/contracts';
import { randomUUID } from 'node:crypto';

async function simulateCheckout(context: CartContext) {
    const { startCheckout } = await import('../../checkout/src/checkout');
    return { startCheckout };
}

async function runPaymentOrderSmokeTest() {
  console.log('--- Starting Payment/Order Persistence Smoke Test ---');
  
  process.env.PERSISTENCE_MODE = process.env.PERSISTENCE_MODE || 'memory';
  console.log(`Mode: ${process.env.PERSISTENCE_MODE}`);

  const context: CartContext = {
    actorType: 'CUSTOMER',
    actorId: 'test-user-payment-' + Date.now()
  };

  // 1. Setup Checkout
  console.log('1. Setting up checkout...');
  const { startCheckout } = await simulateCheckout(context);
  const checkout = await startCheckout({ cartContext: context });
  console.log('Checkout ID:', checkout.checkoutId);

  // P36: Manually move checkout to valid state for persistence test
  const { getCheckoutRepository } = await import('@hx/commerce');
  const checkoutRepo = getCheckoutRepository();
  const checkoutData = await checkoutRepo.getById(checkout.checkoutId);
  if (checkoutData) {
    checkoutData.state = 'REVIEW_READY';
    checkoutData.validationState = 'VALID';
    checkoutData.summary = {
        totalQuantity: 1,
        subTotal: 100,
        grandTotal: 100,
        currency: 'TRY'
    };
    checkoutData.lines = [
        {
            lineId: randomUUID(),
            productId: 'p1',
            variantId: 'v1',
            storefrontId: 's1',
            quantity: 1,
            unitPrice: 100,
            lineTotal: 100,
            validationState: 'VALID',
            warnings: [],
            errors: []
        } as any
    ];
    await checkoutRepo.save(checkoutData);
    console.log('Checkout moved to REVIEW_READY/VALID');
  }

  // 2. Initiate Payment
  console.log('2. Initiating payment...');
  const idempotencyKey = 'idemp-' + checkout.checkoutId;
  const payment = await initiatePayment({
    checkoutId: checkout.checkoutId,
    paymentMethod: 'CARD',
    idempotencyKey,
    cartContext: context
  });
  console.log('Payment ID:', payment.paymentId, 'State:', payment.state);

  // 3. Idempotency Check
  console.log('3. Checking payment idempotency...');
  const payment2 = await initiatePayment({
    checkoutId: checkout.checkoutId,
    paymentMethod: 'CARD',
    idempotencyKey,
    cartContext: context
  });
  if (payment.paymentId === payment2.paymentId) {
    console.log('Payment Idempotency: SUCCESS');
  } else {
    console.error('Payment Idempotency: FAILED');
    process.exit(1);
  }

  // 4. Persistence Check
  console.log('4. Verifying payment persistence...');
  const verifiedPayment = await getPayment(payment.paymentId);
  if (verifiedPayment && verifiedPayment.paymentId === payment.paymentId) {
    console.log('Payment Persistence: SUCCESS');
  } else {
    console.error('Payment Persistence: FAILED');
    process.exit(1);
  }

  // 5. Simulate Success
  console.log('5. Simulating payment success...');
  const successResult = await simulatePaymentSuccess(payment.attempt.paymentAttemptId);
  console.log('Simulation Result State:', successResult.state);

  // 6. Create Order
  console.log('6. Creating order...');
  const orderIdempotencyKey = 'order-idemp-' + checkout.checkoutId;
  const a = await getPayment(payment.paymentId);
  console.log("payment", a);
  const order = await createOrderFromPayment({
    paymentId: payment.paymentId,
    paymentAttemptId: payment.attempt.paymentAttemptId,
    checkoutId: checkout.checkoutId,
    idempotencyKey: orderIdempotencyKey,
  });
  console.log('Order ID:', order.orderId, 'Number:', order.orderNumber, 'State:', order.state);

  // 7. Order Idempotency Check
  console.log('7. Checking order idempotency...');
  const order2 = await createOrderFromPayment({
    paymentId: payment.paymentId,
    paymentAttemptId: payment.attempt.paymentAttemptId,
    checkoutId: checkout.checkoutId,
    idempotencyKey: orderIdempotencyKey
  });
  if (order.orderId === order2.orderId) {
    console.log('Order Idempotency: SUCCESS');
  } else {
    console.error('Order Idempotency: FAILED');
    process.exit(1);
  }

  // 8. Order Persistence Check
  console.log('8. Verifying order persistence...');
  const verifiedOrder = await getOrderById(order.orderId);
  if (verifiedOrder && verifiedOrder.orderId === order.orderId) {
    console.log('Order Persistence: SUCCESS');
  } else {
    console.error('Order Persistence: FAILED');
    process.exit(1);
  }

  console.log('--- Payment/Order Smoke Test Completed Successfully ---');

  await runUnknownResultTest();
}

async function runUnknownResultTest() {
  console.log('--- Starting Unknown-Result Validation Test ---');

  const context: CartContext = {
    actorType: 'CUSTOMER',
    actorId: 'test-user-unknown-' + Date.now()
  };

  // 1. Setup Checkout
  const { startCheckout } = await simulateCheckout(context);
  const checkout = await startCheckout({ cartContext: context });
  const { getCheckoutRepository } = await import('@hx/commerce');
  const checkoutRepo = getCheckoutRepository();
  const checkoutData = await checkoutRepo.getById(checkout.checkoutId);
  if (checkoutData) {
    checkoutData.state = 'REVIEW_READY';
    checkoutData.validationState = 'VALID';
    checkoutData.summary = { totalQuantity: 1, subTotal: 100, grandTotal: 100, currency: 'TRY' };
    await checkoutRepo.save(checkoutData);
  }

  // 2. Initiate a payment, which will be in 'INITIATED' state
  const payment = await initiatePayment({
    checkoutId: checkout.checkoutId,
    paymentMethod: 'CARD',
    cartContext: context
  });
  console.log(`Payment created with state: ${payment.state}`);

  // 3. Attempt to create an order with this payment
  console.log('Attempting to create order from non-SUCCEEDED payment...');
  const order = await createOrderFromPayment({
    paymentId: payment.paymentId,
    paymentAttemptId: payment.attempt.paymentAttemptId,
    checkoutId: checkout.checkoutId
  });

  if (order.state === 'CREATE_FAILED' && order.errors.includes('PAYMENT_NOT_SUCCEEDED')) {
    console.log('Unknown-Result Validation: SUCCESS');
  } else {
    console.error(`Unknown-Result Validation: FAILED - Order state: ${order.state}`);
    process.exit(1);
  }

  console.log('--- Unknown-Result Validation Test Completed Successfully ---');
}

runPaymentOrderSmokeTest().catch(err => {
  console.error('Smoke Test Failed:', err);
  process.exit(1);
});
