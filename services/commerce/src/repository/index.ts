import { ICartRepository, ICheckoutRepository } from './interface';
import { InMemoryCartRepository, InMemoryCheckoutRepository } from './in-memory';
import { PostgresCartRepository, PostgresCheckoutRepository } from './postgres';

export type { ICartRepository, ICheckoutRepository } from './interface';

let cartRepo: ICartRepository;
let checkoutRepo: ICheckoutRepository;

export function getCartRepository(): ICartRepository {
  if (cartRepo) return cartRepo;
  const mode = process.env.PERSISTENCE_MODE || 'memory';
  if (mode === 'postgres') {
    cartRepo = new PostgresCartRepository();
  } else {
    cartRepo = new InMemoryCartRepository();
  }
  return cartRepo;
}

export function getCheckoutRepository(): ICheckoutRepository {
  if (checkoutRepo) return checkoutRepo;
  const mode = process.env.PERSISTENCE_MODE || 'memory';
  if (mode === 'postgres') {
    checkoutRepo = new PostgresCheckoutRepository();
  } else {
    checkoutRepo = new InMemoryCheckoutRepository();
  }
  return checkoutRepo;
}
