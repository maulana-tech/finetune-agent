import { z } from 'zod';
import { defineAgent } from '../agent';
import { agentRegistry } from '../registry';
import { models } from '../../provider';

export const strategySwarmSchema = z.object({
  priority_score: z.number().min(0).max(100).describe('Overall lead quality score'),
  conversion_probability: z.number().min(0).max(1).describe('Probability of conversion (0.0 - 1.0)'),
  estimated_deal_value: z.number().describe('Predicted deal size in USD'),
  priority_tier: z.enum(['A', 'B', 'C', 'D']).describe('A=hot lead, D=disqualify'),
  recommended_action: z.enum(['immediate_outreach', 'nurture', 'disqualify']),
  strategic_alignment_score: z.number().min(0).max(100).describe('How well this lead fits our ICP'),
  reasoning: z.string().describe('Strategic synthesis across all agents. Why this recommendation?'),
  confidence: z.number().min(0).max(100),
});

export const strategySwarmAgent = defineAgent({
  name: 'strategy',
  instructions: `You are a strategic advisor synthesizing multi-agent analysis.

Synthesize all signals and provide:
- Overall lead quality score (0-100)
- Conversion probability (0.0 - 1.0)
- Estimated deal value ($USD)
- Priority tier (A/B/C/D) where A = hot lead, D = disqualify
- Recommended action (immediate_outreach / nurture / disqualify)
- Strategic alignment score (0-100)

Use clinical strategic tone. NO buzzwords.
If agents gave contradictory signals, explain how you resolved them.`,
  model: models.standard,
  schema: strategySwarmSchema,
  handoffs: [], // terminal agent
  tools: [],
  capabilities: ['synthesis', 'strategy'],
});

agentRegistry.register(strategySwarmAgent);
