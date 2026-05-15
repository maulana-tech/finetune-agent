import { generateObject } from 'ai';
import { defaultModel } from '../../provider';
import {
  RiskOutputSchema,
  AgentResponse,
  MarketAnalysisContext,
  RiskOutput,
} from '../../types';
import { MARKET_RULES, renderMarketBlock } from './_shared';

export async function riskAgent(
  ctx: MarketAnalysisContext,
): Promise<AgentResponse<RiskOutput>> {
  const startTime = Date.now();

  const { object, usage } = await generateObject({
    model: defaultModel,
    schema: RiskOutputSchema,
    prompt: `You are the RISK agent in a market analysis multi-agent system.

Your role: evaluate external risks the workspace would face entering or staying
in this market. You care about: regulatory pressure, macro / FX / inflation
risk, supply chain fragility. Name concrete mitigations.

${renderMarketBlock(ctx)}

${MARKET_RULES}

Produce your risk-lens assessment.`,
  });

  return {
    output: object,
    reasoning: object.reasoning,
    confidence: object.confidence,
    contextToShare: { risk: object },
    durationMs: Date.now() - startTime,
    tokensUsed: usage?.totalTokens,
  };
}
