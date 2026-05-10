import { ICustomerRepository } from './repository';
export declare class CustomerService {
    private repository;
    constructor(repository: ICustomerRepository);
    getProfile(id: string): Promise<import("./repository").CustomerProfile | null>;
    createProfile(id: string, name: string, email: string): Promise<void>;
}
//# sourceMappingURL=customer.d.ts.map