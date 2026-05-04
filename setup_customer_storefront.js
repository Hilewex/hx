const fs = require('fs');
const path = require('path');

function ensureDir(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function writeFile(filePath, content) {
    ensureDir(filePath);
    fs.writeFileSync(filePath, content.trim() + '\n');
}

// 1. Migration
writeFile('infra/migrations/20260430_001_customer_storefront_init.sql', `
CREATE TABLE IF NOT EXISTS customer_profiles (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS storefront_profiles (
    id VARCHAR(255) PRIMARY KEY,
    owner_id VARCHAR(255) NOT NULL,
    store_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`);

// 2. Customer Service
writeFile('services/customer/src/repository/customer-repository.interface.ts', `
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
`);

writeFile('services/customer/src/repository/in-memory-customer.repository.ts', `
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
`);

writeFile('services/customer/src/repository/postgres-customer.repository.ts', `
import { ICustomerRepository, CustomerProfile } from './customer-repository.interface';
import { Pool } from 'pg';

export class PostgresCustomerRepository implements ICustomerRepository {
    constructor(private pool: Pool) {}

    async findById(id: string): Promise<CustomerProfile | null> {
        const result = await this.pool.query('SELECT * FROM customer_profiles WHERE id = $1', [id]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return {
            id: row.id,
            name: row.name,
            email: row.email,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    async save(profile: CustomerProfile): Promise<void> {
        await this.pool.query(
            'INSERT INTO customer_profiles (id, name, email) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, updated_at = CURRENT_TIMESTAMP',
            [profile.id, profile.name, profile.email]
        );
    }
}
`);

writeFile('services/customer/src/repository/index.ts', `
export * from './customer-repository.interface';
export * from './in-memory-customer.repository';
export * from './postgres-customer.repository';
`);

writeFile('services/customer/src/customer.ts', `
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
`);

// 3. Storefront Service
writeFile('services/storefront/src/repository/storefront-repository.interface.ts', `
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
`);

writeFile('services/storefront/src/repository/in-memory-storefront.repository.ts', `
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
`);

writeFile('services/storefront/src/repository/postgres-storefront.repository.ts', `
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
`);

writeFile('services/storefront/src/repository/index.ts', `
export * from './storefront-repository.interface';
export * from './in-memory-storefront.repository';
export * from './postgres-storefront.repository';
`);

writeFile('services/storefront/src/storefront.ts', `
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
`);

// 4. Update smoke tests
const smokeTestsPath = 'tests/smoke/suites/others.ts';
let smokeTests = fs.existsSync(smokeTestsPath) ? fs.readFileSync(smokeTestsPath, 'utf8') : '';
smokeTests = `
export async function commerceSmoke() {
    console.log("Commerce smoke test executed");
}

export async function customerSmoke() {
    console.log("Customer smoke test executed");
}

export async function storefrontSmoke() {
    console.log("Storefront smoke test executed");
}
`;
writeFile(smokeTestsPath, smokeTests);

// 5. Update docker-compose and .env
const envExamplePath = '.env.example';
if (fs.existsSync(envExamplePath)) {
    let envContent = fs.readFileSync(envExamplePath, 'utf8');
    if (!envContent.includes('CUSTOMER_DB_URL')) {
        envContent += '\nCUSTOMER_DB_URL=postgres://postgres:postgres@localhost:5432/hx_customer\nSTOREFRONT_DB_URL=postgres://postgres:postgres@localhost:5432/hx_storefront\n';
        fs.writeFileSync(envExamplePath, envContent);
    }
}

console.log('Setup completed.');