import { generateText, generateObject, type LanguageModel } from 'ai';

/**
 * Try generateText with automatic fallback to backup model.
 * If primary model fails, retries with fallback model.
 */
export async function generateTextWithFallback(
  model: LanguageModel,
  fallbackModel: LanguageModel,
  params: Omit<Parameters<typeof generateText>[0], 'model'>,
  tier: 'fast' | 'standard' | 'heavy' = 'fast',
): Promise<Awaited<ReturnType<typeof generateText>>> {
  try {
    return await generateText({ ...params, model });
  } catch (err: any) {
    const msg = err?.message || '';
    // Only fallback on transient errors, not prompt/validation errors
    if (msg.includes('500') || msg.includes('503') || msg.includes('timeout') || msg.includes('ECONNRESET')) {
      console.warn(`[Fallback] Primary ${tier} model failed (${msg.slice(0, 60)}), trying fallback...`);
      return await generateText({ ...params, model: fallbackModel });
    }
    throw err;
  }
}

/**
 * Try generateObject with automatic fallback to backup model.
 * Uses any casting to handle complex generic types from Vercel AI SDK.
 */
export async function generateObjectWithFallback(
  model: LanguageModel,
  fallbackModel: LanguageModel,
  params: Record<string, any>,
  tier: 'fast' | 'standard' | 'heavy' = 'fast',
): Promise<any> {
  try {
    return await generateObject({ ...params, model } as any);
  } catch (err: any) {
    const msg = err?.message || '';
    if (msg.includes('500') || msg.includes('503') || msg.includes('timeout') || msg.includes('ECONNRESET')) {
      console.warn(`[Fallback] Primary ${tier} model failed (${msg.slice(0, 60)}), trying fallback...`);
      return await generateObject({ ...params, model: fallbackModel } as any);
    }
    throw err;
  }
}
