import { z } from 'zod';
import { HandoffTarget } from './types';

export function withHandoff<T extends z.ZodObject<any>>(
  schema: T,
  handoffs: HandoffTarget[],
): z.ZodObject<any> {
  if (handoffs.length === 0) return schema;

  const agentNames = handoffs.map((h) => h.agentName);
  return schema.extend({
    _handoff: z
      .object({
        nextAgent: z
          .enum(agentNames as [string, ...string[]])
          .nullable()
          .describe('Name of the next agent to run, or null if done'),
        contextToPass: z
          .record(z.any())
          .optional()
          .describe('Context to pass to the next agent'),
        reason: z.string().describe('Why this handoff decision was made'),
      })
      .nullable()
      .describe('Handoff decision. null = execution complete.'),
  });
}
