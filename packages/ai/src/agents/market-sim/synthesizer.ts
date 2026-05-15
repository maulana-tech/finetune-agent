import { generateObject } from 'ai';
import { defaultModel } from '../../provider';
import {
  MarketSynthesizerOutputSchema,
  AgentResponse,
  MarketAnalysisContext,
  CompetitorOutput,
  TrendOutput,
  RiskOutput,
  DemandOutput,
  MarketSynthesizerOutput,
} from '../../types';
import { renderMarketBlock } from './_shared';

export interface MarketSynthesizerInput {
  ctx: MarketAnalysisContext;
  competitor: CompetitorOutput;
  trend: TrendOutput;
  risk: RiskOutput;
  demand: DemandOutput;
}

export async function marketSynthesizerAgent(
  input: MarketSynthesizerInput,
): Promise<AgentResponse<MarketSynthesizerOutput>> {
  const startTime = Date.now();
  const { ctx, competitor, trend, risk, demand } = input;

  const { object, usage } = await generateObject({
    model: defaultModel,
    schema: MarketSynthesizerOutputSchema,
    prompt: `You are the SYNTHESIZER agent for the market-analysis pipeline. Four
perspective agents ran in parallel. Your job: reconcile them into a single
opportunity score, positioning recommendation, and risk classification.

${renderMarketBlock(ctx)}

PERSPECTIVE AGENTS:

COMPETITOR:
${JSON.stringify(competitor, null, 2)}

TREND:
${JSON.stringify(trend, null, 2)}

RISK:
${JSON.stringify(risk, null, 2)}

DEMAND:
${JSON.stringify(demand, null, 2)}

CRITICAL RULES:
1. opportunity_score (0-100): weight DEMAND trajectory + TREND direction positively,
   penalise by COMPETITOR intensity + RISK level. Show your math in reasoning.
2. risk_level:
   - low: all agents neutral/positive, risk agent says low across the board
   - medium: at least one negative outlook OR one high risk dimension
   - high: multiple negatives OR high risks not mitigatable
   - critical: risk agent flags critical regulatory or macro risk
3. positioning_recommendation: 1 sentence, concrete, references the differentiation
   gaps from COMPETITOR agent. Avoid generic phrasing.
4. top_opportunities / top_threats: 3-5 each, no overlap, name specifics.
5. primary_drivers: which 2-4 agent insights were decisive in your synthesis.
6. confidence (0-100): reflects how thin or rich the data seed was (${ctx.seed.totalRecords} records).

Produce the final synthesised market view.`,
  });

  return {
    output: object,
    reasoning: object.reasoning,
    confidence: object.confidence,
    contextToShare: { synthesizer: object },
    durationMs: Date.now() - startTime,
    tokensUsed: usage?.totalTokens,
  };
}
