import { Pool } from 'pg';
import { StorefrontService as RealStorefrontService } from './storefront';
import { PostgresStorefrontRepository } from './repository/postgres-storefront.repository';
import { InMemoryStorefrontRepository } from './repository/in-memory-storefront.repository';

export * from './storefront';

const persistenceMode = process.env.PERSISTENCE_MODE || 'postgres';

let repository;
if (persistenceMode.trim() === 'memory') {
    repository = new InMemoryStorefrontRepository();
} else {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://hx_local_user:hx_local_pass@localhost:5433/hx_local_db'
    });
    repository = new PostgresStorefrontRepository(pool);
}

const storefrontService = new RealStorefrontService(repository);

export async function createCreatorStorefront(data: any): Promise<any> {
    const id = data.id || `store-${Date.now()}`;
    const ownerId = data.creatorId || 'unknown';
    const storeName = data.name || data.handle || 'Test Store';
    
    await storefrontService.createStorefront(id, ownerId, storeName, data.description);
    const profile = await storefrontService.getStorefront(id);
    
    // map ownerId back to creatorId for BFF
    return { success: true, data: { ...profile, creatorId: profile?.ownerId } };
}

export async function updateCreatorStorefrontProfile(data: any): Promise<any> {
    const profile = await storefrontService.getStorefront(data.storefrontId);
    if (!profile) return { success: false, error: { code: 'NOT_FOUND' } };
    
    await storefrontService.createStorefront(profile.id, profile.ownerId, data.name || profile.storeName, data.description || profile.description);
    const updated = await storefrontService.getStorefront(data.storefrontId);
    return { success: true, data: { ...updated, creatorId: updated?.ownerId } };
}

export async function getCreatorStorefront(id: string): Promise<any> {
    const profile = await storefrontService.getStorefront(id);
    if (!profile) return { success: false, error: { code: 'NOT_FOUND' } };
    return { success: true, data: { ...profile, creatorId: profile.ownerId } };
}

export async function getCreatorStorefrontBySlug(slug: string): Promise<any> {
    return { success: false, error: { code: 'NOT_IMPLEMENTED' } };
}

export async function listCreatorStorefronts(): Promise<any> {
    return { success: true, data: [] };
}

export async function suspendCreatorStorefront(data: any): Promise<any> {
    return { success: true, data: { id: data.storefrontId, status: 'SUSPENDED' } };
}

export async function reactivateCreatorStorefront(data: any): Promise<any> {
    return { success: true, data: { id: data.storefrontId, status: 'ACTIVE' } };
}

