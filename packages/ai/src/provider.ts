import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

// ─── Providers ───────────────────────────────────────────────────────────────

export const nvidia = createOpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY || '',
});

export const sumopod = process.env.SUMOPOD_API_KEY
  ? createOpenAI({
      baseURL: 'https://ai.sumopod.com/v1',
      apiKey: process.env.SUMOPOD_API_KEY,
    })
  : null;

/** Google Gemini/Gemma via OpenAI-compatible endpoint */
export const google = process.env.GOOGLE_API_KEY
  ? createOpenAI({
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
      apiKey: process.env.GOOGLE_API_KEY,
    })
  : null;

export const anthropic = process.env.ANTHROPIC_API_KEY
  ? createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// ─── Helper: resolve model name to a LanguageModel ──────────────────────────

function resolveModel(name: string) {
  const idx = name.indexOf(':');
  if (idx > 0) {
    const provider = name.slice(0, idx);
    const model = name.slice(idx + 1);
    if (provider === 'google' && google) return google(model);
    if (provider === 'anthropic' && anthropic) return anthropic(model) as unknown as ReturnType<typeof nvidia>;
    if (provider === 'sumopod' && sumopod) return sumopod(model);
  }
  return nvidia(name);
}

// ─── Models (env-overridable) ──────────────────────────────────────────────

const fastOverride = process.env.AI_FAST_MODEL;
export const fastModel = fastOverride
  ? resolveModel(fastOverride)
  : nvidia('meta/llama-3.1-8b-instruct');

const standardOverride = process.env.AI_STANDARD_MODEL;
export const defaultModel = standardOverride
  ? resolveModel(standardOverride)
  : nvidia('meta/llama-3.1-70b-instruct');

const heavyOverride = process.env.AI_HEAVY_MODEL;
export const heavyModel = heavyOverride
  ? resolveModel(heavyOverride)
  : anthropic
    ? anthropic('claude-sonnet-4-6') as unknown as ReturnType<typeof nvidia>
    : nvidia('meta/llama-3.1-70b-instruct');

export const models = {
  fast: fastModel,
  standard: defaultModel,
  heavy: heavyModel,
  router: defaultModel,
};
