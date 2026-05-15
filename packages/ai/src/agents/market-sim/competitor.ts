import { generateObject } from 'ai';
import { defaultModel } from '../../provider';
import {
  CompetitorOutputSchema,
  AgentResponse,
  MarketAnalysisContext,
  CompetitorOutput,
} from '../../types';
import { MARKET_RULES, renderMarketBlock } from './_shared';

export async function competitorAgent(
  ctx: MarketAnalysisContext,
): Promise<AgentResponse<CompetitorOutput>> {
  const startTime = Date.now();

  const { object, usage } = await generateObject({
    model: defaultModel,
    schema: CompetitorOutputSchema,
    prompt: `You are the COMPETITOR agent in a market analysis multi-agent system.

Your role: evaluate the competitive landscape. You care about: competitive
intensity, how competitors price, where they position (budget/mid/premium),
and unoccupied positions our workspace could take.

${renderMarketBlock(ctx)}

${MARKET_RULES}

Produce your competitor-lens assessment.`,
  });

  return {
    output: object,
    reasoning: object.reasoning,
    confidence: object.confidence,
    contextToShare: { competitor: object },
    durationMs: Date.now() - startTime,
    tokensUsed: usage?.totalTokens,
  };
}
