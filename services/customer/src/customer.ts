import { ICustomerRepository } from './repository';

export class CustomerService {
    constructor(private repository: ICustomerRepository) {}

    async getProfile(id: string) {
        return this.repository.findById(id);
    }

    async createProfile(id: string, name: string, email: string) {
        await this.repository.save({ id, name, email, createdAt: new Date(), updatedAt: new Date() });
    }
}
