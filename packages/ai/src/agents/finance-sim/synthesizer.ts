import { generateObject } from 'ai';
import { defaultModel } from '../../provider';
import {
  SynthesizerOutputSchema,
  AgentResponse,
  FinanceSimulationContext,
  OwnerOutput,
  SupplierOutput,
  CustomerOutput,
  BankOutput,
  SynthesizerOutput,
} from '../../types';
import { renderScenarioBlock } from './_shared';

export interface SynthesizerInput {
  ctx: FinanceSimulationContext;
  owner: OwnerOutput;
  supplier: SupplierOutput;
  customer: CustomerOutput;
  bank: BankOutput;
}

export async function synthesizerAgent(
  input: SynthesizerInput
): Promise<AgentResponse<SynthesizerOutput>> {
  const startTime = Date.now();
  const { ctx, owner, supplier, customer, bank } = input;

  const { object, usage } = await generateObject({
    model: defaultModel,
    schema: SynthesizerOutputSchema,
    prompt: `You are the SYNTHESIZER agent. Four stakeholder agents ran in parallel
on the same scenario. Your job: reconcile their independent perspectives into a
single cashflow forecast.

${renderScenarioBlock(ctx)}

STAKEHOLDER VIEWS:

OWNER:
${JSON.stringify(owner, null, 2)}

SUPPLIER:
${JSON.stringify(supplier, null, 2)}

CUSTOMER:
${JSON.stringify(customer, null, 2)}

BANK:
${JSON.stringify(bank, null, 2)}

CRITICAL RULES:
1. Forecast in IDR. Build monthly projection for exactly ${ctx.forecastMonths} month(s) (month_offset 1..${ctx.forecastMonths}).
2. Base income projection on the data seed's averageMonthlyIncome, then adjust by:
   - price_change_pct × revenue lever
   - market_growth_pct × demand lever
   - customer demand_change_pct
3. Base expense projection on averageMonthlyExpense, then adjust by:
   - inventory_budget_monthly (replaces or augments material spend)
   - hiring_delta × estimated payroll per head (assume IDR 8,000,000/month/employee unless data suggests otherwise)
   - supplier cost_pressure
4. Conflicting views should NOT be averaged blindly — favour the stakeholder whose lens is most relevant to that specific line item, and explain why.
5. risk_level reflects the worst credible scenario from the stakeholder views:
   - low: all stakeholders neutral/positive, runway > 12 months
   - medium: at least one stakeholder negative OR runway 6-12 months
   - high: multiple stakeholders negative OR runway 3-6 months
   - critical: bank flags urgent_intervention OR runway < 3 months
6. confidence reflects forecast quality given data seed depth (${ctx.seed.monthsCovered} months, ${ctx.seed.transactionCount} transactions).

Produce the final synthesised forecast.`,
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
