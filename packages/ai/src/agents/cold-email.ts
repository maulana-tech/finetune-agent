import { generateObject } from 'ai';
import { defaultModel } from '../provider';
import { z } from 'zod';

export const ColdEmailSchema = z.object({
  subject: z.string().describe('Email subject line'),
  body: z.string().describe('Email body in plain text'),
  reasoning: z.string().describe('Why this approach was chosen for this lead'),
});

export type ColdEmail = z.infer<typeof ColdEmailSchema>;

export async function generateColdEmail(
  leadData: {
    name: string;
    category: string | null;
    address: string | null;
    website: string | null;
  },
  businessContext: string,
  salesAnalysis: string | null,
): Promise<ColdEmail> {
  const { object } = await generateObject({
    model: defaultModel,
    schema: ColdEmailSchema,
    prompt: `You are a B2B sales email specialist. Write a personalized cold email.

LEAD DATA:
${JSON.stringify(leadData, null, 2)}

OUR BUSINESS CONTEXT:
${businessContext || 'B2B SaaS company'}

${salesAnalysis ? `SALES ANALYSIS (for reference):\n${salesAnalysis}` : ''}

YOUR TASK:
Write a concise, professional cold email:
1. Subject line that gets attention
2. Body that is personalized to the lead (mention their category/industry)
3. Clear value proposition tied to our business
4. Low-pressure call to action

CRITICAL RULES:
1. NO emojis in subject line
2. NO generic greetings — personalize
3. Keep body under 150 words
4. Professional B2B tone
5. Plain text format (no HTML)
6. Include a specific, low-friction CTA`,
  });

  return object;
}
