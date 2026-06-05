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
    prompt: `Anda adalah spesialis ekstraksi data. Ekstrak informasi bisnis terstruktur dari teks mentah.

ATURAN KRITIS:
1. Akurat — hanya ekstrak yang secara eksplisit disebutkan
2. Field "name" HARUS berupa nama bisnis yang bersih saja.
   - JANGAN return object JSON, array, atau key-value pairs sebagai name.
   - JANGAN tambahkan prefix "Name:", "Business:", atau "Company:".
   - Cukup nama mentah: "Klinik Gigi Sehat"
3. Field "email" dan "phone": ekstrak HANYA jika jelas ada di teks.
   - Jika tidak ditemukan, biarkan undefined/null — JANGAN menebak.
4. Jelaskan reasoning Anda secara singkat (1-2 kalimat)
5. Berikan skor confidence (0-100) berdasarkan kualitas data

Konteks Eksekusi:
- Execution ID: ${context.executionId}
- Lead ID: ${context.leadId}
- Step: ${context.stepNumber} (Extractor - agen pertama di pipeline)

Teks mentah dari scraper:
${rawText}

Output data terstruktur dengan reasoning dan confidence score.
PENTING: Semua output field (summary, reasoning) harus dalam Bahasa Indonesia.`,
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
