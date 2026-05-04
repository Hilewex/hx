import { 
  getCart, 
  addToCart, 
  updateCartLine, 
  removeCartLine, 
  clearCart
} from './cart';
import { CartContext } from '@hx/contracts';

async function runCartSmokeTest() {
  console.log('--- Starting Cart Persistence Smoke Test ---');
  
  process.env.PERSISTENCE_MODE = process.env.PERSISTENCE_MODE || 'memory';
  console.log(`Mode: ${process.env.PERSISTENCE_MODE}`);

  const context: CartContext = {
    actorType: 'CUSTOMER',
    actorId: 'test-user-123'
  };

  // 1. Initial State
  const initial = await getCart(context);
  console.log('Initial Cart lines count:', initial.data.lines.length);

  // 2. Add Item
  const added = await addToCart(context, {
    productId: 'p1',
    storefrontId: 's1',
    quantity: 2
  });
  console.log('Added Item. New lines count:', added.data.lines.length);
  const lineId = added.data.lines[0].lineId;

  // 3. Update Item
  const updated = await updateCartLine(context, {
    lineId,
    quantity: 5
  });
  console.log('Updated Item. New quantity:', updated.data.lines[0].quantity);

  // 4. Persistence Check
  console.log('Verifying persistence...');
  const verify = await getCart(context);
  if (verify.data.lines[0].quantity === 5) {
    console.log('Persistence verification: SUCCESS');
  } else {
    console.error('Persistence verification: FAILED');
    process.exit(1);
  }

  // 5. Remove Item
  await removeCartLine(context, { lineId });
  const afterRemove = await getCart(context);
  console.log('After remove lines count:', afterRemove.data.lines.length);

  // 6. Clear Cart
  await clearCart(context);
  const afterClear = await getCart(context);
  console.log('After clear lines count:', afterClear.data.lines.length);

  console.log('--- Cart Persistence Smoke Test Completed Successfully ---');
}

runCartSmokeTest().catch(err => {
  console.error('Smoke Test Failed:', err);
  process.exit(1);
});
