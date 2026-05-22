import { DashboardClient } from '../../../features/dashboard/DashboardClient';
import { db, leads } from '@repo/db';
import { eq } from 'drizzle-orm';
import { getWorkspaceId } from '@/lib/get-workspace';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const workspaceId = await getWorkspaceId();
  const allLeads = await db
    .select({
      id: leads.id,
      name: leads.name,
      address: leads.address,
      lat: leads.lat,
      lng: leads.lng,
      emails: leads.emails,
      category: leads.category,
      mapsUrl: leads.mapsUrl,
      phone: leads.phone,
      pipelineStage: leads.pipelineStage,
    })
    .from(leads)
    .where(eq(leads.workspaceId, workspaceId));

  return <DashboardClient leads={allLeads} />;
}
