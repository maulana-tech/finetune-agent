import { Worker, Queue } from 'bullmq';
import { spawn } from 'child_process';
import path from 'path';
import { eq, sql } from 'drizzle-orm';
import { db, leads, scrapeSchedules } from '@repo/db';

const aiQueue = new Queue('orchestrated-ai-queue', {
  connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
});

const ourProduct =
  'UTUNE AI — B2B lead intelligence platform. Kami menyediakan AI-powered lead scoring, financial simulation, market analysis, dan scraping otomatis untuk sales team B2B di Indonesia.';

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

      let insertedCount = 0;
      for (const res of rawResults) {
        const [inserted] = await db
          .insert(leads)
          .values({
            workspaceId,
            name: (res.name as string) || 'Unknown',
            address: (res.address as string) || null,
            phone: (res.phone as string) || null,
            website: (res.website as string) || null,
            mapsUrl: (res.maps_url as string) || null,
            lat: (res.lat as number) || null,
            lng: (res.lng as number) || null,
            category: (res.category as string) || query,
          })
          .returning();

        const rawText = [
          `Name: ${inserted.name}`,
          inserted.address && `Address: ${inserted.address}`,
          inserted.phone && `Phone: ${inserted.phone}`,
          inserted.website && `Website: ${inserted.website}`,
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
