
import axios from 'axios';
import { CustomerAccountType, CustomerProfileVisibility } from '@hx/contracts';

const PORT = process.env.PORT || 3000;
const bff = axios.create({
    baseURL: `http://localhost:${PORT}`, 
    headers: {
        'Content-Type': 'application/json',
    },
});

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

async function handleRequest(title: string, request: Promise<any>, expectSuccess: boolean = true) {
    log(title);
    try {
        const response = await request;
        log(`Response for: ${title}`, response.data);
        if (expectSuccess) {
            assert(response.data.success, `Expected success for "${title}" but failed.`);
            return response.data.data;
        } else {
            assert(!response.data.success, `Expected failure for "${title}" but succeeded.`);
            return response.data.error;
        }
    } catch (error: any) {
        log(`Error for: ${title}`, error.response?.data || error.message);
        if (expectSuccess) {
            assert(false, `Request failed for "${title}"`);
        } else {
            assert(true, `Request failed as expected for "${title}"`);
            return error.response?.data?.error;
        }
    }
}

async function simulate() {
    log("PX-KULLANICI-01 Customer Smoke Test START");

    const customerActor = { 'x-actor-id': 'customer-1', 'x-actor-type': 'CUSTOMER' };
    const guestActor = { 'x-actor-id': 'guest-1', 'x-actor-type': 'GUEST_CONTEXT' };
    const otherCustomerActor = { 'x-actor-id': 'customer-2', 'x-actor-type': 'CUSTOMER' };
    const adminActor = { 'x-actor-id': 'admin-1', 'x-actor-type': 'ADMIN' };

    // 1. Create customer profile PASS
    const createProfileCmd = {
        accountType: CustomerAccountType.REGISTERED_CUSTOMER,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
    };
    const createResult = await handleRequest('1. Create customer profile PASS', bff.post('/customer/profile', createProfileCmd, { headers: customerActor }));
    const customerProfileId = createResult.id;

    // 2. Guest context persistent profile create FAIL
    const guestProfileCmd = {
        ...createProfileCmd,
        accountType: CustomerAccountType.GUEST_CONTEXT
    };
    await handleRequest('2. Guest context persistent profile create FAIL', bff.post('/customer/profile', guestProfileCmd, { headers: guestActor }), false);


    // 3. Customer own update PASS
    const updateProfileCmd = {
        firstName: 'Johnathan',
        visibility: CustomerProfileVisibility.LIMITED,
    };
    await handleRequest('3. Customer own update PASS', bff.patch(`/customer/profile/${customerProfileId}`, updateProfileCmd, { headers: customerActor }));

    // 4. Customer update foreign profile FAIL
    await handleRequest('4. Customer update foreign profile FAIL', bff.patch(`/customer/profile/${customerProfileId}`, updateProfileCmd, { headers: otherCustomerActor }), false);

    // 5. Admin suspend PASS
    const suspendCmd = { reason: 'Violation of terms of service.' };
    await handleRequest('5. Admin suspend PASS', bff.post(`/customer/admin/profiles/${customerProfileId}/suspend`, suspendCmd, { headers: adminActor }));

    // 6. Suspended customer update FAIL
    await handleRequest('6. Suspended customer update FAIL', bff.patch(`/customer/profile/${customerProfileId}`, updateProfileCmd, { headers: customerActor }), false);

    // 7. Admin reactivate PASS
    const reactivateCmd = { reason: 'Suspension period ended.' };
    await handleRequest('7. Admin reactivate PASS', bff.post(`/customer/admin/profiles/${customerProfileId}/reactivate`, reactivateCmd, { headers: adminActor }));

    // 8. Admin close PASS
    const closeCmd = { reason: 'User requested account closure.' };
    await handleRequest('8. Admin close PASS', bff.post(`/customer/admin/profiles/${customerProfileId}/close`, closeCmd, { headers: adminActor }));

    // 9. Closed profile reactivate FAIL
    await handleRequest('9. Closed profile reactivate FAIL', bff.post(`/customer/admin/profiles/${customerProfileId}/reactivate`, reactivateCmd, { headers: adminActor }), false);

    log("PX-KULLANICI-01 Customer Smoke Test END: ALL TESTS PASSED");
}

simulate().catch(e => {
    console.error("SIMULATION FAILED WITH UNCAUGHT EXCEPTION");
    console.error(e.response?.data || e.message);
    process.exit(1);
});
