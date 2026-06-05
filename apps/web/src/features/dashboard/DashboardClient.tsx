'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MapContainer } from '../map/MapContainer';
import { LeadsPanel } from '../leads/LeadsPanel';
import { MapFilters } from './MapFilters';
import { useMapStore } from '../map/store';
import { useWorkspaceId } from '@/lib/workspace-context';
import { apiUrl } from '@/lib/workspace';

interface Lead {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  emails: string[] | null;
  whatsapp: string[] | null;
  category: string | null;
  mapsUrl: string | null;
  phone: string | null;
  pipelineStage: string | null;
  createdAt: string;
}

export function DashboardClient({ leads: initialLeads }: { leads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();
  const setFlyToLeadId = useMapStore((s) => s.setFlyToLeadId);
  const workspaceId = useWorkspaceId();

  // Read `?lead=` from URL, fetch from API if not in leads, then fly-to
  useEffect(() => {
    const leadId = searchParams.get('lead');
    if (!leadId) return;

    // Check if lead is already in array
    const found = leads.find((l) => l.id === leadId);
    if (found) {
      setFlyToLeadId(leadId);
      return;
    }

    // Fetch from API
    fetch(`${apiUrl()}/leads/${leadId}?workspaceId=${workspaceId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          // Add to leads array so map renders it
          setLeads((prev) => [...prev, {
            id: data.id,
            name: data.name,
            address: data.address ?? null,
            lat: data.lat ?? null,
            lng: data.lng ?? null,
            emails: data.emails ?? null,
            whatsapp: data.whatsapp ?? null,
            category: data.category ?? null,
            mapsUrl: data.mapsUrl ?? null,
            phone: data.phone ?? null,
            pipelineStage: data.pipelineStage ?? null,
            createdAt: data.createdAt ?? new Date().toISOString(),
          }]);
          // Trigger fly-to after a short delay so the pin renders
          setTimeout(() => setFlyToLeadId(leadId), 300);
        }
      })
      .catch(() => {});
  }, [searchParams]); // Only run on mount / URL change

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const l of leads) {
      if (l.category) set.add(l.category);
    }
    return Array.from(set).sort();
  }, [leads]);

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [pipelineFilter, setPipelineFilter] = useState<string | null>(null);
  const [hasEmailOnly, setHasEmailOnly] = useState(false);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const clearCategories = () => setSelectedCategories(new Set());

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (selectedCategories.size > 0 && (!l.category || !selectedCategories.has(l.category))) return false;
      if (pipelineFilter && l.pipelineStage !== pipelineFilter) return false;
      if (hasEmailOnly && (!l.emails || l.emails.length === 0)) return false;
      return true;
    });
  }, [leads, selectedCategories, pipelineFilter, hasEmailOnly]);

  return (
    <div className="w-full h-full flex overflow-hidden">
      <div className="flex-1 relative">
        <div className="absolute top-4 left-4 z-10">
          <MapFilters
            categories={categories}
            selectedCategories={selectedCategories}
            onToggleCategory={toggleCategory}
            onClearCategories={clearCategories}
            pipelineFilter={pipelineFilter}
            onPipelineFilter={setPipelineFilter}
            hasEmailOnly={hasEmailOnly}
            onHasEmailOnly={setHasEmailOnly}
            totalLeads={leads.length}
            filteredCount={filteredLeads.length}
          />
        </div>
        <MapContainer leads={filteredLeads} />
      </div>
      <LeadsPanel leads={filteredLeads} />
    </div>
  );
}
