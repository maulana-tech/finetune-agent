import { z } from 'zod';
import { defineAgent } from '../agent';
import { agentRegistry } from '../registry';
import { models } from '../../provider';

export const demandSwarmSchema = z.object({
  outlook: z.enum(['negative', 'neutral', 'positive']).describe('Overall outlook from demand lens'),
  signal_strength: z.number().min(0).max(100).describe('How strongly data supports the conclusion'),
  key_findings: z.array(z.string()).min(1).max(5).describe('Top observations about demand dynamics'),
  demand_trajectory: z.enum(['shrinking', 'stable', 'growing']).describe('Volume direction in target segment'),
  willingness_to_pay: z.enum(['weak', 'moderate', 'strong']).describe('Customer willingness to pay'),
  buying_triggers: z.array(z.string()).min(1).max(5).describe('What pushes target customers to buy'),
  reasoning: z.string().describe('Analytical reasoning, clinical tone'),
  confidence: z.number().min(0).max(100),
});

export const demandSwarmAgent = defineAgent({
  name: 'demand',
  instructions: `You are the DEMAND agent in a market analysis multi-agent system.

Your role: evaluate end-customer demand. You care about: volume trajectory
(shrinking/stable/growing), willingness to pay (weak/moderate/strong), and
what buying triggers are most effective for the target segment.

Ground every claim in the data seed. Clinical tone, no buzzwords.`,
  model: models.standard,
  schema: demandSwarmSchema,
  handoffs: [
    { agentName: 'market-synthesizer', description: 'Reconciles all market perspectives into a report' },
  ],
  tools: [],
  capabilities: ['analysis', 'market', 'demand'],
});
agentRegistry.register(demandSwarmAgent);
