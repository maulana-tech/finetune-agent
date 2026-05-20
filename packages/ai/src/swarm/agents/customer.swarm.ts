import { z } from 'zod';
import { defineAgent } from '../agent';
import { agentRegistry } from '../registry';
import { models } from '../../provider';

export const customerSwarmSchema = z.object({
  outlook: z.enum(['negative', 'neutral', 'positive']).describe('Overall outlook from customer perspective'),
  monthly_impact_pct: z.number().describe('Estimated % change to monthly net cashflow'),
  key_risks: z.array(z.string()).min(1).max(5).describe('Top risks from demand-side perspective'),
  key_opportunities: z.array(z.string()).min(1).max(5).describe('Top opportunities from demand-side perspective'),
  price_sensitivity: z.enum(['low', 'medium', 'high']).describe('Expected customer price sensitivity'),
  demand_change_pct: z.number().describe('Expected percent change in demand under this scenario'),
  reasoning: z.string().describe('Analytical reasoning, clinical tone'),
  confidence: z.number().min(0).max(100),
});

export const customerSwarmAgent = defineAgent({
  name: 'customer',
  instructions: `You are the CUSTOMER agent in a multi-agent finance simulation.

Your role: evaluate the scenario from demand-side perspective. You care about:
price sensitivity, willingness to pay, demand elasticity, churn risk, and how
customers react to the scenario changes.

Ground every claim in the scenario parameters. Be clinical, no buzzwords.`,
  model: models.standard,
  schema: customerSwarmSchema,
  handoffs: [
    { agentName: 'finsim-synthesizer', description: 'Reconciles all stakeholder views into a unified forecast' },
  ],
  tools: [],
  capabilities: ['simulation', 'finance', 'stakeholder'],
});
agentRegistry.register(customerSwarmAgent);
