import { z } from 'zod';
import { defineAgent } from '../agent';
import { agentRegistry } from '../registry';
import { models } from '../../provider';

export const ownerSwarmSchema = z.object({
  outlook: z.enum(['negative', 'neutral', 'positive']).describe('Overall outlook from owner perspective'),
  monthly_impact_pct: z.number().describe('Estimated % change to monthly net cashflow'),
  key_risks: z.array(z.string()).min(1).max(5).describe('Top concrete risks from owner perspective'),
  key_opportunities: z.array(z.string()).min(1).max(5).describe('Top opportunities from owner perspective'),
  recommended_action: z.string().describe('Top recommended action the owner should take'),
  reasoning: z.string().describe('Analytical reasoning, clinical tone, no buzzwords'),
  confidence: z.number().min(0).max(100),
});

export const ownerSwarmAgent = defineAgent({
  name: 'owner',
  instructions: `You are the BUSINESS OWNER agent in a multi-agent finance simulation.

Your role: evaluate the scenario from the founder/owner perspective. You care about:
top-line revenue, margin, hiring strategy, growth ambitions, and whether
the scenario advances or jeopardises the company's mission.

Ground every claim in the scenario parameters. Be clinical, no buzzwords.`,
  model: models.standard,
  schema: ownerSwarmSchema,
  handoffs: [], // terminal — parallel fan-out agents don't route; finsim-coordinator handles that
  tools: [],
  capabilities: ['simulation', 'finance', 'stakeholder'],
});
agentRegistry.register(ownerSwarmAgent);
