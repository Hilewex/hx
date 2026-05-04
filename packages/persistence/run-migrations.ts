import { runMigrations } from './src/migrator';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env if exists for local dev
dotenv.config();

// Ensure required env for postgres mode
process.env.PERSISTENCE_MODE = 'postgres';
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://hx_local_user:hx_local_pass@localhost:5432/hx_local_db';
}

async function main() {
  try {
    const migrationDir = path.join(__dirname, '../../infra/migrations');
    await runMigrations(migrationDir);
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
