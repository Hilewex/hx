import { Pool } from 'pg';
import { CustomerService as RealCustomerService } from './customer';
import { PostgresCustomerRepository } from './repository/postgres-customer.repository';
import { InMemoryCustomerRepository } from './repository/in-memory-customer.repository';

export * from './customer';

let repository;

if (process.env.PERSISTENCE_MODE === 'postgres') {
  console.log('[CUSTOMER-SERVICE] Using Postgres repository');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://hx_local_user:hx_local_pass@localhost:5433/hx_local_db'
  });
  repository = new PostgresCustomerRepository(pool);
} else {
  console.log('[CUSTOMER-SERVICE] Using In-Memory repository (Mode:', process.env.PERSISTENCE_MODE, ')');
  repository = new InMemoryCustomerRepository();
}

const customerService = new RealCustomerService(repository);

export async function checkCustomerCapability(params: any): Promise<any> {
    return { allowed: true, hasCapability: true };
}

export async function createCustomerProfile(data: any): Promise<any> {
    const id = data.id || `cust-${Date.now()}`;
    const name = data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : data.name || 'Test User';
    const email = data.email || `${id}@example.com`;
    
    await customerService.createProfile(id, name, email);
    
    const profile = await customerService.getProfile(id);
    return { ...profile, actorId: data.actorId };
}

export async function updateCustomerProfile(id: string, actorId: string, actorType: string, data: any): Promise<any> {
    const profile = await customerService.getProfile(id);
    if (!profile) throw new Error("Customer not found");
    
    await customerService.createProfile(id, data.name || profile.name, data.email || profile.email);
    return await customerService.getProfile(id);
}

export async function getCustomerProfile(id: string): Promise<any> {
    const profile = await customerService.getProfile(id);
    if (!profile) return null;
    return profile;
}

export async function getCustomerProfileByActorId(actorId: string): Promise<any> {
    return null; // Mock
}

export async function listCustomerProfiles(actorType: string): Promise<any> {
    return [];
}

export async function suspendCustomerProfile(id: string, actorType: string, reason: any): Promise<any> {
    return { id, status: 'SUSPENDED' };
}

export async function reactivateCustomerProfile(id: string, actorType: string, reason: any): Promise<any> {
    return { id, status: 'ACTIVE' };
}

export async function closeCustomerProfile(id: string, actorType: string, reason: any): Promise<any> {
    return { id, status: 'CLOSED' };
}

