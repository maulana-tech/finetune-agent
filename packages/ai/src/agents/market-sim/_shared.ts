import { MarketAnalysisContext } from '../../types';

/**
 * Stable prompt block consumed by every market-analysis agent. Keeping a
 * single formatter ensures all agents reason over an identical seed view.
 */
export function renderMarketBlock(ctx: MarketAnalysisContext): string {
  const { scenario, seed } = ctx;
  return `SCENARIO:
- Industry: ${scenario.industry}
- Region: ${scenario.region}
- Target segment: ${scenario.target_segment}
- Competitor focus: ${scenario.competitor_focus}
- Time horizon: ${scenario.time_horizon_months} month(s)

MARKET DATA SEED (${seed.totalRecords} records):
- Competitor listings: ${seed.competitorCount}
- Pricing signals: ${seed.pricingSignalCount}
- Industry news / headlines: ${seed.industryNewsCount}
- Trend signals: ${seed.trendSignalCount}
- Demand signals: ${seed.demandSignalCount}
- Regions covered: ${seed.regions.join(', ') || 'n/a'}

TOP COMPETITORS:
${seed.topCompetitors.length === 0 ? '- (none recorded yet)' : seed.topCompetitors
  .map((c) => `- ${c.name} [${c.category}]${c.signal ? ` — ${c.signal}` : ''}`)
  .join('\n')}

RECENT HEADLINES:
${seed.recentHeadlines.length === 0 ? '- (none recorded yet)' : seed.recentHeadlines
  .map((h) => `- "${h.title}" (${h.source})`)
  .join('\n')}

EXECUTION CONTEXT:
- Execution ID: ${ctx.executionId}
- Market Analysis ID: ${ctx.marketAnalysisId}
- Workspace ID: ${ctx.workspaceId}`;
}

export const MARKET_RULES = `CRITICAL RULES:
1. Clinical, analytical tone — no buzzwords, no marketing speak.
2. Ground every claim in the data seed above. If data is thin, say so and lower confidence.
3. Concrete findings — name the competitor, name the trend, name the risk.
4. Reasoning must be 2-4 sentences explaining HOW you arrived at the conclusion.
5. Confidence (0-100) reflects data sufficiency, not your enthusiasm.`;
