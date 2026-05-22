import { db, workspaces } from '@repo/db';
import { eq } from 'drizzle-orm';
import { getWorkspaceId } from '@/lib/get-workspace';
import { BusinessContextForm } from './BusinessContextForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const workspaceId = await getWorkspaceId();
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground mb-8">Manage your workspace configuration.</p>

      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-bold tracking-tight mb-1">Business Context</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Describe your business — products, target market, value proposition, industry, etc.
            This context is used by AI agents to generate more relevant sales analysis and cold emails.
          </p>
          <BusinessContextForm
            workspaceId={workspaceId}
            initialValue={workspace?.businessContext ?? ''}
          />
        </div>
      </div>
    </div>
  );
}
