export * from './customer';
export declare function checkCustomerCapability(params: any): Promise<any>;
export declare function createCustomerProfile(data: any): Promise<any>;
export declare function updateCustomerProfile(id: string, actorId: string, actorType: string, data: any): Promise<any>;
export declare function getCustomerProfile(id: string): Promise<any>;
export declare function getCustomerProfileByActorId(actorId: string): Promise<any>;
export declare function listCustomerProfiles(actorType: string): Promise<any>;
export declare function suspendCustomerProfile(id: string, actorType: string, reason: any): Promise<any>;
export declare function reactivateCustomerProfile(id: string, actorType: string, reason: any): Promise<any>;
export declare function closeCustomerProfile(id: string, actorType: string, reason: any): Promise<any>;
//# sourceMappingURL=index.d.ts.map