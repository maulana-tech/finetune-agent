/**
 * Cleanup orphaned workspaces (workspaces with no users)
 * Run: pnpm db:cleanup-orphaned
 */

import { db, workspaces, leads, jobs } from '@repo/db';
import { sql, inArray } from 'drizzle-orm';

async function main() {
  console.log('🔍 Finding orphaned workspaces...\n');

  // Find workspaces with no users
  const orphaned = await db.execute<{
    id: string;
    name: string;
    created_at: string;
  }>(sql`
    SELECT w.id, w.name, w.created_at
    FROM workspaces w
    LEFT JOIN users u ON u.workspace_id = w.id
    WHERE u.id IS NULL
    ORDER BY w.created_at
  `);

  if (orphaned.rows.length === 0) {
    console.log('✅ No orphaned workspaces found. Database is clean.\n');
    return;
  }

  console.log(`Found ${orphaned.rows.length} orphaned workspaces:\n`);

  const orphanedIds: string[] = [];

  for (const ws of orphaned.rows) {
    const date = new Date(ws.created_at).toISOString().split('T')[0];
    console.log(`📦 "${ws.name}" (${date})`);
    console.log(`   ID: ${ws.id}`);

    // Check if workspace has any data
    const leadCount = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*) as count FROM leads WHERE workspace_id = ${ws.id}
    `);
    const jobCount = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*) as count FROM jobs WHERE workspace_id = ${ws.id}
    `);

    const leadsNum = parseInt(leadCount.rows[0].count, 10);
    const jobsNum = parseInt(jobCount.rows[0].count, 10);

    console.log(`   → Leads: ${leadsNum}, Jobs: ${jobsNum}`);

    if (leadsNum > 0 || jobsNum > 0) {
      console.log(`   ⚠️  HAS DATA — will not delete (migrate data first)\n`);
    } else {
      console.log(`   ✅ Empty — safe to delete\n`);
      orphanedIds.push(ws.id);
    }
  }

  // Delete empty orphaned workspaces
  if (orphanedIds.length > 0) {
    console.log(`🗑️  Deleting ${orphanedIds.length} empty orphaned workspaces...\n`);

    await db.delete(workspaces).where(inArray(workspaces.id, orphanedIds));

    console.log(`✅ Deleted ${orphanedIds.length} workspaces\n`);
  } else {
    console.log('⚠️  All orphaned workspaces contain data — manual migration needed\n');
  }

  // Final summary
  const remaining = orphaned.rows.length - orphanedIds.length;
  if (remaining > 0) {
    console.log(`⚠️  ${remaining} orphaned workspaces remain (they contain data)\n`);
    console.log('To migrate their data to an active workspace, run:\n');
    console.log('  pnpm db:migrate-orphaned-data <orphaned-workspace-id> <target-workspace-id>\n');
  } else {
    console.log('✅ All orphaned workspaces cleaned up!\n');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
  });
