import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NVIDIA_API_KEY: z.string().min(1).optional(),
  SUMOPOD_API_KEY: z.string().min(1).optional(),
  GOOGLE_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  AI_FAST_MODEL: z.string().optional(),
  AI_STANDARD_MODEL: z.string().optional(),
  AI_HEAVY_MODEL: z.string().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  RESEND_WEBHOOK_SECRET: z.string().min(1).optional(),
  SUMOPOD_SMTP_HOST: z.string().optional(),
  SUMOPOD_SMTP_PORT: z.string().optional(),
  SUMOPOD_SMTP_USER: z.string().optional(),
  SUMOPOD_SMTP_PASS: z.string().optional(),
  SUMOPOD_FROM_EMAIL: z.string().email().optional(),
});
