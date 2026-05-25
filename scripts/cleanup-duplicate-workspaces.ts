/**
 * Cleanup script for duplicate workspaces created by race condition.
 *
 * This script:
 * 1. Finds all duplicate users (same email with multiple workspaceId)
 * 2. Keeps the OLDEST workspace for each email
 * 3. Migrates all leads/jobs/etc from duplicate workspaces to the primary one
 * 4. Deletes duplicate users and empty workspaces
 *
 * Run: pnpm tsx scripts/cleanup-duplicate-workspaces.ts
 */

import { db, users, workspaces, leads, jobs, aiInsights } from '@repo/db';
import { eq, sql, inArray } from 'drizzle-orm';

async function main() {
  console.log('🔍 Finding duplicate users...\n');

  // Find all emails with multiple user rows
  const duplicates = await db.execute<{ email: string; count: string }>(sql`
    SELECT email, COUNT(*) as count
    FROM users
    GROUP BY email
    HAVING COUNT(*) > 1
  `);

  if (duplicates.rows.length === 0) {
    console.log('✅ No duplicates found. Database is clean.\n');
    return;
  }

  console.log(`Found ${duplicates.rows.length} emails with duplicates:\n`);

  for (const row of duplicates.rows) {
    const email = row.email;
    const count = parseInt(row.count, 10);

    console.log(`📧 ${email}: ${count} workspaces`);

    // Get all user rows for this email, ordered by createdAt (oldest first)
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .orderBy(users.createdAt);

    const primaryUser = userRows[0]; // Keep oldest
    const duplicateUsers = userRows.slice(1); // Delete rest

    console.log(`  → Keeping workspace: ${primaryUser.workspaceId} (created ${primaryUser.createdAt})`);

    // Collect all duplicate workspace IDs
    const duplicateWorkspaceIds = duplicateUsers.map((u) => u.workspaceId);

    // Migrate all data from duplicate workspaces to primary workspace
    if (duplicateWorkspaceIds.length > 0) {
      console.log(`  → Migrating data from ${duplicateWorkspaceIds.length} duplicate workspaces...`);

      // Update leads
      const leadsResult = await db
        .update(leads)
        .set({ workspaceId: primaryUser.workspaceId })
        .where(inArray(leads.workspaceId, duplicateWorkspaceIds));
      console.log(`     - Migrated ${leadsResult.rowCount || 0} leads`);

      // Update jobs
      const jobsResult = await db
        .update(jobs)
        .set({ workspaceId: primaryUser.workspaceId })
        .where(inArray(jobs.workspaceId, duplicateWorkspaceIds));
      console.log(`     - Migrated ${jobsResult.rowCount || 0} jobs`);

      // Update ai_insights
      const insightsResult = await db
        .update(aiInsights)
        .set({ workspaceId: primaryUser.workspaceId })
        .where(inArray(aiInsights.workspaceId, duplicateWorkspaceIds));
      console.log(`     - Migrated ${insightsResult.rowCount || 0} ai_insights`);

      // Delete duplicate user rows
      const userIds = duplicateUsers.map((u) => u.id);
      await db.delete(users).where(inArray(users.id, userIds));
      console.log(`  → Deleted ${userIds.length} duplicate user rows`);

      // Delete empty duplicate workspaces
      await db.delete(workspaces).where(inArray(workspaces.id, duplicateWorkspaceIds));
      console.log(`  → Deleted ${duplicateWorkspaceIds.length} empty workspaces`);
    }

    console.log('');
  }

  console.log('✅ Cleanup complete!\n');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
  });
