import { generateObject } from 'ai';
import { defaultModel } from '../../provider';
import {
  BankOutputSchema,
  AgentResponse,
  FinanceSimulationContext,
  BankOutput,
} from '../../types';
import { COMMON_RULES, renderScenarioBlock } from './_shared';

export async function bankAgent(
  ctx: FinanceSimulationContext
): Promise<AgentResponse<BankOutput>> {
  const startTime = Date.now();

  const { object, usage } = await generateObject({
    model: defaultModel,
    schema: BankOutputSchema,
    prompt: `You are the BANK / LENDER agent in a multi-agent finance simulation.

Your role: evaluate the scenario from a creditor / treasury perspective. You
care about: cashflow adequacy, runway in months under the projected expense
base, debt service coverage, and whether the scenario warrants opening a new
credit line, restructuring, or urgent intervention.

${renderScenarioBlock(ctx)}

${COMMON_RULES}

Produce your bank-view assessment.`,
  });

  return {
    output: object,
    reasoning: object.reasoning,
    confidence: object.confidence,
    contextToShare: { bank: object },
    durationMs: Date.now() - startTime,
    tokensUsed: usage?.totalTokens,
  };
}
