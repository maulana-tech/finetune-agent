import 'server-only';
import { createClient } from './supabase/server';
import { db, workspaces, users } from '@repo/db';
import { eq } from 'drizzle-orm';
import { DEV_WORKSPACE_ID } from './workspace';

/**
 * Returns workspaceId dari session user.
 * Auto-provision workspace + user row kalau first login.
 */
export async function getWorkspaceId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return DEV_WORKSPACE_ID;
  }

  const [existing] = await db
    .select({ workspaceId: users.workspaceId })
    .from(users)
    .where(eq(users.email, user.email))
    .limit(1);

  if (existing) {
    return existing.workspaceId;
  }

  const [ws] = await db
    .insert(workspaces)
    .values({ name: `${user.email}'s Workspace` })
    .returning({ id: workspaces.id });

  await db.insert(users).values({
    workspaceId: ws.id,
    email: user.email,
    role: 'owner',
  });

  return ws.id;
}
