import { v4 as uuidv4 } from 'uuid';
import {
  AgentResponse,
  MarketSeed,
  MarketScenario,
  MarketAnalysisContext,
  MarketSynthesizerOutput,
  CompetitorOutput,
  TrendOutput,
  RiskOutput,
  DemandOutput,
} from './types';
import { competitorAgent } from './agents/market-sim/competitor';
import { trendAgent } from './agents/market-sim/trend';
import { riskAgent } from './agents/market-sim/risk';
import { demandAgent } from './agents/market-sim/demand';
import { marketSynthesizerAgent } from './agents/market-sim/synthesizer';

/**
 * Market Analysis Multi-Agent Orchestrator
 *
 * Topology mirrors the finance-simulation pipeline: 4 perspective agents run
 * in PARALLEL, then a synthesizer reconciles their views.
 *
 *   ┌── Competitor ─┐
 *   ├── Trend ──────┤  (parallel)
 *   ├── Risk ───────┤
 *   └── Demand ─────┘
 *           │
 *           ▼
 *      Synthesizer  → opportunity score + positioning recommendation
 */

export interface MarketOrchestratorInput {
  marketAnalysisId: string;
  workspaceId: string;
  scenario: MarketScenario;
  seed: MarketSeed;
}

export interface MarketOrchestratorStep {
  agentName: 'competitor' | 'trend' | 'risk' | 'demand' | 'synthesizer';
  stepNumber: number;
  output: unknown;
  reasoning: string;
  confidence: number;
  durationMs: number;
  tokensUsed?: number;
}

export interface MarketOrchestratorResult {
  executionId: string;
  success: boolean;
  steps: MarketOrchestratorStep[];
  finalView: MarketSynthesizerOutput;
  totalDurationMs: number;
  totalTokensUsed: number;
}

export async function runMarketAnalysis(
  input: MarketOrchestratorInput,
): Promise<MarketOrchestratorResult> {
  const executionId = uuidv4();
  const startTime = Date.now();

  const ctx: MarketAnalysisContext = {
    executionId,
    marketAnalysisId: input.marketAnalysisId,
    workspaceId: input.workspaceId,
    scenario: input.scenario,
    seed: input.seed,
  };

  console.log(
    `[MarketOrchestrator] Starting execution ${executionId} for analysis ${input.marketAnalysisId}`,
  );

  // ============ PERSPECTIVE PHASE — parallel ============
  console.log('[MarketOrchestrator] Running Competitor/Trend/Risk/Demand in parallel');

  const [competitorRes, trendRes, riskRes, demandRes] = await Promise.all([
    competitorAgent(ctx) as Promise<AgentResponse<CompetitorOutput>>,
    trendAgent(ctx) as Promise<AgentResponse<TrendOutput>>,
    riskAgent(ctx) as Promise<AgentResponse<RiskOutput>>,
    demandAgent(ctx) as Promise<AgentResponse<DemandOutput>>,
  ]);

  const perspectiveSteps: MarketOrchestratorStep[] = [
    {
      agentName: 'competitor',
      stepNumber: 1,
      output: competitorRes.output,
      reasoning: competitorRes.reasoning,
      confidence: competitorRes.confidence,
      durationMs: competitorRes.durationMs,
      tokensUsed: competitorRes.tokensUsed,
    },
    {
      agentName: 'trend',
      stepNumber: 1,
      output: trendRes.output,
      reasoning: trendRes.reasoning,
      confidence: trendRes.confidence,
      durationMs: trendRes.durationMs,
      tokensUsed: trendRes.tokensUsed,
    },
    {
      agentName: 'risk',
      stepNumber: 1,
      output: riskRes.output,
      reasoning: riskRes.reasoning,
      confidence: riskRes.confidence,
      durationMs: riskRes.durationMs,
      tokensUsed: riskRes.tokensUsed,
    },
    {
      agentName: 'demand',
      stepNumber: 1,
      output: demandRes.output,
      reasoning: demandRes.reasoning,
      confidence: demandRes.confidence,
      durationMs: demandRes.durationMs,
      tokensUsed: demandRes.tokensUsed,
    },
  ];

  for (const s of perspectiveSteps) {
    console.log(
      `[MarketOrchestrator]   ✓ ${s.agentName} confidence=${s.confidence}% in ${s.durationMs}ms`,
    );
  }

  // ============ SYNTHESIS PHASE ============
  console.log('[MarketOrchestrator] Running Synthesizer with 4 perspective views');

  const synthRes = await marketSynthesizerAgent({
    ctx,
    competitor: competitorRes.output,
    trend: trendRes.output,
    risk: riskRes.output,
    demand: demandRes.output,
  });

  const synthesizerStep: MarketOrchestratorStep = {
    agentName: 'synthesizer',
    stepNumber: 2,
    output: synthRes.output,
    reasoning: synthRes.reasoning,
    confidence: synthRes.confidence,
    durationMs: synthRes.durationMs,
    tokensUsed: synthRes.tokensUsed,
  };

  const steps: MarketOrchestratorStep[] = [...perspectiveSteps, synthesizerStep];

  const totalDurationMs = Date.now() - startTime;
  const totalTokensUsed = steps.reduce((sum, s) => sum + (s.tokensUsed || 0), 0);

  console.log(
    `[MarketOrchestrator] Done. risk=${synthRes.output.risk_level} opp=${synthRes.output.opportunity_score} confidence=${synthRes.confidence}% total=${totalDurationMs}ms tokens=${totalTokensUsed}`,
  );

  return {
    executionId,
    success: true,
    steps,
    finalView: synthRes.output,
    totalDurationMs,
    totalTokensUsed,
  };
}
