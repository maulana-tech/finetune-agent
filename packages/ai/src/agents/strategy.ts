import { generateObject } from 'ai';
import { defaultModel, fallbackModels } from '../provider';
import { generateObjectWithFallback } from '../fallback';
import { StrategyOutputSchema, AgentContext, AgentResponse } from '../types';

export async function strategicRecommendation(
  context: AgentContext
): Promise<AgentResponse> {
  const startTime = Date.now();

  if (!context.extractedData || !context.financialAnalysis || !context.marketingInsights) {
    throw new Error('Strategy agent requires context from all previous agents (extractor, finance, marketing)');
  }

  const { object, usage } = await generateObjectWithFallback(
    defaultModel,
    fallbackModels.standard,
    {
      schema: StrategyOutputSchema,
      prompt: `Anda adalah penasihat strategis yang mensintesis analisis multi-agen.

KONTEKS AKUMULATIF DARI SEMUA AGEN:

1. EXTRACTOR:
${JSON.stringify(context.extractedData, null, 2)}

2. AGEN KEUANGAN:
${JSON.stringify(context.financialAnalysis, null, 2)}

3. AGEN MARKETING:
${JSON.stringify(context.marketingInsights, null, 2)}

TUGAS ANDA:
Sintesis semua sinyal dan berikan:
- Skor kualitas lead keseluruhan (0-100)
- Probabilitas konversi (0.0 - 1.0)
- Estimasi nilai deal ($USD)
- Tier prioritas (A/B/C/D) di mana A = lead panas, D = diskualifikasi
- Aksi yang direkomendasikan (immediate_outreach / nurture / disqualify)
- Skor kesesuaian strategis (0-100): seberapa cocok lead ini dengan ICP kami

ATURAN KRITIS:
1. Rekomendasi harus berbasis data — referensikan wawasan spesifik dari agen sebelumnya
2. Tone strategis klinis — TANPA buzzwords
3. Reasoning harus menjelaskan MENGAPA (3-4 kalimat)
4. Jika agen memberikan sinyal kontradiktif, jelaskan bagaimana Anda menyelesaikannya

Konteks Eksekusi:
- Execution ID: ${context.executionId}
- Lead ID: ${context.leadId}
- Step: ${context.stepNumber} (Strategy Agent - SINTESIS AKHIR dari semua agen)

Output: rekomendasi strategis dengan reasoning dan confidence.
PENTING: Semua output (reasoning, recommended_action) dalam Bahasa Indonesia.`,
    },
    'standard',
  );

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
