import { generateObject } from 'ai';
import { defaultModel } from '../provider';
import { FinanceOutputSchema, AgentContext, AgentResponse } from '../types';

export async function analyzeFinancials(
  context: AgentContext
): Promise<AgentResponse> {
  const startTime = Date.now();

  if (!context.extractedData) {
    throw new Error('Finance agent requires extractedData from previous agent');
  }

  const { object, usage } = await generateObject({
    model: defaultModel,
    schema: FinanceOutputSchema,
    prompt: `You are a financial analyst specializing in B2B lead qualification.

CONTEXT FROM PREVIOUS AGENT (Extractor):
${JSON.stringify(context.extractedData, null, 2)}

YOUR TASK:
Estimate this business's financial health and capacity to purchase B2B tools.

CRITICAL RULES:
1. Use strictly clinical and analytical tone - no buzzwords
2. Base estimates on tangible signals (company size, category, services)
3. Provide clear reasoning (2-3 sentences)
4. Rate confidence based on available data quality

Execution Context:
- Execution ID: ${context.executionId}
- Lead ID: ${context.leadId}
- Step: ${context.stepNumber} (Finance Agent - receives context from Extractor)

Output: financial analysis with reasoning and confidence score.`,
  });

  const durationMs = Date.now() - startTime;

  return {
    output: {
      estimated_revenue_range: object.estimated_revenue_range,
      company_size: object.company_size,
      budget_probability: object.budget_probability,
      financial_health_score: object.financial_health_score,
      reasoning: object.reasoning,
    },
    reasoning: object.reasoning,
    confidence: object.confidence,
    contextToShare: {
      financialAnalysis: {
        estimated_revenue_range: object.estimated_revenue_range,
        company_size: object.company_size,
        budget_probability: object.budget_probability,
        reasoning: object.reasoning,
      },
    },
    durationMs,
    tokensUsed: usage?.totalTokens,
  };
}
