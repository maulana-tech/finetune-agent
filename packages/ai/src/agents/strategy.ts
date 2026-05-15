import { generateObject } from 'ai';
import { defaultModel } from '../provider';
import { StrategyOutputSchema, AgentContext, AgentResponse } from '../types';

export async function strategicRecommendation(
  context: AgentContext
): Promise<AgentResponse> {
  const startTime = Date.now();

  if (!context.extractedData || !context.financialAnalysis || !context.marketingInsights) {
    throw new Error('Strategy agent requires context from all previous agents (extractor, finance, marketing)');
  }

  const { object, usage } = await generateObject({
    model: defaultModel,
    schema: StrategyOutputSchema,
    prompt: `You are a strategic advisor synthesizing multi-agent analysis.

ACCUMULATED CONTEXT FROM ALL AGENTS:

1. EXTRACTOR:
${JSON.stringify(context.extractedData, null, 2)}

2. FINANCE AGENT:
${JSON.stringify(context.financialAnalysis, null, 2)}

3. MARKETING AGENT:
${JSON.stringify(context.marketingInsights, null, 2)}

YOUR TASK:
Synthesize all signals and provide:
- Overall lead quality score (0-100)
- Conversion probability (0.0 - 1.0)
- Estimated deal value ($USD)
- Priority tier (A/B/C/D) where A = hot lead, D = disqualify
- Recommended action (immediate_outreach / nurture / disqualify)
- Strategic alignment score (0-100): how well this lead fits our ICP

CRITICAL RULES:
1. Your recommendation must be data-driven - reference specific insights from previous agents
2. Use clinical strategic tone - NO buzzwords
3. Reasoning must explain WHY (3-4 sentences)
4. If agents gave contradictory signals, explain how you resolved them

Execution Context:
- Execution ID: ${context.executionId}
- Lead ID: ${context.leadId}
- Step: ${context.stepNumber} (Strategy Agent - FINAL SYNTHESIS of all agents)

Output: strategic recommendation with reasoning and confidence.`,
  });

  const durationMs = Date.now() - startTime;

  return {
    output: {
      priority_score: object.priority_score,
      conversion_probability: object.conversion_probability,
      estimated_deal_value: object.estimated_deal_value,
      priority_tier: object.priority_tier,
      recommended_action: object.recommended_action,
      strategic_alignment_score: object.strategic_alignment_score,
    },
    reasoning: object.reasoning,
    confidence: object.confidence,
    contextToShare: {
      strategicRecommendation: {
        priorityScore: object.priority_score,
        conversionProbability: object.conversion_probability,
        recommendedAction: object.recommended_action,
        reasoning: object.reasoning,
      },
    },
    durationMs,
    tokensUsed: usage?.totalTokens,
  };
}
