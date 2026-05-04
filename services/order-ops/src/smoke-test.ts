import { getOrderOpsOverview } from './order-ops';

async function runTest() {
  console.log('--- Smoke Test @hx/order-ops ---');
  
  // Test 1: Missing orderId
  const r1 = await getOrderOpsOverview({ orderId: '' });
  if (r1.errors?.[0] !== 'ORDER_OPS_ORDER_ID_REQUIRED') throw new Error('Test 1 Failed');
  console.log('Test 1 Passed: ORDER_OPS_ORDER_ID_REQUIRED');

  // Test 2: Order Not Found
  const r2 = await getOrderOpsOverview({ orderId: 'not-found' });
  if (r2.errors?.[0] !== 'ORDER_OPS_ORDER_NOT_FOUND') throw new Error('Test 2 Failed');
  console.log('Test 2 Passed: ORDER_OPS_ORDER_NOT_FOUND');

  console.log('Test 3 SKIPPED: CREATE_SHIPMENT_ADVISORY requires fixture/mock support');
  console.log('Test 4 SKIPPED: SUPPORT_ACTOR_CONTEXT_NOT_PROVIDED requires fixture/mock support');
  console.log('Test 5 SKIPPED: Boundary flags happy-path requires fixture/mock support');

  // Test 6: Verify no mutations imported
  const fs = require('fs');
  const path = require('path');
  const content = fs.readFileSync(path.join(__dirname, 'order-ops.ts'), 'utf-8');
  
  const forbiddenImports = [
    'createOrderFromPayment',
    'createShipmentFromOrder',
    'transitionShipmentState',
    'createCancelRequest',
    'createReturnRequest',
    'transitionCancelReturnRequest',
    'createRefundFromCancelReturn',
    'processRefund',
    'transitionRefundState',
    'createSupportTicket',
    'transitionSupportTicket',
    'addSupportTicketMessage',
    'createRiskSignal',
    'createRiskCase',
    'reviewRiskCase'
  ];

  for (const forbidden of forbiddenImports) {
    if (content.includes(forbidden)) {
      throw new Error(`Test 6 Failed: Mutation function imported: ${forbidden}`);
    }
  }
  console.log('Test 6 Passed: No mutation functions imported');

  console.log('--- Smoke Test Passed ---');
}

runTest().catch(e => {
  console.error(e);
  process.exit(1);
});





