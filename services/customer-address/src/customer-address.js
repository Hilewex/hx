"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCheckoutEligibility = exports.listCustomerAddresses = exports.getCustomerAddress = exports.setDefaultCustomerAddress = exports.archiveCustomerAddress = exports.updateCustomerAddress = exports.createCustomerAddress = void 0;
const contracts_1 = require("@hx/contracts");
const customer_1 = require("@hx/customer");
// In-memory foundation store
const addresses = [];
// Helpers
const checkCustomerAccountStatus = async (customerId) => {
    const profile = await (0, customer_1.getCustomerProfileByActorId)(customerId);
    if (!profile) {
        throw new Error(contracts_1.CustomerAddressErrorCode.CUSTOMER_NOT_FOUND);
    }
    if (profile.status === contracts_1.CustomerAccountStatus.SUSPENDED) {
        throw new Error(contracts_1.CustomerAddressErrorCode.SUSPENDED_CUSTOMER_CANNOT_CREATE_ADDRESS);
    }
    if (profile.status === contracts_1.CustomerAccountStatus.CLOSED) {
        throw new Error(contracts_1.CustomerAddressErrorCode.CLOSED_CUSTOMER_CANNOT_CREATE_ADDRESS);
    }
};
const createCustomerAddress = async (actorId, actorType, command) => {
    if (actorType === 'GUEST') {
        throw new Error(contracts_1.CustomerAddressErrorCode.GUEST_CANNOT_CREATE_ADDRESS);
    }
    await checkCustomerAccountStatus(actorId);
    const newAddress = {
        id: `addr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        customerId: actorId,
        type: command.type,
        status: contracts_1.CustomerAddressStatus.ACTIVE,
        isDefault: false,
        firstName: command.firstName,
        lastName: command.lastName,
        phone: command.phone,
        city: command.city,
        district: command.district,
        neighborhood: command.neighborhood,
        fullAddress: command.fullAddress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    // Default address uniqueness guard
    const existingAddresses = addresses.filter((a) => a.customerId === actorId && a.type === command.type && a.status === contracts_1.CustomerAddressStatus.ACTIVE);
    if (existingAddresses.length === 0) {
        newAddress.isDefault = true;
    }
    addresses.push(newAddress);
    return newAddress;
};
exports.createCustomerAddress = createCustomerAddress;
const updateCustomerAddress = async (actorId, addressId, command) => {
    const address = addresses.find((a) => a.id === addressId);
    if (!address) {
        throw new Error(contracts_1.CustomerAddressErrorCode.ADDRESS_NOT_FOUND);
    }
    // Customer ownership guard
    if (address.customerId !== actorId) {
        throw new Error(contracts_1.CustomerAddressErrorCode.UNAUTHORIZED_ACCESS);
    }
    await checkCustomerAccountStatus(actorId);
    Object.assign(address, {
        ...command,
        updatedAt: new Date().toISOString(),
    });
    return address;
};
exports.updateCustomerAddress = updateCustomerAddress;
const archiveCustomerAddress = async (actorId, addressId) => {
    const address = addresses.find((a) => a.id === addressId);
    if (!address) {
        throw new Error(contracts_1.CustomerAddressErrorCode.ADDRESS_NOT_FOUND);
    }
    if (address.customerId !== actorId) {
        throw new Error(contracts_1.CustomerAddressErrorCode.UNAUTHORIZED_ACCESS);
    }
    await checkCustomerAccountStatus(actorId);
    address.status = contracts_1.CustomerAddressStatus.ARCHIVED;
    if (address.isDefault) {
        address.isDefault = false;
        // Maybe set another active one as default?
        const otherActive = addresses.find((a) => a.customerId === actorId && a.type === address.type && a.status === contracts_1.CustomerAddressStatus.ACTIVE);
        if (otherActive) {
            otherActive.isDefault = true;
        }
    }
    address.updatedAt = new Date().toISOString();
    return address;
};
exports.archiveCustomerAddress = archiveCustomerAddress;
const setDefaultCustomerAddress = async (actorId, addressId) => {
    const address = addresses.find((a) => a.id === addressId);
    if (!address) {
        throw new Error(contracts_1.CustomerAddressErrorCode.ADDRESS_NOT_FOUND);
    }
    if (address.customerId !== actorId) {
        throw new Error(contracts_1.CustomerAddressErrorCode.UNAUTHORIZED_ACCESS);
    }
    await checkCustomerAccountStatus(actorId);
    if (address.status === contracts_1.CustomerAddressStatus.ARCHIVED) {
        throw new Error(contracts_1.CustomerAddressErrorCode.ARCHIVED_ADDRESS_CANNOT_BE_DEFAULT);
    }
    // Set all others of same type to false
    addresses
        .filter((a) => a.customerId === actorId && a.type === address.type)
        .forEach((a) => (a.isDefault = false));
    address.isDefault = true;
    address.updatedAt = new Date().toISOString();
    return address;
};
exports.setDefaultCustomerAddress = setDefaultCustomerAddress;
const getCustomerAddress = async (actorId, addressId) => {
    const address = addresses.find((a) => a.id === addressId);
    if (!address) {
        throw new Error(contracts_1.CustomerAddressErrorCode.ADDRESS_NOT_FOUND);
    }
    if (address.customerId !== actorId) {
        throw new Error(contracts_1.CustomerAddressErrorCode.UNAUTHORIZED_ACCESS);
    }
    return address;
};
exports.getCustomerAddress = getCustomerAddress;
const listCustomerAddresses = async (actorId) => {
    return addresses.filter((a) => a.customerId === actorId);
};
exports.listCustomerAddresses = listCustomerAddresses;
const checkCheckoutEligibility = async (actorId, actorType) => {
    if (actorType === 'GUEST') {
        // Guests are eligible by default from an address perspective.
        // The checkout service is responsible for validating the provided address snapshot.
        return { eligible: true };
    }
    // For registered customers, perform full checks.
    const profile = await (0, customer_1.getCustomerProfileByActorId)(actorId);
    if (profile?.status === contracts_1.CustomerAccountStatus.CLOSED) {
        return { eligible: false, reason: contracts_1.CustomerAddressErrorCode.CLOSED_CUSTOMER_CANNOT_CHECKOUT };
    }
    // Active registered customers must have a default shipping address.
    const hasActiveShipping = addresses.some((a) => a.customerId === actorId && a.type === contracts_1.CustomerAddressType.SHIPPING && a.status === contracts_1.CustomerAddressStatus.ACTIVE && a.isDefault);
    if (!hasActiveShipping) {
        return { eligible: false, reason: 'NO_DEFAULT_SHIPPING_ADDRESS' };
    }
    return { eligible: true };
};
exports.checkCheckoutEligibility = checkCheckoutEligibility;
