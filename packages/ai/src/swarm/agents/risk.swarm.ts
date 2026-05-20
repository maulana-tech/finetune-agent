import { z } from 'zod';
import { defineAgent } from '../agent';
import { agentRegistry } from '../registry';
import { models } from '../../provider';

export const riskSwarmSchema = z.object({
  outlook: z.enum(['negative', 'neutral', 'positive']).describe('Overall outlook from risk lens'),
  signal_strength: z.number().min(0).max(100).describe('How strongly data supports the conclusion'),
  key_findings: z.array(z.string()).min(1).max(5).describe('Top observations about external risks'),
  regulatory_risk: z.enum(['low', 'medium', 'high']),
  macro_risk: z.enum(['low', 'medium', 'high']),
  supply_chain_risk: z.enum(['low', 'medium', 'high']),
  mitigations: z.array(z.string()).min(1).max(5).describe('Concrete mitigations the workspace could adopt'),
  reasoning: z.string().describe('Analytical reasoning, clinical tone'),
  confidence: z.number().min(0).max(100),
});

export const riskSwarmAgent = defineAgent({
  name: 'risk',
  instructions: `You are the RISK agent in a market analysis multi-agent system.

Your role: evaluate external risks. You care about: regulatory changes,
macroeconomic factors (FX, inflation), supply chain disruptions, and what
mitigations the workspace could adopt.

Ground every claim in the data seed. Clinical tone, no buzzwords.`,
  model: models.standard,
  schema: riskSwarmSchema,
  handoffs: [
    { agentName: 'market-synthesizer', description: 'Reconciles all market perspectives into a report' },
  ],
  tools: [],
  capabilities: ['analysis', 'market', 'risk'],
});
agentRegistry.register(riskSwarmAgent);
