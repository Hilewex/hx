import { query } from './index';
import * as fs from 'fs';
import * as path from 'path';

export async function runMigrations(migrationDir: string) {
  console.log('[Migration] Starting migrations from:', migrationDir);
  
  // Ensure migrations table exists
  await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const files = fs.readdirSync(migrationDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const res = await query('SELECT id FROM _migrations WHERE name = $1', [file]);
    if (res.rowCount === 0) {
      console.log(`[Migration] Applying ${file}...`);
      const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
      
      // Execute as single block for safety in this foundation
      await query(sql);
      
      await query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      console.log(`[Migration] ${file} applied successfully.`);
    } else {
      console.log(`[Migration] Skipping ${file} (already applied).`);
    }
  }
}
