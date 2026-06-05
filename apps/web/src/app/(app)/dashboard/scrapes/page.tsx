import { Suspense } from 'react';
import { db, jobs, leads } from '@repo/db';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { getWorkspaceId } from '@/lib/get-workspace';
import { ScrapesClient, type JobData, type JobLeadPreview } from './ScrapesClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Scrape History | uTune AI',
};

async function ScrapesContent() {
  const workspaceId = await getWorkspaceId();

  const allJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.workspaceId, workspaceId))
    .orderBy(desc(jobs.createdAt))
    .limit(100);

  // Fetch leads per job using a ±15min time window around the job's creation time
  const jobLeadsMap: Record<string, JobLeadPreview[]> = {};

  await Promise.all(
    allJobs
      .filter((j) => j.status === 'completed' && (j.resultCount ?? 0) > 0)
      .map(async (job) => {
        const windowStart = new Date(job.createdAt.getTime() - 30_000);
        const windowEnd = new Date(job.createdAt.getTime() + 15 * 60_000);
        const jobLeads = await db
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
        jobLeadsMap[job.id] = jobLeads as JobLeadPreview[];
      }),
  );

  const serializedJobs: JobData[] = allJobs.map((j) => ({
    id: j.id,
    query: j.query,
    status: j.status,
    resultCount: j.resultCount ?? null,
    createdAt: j.createdAt.toISOString(),
  }));

  const totalLeads = allJobs.reduce((s, j) => s + (j.resultCount ?? 0), 0);
  const completedJobs = allJobs.filter((j) => j.status === 'completed').length;
  const hasActive = allJobs.some((j) => j.status === 'pending' || j.status === 'processing');

  return (
    <ScrapesClient
      jobs={serializedJobs}
      jobLeadsMap={jobLeadsMap}
      hasActive={hasActive}
      totalLeads={totalLeads}
      completedJobs={completedJobs}
    />
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
