import { Worker } from 'bullmq';
import { eq, and, desc } from 'drizzle-orm';
import {
  runMarketAnalysis,
  MarketSeed,
  MarketScenario,
} from '@repo/ai';
import {
  db,
  agentLogs,
  marketAnalyses,
  marketData,
  type MarketAnalysisResult,
} from '@repo/db';
import type { MarketAnalysisJobPayload } from '@repo/shared';

const AGENT_ROLES: Record<string, string> = {
  competitor: 'Competitive landscape — pricing, positioning, differentiation gaps',
  trend: 'Industry direction — declining / flat / growing / accelerating + drivers',
  risk: 'External risk — regulatory, macro, supply chain; produces mitigations',
  demand: 'Customer demand — trajectory, willingness-to-pay, buying triggers',
  synthesizer: 'Synthesizer — reconciles 4 lenses into opportunity score + positioning',
};

/**
 * Market Analysis Worker
 *
 * Consumes `market-analysis-queue`:
 * 1. Loads market_analyses row (created by API in 'pending')
 * 2. Builds MarketSeed from recent market_data rows
 * 3. Runs orchestrator (Competitor/Trend/Risk/Demand parallel + Synthesizer)
 * 4. Logs each agent execution to agent_logs
 * 5. Writes final view back to market_analyses row
 */
export const startMarketAnalysisWorker = () => {
  const worker = new Worker(
    'market-analysis-queue',
    async (job) => {
      const { marketAnalysisId, workspaceId } = job.data as MarketAnalysisJobPayload;
      console.log(`[MarketAnalysis] Picked up analysis ${marketAnalysisId}`);

      const [row] = await db
        .select()
        .from(marketAnalyses)
        .where(eq(marketAnalyses.id, marketAnalysisId))
        .limit(1);

      if (!row) {
        throw new Error(`Market analysis ${marketAnalysisId} not found`);
      }

      await db
        .update(marketAnalyses)
        .set({ status: 'running' })
        .where(eq(marketAnalyses.id, marketAnalysisId));

      try {
        const seed = await buildMarketSeed(workspaceId);

        const result = await runMarketAnalysis({
          marketAnalysisId,
          workspaceId,
          scenario: row.scenarioParams as MarketScenario,
          seed,
        });

        for (const step of result.steps) {
          await db.insert(agentLogs).values({
            workspaceId,
            marketAnalysisId,
            agentName: step.agentName,
            agentRole: AGENT_ROLES[step.agentName] ?? 'Unknown agent role',
            executionId: result.executionId,
            stepNumber: step.stepNumber,
            input: {
              scenario: row.scenarioParams,
              seedSize: seed.totalRecords,
            },
            output: step.output as object,
            reasoning: step.reasoning,
            confidence: step.confidence,
            contextFromPreviousAgent:
              step.agentName === 'synthesizer'
                ? {
                    perspectives: result.steps
                      .filter((s) => s.stepNumber === 1)
                      .reduce(
                        (acc, s) => ({ ...acc, [s.agentName]: s.output }),
                        {},
                      ),
                  }
                : null,
            contextSharedToNextAgent:
              step.stepNumber === 1 ? { [step.agentName]: step.output } : null,
            durationMs: step.durationMs,
            tokensUsed: step.tokensUsed,
          });
        }

        const resultPayload: MarketAnalysisResult = {
          opportunity_score: result.finalView.opportunity_score,
          positioning_recommendation: result.finalView.positioning_recommendation,
          top_opportunities: result.finalView.top_opportunities,
          top_threats: result.finalView.top_threats,
          primary_drivers: result.finalView.primary_drivers,
        };

        await db
          .update(marketAnalyses)
          .set({
            status: 'completed',
            executionId: result.executionId,
            dataSeedSize: seed.totalRecords,
            result: resultPayload,
            riskLevel: result.finalView.risk_level,
            summary: result.finalView.summary,
            finalReasoning: result.finalView.reasoning,
            confidence: result.finalView.confidence,
            totalDurationMs: result.totalDurationMs,
            totalTokensUsed: result.totalTokensUsed,
            completedAt: new Date(),
          })
          .where(eq(marketAnalyses.id, marketAnalysisId));

        console.log(
          `[MarketAnalysis] Completed ${marketAnalysisId} opp=${result.finalView.opportunity_score} risk=${result.finalView.risk_level}`,
        );

        return {
          success: true,
          executionId: result.executionId,
          opportunityScore: result.finalView.opportunity_score,
          riskLevel: result.finalView.risk_level,
          totalDurationMs: result.totalDurationMs,
          totalTokensUsed: result.totalTokensUsed,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[MarketAnalysis] Failed ${marketAnalysisId}:`, message);
        await db
          .update(marketAnalyses)
          .set({ status: 'failed', errorMessage: message })
          .where(eq(marketAnalyses.id, marketAnalysisId));
        throw err;
      }
    },
    {
      connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
    },
  );

  worker.on('completed', (job) =>
    console.log(`[MarketAnalysis] Job ${job.id} completed`),
  );
  worker.on('failed', (job, err) =>
    console.log(`[MarketAnalysis] Job ${job?.id} failed: ${err.message}`),
  );

  console.log('[MarketAnalysis] Worker started - listening to market-analysis-queue');
};

/* =============================================================
   Build a compact seed from recent market_data rows
   ============================================================= */
async function buildMarketSeed(workspaceId: string): Promise<MarketSeed> {
  const rows = await db
    .select()
    .from(marketData)
    .where(eq(marketData.workspaceId, workspaceId))
    .orderBy(desc(marketData.scrapedAt))
    .limit(100); // cap to keep prompt manageable

  const counts = {
    competitor: 0,
    pricing: 0,
    news: 0,
    trend: 0,
    demand: 0,
  };
  const regions = new Set<string>();
  const competitors: { name: string; category: string; signal?: string }[] = [];
  const headlines: { title: string; source: string }[] = [];

  for (const r of rows) {
    if (r.region) regions.add(r.region);
    switch (r.dataType) {
      case 'competitor_listing': {
        counts.competitor++;
        if (competitors.length < 8) {
          const payload = r.payload as Record<string, unknown>;
          competitors.push({
            name: r.title || (payload.name as string) || 'unnamed',
            category: r.industry || (payload.category as string) || 'unknown',
            signal: (payload.signal as string) || undefined,
          });
        }
        break;
      }
      case 'pricing_signal':
        counts.pricing++;
        break;
      case 'industry_news': {
        counts.news++;
        if (headlines.length < 6) {
          headlines.push({
            title: r.title || 'untitled',
            source: r.source ?? 'unknown',
          });
        }
        break;
      }
      case 'trend_signal':
        counts.trend++;
        break;
      case 'demand_signal':
        counts.demand++;
        break;
      default:
        break;
    }
  }

  return {
    totalRecords: rows.length,
    competitorCount: counts.competitor,
    pricingSignalCount: counts.pricing,
    industryNewsCount: counts.news,
    trendSignalCount: counts.trend,
    demandSignalCount: counts.demand,
    topCompetitors: competitors,
    recentHeadlines: headlines,
    regions: Array.from(regions),
  };
}

// `and` and `desc` are imported above for the query; keeping linter happy
void and;
