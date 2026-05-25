import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { db, workspaces, users } from '@repo/db';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
            for (const { name, value } of cookiesToSet) {
              request.cookies.set(name, value);
            }
          },
        },
      },
    );

    const { error: authError, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!authError && data.user?.email) {
      // Provision workspace + user row if first login
      await ensureUserWorkspace(data.user.email);

      const response = NextResponse.redirect(`${origin}${next}`);
      for (const cookie of request.cookies.getAll()) {
        response.cookies.set(cookie.name, cookie.value);
      }
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}

/**
 * Ensures workspace + user row exist for the given email.
 * Idempotent — safe to call multiple times.
 */
async function ensureUserWorkspace(email: string): Promise<void> {
  const [existing] = await db
    .select({ workspaceId: users.workspaceId })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return; // Already provisioned
  }

  try {
    const [ws] = await db
      .insert(workspaces)
      .values({ name: `${email}'s Workspace` })
      .returning({ id: workspaces.id });

    await db.insert(users).values({
      workspaceId: ws.id,
      email,
      role: 'owner',
    });
  } catch (err: any) {
    // If unique constraint violation, another request beat us — ignore
    if (err?.code === '23505') {
      return;
    }
    throw err;
  }
}
