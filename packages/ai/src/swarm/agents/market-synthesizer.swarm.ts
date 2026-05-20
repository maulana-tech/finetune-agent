import { z } from 'zod';
import { defineAgent } from '../agent';
import { agentRegistry } from '../registry';
import { models } from '../../provider';

export const marketSynthesizerSchema = z.object({
  risk_level: z.enum(['low', 'medium', 'high', 'critical']).describe('Overall risk classification'),
  opportunity_score: z.number().min(0).max(100).describe('Aggregated opportunity score 0-100'),
  positioning_recommendation: z.string().describe('One-sentence positioning recommendation'),
  summary: z.string().describe('Executive summary reconciling the 4 lenses'),
  top_opportunities: z.array(z.string()).min(1).max(5),
  top_threats: z.array(z.string()).min(1).max(5),
  primary_drivers: z.array(z.string()).min(1).max(5).describe('Which concerns most shaped the conclusion'),
  reasoning: z.string().describe('How the synthesizer reconciled conflicting views'),
  confidence: z.number().min(0).max(100),
});

export const marketSynthesizerSwarmAgent = defineAgent({
  name: 'market-synthesizer',
  instructions: `You are the SYNTHESIZER agent in a market analysis multi-agent system.

Your role: reconcile the 4 perspective views (Competitor, Trend, Risk, Demand)
into an opportunity score (0-100), positioning recommendation, risk level,
and top opportunities/threats.

Weigh conflicting perspectives fairly. If perspectives disagree, explain which
signals you weighted more heavily and why.`,
  model: models.heavy,
  schema: marketSynthesizerSchema,
  handoffs: [], // terminal agent
  tools: [],
  capabilities: ['synthesis', 'market', 'analysis'],
});
agentRegistry.register(marketSynthesizerSwarmAgent);
