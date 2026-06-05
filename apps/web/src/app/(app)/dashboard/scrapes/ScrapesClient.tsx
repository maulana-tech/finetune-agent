'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ScrapePageRefresher } from './ScrapePageRefresher';
import { apiUrl } from '@/lib/workspace';
import { useWorkspaceId } from '@/lib/workspace-context';

export interface JobData {
  id: string;
  query: string;
  status: string;
  resultCount: number | null;
  createdAt: string;
}

export interface JobLeadPreview {
  id: string;
  name: string;
  category: string | null;
  emails: string[] | null;
}

interface Lead {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  emails: string[] | null;
  whatsapp: string[] | null;
  category: string | null;
  mapsUrl: string | null;
  website: string | null;
  pipelineStage: string | null;
  createdAt: string;
}

interface AiInsight {
  id: string;
  agentType: string;
  content: Record<string, unknown>;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:    'border-border text-muted-foreground',
    processing: 'border-blue-500/50 text-blue-600 bg-blue-500/5',
    completed:  'border-green-500/50 text-green-600 bg-green-500/5',
    failed:     'border-red-500/50 text-red-600 bg-red-500/5',
  };
  return (
    <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase tracking-widest ${styles[status] ?? styles.pending}`}>
      {status === 'processing' ? '● ' : ''}{status}
    </span>
  );
}

function renderInsightValue(val: unknown): React.ReactNode {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return null;
    return (
      <ul className="mt-0.5 space-y-0.5 pl-3">
        {val.map((item, i) => (
          <li key={i} className="list-disc list-inside text-[10px]">
            {typeof item === 'string'
              ? item
              : typeof item === 'object' && item !== null
              ? Object.entries(item as Record<string, unknown>)
                  .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
                  .join(' · ')
              : String(item)}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof val === 'object') {
    return (
      <div className="mt-0.5 pl-3 space-y-0.5 border-l border-border">
        {Object.entries(val as Record<string, unknown>).map(([k, v]) => (
          <div key={k} className="text-[10px]">
            <span className="text-foreground/60 capitalize">{k.replace(/_/g, ' ')}: </span>
            <span>{typeof v === 'string' ? v : String(v)}</span>
          </div>
        ))}
      </div>
    );
  }
  return String(val);
}

function LeadDetailPanel({
  leadId,
  onClose,
}: {
  leadId: string;
  onClose: () => void;
}) {
  const workspaceId = useWorkspaceId();
  const [lead, setLead] = useState<Lead | null>(null);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setInsightsLoading(true);
    setLead(null);
    setInsights([]);

    fetch(`${apiUrl()}/leads/${leadId}?workspaceId=${workspaceId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setLead(data); setLoading(false); })
      .catch(() => setLoading(false));

    fetch(`${apiUrl()}/leads/${leadId}/insights`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setInsights(data); setInsightsLoading(false); })
      .catch(() => setInsightsLoading(false));
  }, [leadId, workspaceId]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border shrink-0">
        <div className="font-bold text-sm uppercase tracking-widest mb-2">Lead Detail</div>
        <button
          onClick={onClose}
          className="text-[10px] uppercase font-bold text-muted-foreground hover:text-primary transition-colors"
        >
          ← Back to list
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
        {loading ? (
          <div className="animate-pulse flex flex-col gap-3">
            <div className="h-4 bg-muted w-3/4" />
            <div className="h-3 bg-muted w-full" />
            <div className="h-3 bg-muted w-2/3" />
          </div>
        ) : !lead ? (
          <p className="text-xs text-muted-foreground italic">Could not load lead data.</p>
        ) : (
          <>
            {/* Identity */}
            <div>
              <h2 className="font-bold text-base leading-tight">{lead.name}</h2>
              {lead.address && <p className="text-xs text-muted-foreground mt-0.5">{lead.address}</p>}
              {lead.pipelineStage && (
                <span className="inline-block mt-1.5 px-2 py-0.5 border border-border text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  {lead.pipelineStage}
                </span>
              )}
            </div>

            {/* Contact details */}
            <div className="space-y-1.5 text-xs">
              {lead.category && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-20 shrink-0">Category</span>
                  <span className="font-medium">{lead.category}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-20 shrink-0">Phone</span>
                  <a href={`tel:${lead.phone}`} className="font-medium hover:text-primary transition-colors">
                    {lead.phone}
                  </a>
                </div>
              )}
              {lead.emails && lead.emails.length > 0 && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-20 shrink-0">Email</span>
                  <a href={`mailto:${lead.emails[0]}`} className="font-medium break-all hover:text-primary transition-colors">
                    {lead.emails[0]}
                  </a>
                </div>
              )}
              {lead.whatsapp && lead.whatsapp.length > 0 && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-20 shrink-0">WhatsApp</span>
                  <a
                    href={`https://wa.me/${lead.whatsapp[0].replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-green-600 hover:text-green-700 transition-colors"
                  >
                    {lead.whatsapp[0]} ↗
                  </a>
                </div>
              )}
              {lead.website && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-20 shrink-0">Website</span>
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline truncate"
                  >
                    {lead.website} ↗
                  </a>
                </div>
              )}
              {lead.mapsUrl && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-20 shrink-0">Maps</span>
                  <a
                    href={lead.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    Open Google Maps ↗
                  </a>
                </div>
              )}
            </div>

            {/* View on dashboard map */}
            <Link
              href={`/dashboard?lead=${lead.id}`}
              className="block w-full py-2 text-center border border-border text-[10px] font-bold uppercase tracking-widest hover:border-primary hover:text-foreground transition-colors"
            >
              View on Map →
            </Link>

            {/* AI Insights */}
            <div className="border border-border bg-accent/20 p-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3 text-primary">
                AI Strategy Insights
              </h3>
              {insightsLoading ? (
                <div className="animate-pulse flex flex-col gap-2">
                  <div className="h-2 bg-muted w-full" />
                  <div className="h-2 bg-muted w-3/4" />
                  <div className="h-2 bg-muted w-5/6" />
                </div>
              ) : insights.length === 0 ? (
                <p className="text-[10px] text-muted-foreground italic">
                  No AI insights yet. Open the main dashboard and run analysis for this lead.
                </p>
              ) : (
                <div className="space-y-3">
                  {insights.map((insight) => (
                    <div key={insight.id} className="text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider">
                          {insight.agentType}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(insight.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-muted-foreground space-y-1">
                        {Object.entries(insight.content).map(([key, val]) => (
                          <div key={key}>
                            <span className="font-medium text-foreground capitalize">
                              {key.replace(/_/g, ' ')}:{' '}
                            </span>
                            {renderInsightValue(val)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface ScrapesClientProps {
  jobs: JobData[];
  jobLeadsMap: Record<string, JobLeadPreview[]>;
  hasActive: boolean;
  totalLeads: number;
  completedJobs: number;
}

export function ScrapesClient({
  jobs,
  jobLeadsMap,
  hasActive,
  totalLeads,
  completedJobs,
}: ScrapesClientProps) {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const activeJobs = jobs.filter(j => j.status === 'pending' || j.status === 'processing');

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: job list */}
      <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
        {hasActive && <ScrapePageRefresher />}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold uppercase tracking-widest">Scrape History</h1>
            <p className="text-xs text-muted-foreground mt-1">
              All scrape jobs run from the search bar above
            </p>
          </div>
          {hasActive && (
            <div className="flex items-center gap-2 px-3 py-1.5 border border-blue-500/40 bg-blue-500/5 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-blue-600 font-bold">
                {activeJobs.length} job{activeJobs.length > 1 ? 's' : ''} running
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Scrapes', value: jobs.length },
            { label: 'Leads Found', value: totalLeads },
            { label: 'Completed', value: completedJobs },
          ].map((stat) => (
            <div key={stat.label} className="border border-border p-4">
              <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Job list */}
        {jobs.length === 0 ? (
          <div className="border border-dashed border-border p-12 text-center">
            <p className="text-xs text-muted-foreground">No scrape jobs yet.</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Use the search bar at the top to start your first scrape.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {jobs.map((job) => {
              const jobLeads = jobLeadsMap[job.id] ?? [];
              const isActive = job.status === 'pending' || job.status === 'processing';
              const isFailed = job.status === 'failed';

              return (
                <div
                  key={job.id}
                  className={`border ${
                    isActive
                      ? 'border-blue-500/30 bg-blue-500/3'
                      : isFailed
                      ? 'border-red-500/20'
                      : 'border-border'
                  }`}
                >
                  {/* Job header row */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <StatusBadge status={job.status} />
                      <span className="font-bold text-sm truncate">{job.query}</span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-[10px] text-muted-foreground">
                      {job.status === 'completed' && (
                        <span className="font-bold text-foreground">
                          {job.resultCount ?? 0} lead{(job.resultCount ?? 0) !== 1 ? 's' : ''}
                        </span>
                      )}
                      {isActive && <span className="text-blue-600">Scraping...</span>}
                      {isFailed && <span className="text-red-500">Failed</span>}
                      <span>{timeAgo(job.createdAt)}</span>
                      <Link
                        href={jobLeads.length > 0 ? `/dashboard?lead=${jobLeads[0].id}` : `/dashboard?q=${encodeURIComponent(job.query)}`}
                        className="px-2 py-1 border border-border text-[9px] font-bold uppercase tracking-widest hover:border-primary hover:text-foreground transition-colors"
                      >
                        View on map →
                      </Link>
                    </div>
                  </div>

                  {/* Lead mini-list */}
                  {job.status === 'completed' && jobLeads.length > 0 && (
                    <div className="border-t border-border bg-accent/10">
                      <div className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        Leads found
                      </div>
                      <div className="divide-y divide-border">
                        {jobLeads.slice(0, 8).map((lead) => (
                          <button
                            key={lead.id}
                            onClick={() => setSelectedLeadId(lead.id === selectedLeadId ? null : lead.id)}
                            className={`w-full px-4 py-2.5 flex items-center justify-between gap-2 text-left transition-colors hover:bg-accent/30 ${
                              selectedLeadId === lead.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                            }`}
                          >
                            <span className={`text-xs font-medium truncate ${selectedLeadId === lead.id ? 'text-primary' : ''}`}>
                              {lead.name}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Link
                                href={`/dashboard?lead=${lead.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="px-1.5 py-0.5 border border-border text-[8px] font-bold uppercase tracking-wider hover:border-primary hover:text-foreground transition-colors"
                              >
                                Map
                              </Link>
                              {lead.emails && lead.emails.length > 0 && (
                                <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[8px] font-bold uppercase tracking-wider">
                                  Email
                                </span>
                              )}
                              {lead.category && (
                                <span className="text-[9px] text-muted-foreground border border-border px-1.5 py-0.5">
                                  {lead.category}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                        {jobLeads.length > 8 && (
                          <div className="px-4 py-2.5 text-[10px] text-muted-foreground">
                            + {jobLeads.length - 8} more leads
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: lead detail panel */}
      <div className="w-80 shrink-0 border-l border-border bg-background overflow-hidden flex flex-col">
        {selectedLeadId ? (
          <LeadDetailPanel
            leadId={selectedLeadId}
            onClose={() => setSelectedLeadId(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="w-10 h-10 border border-dashed border-border flex items-center justify-center text-muted-foreground text-lg">
              ↖
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Lead Detail
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Click any lead name in the job list to view full contact info and AI insights
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
