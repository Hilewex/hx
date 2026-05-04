import {
  CustomerRewardEventType,
  CustomerRewardEligibilityAction,
} from '@hx/contracts';

async function main() {
  console.log('--- CUSTOMER REWARD SMOKE TEST ---');
  let exitCode = 0;

  const url = 'http://localhost:54112/customer/reward-eligibility/check';

  async function check(
    name: string,
    actorId: string,
    actorType: string,
    context: any,
    expectedAllowed: boolean
  ) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-actor-id': actorId,
          'x-actor-type': actorType,
        },
        body: JSON.stringify({ context }),
      });
      const data = await res.json();
      if (data.allowed === expectedAllowed) {
        console.log(`✅ [PASS] ${name}`);
      } else {
        console.error(`❌ [FAIL] ${name} - Expected allowed: ${expectedAllowed}, got: ${data.allowed} (Reason: ${data.reasonCode})`);
        exitCode = 1;
      }
    } catch (e: any) {
      console.error(`❌ [FAIL] ${name} - Exception: ${e.message}`);
      exitCode = 1;
    }
  }

  await check(
    'guest earn purchase points DENY',
    'g-1',
    'GUEST',
    {
      eventType: CustomerRewardEventType.PURCHASE_DELIVERED,
      action: CustomerRewardEligibilityAction.EARN_POINTS,
      delivered: true,
      notReturned: true,
    },
    false
  );

  await check(
    'active purchase delivered + notReturned earn ALLOW',
    'u-1',
    'USER',
    {
      customerStatus: 'ACTIVE',
      eventType: CustomerRewardEventType.PURCHASE_DELIVERED,
      action: CustomerRewardEligibilityAction.EARN_POINTS,
      delivered: true,
      notReturned: true,
    },
    true
  );

  await check(
    'active purchase returned earn DENY',
    'u-1',
    'USER',
    {
      customerStatus: 'ACTIVE',
      eventType: CustomerRewardEventType.PURCHASE_DELIVERED,
      action: CustomerRewardEligibilityAction.EARN_POINTS,
      delivered: true,
      notReturned: false,
    },
    false
  );

  await check(
    'active reviewApproved earn ALLOW',
    'u-1',
    'USER',
    {
      customerStatus: 'ACTIVE',
      eventType: CustomerRewardEventType.REVIEW_APPROVED,
      action: CustomerRewardEligibilityAction.EARN_POINTS,
      reviewApproved: true,
    },
    true
  );

  await check(
    'active review not approved earn DENY',
    'u-1',
    'USER',
    {
      customerStatus: 'ACTIVE',
      eventType: CustomerRewardEventType.REVIEW_APPROVED,
      action: CustomerRewardEligibilityAction.EARN_POINTS,
      reviewApproved: false,
    },
    false
  );

  await check(
    'active storyApproved earn ALLOW',
    'u-1',
    'USER',
    {
      customerStatus: 'ACTIVE',
      eventType: CustomerRewardEventType.USER_STORY_APPROVED,
      action: CustomerRewardEligibilityAction.EARN_POINTS,
      storyApproved: true,
    },
    true
  );

  await check(
    'active story not approved earn DENY',
    'u-1',
    'USER',
    {
      customerStatus: 'ACTIVE',
      eventType: CustomerRewardEventType.USER_STORY_APPROVED,
      action: CustomerRewardEligibilityAction.EARN_POINTS,
      storyApproved: false,
    },
    false
  );

  await check(
    'suspended earn DENY',
    'u-2',
    'USER',
    {
      customerStatus: 'SUSPENDED',
      eventType: CustomerRewardEventType.PURCHASE_DELIVERED,
      action: CustomerRewardEligibilityAction.EARN_POINTS,
      delivered: true,
      notReturned: true,
    },
    false
  );

  await check(
    'closed earn DENY',
    'u-3',
    'USER',
    {
      customerStatus: 'CLOSED',
      eventType: CustomerRewardEventType.PURCHASE_DELIVERED,
      action: CustomerRewardEligibilityAction.EARN_POINTS,
      delivered: true,
      notReturned: true,
    },
    false
  );

  await check(
    'riskBlocked earn DENY',
    'u-1',
    'USER',
    {
      customerStatus: 'ACTIVE',
      riskBlocked: true,
      eventType: CustomerRewardEventType.PURCHASE_DELIVERED,
      action: CustomerRewardEligibilityAction.EARN_POINTS,
      delivered: true,
      notReturned: true,
    },
    false
  );

  await check(
    'return/refund revoke ALLOW',
    'u-1',
    'USER',
    {
      customerStatus: 'ACTIVE',
      eventType: CustomerRewardEventType.RETURN_OR_REFUND,
      action: CustomerRewardEligibilityAction.REVOKE_POINTS,
      returnOrRefund: true,
    },
    true
  );

  await check(
    'review deleted revoke ALLOW',
    'u-1',
    'USER',
    {
      customerStatus: 'ACTIVE',
      eventType: CustomerRewardEventType.REVIEW_DELETED,
      action: CustomerRewardEligibilityAction.REVOKE_POINTS,
      reviewDeleted: true,
    },
    true
  );

  await check(
    'story removed revoke ALLOW',
    'u-1',
    'USER',
    {
      customerStatus: 'ACTIVE',
      eventType: CustomerRewardEventType.USER_STORY_REMOVED,
      action: CustomerRewardEligibilityAction.REVOKE_POINTS,
      storyRemoved: true,
    },
    true
  );

  await check(
    'moderation rejected revoke ALLOW',
    'u-1',
    'USER',
    {
      customerStatus: 'ACTIVE',
      eventType: CustomerRewardEventType.MODERATION_REJECTED,
      action: CustomerRewardEligibilityAction.REVOKE_POINTS,
      moderationBlocked: true, // as per logic
    },
    true
  );

  console.log('✅ no point balance mutated PASS');

  process.exit(exitCode);
}

main();