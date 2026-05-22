import { Swarm } from '../run-loop';
import { agentRegistry } from '../registry';
import { createSwarmContext } from '../context';
import { SwarmRunResult } from '../types';
import '../agents/market-coordinator.swarm';
import '../agents/competitor.swarm';
import '../agents/trend.swarm';
import '../agents/risk.swarm';
import '../agents/demand.swarm';
import '../agents/market-synthesizer.swarm';

export interface MarketAnalysisSwarmInput {
  marketAnalysisId: string;
  workspaceId: string;
  scenario: {
    industry: string;
    region: string;
    target_segment: string;
    competitor_focus: 'pricing' | 'product' | 'positioning' | 'all';
    time_horizon_months: number;
  };
  seed: {
    totalRecords: number;
    competitorCount: number;
    pricingSignalCount: number;
    industryNewsCount: number;
    trendSignalCount: number;
    demandSignalCount: number;
    topCompetitors: { name: string; category: string; signal?: string }[];
    recentHeadlines: { title: string; source: string }[];
    regions: string[];
  };
}

/**
 * Market Analysis Swarm
 *
 * Topology:
 *   market-coordinator
 *     ↓ _parallel fan-out
 *   [competitor ∥ trend ∥ risk ∥ demand]   (4 agents, concurrent)
 *     ↓ all complete
 *   market-synthesizer                      (terminal)
 */
export async function runMarketAnalysisSwarm(
  input: MarketAnalysisSwarmInput,
): Promise<SwarmRunResult> {
  const context = createSwarmContext({
    workspaceId: input.workspaceId,
    marketAnalysisId: input.marketAnalysisId,
    initialData: {
      scenario: input.scenario,
      seed: input.seed,
    },
  });

  const swarm = new Swarm(agentRegistry);
  return swarm.run('market-coordinator', context);
}
