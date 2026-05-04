import { IStorefrontRepository } from './repository';

export class StorefrontService {
    constructor(private repository: IStorefrontRepository) {}

    async getStorefront(id: string) {
        return this.repository.findById(id);
    }

    async createStorefront(id: string, ownerId: string, storeName: string, description?: string) {
        await this.repository.save({ id, ownerId, storeName, description, createdAt: new Date(), updatedAt: new Date() });
    }
}
