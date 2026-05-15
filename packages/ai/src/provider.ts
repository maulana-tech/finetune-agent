import { createOpenAI } from '@ai-sdk/openai';

// NVIDIA NIM uses OpenAI-compatible API
export const nvidia = createOpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY,
});

export const defaultModel = nvidia('meta/llama-3.1-70b-instruct');
export const fastModel = nvidia('meta/llama-3.1-8b-instruct');
