import { Worker, Queue } from 'bullmq';
import { spawn } from 'child_process';
import path from 'path';
import { eq, sql, and, ilike } from 'drizzle-orm';
import { db, leads, scrapeSchedules, jobs } from '@repo/db';

const aiQueue = new Queue('orchestrated-ai-queue', {
  connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
});

const ourProduct =
  'UTUNE AI — B2B lead intelligence platform. Kami menyediakan AI-powered lead scoring, financial simulation, market analysis, dan scraping otomatis untuk sales team B2B di Indonesia.';

export const startScrapeWorker = () => {
  const worker = new Worker(
    'scrape-map',
    async (job) => {
      const { query, limit, workspaceId, scheduleId, jobId } = job.data as {
        query: string;
        limit: number;
        workspaceId: string;
        scheduleId?: string;
        jobId?: string;
      };

      console.log(`[Scrape] Starting scrape: query="${query}" limit=${limit}`);

      if (jobId) {
        await db
          .update(jobs)
          .set({ status: 'processing', updatedAt: new Date() })
          .where(eq(jobs.id, jobId));
      }

      let rawResults: Record<string, unknown>[];
      try {
        rawResults = await runPythonScraper(query, limit);
      } catch (err) {
        if (jobId) {
          await db
            .update(jobs)
            .set({ status: 'failed', updatedAt: new Date() })
            .where(eq(jobs.id, jobId));
        }
        if (scheduleId) {
          await db
            .update(scrapeSchedules)
            .set({
              lastRunAt: new Date(),
              lastRunStatus: 'failed',
              retryCount: sql`COALESCE(${scrapeSchedules.retryCount}, 0)`,
              updatedAt: new Date(),
            })
            .where(eq(scrapeSchedules.id, scheduleId));
        }
        throw err;
      }

      console.log(`[Scrape] Scraped ${rawResults.length} results for "${query}"`);

      // Names that indicate scraper picked up a non-business element
      const BAD_NAMES = new Set(['json', 'null', 'undefined', 'n/a', 'na', 'loading', 'unknown']);

      let insertedCount = 0;
      for (const res of rawResults) {
        const emails    = (res.emails    as string[]) || [];
        const whatsapp  = (res.whatsapp  as string[]) || [];
        const leadName  = (res.name      as string)?.trim() || '';

        // Skip bad/placeholder names
        if (!leadName || leadName.length < 3 || BAD_NAMES.has(leadName.toLowerCase())) {
          console.log(`[Scrape] Skip bad name: "${leadName}"`);
          continue;
        }

        // Skip duplicates — same workspace + same name already exists
        const existing = await db
          .select({ id: leads.id })
          .from(leads)
          .where(and(eq(leads.workspaceId, workspaceId), ilike(leads.name, leadName)))
          .limit(1);

        if (existing.length > 0) {
          console.log(`[Scrape] Skip duplicate: ${leadName}`);
          continue;
        }

        const [inserted] = await db
          .insert(leads)
          .values({
            workspaceId,
            name:          leadName,
            address:       (res.address  as string) || null,
            phone:         (res.phone    as string) || null,
            website:       (res.website  as string) || null,
            emails:        emails.length   > 0 ? emails   : undefined,
            whatsapp:      whatsapp.length > 0 ? whatsapp : undefined,
            mapsUrl:       (res.maps_url  as string) || null,
            lat:           (res.lat       as number) || null,
            lng:           (res.lng       as number) || null,
            category:      (res.category  as string) || query,
          })
          .returning();

        const rawText = [
          `Name: ${inserted.name}`,
          inserted.address && `Address: ${inserted.address}`,
          inserted.phone && `Phone: ${inserted.phone}`,
          inserted.website && `Website: ${inserted.website}`,
          emails.length > 0 && `Emails: ${emails.join(', ')}`,
          inserted.category && `Category: ${inserted.category}`,
        ]
          .filter(Boolean)
          .join('\n');

        await aiQueue.add('orchestrated-workflow', {
          leadId: inserted.id,
          workspaceId,
          rawText,
          ourProduct,
        });
        insertedCount++;
      }
      console.log(`[Scrape] Inserted ${insertedCount} leads + queued AI for each`);

      if (jobId) {
        await db
          .update(jobs)
          .set({ status: 'completed', resultCount: insertedCount, updatedAt: new Date() })
          .where(eq(jobs.id, jobId));
      }

      // Update schedule status on success
      if (scheduleId) {
        await db
          .update(scrapeSchedules)
          .set({
            lastRunAt: new Date(),
            lastRunStatus: 'success',
            retryCount: 0,
            updatedAt: new Date(),
          })
          .where(eq(scrapeSchedules.id, scheduleId));
      }

      return { count: rawResults.length };
    },
    {
      connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
    },
  );

  worker.on('completed', (job) => console.log(`[Scrape] Job ${job.id} completed`));
  worker.on('failed', (job, err) =>
    console.log(`[Scrape] Job ${job?.id} failed: ${err.message}`),
  );

  console.log('[Scrape] Worker started - listening to scrape-map');
};

function runPythonScraper(
  query: string,
  limit: number,
): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, '../python/places_scraper.py');
    const pythonExec = path.resolve(__dirname, '../../.venv/bin/python');
    const proc = spawn(pythonExec, [scriptPath, query, String(limit)], {
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Scraper exited ${code}: ${stderr.slice(0, 500)}`));
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error(`Failed to parse scraper output: ${stdout.slice(0, 200)}`));
      }
    });
  });
}
