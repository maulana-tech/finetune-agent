import { z } from 'zod';

export const ScrapeJobPayloadSchema = z.object({
  workspaceId: z.string().uuid(),
  query: z.string().min(1),
  limit: z.number().int().positive().default(10),
});

export type ScrapeJobPayload = z.infer<typeof ScrapeJobPayloadSchema>;
