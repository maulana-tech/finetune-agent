import { generateObject } from 'ai';
import { defaultModel } from '../provider';
import { z } from 'zod';

export const SalesAnalysisSchema = z.object({
  weaknesses: z.array(z.string()).describe('Key weaknesses or risks for this lead'),
  strengths: z.array(z.string()).describe('Key strengths or opportunities'),
  recommendedApproach: z.string().describe('One-sentence recommended sales approach'),
  suggestedNextSteps: z.array(z.string()).describe('Concrete next steps for the sales team'),
  businessFitScore: z.number().min(0).max(100).describe('How well this lead fits our business (0-100)'),
  reasoning: z.string().describe('Detailed reasoning behind the analysis'),
});

export type SalesAnalysis = z.infer<typeof SalesAnalysisSchema>;

export async function analyzeLeadForSales(
  leadData: {
    name: string;
    category: string | null;
    address: string | null;
    website: string | null;
    emails: string[] | null;
    phone: string | null;
    mapsUrl: string | null;
  },
  businessContext: string,
): Promise<SalesAnalysis> {
  const startTime = Date.now();

  const { object } = await generateObject({
    model: defaultModel,
    schema: SalesAnalysisSchema,
    prompt: `You are a senior B2B sales strategist. Analyze this lead and recommend a sales approach.

LEAD DATA:
${JSON.stringify(leadData, null, 2)}

OUR BUSINESS CONTEXT:
${businessContext || 'No business context provided. Use general B2B best practices.'}

YOUR TASK:
Analyze this lead from a sales perspective:
1. What are the key weaknesses or risks? (e.g., no website, no emails, hard to reach)
2. What are the strengths or opportunities? (e.g., clear category, has contact info)
3. What is the recommended sales approach? (one sentence)
4. What are concrete next steps?
5. How well does this lead fit our business? (0-100)

CRITICAL RULES:
1. NO emojis, NO buzzwords
2. Base analysis on actual data provided — don't invent information
3. Clinical B2B tone
4. Be honest about data quality issues`,
  });

  return object;
}
