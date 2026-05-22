import { z } from 'zod';

export const ScrapeJobPayloadSchema = z.object({
  workspaceId: z.string().uuid(),
  query: z.string().min(1),
  limit: z.number().int().positive().default(10),
  scheduleId: z.string().uuid().optional(),
});

export type ScrapeJobPayload = z.infer<typeof ScrapeJobPayloadSchema>;

/**
 * Payload for triggering a finance multi-agent simulation. The simulation
 * row must already exist (status='pending') — the worker picks it up by id.
 */
export const FinanceSimulationJobPayloadSchema = z.object({
  simulationId: z.string().uuid(),
  workspaceId: z.string().uuid(),
});

export type FinanceSimulationJobPayload = z.infer<
  typeof FinanceSimulationJobPayloadSchema
>;

/**
 * Payload for triggering a market-analysis multi-agent run. The
 * market_analyses row must already exist (status='pending'); the worker
 * picks it up by id.
 */
export const MarketAnalysisJobPayloadSchema = z.object({
  marketAnalysisId: z.string().uuid(),
  workspaceId: z.string().uuid(),
});

export type MarketAnalysisJobPayload = z.infer<
  typeof MarketAnalysisJobPayloadSchema
>;

/**
 * Payload for triggering the market scraper. The worker will fetch
 * competitor / industry data and write rows to market_data.
 */
export const MarketScrapeJobPayloadSchema = z.object({
  workspaceId: z.string().uuid(),
  industry: z.string().min(1),
  region: z.string().min(1),
  limit: z.number().int().positive().default(10),
});

export type MarketScrapeJobPayload = z.infer<typeof MarketScrapeJobPayloadSchema>;
