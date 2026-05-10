import { CustomerAddress, CreateCustomerAddressCommand, UpdateCustomerAddressCommand, CheckoutEligibilityResult } from '@hx/contracts';
export declare const createCustomerAddress: (actorId: string, actorType: string, command: CreateCustomerAddressCommand) => Promise<CustomerAddress>;
export declare const updateCustomerAddress: (actorId: string, addressId: string, command: UpdateCustomerAddressCommand) => Promise<CustomerAddress>;
export declare const archiveCustomerAddress: (actorId: string, addressId: string) => Promise<CustomerAddress>;
export declare const setDefaultCustomerAddress: (actorId: string, addressId: string) => Promise<CustomerAddress>;
export declare const getCustomerAddress: (actorId: string, addressId: string) => Promise<CustomerAddress>;
export declare const listCustomerAddresses: (actorId: string) => Promise<CustomerAddress[]>;
export declare const checkCheckoutEligibility: (actorId: string, actorType: string) => Promise<CheckoutEligibilityResult>;
//# sourceMappingURL=customer-address.d.ts.map