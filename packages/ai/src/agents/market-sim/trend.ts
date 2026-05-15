import { generateObject } from 'ai';
import { defaultModel } from '../../provider';
import {
  TrendOutputSchema,
  AgentResponse,
  MarketAnalysisContext,
  TrendOutput,
} from '../../types';
import { MARKET_RULES, renderMarketBlock } from './_shared';

export async function trendAgent(
  ctx: MarketAnalysisContext,
): Promise<AgentResponse<TrendOutput>> {
  const startTime = Date.now();

  const { object, usage } = await generateObject({
    model: defaultModel,
    schema: TrendOutputSchema,
    prompt: `You are the TREND agent in a market analysis multi-agent system.

Your role: evaluate the macro / industry direction. You care about: where the
category is heading (declining / flat / growing / accelerating), what is
driving that direction (regulation, tech, demographics, consumer behaviour).

${renderMarketBlock(ctx)}

${MARKET_RULES}

Produce your trend-lens assessment.`,
  });

  return {
    output: object,
    reasoning: object.reasoning,
    confidence: object.confidence,
    contextToShare: { trend: object },
    durationMs: Date.now() - startTime,
    tokensUsed: usage?.totalTokens,
  };
}
