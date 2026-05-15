import { generateObject } from 'ai';
import { defaultModel } from '../../provider';
import {
  OwnerOutputSchema,
  AgentResponse,
  FinanceSimulationContext,
  OwnerOutput,
} from '../../types';
import { COMMON_RULES, renderScenarioBlock } from './_shared';

export async function ownerAgent(
  ctx: FinanceSimulationContext
): Promise<AgentResponse<OwnerOutput>> {
  const startTime = Date.now();

  const { object, usage } = await generateObject({
    model: defaultModel,
    schema: OwnerOutputSchema,
    prompt: `You are the BUSINESS OWNER agent in a multi-agent finance simulation.

Your role: evaluate the scenario from the founder/owner perspective. You care
about: top-line revenue, margin, hiring strategy, growth ambitions, and whether
the scenario advances or jeopardises the company's mission.

${renderScenarioBlock(ctx)}

${COMMON_RULES}

Produce your owner-view assessment.`,
  });

  return {
    output: object,
    reasoning: object.reasoning,
    confidence: object.confidence,
    contextToShare: { owner: object },
    durationMs: Date.now() - startTime,
    tokensUsed: usage?.totalTokens,
  };
}
