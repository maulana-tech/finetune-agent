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
    prompt: `Anda adalah strategis marketing B2B. Analisis kesesuaian messaging untuk lead ini.

KONTEKS DARI AGEN SEBELUMNYA:

1. OUTPUT EXTRACTOR:
${JSON.stringify(context.extractedData, null, 2)}

2. OUTPUT AGEN KEUANGAN:
${JSON.stringify(context.financialAnalysis, null, 2)}

PRODUK/LAYANAN KAMI:
${ourProduct}

TUGAS ANDA:
Tentukan:
- Siapa target customer mereka (persona)?
- 3 pain points utama yang bisa kami selesaikan?
- Bagaimana cara memposisikan produk kami kepada mereka?
- Seberapa cocok produk kami dengan kebutuhan mereka? (skor 0-100)

ATURAN KRITIS:
1. TANPA emoji, TANPA buzzwords
2. Berdasarkan analisis dari agen sebelumnya
3. Tone B2B klinis
4. Berikan reasoning (2-3 kalimat)

Konteks Eksekusi:
- Execution ID: ${context.executionId}
- Lead ID: ${context.leadId}
- Step: ${context.stepNumber} (Marketing Agent - menerima konteks dari Extractor + Finance)

Output: analisis marketing dengan reasoning dan confidence.
PENTING: Semua output (target_persona, pain_points, messaging_angle, reasoning) dalam Bahasa Indonesia.`,
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
