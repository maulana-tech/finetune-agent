import { z } from 'zod';
import { SwarmTool, SwarmContext } from './types';

export function defineTool(config: {
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
  execute: (params: unknown, context: SwarmContext) => Promise<unknown>;
}): SwarmTool {
  return { ...config };
}
