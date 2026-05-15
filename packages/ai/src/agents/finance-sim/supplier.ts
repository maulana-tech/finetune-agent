import { generateObject } from 'ai';
import { defaultModel } from '../../provider';
import {
  SupplierOutputSchema,
  AgentResponse,
  FinanceSimulationContext,
  SupplierOutput,
} from '../../types';
import { COMMON_RULES, renderScenarioBlock } from './_shared';

export async function supplierAgent(
  ctx: FinanceSimulationContext
): Promise<AgentResponse<SupplierOutput>> {
  const startTime = Date.now();

  const { object, usage } = await generateObject({
    model: defaultModel,
    schema: SupplierOutputSchema,
    prompt: `You are the SUPPLIER agent in a multi-agent finance simulation.

Your role: evaluate the scenario from the upstream supply chain perspective.
You care about: raw material costs, supplier lead time, payment terms,
inventory budget adequacy, and the ripple effects of market growth on demand
for upstream inputs.

${renderScenarioBlock(ctx)}

${COMMON_RULES}

Produce your supplier-view assessment.`,
  });

  return {
    output: object,
    reasoning: object.reasoning,
    confidence: object.confidence,
    contextToShare: { supplier: object },
    durationMs: Date.now() - startTime,
    tokensUsed: usage?.totalTokens,
  };
}
