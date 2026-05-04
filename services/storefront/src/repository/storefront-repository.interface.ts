export interface StorefrontProfile {
    id: string;
    ownerId: string;
    storeName: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IStorefrontRepository {
    findById(id: string): Promise<StorefrontProfile | null>;
    save(profile: StorefrontProfile): Promise<void>;
}
