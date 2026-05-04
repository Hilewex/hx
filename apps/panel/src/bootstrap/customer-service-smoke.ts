import { CustomerAccountType, CustomerProfileVisibility, CustomerCapability } from '@hx/contracts';
import * as CustomerService from '@hx/customer';

function log(title: string, data?: any) {
    console.log(`\n--- ${title} ---`);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
}

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`ASSERTION FAILED: ${message}`);
        process.exit(1);
    }
}

async function simulate() {
    log("CUSTOMER SERVICE SMOKE START");

    const customerActorId = 'customer-1';
    const guestActorId = 'guest-1';
    const otherCustomerActorId = 'customer-2';
    
    // 1. Create customer profile PASS
    log("STEP 1: registered customer profile create");
    const createProfileCmd = {
        actorId: customerActorId,
        accountType: CustomerAccountType.REGISTERED_CUSTOMER,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
    };
    const createResult = await CustomerService.createCustomerProfile(createProfileCmd);
    log('1. Create customer profile PASS', createResult);
    assert(createResult.id !== undefined, "Profile ID should be generated");
    const customerProfileId = createResult.id;

    // 2. Guest context persistent profile create FAIL
    log("STEP 2: guest persistent profile create");
    const guestProfileCmd = {
        ...createProfileCmd,
        actorId: guestActorId,
        accountType: CustomerAccountType.GUEST_CONTEXT
    };
    let guestFailed = false;
    try {
        await CustomerService.createCustomerProfile(guestProfileCmd);
    } catch (e: any) {
        guestFailed = true;
        log('2. Guest profile creation failed as expected', e.message);
    }
    assert(guestFailed, "Guest context should not create persistent profile");

    // Capability Checks for GUEST
    log("STEP 2A: Guest Capabilities");
    const guestBrowse = await CustomerService.checkCustomerCapability({ capability: CustomerCapability.BROWSE_PUBLIC_CATALOG, context: { actorId: guestActorId, actorType: 'GUEST' } });
    assert(guestBrowse.allowed === true, "guest browse catalog ALLOW");
    const guestCart = await CustomerService.checkCustomerCapability({ capability: CustomerCapability.ADD_TO_CART, context: { actorId: guestActorId, actorType: 'GUEST' } });
    assert(guestCart.allowed === true, "guest add to cart ALLOW");
    const guestReview = await CustomerService.checkCustomerCapability({ capability: CustomerCapability.WRITE_REVIEW, context: { actorId: guestActorId, actorType: 'GUEST' } });
    assert(guestReview.allowed === false, "guest write review DENY");
    const guestStory = await CustomerService.checkCustomerCapability({ capability: CustomerCapability.CREATE_USER_PRODUCT_STORY, context: { actorId: guestActorId, actorType: 'GUEST' } });
    assert(guestStory.allowed === false, "guest story DENY");
    const guestFollow = await CustomerService.checkCustomerCapability({ capability: CustomerCapability.FOLLOW_STORE, context: { actorId: guestActorId, actorType: 'GUEST' } });
    assert(guestFollow.allowed === false, "guest follow store DENY");

    // Capability Checks for ACTIVE REGISTERED
    log("STEP 2B: Active Registered Capabilities");
    const activeAsk = await CustomerService.checkCustomerCapability({ capability: CustomerCapability.ASK_PRODUCT_QUESTION, context: { actorId: customerActorId, actorType: 'CUSTOMER' } });
    assert(activeAsk.allowed === true, "registered active ask question ALLOW");
    const activeReview = await CustomerService.checkCustomerCapability({ capability: CustomerCapability.WRITE_REVIEW, context: { actorId: customerActorId, actorType: 'CUSTOMER' } });
    assert(activeReview.allowed === false, "registered active write review DENY without purchase eligibility");


    // 3. Customer own update PASS
    log("STEP 3: own update");
    const updateProfileCmd = {
        firstName: 'Johnathan',
        visibility: CustomerProfileVisibility.LIMITED,
    };
    const updateResult = await CustomerService.updateCustomerProfile(customerProfileId, customerActorId, 'CUSTOMER', updateProfileCmd as any);
    log('3. Customer own update PASS', updateResult);
    assert(updateResult.version === 2, "Profile should be updated");

    // 4. Customer update foreign profile FAIL
    log("STEP 4: foreign update");
    let foreignUpdateFailed = false;
    try {
        await CustomerService.updateCustomerProfile(customerProfileId, otherCustomerActorId, 'CUSTOMER', updateProfileCmd as any);
    } catch (e: any) {
        foreignUpdateFailed = true;
        log('4. Foreign update failed as expected', e.message);
    }
    assert(foreignUpdateFailed, "Customer should not update foreign profile");

    // 5. Admin suspend PASS
    log("STEP 5: admin suspend");
    const suspendCmd = { reason: 'Violation of terms of service.' };
    const suspendResult = await CustomerService.suspendCustomerProfile(customerProfileId, 'ADMIN', suspendCmd);
    log('5. Admin suspend PASS', suspendResult);
    assert(suspendResult.version === 3, "Profile should be suspended");

    // Capability checks for SUSPENDED
    log("STEP 5A: Suspended Capabilities");
    const suspendedCart = await CustomerService.checkCustomerCapability({ capability: CustomerCapability.ADD_TO_CART, context: { actorId: customerActorId, actorType: 'CUSTOMER' } });
    assert(suspendedCart.allowed === false, "suspended customer add to cart DENY");
    const suspendedMessage = await CustomerService.checkCustomerCapability({ capability: CustomerCapability.SEND_STORE_MESSAGE, context: { actorId: customerActorId, actorType: 'CUSTOMER' } });
    assert(suspendedMessage.allowed === false, "suspended customer send message DENY");

    // 6. Suspended customer update FAIL
    log("STEP 6: suspended profile update");
    let suspendedUpdateFailed = false;
    try {
        await CustomerService.updateCustomerProfile(customerProfileId, customerActorId, 'CUSTOMER', updateProfileCmd as any);
    } catch (e: any) {
        suspendedUpdateFailed = true;
        log('6. Suspended update failed as expected', e.message);
    }
    assert(suspendedUpdateFailed, "Suspended profile should not be updated by customer");

    // 7. Admin reactivate PASS
    log("STEP 7: admin reactivate");
    const reactivateCmd = { reason: 'Suspension period ended.' };
    const reactivateResult = await CustomerService.reactivateCustomerProfile(customerProfileId, 'ADMIN', reactivateCmd);
    log('7. Admin reactivate PASS', reactivateResult);
    assert(reactivateResult.version === 4, "Profile should be active");

    // 8. Admin close PASS
    log("STEP 8: admin close");
    const closeCmd = { reason: 'User requested account closure.' };
    const closeResult = await CustomerService.closeCustomerProfile(customerProfileId, 'ADMIN', closeCmd);
    log('8. Admin close PASS', closeResult);
    assert(closeResult.version === 5, "Profile should be closed");

    // Capability checks for CLOSED
    log("STEP 8A: Closed Capabilities");
    const closedBrowse = await CustomerService.checkCustomerCapability({ capability: CustomerCapability.BROWSE_PUBLIC_CATALOG, context: { actorId: customerActorId, actorType: 'CUSTOMER' } });
    assert(closedBrowse.allowed === false, "closed customer browse or active action DENY");

    // 9. Closed profile reactivate FAIL
    log("STEP 9: closed profile reactivate");
    let closedReactivateFailed = false;
    try {
        await CustomerService.reactivateCustomerProfile(customerProfileId, 'ADMIN', reactivateCmd);
    } catch (e: any) {
        closedReactivateFailed = true;
        log('9. Closed reactivate failed as expected', e.message);
    }
    assert(closedReactivateFailed, "Closed profile should not be reactivated");

    log("CUSTOMER SERVICE SMOKE PASS");
}

simulate().catch(e => {
    console.error("CUSTOMER SERVICE SMOKE FAILED WITH UNCAUGHT EXCEPTION");
    console.error(e);
    process.exit(1);
});
