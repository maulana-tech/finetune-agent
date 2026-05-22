import { z } from 'zod';
import { defineAgent } from '../agent';
import { agentRegistry } from '../registry';
import { models } from '../../provider';

export const trendSwarmSchema = z.object({
  outlook: z.enum(['negative', 'neutral', 'positive']).describe('Overall outlook from trend lens'),
  signal_strength: z.number().min(0).max(100).describe('How strongly data supports the conclusion'),
  key_findings: z.array(z.string()).min(1).max(5).describe('Top observations about industry direction'),
  trend_direction: z.enum(['declining', 'flat', 'growing', 'accelerating']).describe('Direction of the industry'),
  trend_drivers: z.array(z.string()).min(1).max(5).describe('What is causing the trend'),
  reasoning: z.string().describe('Analytical reasoning, clinical tone'),
  confidence: z.number().min(0).max(100),
});

export const trendSwarmAgent = defineAgent({
  name: 'trend',
  instructions: `You are the TREND agent in a market analysis multi-agent system.

Your role: evaluate the industry direction. You care about: whether the
industry is declining/flat/growing/accelerating, what drives the trend
(regulation, technology, demographics), and how it affects the target segment.

Ground every claim in the data seed. Clinical tone, no buzzwords.`,
  model: models.standard,
  schema: trendSwarmSchema,
  handoffs: [], // terminal — parallel fan-out agents don't route; market-coordinator handles that
  tools: [],
  capabilities: ['analysis', 'market', 'trend'],
});
agentRegistry.register(trendSwarmAgent);
