import { ICustomerRepository, CustomerProfile } from './customer-repository.interface';
import { Pool } from 'pg';
export declare class PostgresCustomerRepository implements ICustomerRepository {
    private pool;
    constructor(pool: Pool);
    findById(id: string): Promise<CustomerProfile | null>;
    save(profile: CustomerProfile): Promise<void>;
}
//# sourceMappingURL=postgres-customer.repository.d.ts.map