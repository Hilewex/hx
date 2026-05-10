"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresCustomerRepository = void 0;
class PostgresCustomerRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async findById(id) {
        const result = await this.pool.query('SELECT * FROM customer_profiles WHERE id = $1', [id]);
        if (result.rows.length === 0)
            return null;
        const row = result.rows[0];
        return {
            id: row.id,
            name: row.name,
            email: row.email,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
    async save(profile) {
        await this.pool.query('INSERT INTO customer_profiles (id, name, email) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, updated_at = CURRENT_TIMESTAMP', [profile.id, profile.name, profile.email]);
    }
}
exports.PostgresCustomerRepository = PostgresCustomerRepository;
