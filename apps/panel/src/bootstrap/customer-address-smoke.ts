import { CustomerAccountType, CustomerAddressType } from '@hx/contracts';
import * as CustomerService from '@hx/customer';
import * as CustomerAddressService from '@hx/customer-address';

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
    log("CUSTOMER ADDRESS SMOKE START");

    const activeActorId = 'customer-active-1';
    const guestActorId = 'guest-1';
    const suspendedActorId = 'customer-suspended-1';
    const closedActorId = 'customer-closed-1';

    // 0. Setup profiles
    log("Setup Profiles");
    await CustomerService.createCustomerProfile({
        actorId: activeActorId,
        accountType: CustomerAccountType.REGISTERED_CUSTOMER,
        firstName: 'Active',
        lastName: 'User',
        email: 'active@example.com',
        phone: '1111111111',
    });

    const suspendedProfile = await CustomerService.createCustomerProfile({
        actorId: suspendedActorId,
        accountType: CustomerAccountType.REGISTERED_CUSTOMER,
        firstName: 'Suspended',
        lastName: 'User',
        email: 'suspended@example.com',
        phone: '2222222222',
    });
    await CustomerService.suspendCustomerProfile(suspendedProfile.id, 'ADMIN', { reason: 'Violation of Terms' });

    const closedProfile = await CustomerService.createCustomerProfile({
        actorId: closedActorId,
        accountType: CustomerAccountType.REGISTERED_CUSTOMER,
        firstName: 'Closed',
        lastName: 'User',
        email: 'closed@example.com',
        phone: '3333333333',
    });
    await CustomerService.closeCustomerProfile(closedProfile.id, 'ADMIN', { reason: 'Requested Account Deletion' });

    // 1. guest persistent address create FAIL
    log("STEP 1: guest persistent address create FAIL");
    let guestFailed = false;
    try {
        await CustomerAddressService.createCustomerAddress(guestActorId, 'GUEST', {
            type: CustomerAddressType.SHIPPING,
            firstName: 'Guest',
            lastName: 'User',
            phone: '000',
            city: 'Istanbul',
            district: 'Sisli',
            neighborhood: 'Merkez',
            fullAddress: 'Guest Addr 1'
        });
    } catch (e: any) {
        guestFailed = true;
        log('1. Guest address creation failed as expected', e.message);
    }
    assert(guestFailed, "Guest should not create persistent address");

    // 2. active customer create shipping address PASS
    log("STEP 2: active customer create shipping address PASS");
    const activeShipping = await CustomerAddressService.createCustomerAddress(activeActorId, 'CUSTOMER', {
        type: CustomerAddressType.SHIPPING,
        firstName: 'Active',
        lastName: 'User',
        phone: '111',
        city: 'Istanbul',
        district: 'Kadikoy',
        neighborhood: 'Moda',
        fullAddress: 'Shipping 1'
    });
    log('2. Active customer shipping address PASS', activeShipping);
    assert(activeShipping.id !== undefined, "Shipping address should be created");
    assert(activeShipping.isDefault === true, "First shipping address should be default");
    const activeShippingId = activeShipping.id;

    // 3. active customer create billing address PASS
    log("STEP 3: active customer create billing address PASS");
    const activeBilling = await CustomerAddressService.createCustomerAddress(activeActorId, 'CUSTOMER', {
        type: CustomerAddressType.BILLING,
        firstName: 'Active',
        lastName: 'User',
        phone: '111',
        city: 'Ankara',
        district: 'Cankaya',
        neighborhood: 'Kizilay',
        fullAddress: 'Billing 1'
    });
    log('3. Active customer billing address PASS', activeBilling);
    assert(activeBilling.id !== undefined, "Billing address should be created");
    assert(activeBilling.isDefault === true, "First billing address should be default");

    // 4. own update PASS
    log("STEP 4: own update PASS");
    const updatedAddress = await CustomerAddressService.updateCustomerAddress(activeActorId, activeShippingId, {
        city: 'Izmir'
    });
    log('4. Own update PASS', updatedAddress);
    assert(updatedAddress.city === 'Izmir', "Address city should be updated");

    // 5. foreign update FAIL
    log("STEP 5: foreign update FAIL");
    let foreignFailed = false;
    try {
        await CustomerAddressService.updateCustomerAddress(suspendedActorId, activeShippingId, {
            city: 'Bursa'
        });
    } catch (e: any) {
        foreignFailed = true;
        log('5. Foreign update failed as expected', e.message);
    }
    assert(foreignFailed, "Foreign update should fail");

    // 6. set default address PASS
    log("STEP 6: set default address PASS");
    // Create another shipping address first
    const activeShipping2 = await CustomerAddressService.createCustomerAddress(activeActorId, 'CUSTOMER', {
        type: CustomerAddressType.SHIPPING,
        firstName: 'Active2',
        lastName: 'User2',
        phone: '111',
        city: 'Antalya',
        district: 'Kemer',
        neighborhood: 'Merkez',
        fullAddress: 'Shipping 2'
    });
    assert(activeShipping2.isDefault === false, "Second shipping address should not be default");

    const setDefaultResult = await CustomerAddressService.setDefaultCustomerAddress(activeActorId, activeShipping2.id);
    log('6. Set default address PASS', setDefaultResult);
    assert(setDefaultResult.isDefault === true, "Address should be default now");

    // Verify first is no longer default
    const firstAddress = await CustomerAddressService.getCustomerAddress(activeActorId, activeShippingId);
    assert(firstAddress.isDefault === false, "First address should no longer be default");

    // 7. archived address set default FAIL
    log("STEP 7: archived address set default FAIL");
    await CustomerAddressService.archiveCustomerAddress(activeActorId, activeShippingId);
    let archivedDefaultFailed = false;
    try {
        await CustomerAddressService.setDefaultCustomerAddress(activeActorId, activeShippingId);
    } catch (e: any) {
        archivedDefaultFailed = true;
        log('7. Archived address set default failed as expected', e.message);
    }
    assert(archivedDefaultFailed, "Archived address should not be set to default");

    // 8. suspended customer create address FAIL
    log("STEP 8: suspended customer create address FAIL");
    let suspendedFailed = false;
    try {
        await CustomerAddressService.createCustomerAddress(suspendedActorId, 'CUSTOMER', {
            type: CustomerAddressType.SHIPPING,
            firstName: 'Suspended',
            lastName: 'User',
            phone: '000',
            city: 'Istanbul',
            district: 'Sisli',
            neighborhood: 'Merkez',
            fullAddress: 'Suspended Addr'
        });
    } catch (e: any) {
        suspendedFailed = true;
        log('8. Suspended address creation failed as expected', e.message);
    }
    assert(suspendedFailed, "Suspended customer should not create address");

    // 9. closed customer checkout eligibility FAIL
    log("STEP 9: closed customer checkout eligibility FAIL");
    const closedCheckout = await CustomerAddressService.checkCheckoutEligibility(closedActorId, 'CUSTOMER');
    log('9. Closed checkout FAIL', closedCheckout);
    assert(closedCheckout.eligible === false, "Closed customer should not be eligible for checkout");

    // 10. active customer checkout eligibility with default shipping address PASS
    log("STEP 10: active customer checkout eligibility with default shipping address PASS");
    const activeCheckoutPass = await CustomerAddressService.checkCheckoutEligibility(activeActorId, 'CUSTOMER');
    log('10. Active checkout with address PASS', activeCheckoutPass);
    assert(activeCheckoutPass.eligible === true, "Active customer with default address should be eligible");

    // 11. active customer checkout eligibility without address FAIL
    log("STEP 11: active customer checkout eligibility without address FAIL");
    const noAddressActorId = 'customer-no-address-1';
    await CustomerService.createCustomerProfile({
        actorId: noAddressActorId,
        accountType: CustomerAccountType.REGISTERED_CUSTOMER,
        firstName: 'No',
        lastName: 'Address',
        email: 'no@example.com',
        phone: '444',
    });
    const activeCheckoutFail = await CustomerAddressService.checkCheckoutEligibility(noAddressActorId, 'CUSTOMER');
    log('11. Active checkout without address FAIL', activeCheckoutFail);
    assert(activeCheckoutFail.eligible === false, "Active customer without address should not be eligible");

    log("CUSTOMER ADDRESS SMOKE PASS");
}

simulate().catch(e => {
    console.error("CUSTOMER ADDRESS SMOKE FAILED WITH UNCAUGHT EXCEPTION");
    console.error(e);
    process.exit(1);
});
