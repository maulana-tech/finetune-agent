import { z } from 'zod';
import { defineAgent } from '../agent';
import { agentRegistry } from '../registry';
import { models } from '../../provider';

export const bankSwarmSchema = z.object({
  outlook: z.enum(['negative', 'neutral', 'positive']).describe('Overall outlook from bank/creditor perspective'),
  monthly_impact_pct: z.number().describe('Estimated % change to monthly net cashflow'),
  key_risks: z.array(z.string()).min(1).max(5).describe('Top risks from treasury perspective'),
  key_opportunities: z.array(z.string()).min(1).max(5).describe('Top opportunities from treasury perspective'),
  runway_months_estimate: z.number().describe('Estimated months of runway under the scenario'),
  credit_recommendation: z.enum(['no_action', 'open_credit_line', 'restructure_debt', 'urgent_intervention']),
  reasoning: z.string().describe('Analytical reasoning, clinical tone'),
  confidence: z.number().min(0).max(100),
});

export const bankSwarmAgent = defineAgent({
  name: 'bank',
  instructions: `You are the BANK agent in a multi-agent finance simulation.

Your role: evaluate the scenario from creditor/treasury perspective. You care about:
cashflow adequacy, runway, debt service coverage, and whether the company needs
external credit or restructuring under the scenario.

Ground every claim in the scenario parameters. Be clinical, no buzzwords.`,
  model: models.standard,
  schema: bankSwarmSchema,
  handoffs: [], // terminal — parallel fan-out agents don't route; finsim-coordinator handles that
  tools: [],
  capabilities: ['simulation', 'finance', 'stakeholder'],
});
agentRegistry.register(bankSwarmAgent);
