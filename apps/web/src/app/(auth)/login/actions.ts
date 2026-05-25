'use server';

import { db, workspaces, users } from '@repo/db';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

/**
 * Ensures workspace + user row exist for the current authenticated user.
 * Called after successful sign-in to provision workspace if first login.
 */
export async function ensureWorkspaceProvisioned(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return { success: false, error: 'No authenticated user' };
    }

    const [existing] = await db
      .select({ workspaceId: users.workspaceId })
      .from(users)
      .where(eq(users.email, user.email))
      .limit(1);

    if (existing) {
      return { success: true }; // Already provisioned
    }

    // Create workspace + user
    try {
      const [ws] = await db
        .insert(workspaces)
        .values({ name: `${user.email}'s Workspace` })
        .returning({ id: workspaces.id });

      await db.insert(users).values({
        workspaceId: ws.id,
        email: user.email,
        role: 'owner',
      });

      return { success: true };
    } catch (err: any) {
      // If unique constraint violation, another request beat us — that's ok
      if (err?.code === '23505') {
        return { success: true };
      }
      throw err;
    }
  } catch (err) {
    console.error('[ensureWorkspaceProvisioned] Error:', err);
    return { success: false, error: 'Failed to provision workspace' };
  }
}
