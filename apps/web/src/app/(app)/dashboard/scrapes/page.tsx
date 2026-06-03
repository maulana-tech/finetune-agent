import { Suspense } from 'react';
import Link from 'next/link';
import { db, jobs, leads } from '@repo/db';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { getWorkspaceId } from '@/lib/get-workspace';
import { ScrapePageRefresher } from './ScrapePageRefresher';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Scrape History | uTune AI',
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
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

async function ScrapesContent() {
  const workspaceId = await getWorkspaceId();

  const allJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.workspaceId, workspaceId))
    .orderBy(desc(jobs.createdAt))
    .limit(100);

  // Fetch leads per job: prefer sourceJobId FK; fall back to ±2min time window for old jobs
  const jobLeadsMap = new Map<string, { id: string; name: string; category: string | null; emails: string[] | null }[]>();

  await Promise.all(
    allJobs
      .filter((j) => j.status === 'completed')
      .map(async (job) => {
        // Try FK first
        let jobLeads = await db
          .select({ id: leads.id, name: leads.name, category: leads.category, emails: leads.emails })
          .from(leads)
          .where(and(eq(leads.workspaceId, workspaceId), eq(leads.sourceJobId, job.id)))
          .limit(50);

        // If none found (old data without sourceJobId), use time-window fallback
        if (jobLeads.length === 0 && job.resultCount && job.resultCount > 0) {
          const windowStart = new Date(job.createdAt.getTime() - 30_000);
          const windowEnd = new Date(job.createdAt.getTime() + 15 * 60_000);
          jobLeads = await db
            .select({ id: leads.id, name: leads.name, category: leads.category, emails: leads.emails })
            .from(leads)
            .where(
              and(
                eq(leads.workspaceId, workspaceId),
                gte(leads.createdAt, windowStart),
                lte(leads.createdAt, windowEnd),
              ),
            )
            .limit(50);
        }

        jobLeadsMap.set(job.id, jobLeads as { id: string; name: string; category: string | null; emails: string[] | null }[]);
      }),
  );

  const totalLeads = allJobs.reduce((s, j) => s + (j.resultCount ?? 0), 0);
  const completedJobs = allJobs.filter((j) => j.status === 'completed').length;
  const activeJobs = allJobs.filter((j) => j.status === 'pending' || j.status === 'processing');
  const hasActive = activeJobs.length > 0;

  return (
    <div className="p-6 flex flex-col gap-6 max-w-4xl">
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
            <span className="text-blue-600 font-bold">{activeJobs.length} job{activeJobs.length > 1 ? 's' : ''} running</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Scrapes', value: allJobs.length },
          { label: 'Leads Found', value: totalLeads },
          { label: 'Completed', value: completedJobs },
        ].map((stat) => (
          <div key={stat.label} className="border border-border p-4">
            <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Job list */}
      {allJobs.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center">
          <p className="text-xs text-muted-foreground">No scrape jobs yet.</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Use the search bar at the top to start your first scrape.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {allJobs.map((job) => {
            const jobLeads = jobLeadsMap.get(job.id) ?? [];
            const isActive = job.status === 'pending' || job.status === 'processing';
            const isFailed = job.status === 'failed';

            return (
              <div
                key={job.id}
                className={`border ${
                  isActive ? 'border-blue-500/30 bg-blue-500/3' : isFailed ? 'border-red-500/20' : 'border-border'
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
                      href={`/dashboard?q=${encodeURIComponent(job.query)}`}
                      className="px-2 py-1 border border-border text-[9px] font-bold uppercase tracking-widest hover:border-primary hover:text-foreground transition-colors"
                    >
                      View on map →
                    </Link>
                  </div>
                </div>

                {/* Lead mini-list (only for completed jobs with results) */}
                {job.status === 'completed' && jobLeads.length > 0 && (
                  <div className="border-t border-border bg-accent/10">
                    <div className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      Leads found
                    </div>
                    <div className="divide-y divide-border">
                      {jobLeads.slice(0, 8).map((lead) => (
                        <div key={lead.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
                          <span className="text-xs font-medium truncate">{lead.name}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {lead.emails && (lead.emails as string[]).length > 0 && (
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
                        </div>
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
  );
}

export default function ScrapesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-xs text-muted-foreground">Loading scrape history...</div>
      }
    >
      <ScrapesContent />
    </Suspense>
  );
}
