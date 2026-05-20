import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

export const nvidia = createOpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY,
});

export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export const defaultModel = nvidia('meta/llama-3.1-70b-instruct');
export const fastModel = nvidia('meta/llama-3.1-8b-instruct');
export const heavyModel = process.env.ANTHROPIC_API_KEY
  ? anthropic('claude-sonnet-4-20250514')
  : nvidia('meta/llama-3.1-70b-instruct');

export const models = {
  fast: fastModel,
  standard: defaultModel,
  heavy: heavyModel,
  router: defaultModel,
};
