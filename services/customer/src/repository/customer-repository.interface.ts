export interface CustomerProfile {
    id: string;
    name: string;
    email: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICustomerRepository {
    findById(id: string): Promise<CustomerProfile | null>;
    save(profile: CustomerProfile): Promise<void>;
}
