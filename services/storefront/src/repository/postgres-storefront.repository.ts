import { IStorefrontRepository, StorefrontProfile } from './storefront-repository.interface';
import { Pool } from 'pg';

export class PostgresStorefrontRepository implements IStorefrontRepository {
    constructor(private pool: Pool) {}

    async findById(id: string): Promise<StorefrontProfile | null> {
        const result = await this.pool.query('SELECT * FROM storefront_profiles WHERE id = $1', [id]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return {
            id: row.id,
            ownerId: row.owner_id,
            storeName: row.store_name,
            description: row.description,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    async save(profile: StorefrontProfile): Promise<void> {
        await this.pool.query(
            'INSERT INTO storefront_profiles (id, owner_id, store_name, description) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET store_name = EXCLUDED.store_name, description = EXCLUDED.description, updated_at = CURRENT_TIMESTAMP',
            [profile.id, profile.ownerId, profile.storeName, profile.description]
        );
    }
}
