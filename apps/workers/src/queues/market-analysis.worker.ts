import { Worker } from 'bullmq';
import { eq, and, desc } from 'drizzle-orm';
import {
  runMarketAnalysis,
  runMarketAnalysisSwarm,
  type SwarmRunResult,
  MarketSeed,
  MarketScenario,
} from '@repo/ai';
import {
  db,
  agentLogs,
  marketAnalyses,
  marketData,
  swarmRuns,
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

        const useSwarm = process.env.USE_SWARM_AGENTS === 'true';
        const result = useSwarm
          ? await runMarketAnalysisSwarm({
              marketAnalysisId,
              workspaceId,
              scenario: row.scenarioParams as any,
              seed,
            })
          : await runMarketAnalysis({
              marketAnalysisId,
              workspaceId,
              scenario: row.scenarioParams as MarketScenario,
              seed,
            });

        const steps = useSwarm
          ? swarmStepsToOrchestratorSteps(result as SwarmRunResult)
          : (result as Awaited<ReturnType<typeof runMarketAnalysis>>).steps;
        const finalView = useSwarm
          ? swarmOutputToFinalView(result as SwarmRunResult)
          : (result as Awaited<ReturnType<typeof runMarketAnalysis>>).finalView;
        const executionId = result.executionId;
        const totalDurationMs = result.totalDurationMs;
        const totalTokensUsed = result.totalTokensUsed;

        for (const step of steps) {
          await db.insert(agentLogs).values({
            workspaceId,
            marketAnalysisId,
            agentName: step.agentName,
            agentRole: AGENT_ROLES[step.agentName] ?? 'Unknown agent role',
            executionId,
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
                    perspectives: steps
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
            handoffFrom: step.handoffFrom ?? null,
            parallelGroup: step.parallelGroup ?? null,
          });
        }

        const resultPayload: MarketAnalysisResult = {
          opportunity_score: finalView.opportunity_score,
          positioning_recommendation: finalView.positioning_recommendation,
          top_opportunities: finalView.top_opportunities,
          top_threats: finalView.top_threats,
          primary_drivers: finalView.primary_drivers,
        };

        await db
          .update(marketAnalyses)
          .set({
            status: 'completed',
            executionId,
            dataSeedSize: seed.totalRecords,
            result: resultPayload,
            riskLevel: finalView.risk_level,
            summary: finalView.summary,
            finalReasoning: finalView.reasoning,
            confidence: finalView.confidence,
            totalDurationMs,
            totalTokensUsed,
            completedAt: new Date(),
          })
          .where(eq(marketAnalyses.id, marketAnalysisId));

        // Record the swarm run for observability
        if (useSwarm) {
          await db.insert(swarmRuns).values({
            workspaceId,
            executionId,
            workflowName: 'market-analysis',
            entryAgent: 'market-coordinator',
            marketAnalysisId,
            totalSteps: steps.length,
            totalDurationMs,
            totalTokensUsed,
            status: 'completed',
          });
        }

        console.log(
          `[MarketAnalysis] Completed ${marketAnalysisId} opp=${finalView.opportunity_score} risk=${finalView.risk_level}`,
        );

        return {
          success: true,
          executionId,
          opportunityScore: finalView.opportunity_score,
          riskLevel: finalView.risk_level,
          totalDurationMs,
          totalTokensUsed,
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
   Swarm adapters
   ============================================================= */

function swarmStepsToOrchestratorSteps(
  result: SwarmRunResult,
): { agentName: string; stepNumber: number; output: any; reasoning: string; confidence: number; durationMs: number; tokensUsed?: number; handoffFrom?: string; parallelGroup?: string }[] {
  return result.steps.map((s, i) => ({
    agentName: s.agentName,
    stepNumber: i + 1,
    output: s.output as Record<string, unknown>,
    reasoning: s.reasoning,
    confidence: s.confidence,
    durationMs: s.durationMs,
    tokensUsed: s.tokensUsed,
    handoffFrom: s.handoffFrom,
    parallelGroup: s.parallelGroup,
  }));
}

function swarmOutputToFinalView(result: SwarmRunResult) {
  const out = (result.finalOutput ?? result.steps[result.steps.length - 1]?.output) as Record<string, unknown> | undefined;
  return {
    risk_level: (out?.risk_level as 'low' | 'medium' | 'high' | 'critical') ?? 'medium',
    opportunity_score: (out?.opportunity_score as number) ?? 0,
    positioning_recommendation: (out?.positioning_recommendation as string) ?? '',
    summary: (out?.summary as string) ?? '',
    top_opportunities: (out?.top_opportunities as string[]) ?? [],
    top_threats: (out?.top_threats as string[]) ?? [],
    primary_drivers: (out?.primary_drivers as string[]) ?? [],
    reasoning: (out?.reasoning as string) ?? '',
    confidence: (out?.confidence as number) ?? 0,
  };
}

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
