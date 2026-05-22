import { Worker } from 'bullmq';
import { spawn } from 'child_process';
import path from 'path';
import { eq, sql } from 'drizzle-orm';
import { db, leads, scrapeSchedules } from '@repo/db';

export const startScrapeWorker = () => {
  const worker = new Worker(
    'scrape-map',
    async (job) => {
      const { query, limit, workspaceId, scheduleId } = job.data as {
        query: string;
        limit: number;
        workspaceId: string;
        scheduleId?: string;
      };

      console.log(`[Scrape] Starting scrape: query="${query}" limit=${limit}`);

      let rawResults: Record<string, unknown>[];
      try {
        rawResults = await runPythonScraper(query, limit);
      } catch (err) {
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

      // Insert leads — skip duplicates by name+workspaceId (best-effort: no unique constraint,
      // so we just insert and let the scheduler control frequency).
      for (const res of rawResults) {
        await db.insert(leads).values({
          workspaceId,
          name: (res.name as string) || 'Unknown',
          address: (res.address as string) || null,
          phone: (res.phone as string) || null,
          website: (res.website as string) || null,
          mapsUrl: (res.maps_url as string) || null,
          lat: (res.lat as number) || null,
          lng: (res.lng as number) || null,
          category: (res.category as string) || query,
        });
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
    const scriptPath = path.resolve(__dirname, '../python/maps_scraper.py');
    const pythonExec = path.resolve(__dirname, '../../.venv/bin/python');
    const proc = spawn(pythonExec, [scriptPath, query, String(limit)]);

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
