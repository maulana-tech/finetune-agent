import { db, scrapeSchedules, workspaces } from '@repo/db';
import { sql, eq } from 'drizzle-orm';

async function main() {
  // Get firdaus workspace
  const firdausUser = await db.execute<{ workspace_id: string }>(sql`
    SELECT workspace_id FROM users WHERE email = 'firdaussyah03@gmail.com' LIMIT 1
  `);

  if (!firdausUser.rows[0]) {
    console.log('❌ User not found');
    return;
  }

  const targetWorkspaceId = firdausUser.rows[0].workspace_id;
  console.log('✅ Target workspace:', targetWorkspaceId, '\n');

  // Get all schedules
  const schedules = await db.execute<{
    id: string;
    name: string;
    workspace_id: string;
    workspace_name: string | null;
    status: string;
    frequency: string;
  }>(sql`
    SELECT ss.*, w.name as workspace_name
    FROM scrape_schedules ss
    LEFT JOIN workspaces w ON w.id = ss.workspace_id
    ORDER BY ss.created_at DESC
  `);

  console.log(`📅 Found ${schedules.rows.length} schedules:\n`);

  let needMigration = 0;
  for (const s of schedules.rows) {
    const isOrphaned = !s.workspace_name;
    const isFirdaus = s.workspace_id === targetWorkspaceId;

    if (isOrphaned) {
      console.log(`  ⚠️  "${s.name}" → orphaned (${s.status})`);
      needMigration++;
    } else if (isFirdaus) {
      console.log(`  ✅ "${s.name}" → already in firdaus workspace (${s.status})`);
    } else {
      console.log(`  📦 "${s.name}" → ${s.workspace_name} (${s.status})`);
      needMigration++;
    }
  }

  console.log(`\n${needMigration} schedules need migration to firdaus workspace`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
