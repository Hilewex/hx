import { ICustomerRepository, CustomerProfile } from './customer-repository.interface';

export class InMemoryCustomerRepository implements ICustomerRepository {
    private customers = new Map<string, CustomerProfile>();

    async findById(id: string): Promise<CustomerProfile | null> {
        return this.customers.get(id) || null;
    }

    async save(profile: CustomerProfile): Promise<void> {
        this.customers.set(profile.id, { ...profile, updatedAt: new Date() });
    }
}
