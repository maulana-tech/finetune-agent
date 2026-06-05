import { generateObject } from 'ai';
import { fastModel } from '../provider';
import { ExtractorOutputSchema, AgentContext, AgentResponse } from '../types';

export async function extractBusinessInfo(
  rawText: string,
  context: AgentContext
): Promise<AgentResponse> {
  const startTime = Date.now();

  const { object, usage } = await generateObject({
    model: fastModel,
    schema: ExtractorOutputSchema,
    prompt: `You are a data extraction specialist. Extract structured business information from raw text.

CRITICAL RULES:
1. Be precise - only extract what's explicitly stated
2. The "name" field MUST be a CLEAN business name string only.
   - DO NOT return JSON objects, arrays, or key-value pairs as the name.
   - DO NOT prefix with "Name:", "Business:", or "Company:".
   - Just the raw name: "Klinik Gigi Sehat"
3. The "email" and "phone" fields: extract ONLY if clearly present in the text.
   - If not found, leave them undefined/null — do NOT guess.
4. Explain your reasoning briefly (1-2 sentences)
5. Rate your confidence (0-100) based on data quality

Execution Context:
- Execution ID: ${context.executionId}
- Lead ID: ${context.leadId}
- Step: ${context.stepNumber} (Extractor - first agent in pipeline)

Raw text from scraper:
${rawText}

Output structured data with reasoning and confidence score.`,
  });

  const durationMs = Date.now() - startTime;

  return {
    output: {
      name: object.name,
      category: object.category,
      services: object.services,
      contact_info: object.contact_info,
      summary: object.summary,
    },
    reasoning: object.reasoning,
    confidence: object.confidence,
    contextToShare: {
      extractedData: {
        name: object.name,
        category: object.category,
        services: object.services,
        contact_info: object.contact_info,
        summary: object.summary,
      },
    },
    durationMs,
    tokensUsed: usage?.totalTokens,
  };
}
