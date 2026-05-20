import { z } from 'zod';
import { defineAgent } from '../agent';
import { agentRegistry } from '../registry';
import { models } from '../../provider';

export const supplierSwarmSchema = z.object({
  outlook: z.enum(['negative', 'neutral', 'positive']).describe('Overall outlook from supplier perspective'),
  monthly_impact_pct: z.number().describe('Estimated % change to monthly net cashflow'),
  key_risks: z.array(z.string()).min(1).max(5).describe('Top risks from supply chain perspective'),
  key_opportunities: z.array(z.string()).min(1).max(5).describe('Top opportunities from supply chain perspective'),
  expected_lead_time_change: z.string().describe('Expected change in supplier lead time'),
  cost_pressure: z.enum(['low', 'medium', 'high']).describe('Upstream cost pressure on raw materials'),
  reasoning: z.string().describe('Analytical reasoning, clinical tone'),
  confidence: z.number().min(0).max(100),
});

export const supplierSwarmAgent = defineAgent({
  name: 'supplier',
  instructions: `You are the SUPPLIER agent in a multi-agent finance simulation.

Your role: evaluate the scenario from upstream supply chain perspective. You care about:
raw material costs, lead time, payment terms, and whether the inventory budget
is adequate under the scenario.

Ground every claim in the scenario parameters. Be clinical, no buzzwords.`,
  model: models.standard,
  schema: supplierSwarmSchema,
  handoffs: [
    { agentName: 'finsim-synthesizer', description: 'Reconciles all stakeholder views into a unified forecast' },
  ],
  tools: [],
  capabilities: ['simulation', 'finance', 'stakeholder'],
});
agentRegistry.register(supplierSwarmAgent);
