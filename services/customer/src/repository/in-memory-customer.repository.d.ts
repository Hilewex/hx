import { ICustomerRepository, CustomerProfile } from './customer-repository.interface';
export declare class InMemoryCustomerRepository implements ICustomerRepository {
    private customers;
    findById(id: string): Promise<CustomerProfile | null>;
    save(profile: CustomerProfile): Promise<void>;
}
//# sourceMappingURL=in-memory-customer.repository.d.ts.map