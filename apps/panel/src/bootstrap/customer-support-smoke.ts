process.env.PORT = '3030';
import { createServer } from '../../../bff/src/server';
import { config } from '../../../bff/src/config';
import * as http from 'http';
import { 
  CustomerSupportAction, 
  CustomerSupportTopic,
  CustomerSupportEligibilityErrorCode 
} from '@hx/contracts';

const PORT = config.PORT || 3030;

async function request(path: string, method: string, headers: any = {}, body?: any) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              body: data ? JSON.parse(data) : null,
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              body: data,
            });
          }
        });
      }
    );

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function assertResult(name: string, result: any, expectedAllowed: boolean, expectedReasonCode?: string) {
  const passed = result.allowed === expectedAllowed && 
    (!expectedReasonCode || result.reasonCode === expectedReasonCode);

  if (passed) {
    console.log(`✅ [PASS] ${name}`);
  } else {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Expected: allowed=${expectedAllowed}, reasonCode=${expectedReasonCode}`);
    console.error(`   Actual: allowed=${result.allowed}, reasonCode=${result.reasonCode}, reason=${result.reason}`);
    // Not exiting yet to stop server
    return false;
  }
  return true;
}

async function runSmokeTests() {
  console.log('--- CUSTOMER SUPPORT / ORDER VISIBILITY SMOKE TESTS ---\n');
  const server = createServer();
  server.start();

  let allPassed = true;

  try {
    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 500));

    const checkEligibility = async (
      actorId: string, 
      actorType: string, 
      context: any,
      action: CustomerSupportAction
    ) => {
      const res = await request(
        '/customer/support-eligibility/check',
        'POST',
        {
          'x-actor-id': actorId,
          'x-actor-type': actorType,
        },
        { context, action }
      ) as any;
      return res.body;
    };

    // 1. Guest tests
    console.log('--- 1. Guest Tests ---');
    let result = await checkEligibility('guest-1', 'GUEST', {}, CustomerSupportAction.VIEW_ORDER_HISTORY);
    if (!assertResult('Guest view order history DENY', result, false, CustomerSupportEligibilityErrorCode.UNAUTHORIZED_GUEST)) allPassed = false;

    result = await checkEligibility('guest-1', 'GUEST', {}, CustomerSupportAction.OPEN_SUPPORT_TICKET);
    if (!assertResult('Guest open support DENY', result, false, CustomerSupportEligibilityErrorCode.UNAUTHORIZED_GUEST)) allPassed = false;


    // 2. Active Customer Tests
    console.log('\n--- 2. Active Customer Tests ---');
    result = await checkEligibility('customer-1', 'CUSTOMER', {
      customerStatus: 'ACTIVE',
      customerProfileId: 'profile-1',
      orderCustomerProfileId: 'profile-1'
    }, CustomerSupportAction.VIEW_ORDER);
    if (!assertResult('Active view own order ALLOW', result, true)) allPassed = false;

    result = await checkEligibility('customer-1', 'CUSTOMER', {
      customerStatus: 'ACTIVE',
      customerProfileId: 'profile-1',
      orderCustomerProfileId: 'profile-2'
    }, CustomerSupportAction.VIEW_ORDER);
    if (!assertResult('Active view foreign order DENY', result, false, CustomerSupportEligibilityErrorCode.FOREIGN_ORDER_ACCESS_DENIED)) allPassed = false;

    result = await checkEligibility('customer-1', 'CUSTOMER', {
      customerStatus: 'ACTIVE',
      supportTopic: CustomerSupportTopic.GENERAL_SUPPORT
    }, CustomerSupportAction.OPEN_SUPPORT_TICKET);
    if (!assertResult('Active open general support ALLOW', result, true)) allPassed = false;

    result = await checkEligibility('customer-1', 'CUSTOMER', {
      customerStatus: 'ACTIVE',
      hasExistingOrderContext: false
    }, CustomerSupportAction.OPEN_RETURN_CANCEL_SUPPORT);
    if (!assertResult('Active return/cancel support without order context DENY', result, false, CustomerSupportEligibilityErrorCode.MISSING_ORDER_CONTEXT)) allPassed = false;

    result = await checkEligibility('customer-1', 'CUSTOMER', {
      customerStatus: 'ACTIVE',
      hasExistingOrderContext: true
    }, CustomerSupportAction.OPEN_RETURN_CANCEL_SUPPORT);
    if (!assertResult('Active return/cancel support with order context ALLOW', result, true)) allPassed = false;


    // 3. Suspended Customer Tests
    console.log('\n--- 3. Suspended Customer Tests ---');
    result = await checkEligibility('customer-2', 'CUSTOMER', {
      customerStatus: 'SUSPENDED',
      customerProfileId: 'profile-2',
      orderCustomerProfileId: 'profile-2',
      hasExistingOrderContext: true
    }, CustomerSupportAction.VIEW_ORDER);
    if (!assertResult('Suspended view own existing order ALLOW', result, true)) allPassed = false;

    result = await checkEligibility('customer-2', 'CUSTOMER', {
      customerStatus: 'SUSPENDED',
      hasExistingOrderContext: false
    }, CustomerSupportAction.OPEN_SUPPORT_TICKET);
    if (!assertResult('Suspended open support without order context DENY', result, false, CustomerSupportEligibilityErrorCode.SUSPENDED_NEW_SUPPORT_DENIED)) allPassed = false;

    result = await checkEligibility('customer-2', 'CUSTOMER', {
      customerStatus: 'SUSPENDED',
      hasExistingOrderContext: true
    }, CustomerSupportAction.OPEN_SUPPORT_TICKET);
    if (!assertResult('Suspended open support with order context ALLOW', result, true)) allPassed = false;


    // 4. Closed Customer Tests
    console.log('\n--- 4. Closed Customer Tests ---');
    result = await checkEligibility('customer-3', 'CUSTOMER', {
      customerStatus: 'CLOSED'
    }, CustomerSupportAction.VIEW_ORDER);
    if (!assertResult('Closed view order DENY', result, false, CustomerSupportEligibilityErrorCode.CLOSED_ACCOUNT_DENIED)) allPassed = false;

    result = await checkEligibility('customer-3', 'CUSTOMER', {
      customerStatus: 'CLOSED'
    }, CustomerSupportAction.OPEN_SUPPORT_TICKET);
    if (!assertResult('Closed open support DENY', result, false, CustomerSupportEligibilityErrorCode.CLOSED_ACCOUNT_DENIED)) allPassed = false;


    // 5. Missing Context Test
    console.log('\n--- 5. Missing Order Context Tests ---');
    result = await checkEligibility('customer-1', 'CUSTOMER', {
      customerStatus: 'ACTIVE',
      hasExistingOrderContext: false
    }, CustomerSupportAction.OPEN_DELIVERY_SUPPORT);
    if (!assertResult('Active delivery support without order context DENY', result, false, CustomerSupportEligibilityErrorCode.MISSING_ORDER_CONTEXT)) allPassed = false;

    if (allPassed) {
      console.log('\n✅ ALL CUSTOMER SUPPORT SMOKE TESTS PASSED');
    } else {
      console.error('\n❌ SOME CUSTOMER SUPPORT SMOKE TESTS FAILED');
      process.exit(1);
    }
  } catch (e) {
    console.error('Smoke tests failed:', e);
    process.exit(1);
  } finally {
    server.stop();
    process.exit(0);
  }
}

runSmokeTests();
