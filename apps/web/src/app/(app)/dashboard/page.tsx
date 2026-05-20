import { MapContainer } from '../../../features/map/MapContainer';
import { LeadsPanel } from '../../../features/leads/LeadsPanel';
import { db, leads } from '@repo/db';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Fetch real leads from DB
  const allLeads = await db.select().from(leads);

  return (
    <div className="w-full h-full flex overflow-hidden">
      <div className="flex-1 relative">
        <MapContainer leads={allLeads} />
      </div>
      
      <LeadsPanel leads={allLeads} />
    </div>
  );
}
