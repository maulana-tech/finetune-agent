import { Suspense } from 'react';
import { db, jobs } from '@repo/db';
import { eq, desc, sum, count } from 'drizzle-orm';
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

  const totalLeads = allJobs.reduce((s, j) => s + (j.resultCount ?? 0), 0);
  const completedJobs = allJobs.filter((j) => j.status === 'completed').length;
  const activeJobs = allJobs.filter((j) => j.status === 'pending' || j.status === 'processing');
  const hasActive = activeJobs.length > 0;

  return (
    <div className="p-6 flex flex-col gap-6 max-w-4xl">
      {/* Auto-refresh while jobs are running */}
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
        <div className="flex flex-col gap-2">
          {allJobs.map((job) => (
            <div
              key={job.id}
              className={`border p-4 flex items-center justify-between gap-4 ${
                job.status === 'processing' || job.status === 'pending'
                  ? 'border-blue-500/30 bg-blue-500/3'
                  : job.status === 'failed'
                  ? 'border-red-500/20'
                  : 'border-border'
              }`}
            >
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
                {(job.status === 'pending' || job.status === 'processing') && (
                  <span className="text-blue-600">Scraping...</span>
                )}
                {job.status === 'failed' && (
                  <span className="text-red-500">No leads found</span>
                )}
                <span>{timeAgo(job.createdAt)}</span>
              </div>
            </div>
          ))}
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
