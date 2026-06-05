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
    prompt: `Anda adalah strategis sales B2B senior. Analisis lead ini dan rekomendasikan pendekatan sales.

DATA LEAD:
${JSON.stringify(leadData, null, 2)}

KONTEKS BISNIS KAMI:
${businessContext || 'Tidak ada konteks bisnis. Gunakan best practices B2B umum.'}

TUGAS ANDA:
Analisis lead ini dari perspektif sales:
1. Apa kelemahan atau risiko utama? (misal: tanpa website, tanpa email, sulit dihubungi)
2. Apa kekuatan atau peluang? (misal: kategori jelas, punya kontak)
3. Pendekatan sales yang direkomendasikan? (satu kalimat)
4. Langkah konkret berikutnya?
5. Seberapa cocok lead ini dengan bisnis kami? (0-100)

ATURAN KRITIS:
1. TANPA emoji, TANPA buzzwords
2. Berdasarkan data aktual yang diberikan — jangan mengarang informasi
3. Tone B2B klinis
4. Jujur tentang masalah kualitas data

PENTING: Semua output (weaknesses, strengths, recommendedApproach, reasoning) dalam Bahasa Indonesia.`,
  });

  return object;
}
