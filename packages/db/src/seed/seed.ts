import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function main() {
  console.log('Seeding...');
  
  const [workspace] = await db.insert(schema.workspaces).values({
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Default Workspace',
  }).onConflictDoNothing().returning();

  console.log('Default workspace ready:', workspace?.id || 'already exists');
  
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
