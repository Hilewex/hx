import { IStorefrontRepository, StorefrontProfile } from './storefront-repository.interface';

export class InMemoryStorefrontRepository implements IStorefrontRepository {
    private storefronts = new Map<string, StorefrontProfile>();

    async findById(id: string): Promise<StorefrontProfile | null> {
        return this.storefronts.get(id) || null;
    }

    async save(profile: StorefrontProfile): Promise<void> {
        this.storefronts.set(profile.id, { ...profile, updatedAt: new Date() });
    }
}
