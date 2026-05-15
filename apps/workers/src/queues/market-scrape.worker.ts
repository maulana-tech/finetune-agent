import { Worker } from 'bullmq';
import { spawn } from 'child_process';
import path from 'path';
import { db, marketData, type NewMarketData } from '@repo/db';
import type { MarketScrapeJobPayload } from '@repo/shared';

/**
 * Market Scrape Worker
 *
 * Consumes `market-scrape-queue` jobs:
 *  1. Spawns the Python `market_scraper.py` for the given industry + region
 *  2. Writes returned records into `market_data` so the multi-agent pipeline
 *     can use them as seed
 *
 * Hackathon note: the Python scraper has a synthetic fallback so even if
 * Playwright / scrapling cannot run in the container, we still produce a
 * minimum set of seed rows.
 */
export const startMarketScrapeWorker = () => {
  const worker = new Worker(
    'market-scrape-queue',
    async (job) => {
      const { workspaceId, industry, region, limit } = job.data as MarketScrapeJobPayload;
      console.log(`[MarketScrape] Started: ${industry} / ${region} limit=${limit}`);

      const rawResults = await runPythonScraper(industry, region, limit);
      console.log(`[MarketScrape] Got ${rawResults.length} records`);

      if (rawResults.length === 0) {
        return { count: 0 };
      }

      const rows: NewMarketData[] = rawResults.map((r) => ({
        workspaceId,
        source: r.source,
        dataType: r.data_type,
        url: r.url ?? null,
        title: r.title ?? null,
        payload: r.payload ?? {},
        industry: r.industry ?? industry,
        region: r.region ?? region,
      }));

      await db.insert(marketData).values(rows);
      console.log(`[MarketScrape] Inserted ${rows.length} market_data rows`);

      return { count: rows.length };
    },
    {
      connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
    },
  );

  worker.on('completed', (job) =>
    console.log(`[MarketScrape] Job ${job.id} completed`),
  );
  worker.on('failed', (job, err) =>
    console.log(`[MarketScrape] Job ${job?.id} failed: ${err.message}`),
  );

  console.log('[MarketScrape] Worker started - listening to market-scrape-queue');
};

interface RawScrapeRecord {
  source: NewMarketData['source'];
  data_type: NewMarketData['dataType'];
  title?: string | null;
  url?: string | null;
  industry?: string | null;
  region?: string | null;
  payload?: Record<string, unknown>;
}

function runPythonScraper(
  industry: string,
  region: string,
  limit: number,
): Promise<RawScrapeRecord[]> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.resolve(__dirname, '../python/market_scraper.py');
    const pythonExec = path.resolve(__dirname, '../../.venv/bin/python');

    const proc = spawn(pythonExec, [
      pythonScript,
      industry,
      region,
      String(limit),
    ]);

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        console.error(`[MarketScrape] python exited ${code}: ${stderr}`);
        return reject(new Error(`market_scraper.py exited with ${code}`));
      }
      try {
        const parsed = JSON.parse(stdout) as RawScrapeRecord[];
        resolve(parsed);
      } catch (e) {
        reject(new Error(`Failed to parse scraper output: ${stdout.slice(0, 200)}`));
      }
    });

    proc.on('error', (err) => reject(err));
  });
}
