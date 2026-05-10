import {
  CustomerAddress,
  CustomerAddressType,
  CustomerAddressStatus,
  CreateCustomerAddressCommand,
  UpdateCustomerAddressCommand,
  CustomerAddressErrorCode,
  CheckoutEligibilityResult,
  CustomerAccountStatus,
} from '@hx/contracts';
import { getCustomerProfileByActorId } from '@hx/customer';

// In-memory foundation store
const addresses: CustomerAddress[] = [];

// Helpers
const checkCustomerAccountStatus = async (customerId: string) => {
  const profile = await getCustomerProfileByActorId(customerId);
  if (!profile) {
    throw new Error(CustomerAddressErrorCode.CUSTOMER_NOT_FOUND);
  }
  if (profile.status === CustomerAccountStatus.SUSPENDED) {
    throw new Error(CustomerAddressErrorCode.SUSPENDED_CUSTOMER_CANNOT_CREATE_ADDRESS);
  }
  if (profile.status === CustomerAccountStatus.CLOSED) {
    throw new Error(CustomerAddressErrorCode.CLOSED_CUSTOMER_CANNOT_CREATE_ADDRESS);
  }
};

export const createCustomerAddress = async (
  actorId: string,
  actorType: string,
  command: CreateCustomerAddressCommand
): Promise<CustomerAddress> => {
  if (actorType === 'GUEST') {
    throw new Error(CustomerAddressErrorCode.GUEST_CANNOT_CREATE_ADDRESS);
  }

  await checkCustomerAccountStatus(actorId);

  const newAddress: CustomerAddress = {
    id: `addr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    customerId: actorId,
    type: command.type,
    status: CustomerAddressStatus.ACTIVE,
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
  const existingAddresses = addresses.filter(
    (a) => a.customerId === actorId && a.type === command.type && a.status === CustomerAddressStatus.ACTIVE
  );
  if (existingAddresses.length === 0) {
    newAddress.isDefault = true;
  }

  addresses.push(newAddress);
  return newAddress;
};

export const updateCustomerAddress = async (
  actorId: string,
  addressId: string,
  command: UpdateCustomerAddressCommand
): Promise<CustomerAddress> => {
  const address = addresses.find((a) => a.id === addressId);
  if (!address) {
    throw new Error(CustomerAddressErrorCode.ADDRESS_NOT_FOUND);
  }

  // Customer ownership guard
  if (address.customerId !== actorId) {
    throw new Error(CustomerAddressErrorCode.UNAUTHORIZED_ACCESS);
  }

  await checkCustomerAccountStatus(actorId);

  Object.assign(address, {
    ...command,
    updatedAt: new Date().toISOString(),
  });

  return address;
};

export const archiveCustomerAddress = async (
  actorId: string,
  addressId: string
): Promise<CustomerAddress> => {
  const address = addresses.find((a) => a.id === addressId);
  if (!address) {
    throw new Error(CustomerAddressErrorCode.ADDRESS_NOT_FOUND);
  }

  if (address.customerId !== actorId) {
    throw new Error(CustomerAddressErrorCode.UNAUTHORIZED_ACCESS);
  }

  await checkCustomerAccountStatus(actorId);

  address.status = CustomerAddressStatus.ARCHIVED;
  if (address.isDefault) {
    address.isDefault = false;
    // Maybe set another active one as default?
    const otherActive = addresses.find(
      (a) => a.customerId === actorId && a.type === address.type && a.status === CustomerAddressStatus.ACTIVE
    );
    if (otherActive) {
      otherActive.isDefault = true;
    }
  }
  address.updatedAt = new Date().toISOString();

  return address;
};

export const setDefaultCustomerAddress = async (
  actorId: string,
  addressId: string
): Promise<CustomerAddress> => {
  const address = addresses.find((a) => a.id === addressId);
  if (!address) {
    throw new Error(CustomerAddressErrorCode.ADDRESS_NOT_FOUND);
  }

  if (address.customerId !== actorId) {
    throw new Error(CustomerAddressErrorCode.UNAUTHORIZED_ACCESS);
  }

  await checkCustomerAccountStatus(actorId);

  if (address.status === CustomerAddressStatus.ARCHIVED) {
    throw new Error(CustomerAddressErrorCode.ARCHIVED_ADDRESS_CANNOT_BE_DEFAULT);
  }

  // Set all others of same type to false
  addresses
    .filter((a) => a.customerId === actorId && a.type === address.type)
    .forEach((a) => (a.isDefault = false));

  address.isDefault = true;
  address.updatedAt = new Date().toISOString();

  return address;
};

export const getCustomerAddress = async (
  actorId: string,
  addressId: string
): Promise<CustomerAddress> => {
  const address = addresses.find((a) => a.id === addressId);
  if (!address) {
    throw new Error(CustomerAddressErrorCode.ADDRESS_NOT_FOUND);
  }

  if (address.customerId !== actorId) {
    throw new Error(CustomerAddressErrorCode.UNAUTHORIZED_ACCESS);
  }

  return address;
};

export const listCustomerAddresses = async (
  actorId: string
): Promise<CustomerAddress[]> => {
  return addresses.filter((a) => a.customerId === actorId);
};

export const checkCheckoutEligibility = async (
  actorId: string,
  actorType: string
): Promise<CheckoutEligibilityResult> => {
  if (actorType === 'GUEST') {
    // Guests are eligible by default from an address perspective.
    // The checkout service is responsible for validating the provided address snapshot.
    return { eligible: true };
  }

  // For registered customers, perform full checks.
  const profile = await getCustomerProfileByActorId(actorId);
  if (profile?.status === CustomerAccountStatus.CLOSED) {
    return { eligible: false, reason: CustomerAddressErrorCode.CLOSED_CUSTOMER_CANNOT_CHECKOUT };
  }

  // Active registered customers must have a default shipping address.
  const hasActiveShipping = addresses.some(
    (a) => a.customerId === actorId && a.type === CustomerAddressType.SHIPPING && a.status === CustomerAddressStatus.ACTIVE && a.isDefault
  );
  if (!hasActiveShipping) {
    return { eligible: false, reason: 'NO_DEFAULT_SHIPPING_ADDRESS' };
  }

  return { eligible: true };
};
