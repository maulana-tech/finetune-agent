import { generateObject } from 'ai';
import { defaultModel } from '../../provider';
import {
  CustomerOutputSchema,
  AgentResponse,
  FinanceSimulationContext,
  CustomerOutput,
} from '../../types';
import { COMMON_RULES, renderScenarioBlock } from './_shared';

export async function customerAgent(
  ctx: FinanceSimulationContext
): Promise<AgentResponse<CustomerOutput>> {
  const startTime = Date.now();

  const { object, usage } = await generateObject({
    model: defaultModel,
    schema: CustomerOutputSchema,
    prompt: `You are the CUSTOMER agent in a multi-agent finance simulation.

Your role: evaluate the scenario from the demand-side perspective. You care
about: price sensitivity, willingness to pay, demand elasticity, churn risk
when prices change, and how market growth shifts purchase behaviour.

${renderScenarioBlock(ctx)}

${COMMON_RULES}

Produce your customer-view assessment.`,
  });

  return {
    output: object,
    reasoning: object.reasoning,
    confidence: object.confidence,
    contextToShare: { customer: object },
    durationMs: Date.now() - startTime,
    tokensUsed: usage?.totalTokens,
  };
}
