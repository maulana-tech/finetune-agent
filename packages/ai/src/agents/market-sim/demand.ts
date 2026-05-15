import { generateObject } from 'ai';
import { defaultModel } from '../../provider';
import {
  DemandOutputSchema,
  AgentResponse,
  MarketAnalysisContext,
  DemandOutput,
} from '../../types';
import { MARKET_RULES, renderMarketBlock } from './_shared';

export async function demandAgent(
  ctx: MarketAnalysisContext,
): Promise<AgentResponse<DemandOutput>> {
  const startTime = Date.now();

  const { object, usage } = await generateObject({
    model: defaultModel,
    schema: DemandOutputSchema,
    prompt: `You are the DEMAND agent in a market analysis multi-agent system.

Your role: evaluate end-customer demand in the target segment. You care about:
demand volume trajectory, customer willingness to pay, and the concrete
triggers that drive purchase decisions in this segment.

${renderMarketBlock(ctx)}

${MARKET_RULES}

Produce your demand-lens assessment.`,
  });

  return {
    output: object,
    reasoning: object.reasoning,
    confidence: object.confidence,
    contextToShare: { demand: object },
    durationMs: Date.now() - startTime,
    tokensUsed: usage?.totalTokens,
  };
}
