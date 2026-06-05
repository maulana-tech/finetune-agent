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
    prompt: `Anda adalah analis keuangan spesialis kualifikasi lead B2B.

KONTEKS DARI AGEN SEBELUMNYA (Extractor):
${JSON.stringify(context.extractedData, null, 2)}

TUGAS ANDA:
Estimasi kesehatan keuangan bisnis ini dan kemampuan membeli tools B2B.

ATURAN KRITIS:
1. Gunakan tone klinis dan analitis — tanpa buzzwords
2. Berdasarkan estimasi dari sinyal nyata (ukuran perusahaan, kategori, layanan)
3. Berikan reasoning yang jelas (2-3 kalimat)
4. Berikan confidence berdasarkan kualitas data yang tersedia

Konteks Eksekusi:
- Execution ID: ${context.executionId}
- Lead ID: ${context.leadId}
- Step: ${context.stepNumber} (Finance Agent - menerima konteks dari Extractor)

Output: analisis keuangan dengan reasoning dan confidence score.
PENTING: Semua output (estimated_revenue_range, reasoning) harus dalam Bahasa Indonesia.`,
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
