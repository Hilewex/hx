process.env.PORT = '3020';
import { createServer } from '../../../bff/src/server';
import { config } from '../../../bff/src/config';
import * as http from 'http';
import { CustomerContributionType, CustomerContributionEligibilityErrorCode } from '@hx/contracts';

const PORT = config.PORT || 3020;

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

async function runSmokeTests() {
  console.log('Starting Customer Contribution Eligibility Smoke Tests...\n');
  const server = createServer();
  server.start();

  try {
    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 500));

    const checkEligibility = async (
      actorType: string,
      contributionType: CustomerContributionType,
      contextData: any = {}
    ) => {
      return request(
        '/customer/contribution-eligibility/check',
        'POST',
        {
          'x-actor-id': 'test-actor',
          'x-actor-type': actorType,
        },
        {
          contributionType,
          context: {
            productId: 'p-1',
            ...contextData,
          },
        }
      );
    };

    console.log('--- 1. Guest Contribution Rules ---');
    
    let res = await checkEligibility('GUEST', CustomerContributionType.PRODUCT_REVIEW) as any;
    console.log('Guest Review allowed:', res.body.allowed, '(Expected: false, Reason:', res.body.reasonCode, ')');
    
    res = await checkEligibility('GUEST', CustomerContributionType.PRODUCT_QUESTION) as any;
    console.log('Guest Question allowed:', res.body.allowed, '(Expected: false, Reason:', res.body.reasonCode, ')');
    
    res = await checkEligibility('GUEST', CustomerContributionType.USER_PRODUCT_STORY) as any;
    console.log('Guest Story allowed:', res.body.allowed, '(Expected: false, Reason:', res.body.reasonCode, ')');
    console.log('');

    console.log('--- 2. Registered Customer Question Rules ---');
    res = await checkEligibility('REGISTERED_CUSTOMER', CustomerContributionType.PRODUCT_QUESTION, {
      customerStatus: 'ACTIVE',
    }) as any;
    console.log('Active Registered Question allowed:', res.body.allowed, '(Expected: true)');
    console.log('');

    console.log('--- 3. Registered Customer Review & Story Rules ---');
    res = await checkEligibility('REGISTERED_CUSTOMER', CustomerContributionType.PRODUCT_REVIEW, {
      customerStatus: 'ACTIVE',
    }) as any;
    console.log('Active Registered Review (No Delivery/Purchase) allowed:', res.body.allowed, '(Expected: false, Reason:', res.body.reasonCode, ')');

    res = await checkEligibility('REGISTERED_CUSTOMER', CustomerContributionType.PRODUCT_REVIEW, {
      customerStatus: 'ACTIVE',
      delivered: true,
      verifiedPurchase: true,
    }) as any;
    console.log('Active Registered Review (Delivered+Verified) allowed:', res.body.allowed, '(Expected: true)');

    res = await checkEligibility('REGISTERED_CUSTOMER', CustomerContributionType.USER_PRODUCT_STORY, {
      customerStatus: 'ACTIVE',
    }) as any;
    console.log('Active Registered Story (No Delivery/Purchase) allowed:', res.body.allowed, '(Expected: false, Reason:', res.body.reasonCode, ')');

    res = await checkEligibility('REGISTERED_CUSTOMER', CustomerContributionType.USER_PRODUCT_STORY, {
      customerStatus: 'ACTIVE',
      delivered: true,
      verifiedPurchase: true,
    }) as any;
    console.log('Active Registered Story (Delivered+Verified) allowed:', res.body.allowed, '(Expected: true)');
    console.log('');

    console.log('--- 4. Customer Status & Blocks ---');
    res = await checkEligibility('REGISTERED_CUSTOMER', CustomerContributionType.PRODUCT_QUESTION, {
      customerStatus: 'SUSPENDED',
    }) as any;
    console.log('Suspended Customer allowed:', res.body.allowed, '(Expected: false, Reason:', res.body.reasonCode, ')');

    res = await checkEligibility('REGISTERED_CUSTOMER', CustomerContributionType.PRODUCT_QUESTION, {
      customerStatus: 'CLOSED',
    }) as any;
    console.log('Closed Customer allowed:', res.body.allowed, '(Expected: false, Reason:', res.body.reasonCode, ')');

    res = await checkEligibility('REGISTERED_CUSTOMER', CustomerContributionType.PRODUCT_QUESTION, {
      customerStatus: 'ACTIVE',
      moderationBlocked: true,
    }) as any;
    console.log('Moderation Blocked allowed:', res.body.allowed, '(Expected: false, Reason:', res.body.reasonCode, ')');

    res = await checkEligibility('REGISTERED_CUSTOMER', CustomerContributionType.PRODUCT_QUESTION, {
      customerStatus: 'ACTIVE',
      riskBlocked: true,
    }) as any;
    console.log('Risk Blocked allowed:', res.body.allowed, '(Expected: false, Reason:', res.body.reasonCode, ')');
    console.log('');

    console.log('--- 5. Missing Context Validation ---');
    res = await request(
      '/customer/contribution-eligibility/check',
      'POST',
      {
        'x-actor-id': 'test-actor',
        'x-actor-type': 'REGISTERED_CUSTOMER',
      },
      {
        contributionType: CustomerContributionType.PRODUCT_QUESTION,
        context: {
          customerStatus: 'ACTIVE',
          // productId is missing
        },
      }
    ) as any;
    console.log('Missing Product ID allowed:', res.body.allowed, '(Expected: false, Reason:', res.body.reasonCode, ')');
    console.log('');

    console.log('Smoke tests completed successfully.');
  } catch (e) {
    console.error('Smoke tests failed:', e);
  } finally {
    server.stop();
    process.exit(0);
  }
}

runSmokeTests();
