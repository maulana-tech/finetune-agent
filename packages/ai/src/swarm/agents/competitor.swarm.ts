import { z } from 'zod';
import { defineAgent } from '../agent';
import { agentRegistry } from '../registry';
import { models } from '../../provider';

export const competitorSwarmSchema = z.object({
  outlook: z.enum(['negative', 'neutral', 'positive']).describe('Overall outlook from competitive lens'),
  signal_strength: z.number().min(0).max(100).describe('How strongly data supports the conclusion'),
  key_findings: z.array(z.string()).min(1).max(5).describe('Top observations from competitive landscape'),
  competitive_intensity: z.enum(['low', 'medium', 'high']),
  price_position: z.enum(['budget', 'mid-market', 'premium']).describe('Where competitors sit in pricing'),
  differentiation_gaps: z.array(z.string()).min(1).max(5).describe('Underserved positions our workspace could occupy'),
  reasoning: z.string().describe('Analytical reasoning, clinical tone'),
  confidence: z.number().min(0).max(100),
});

export const competitorSwarmAgent = defineAgent({
  name: 'competitor',
  instructions: `You are the COMPETITOR agent in a market analysis multi-agent system.

Your role: evaluate the competitive landscape. You care about: competitive
intensity, how competitors price, where they position (budget/mid/premium),
and unoccupied positions our workspace could take.

Ground every claim in the data seed. Clinical tone, no buzzwords.`,
  model: models.standard,
  schema: competitorSwarmSchema,
  handoffs: [
    { agentName: 'market-synthesizer', description: 'Reconciles all market perspectives into a report' },
  ],
  tools: [],
  capabilities: ['analysis', 'market', 'competitor'],
});
agentRegistry.register(competitorSwarmAgent);
