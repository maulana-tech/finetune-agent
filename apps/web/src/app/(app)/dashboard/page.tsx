import { MapContainer } from '../../../features/map/MapContainer';
import { LeadsPanel } from '../../../features/leads/LeadsPanel';
import { db, leads } from '@repo/db';
import { eq } from 'drizzle-orm';
import { DEV_WORKSPACE_ID } from '@/lib/workspace';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
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
    })
    .from(leads)
    .where(eq(leads.workspaceId, DEV_WORKSPACE_ID));

  return (
    <div className="w-full h-full flex overflow-hidden">
      <div className="flex-1 relative">
        <MapContainer leads={allLeads} />
      </div>
      <LeadsPanel leads={allLeads} />
    </div>
  );
}
