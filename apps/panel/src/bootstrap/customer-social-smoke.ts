import { CustomerSocialAction } from '@hx/contracts';

async function runSmokeTests() {
  const checkEligibility = async (
    actorType: string,
    action: CustomerSocialAction,
    contextArgs: any
  ) => {
    try {
      const response = await fetch('http://localhost:54112/customer/social-eligibility/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-actor-id': 'smoke-actor-id',
          'x-actor-type': actorType,
        },
        body: JSON.stringify({
          action,
          context: {
            actorId: 'smoke-actor-id',
            actorType,
            ...contextArgs,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (e: any) {
      return { allowed: false, reason: e.message };
    }
  };

  console.log('--- CUSTOMER SOCIAL SMOKE TESTS ---\n');

  // Scenario 1: Guest follow DENY
  console.log('1. Guest follow DENY');
  const res1 = await checkEligibility('GUEST', CustomerSocialAction.FOLLOW_STOREFRONT, { storefrontId: 'sf-1' });
  console.log(res1);

  // Scenario 2: Guest message DENY
  console.log('\n2. Guest message DENY');
  const res2 = await checkEligibility('GUEST', CustomerSocialAction.SEND_STORE_MESSAGE, { storefrontId: 'sf-1' });
  console.log(res2);

  // Scenario 3: active registered follow active/public storefront ALLOW
  console.log('\n3. Active registered follow active/public storefront ALLOW');
  const res3 = await checkEligibility('REGISTERED_CUSTOMER', CustomerSocialAction.FOLLOW_STOREFRONT, {
    customerStatus: 'ACTIVE',
    storefrontId: 'sf-1',
    storefrontStatus: 'ACTIVE',
    storefrontVisibility: 'PUBLIC',
  });
  console.log(res3);

  // Scenario 4: active registered message active/public/messageAllowed storefront ALLOW
  console.log('\n4. Active registered message active/public/messageAllowed storefront ALLOW');
  const res4 = await checkEligibility('REGISTERED_CUSTOMER', CustomerSocialAction.SEND_STORE_MESSAGE, {
    customerStatus: 'ACTIVE',
    storefrontId: 'sf-1',
    storefrontStatus: 'ACTIVE',
    storefrontVisibility: 'PUBLIC',
    messageAllowedByStorefront: true,
  });
  console.log(res4);

  // Scenario 5: suspended follow DENY
  console.log('\n5. Suspended follow DENY');
  const res5 = await checkEligibility('REGISTERED_CUSTOMER', CustomerSocialAction.FOLLOW_STOREFRONT, {
    customerStatus: 'SUSPENDED',
    storefrontId: 'sf-1',
  });
  console.log(res5);

  // Scenario 6: closed follow DENY
  console.log('\n6. Closed follow DENY');
  const res6 = await checkEligibility('REGISTERED_CUSTOMER', CustomerSocialAction.FOLLOW_STOREFRONT, {
    customerStatus: 'CLOSED',
    storefrontId: 'sf-1',
  });
  console.log(res6);

  // Scenario 7: hidden storefront follow DENY
  console.log('\n7. Hidden storefront follow DENY');
  const res7 = await checkEligibility('REGISTERED_CUSTOMER', CustomerSocialAction.FOLLOW_STOREFRONT, {
    customerStatus: 'ACTIVE',
    storefrontId: 'sf-1',
    storefrontVisibility: 'HIDDEN',
  });
  console.log(res7);

  // Scenario 8: suspended storefront message DENY
  console.log('\n8. Suspended storefront message DENY');
  const res8 = await checkEligibility('REGISTERED_CUSTOMER', CustomerSocialAction.SEND_STORE_MESSAGE, {
    customerStatus: 'ACTIVE',
    storefrontId: 'sf-1',
    storefrontStatus: 'SUSPENDED',
  });
  console.log(res8);

  // Scenario 9: alreadyFollowing follow DENY with ALREADY_FOLLOWING
  console.log('\n9. alreadyFollowing follow DENY with ALREADY_FOLLOWING');
  const res9 = await checkEligibility('REGISTERED_CUSTOMER', CustomerSocialAction.FOLLOW_STOREFRONT, {
    customerStatus: 'ACTIVE',
    storefrontId: 'sf-1',
    alreadyFollowing: true,
  });
  console.log(res9);

  // Scenario 10: messageAllowedByStorefront false DENY
  console.log('\n10. messageAllowedByStorefront false DENY');
  const res10 = await checkEligibility('REGISTERED_CUSTOMER', CustomerSocialAction.SEND_STORE_MESSAGE, {
    customerStatus: 'ACTIVE',
    storefrontId: 'sf-1',
    messageAllowedByStorefront: false,
  });
  console.log(res10);

  // Scenario 11: missing storefrontId DENY
  console.log('\n11. missing storefrontId DENY');
  const res11 = await checkEligibility('REGISTERED_CUSTOMER', CustomerSocialAction.FOLLOW_STOREFRONT, {
    customerStatus: 'ACTIVE',
    storefrontId: '',
  });
  console.log(res11);

  console.log('\n--- SOCIAL SMOKE TESTS COMPLETED ---');
}

runSmokeTests().catch(console.error);
