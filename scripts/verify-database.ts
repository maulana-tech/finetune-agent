/**
 * Verify database integrity — check for any anomalies
 * Run: pnpm tsx scripts/verify-database.ts
 */

import { db, users, workspaces } from '@repo/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('🔍 Database Integrity Check\n');

  // 1. Count total users and workspaces
  const userCount = await db.execute<{ count: string }>(sql`
    SELECT COUNT(*) as count FROM users
  `);

  const workspaceCount = await db.execute<{ count: string }>(sql`
    SELECT COUNT(*) as count FROM workspaces
  `);

  console.log(`📊 Total users: ${userCount.rows[0].count}`);
  console.log(`📊 Total workspaces: ${workspaceCount.rows[0].count}\n`);

  // 2. Check for duplicate emails (should be 0)
  const duplicates = await db.execute<{ email: string; count: string }>(sql`
    SELECT email, COUNT(*) as count
    FROM users
    GROUP BY email
    HAVING COUNT(*) > 1
  `);

  if (duplicates.rows.length > 0) {
    console.log('⚠️  DUPLICATES FOUND:');
    for (const row of duplicates.rows) {
      console.log(`   - ${row.email}: ${row.count} entries`);
    }
    console.log('');
  } else {
    console.log('✅ No duplicate emails found\n');
  }

  // 3. Check for orphaned workspaces (workspaces with no users)
  const orphaned = await db.execute<{ id: string; name: string }>(sql`
    SELECT w.id, w.name
    FROM workspaces w
    LEFT JOIN users u ON u.workspace_id = w.id
    WHERE u.id IS NULL
  `);

  if (orphaned.rows.length > 0) {
    console.log('⚠️  ORPHANED WORKSPACES (no users):');
    for (const row of orphaned.rows) {
      console.log(`   - ${row.name} (${row.id})`);
    }
    console.log('');
  } else {
    console.log('✅ No orphaned workspaces found\n');
  }

  // 4. List all users with their workspaces
  const allUsers = await db.execute<{
    email: string;
    workspace_name: string;
    role: string;
    created_at: string;
  }>(sql`
    SELECT u.email, w.name as workspace_name, u.role, u.created_at
    FROM users u
    JOIN workspaces w ON w.id = u.workspace_id
    ORDER BY u.created_at DESC
    LIMIT 10
  `);

  console.log('👥 Recent users (last 10):');
  if (allUsers.rows.length === 0) {
    console.log('   (no users yet)');
  } else {
    for (const user of allUsers.rows) {
      const date = new Date(user.created_at).toISOString().split('T')[0];
      console.log(`   - ${user.email} → "${user.workspace_name}" (${user.role}, ${date})`);
    }
  }
  console.log('');

  // 5. Summary
  const duplicateCount = duplicates.rows.length;
  const orphanedCount = orphaned.rows.length;

  if (duplicateCount === 0 && orphanedCount === 0) {
    console.log('✅ Database integrity: GOOD\n');
  } else {
    console.log('⚠️  Database integrity: NEEDS ATTENTION\n');
    if (duplicateCount > 0) {
      console.log(`   → Run: pnpm db:cleanup-dupes (${duplicateCount} duplicates)`);
    }
    if (orphanedCount > 0) {
      console.log(`   → ${orphanedCount} orphaned workspaces to clean up`);
    }
    console.log('');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  });
