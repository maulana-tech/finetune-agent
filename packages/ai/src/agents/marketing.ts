import { generateObject } from 'ai';
import { defaultModel } from '../provider';
import { MarketingOutputSchema, AgentContext, AgentResponse } from '../types';

export async function analyzeMarketing(
  context: AgentContext,
  ourProduct: string
): Promise<AgentResponse> {
  const startTime = Date.now();

  if (!context.extractedData || !context.financialAnalysis) {
    throw new Error('Marketing agent requires extractedData and financialAnalysis from previous agents');
  }

  const { object, usage } = await generateObject({
    model: defaultModel,
    schema: MarketingOutputSchema,
    prompt: `You are a B2B marketing strategist. Analyze this lead's messaging fit.

CONTEXT FROM PREVIOUS AGENTS:

1. EXTRACTOR OUTPUT:
${JSON.stringify(context.extractedData, null, 2)}

2. FINANCE AGENT OUTPUT:
${JSON.stringify(context.financialAnalysis, null, 2)}

OUR PRODUCT/SERVICE:
${ourProduct}

YOUR TASK:
Determine:
- Who is their target customer (persona)?
- What are their top 3 pain points we can solve?
- How should we position our product to them?
- How well does our product fit their needs? (0-100 score)

CRITICAL RULES:
1. NO emojis, NO buzzwords
2. Base analysis on data from previous agents
3. Clinical B2B tone
4. Provide reasoning (2-3 sentences)

Execution Context:
- Execution ID: ${context.executionId}
- Lead ID: ${context.leadId}
- Step: ${context.stepNumber} (Marketing Agent - receives context from Extractor + Finance)

Output: marketing analysis with reasoning and confidence.`,
  });

  const durationMs = Date.now() - startTime;

  return {
    output: {
      target_persona: object.target_persona,
      pain_points: object.pain_points,
      messaging_angle: object.messaging_angle,
      messaging_fit_score: object.messaging_fit_score,
    },
    reasoning: object.reasoning,
    confidence: object.confidence,
    contextToShare: {
      marketingInsights: {
        targetPersona: object.target_persona,
        painPoints: object.pain_points,
        messagingAngle: object.messaging_angle,
        coldEmailDraft: '', // Can add email generation later
        reasoning: object.reasoning,
      },
    },
    durationMs,
    tokensUsed: usage?.totalTokens,
  };
}
