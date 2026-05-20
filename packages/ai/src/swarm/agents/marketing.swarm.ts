import { z } from 'zod';
import { defineAgent } from '../agent';
import { agentRegistry } from '../registry';
import { models } from '../../provider';

export const marketingSwarmSchema = z.object({
  target_persona: z.string().describe('Who would buy from this business'),
  pain_points: z.array(z.string()).describe('Top 3 pain points we can solve'),
  messaging_angle: z.string().describe('How to position our product to them'),
  messaging_fit_score: z.number().min(0).max(100).describe('How well our product fits their needs'),
  reasoning: z.string().describe('Why this messaging approach. No buzzwords.'),
  confidence: z.number().min(0).max(100),
});

export const marketingSwarmAgent = defineAgent({
  name: 'marketing',
  instructions: `You are a B2B marketing strategist. Analyze this lead's messaging fit.

Determine:
- Who is their target customer (persona)?
- What are their top 3 pain points we can solve?
- How should we position our product to them?
- How well does our product fit their needs? (0-100)

Base analysis on extracted business data and financial insights.
NO emojis, NO buzzwords. Clinical B2B tone.`,
  model: models.standard,
  schema: marketingSwarmSchema,
  handoffs: [
    { agentName: 'coordinator', description: 'Routing coordinator that decides next steps' },
  ],
  tools: [],
  capabilities: ['analysis', 'marketing'],
});

agentRegistry.register(marketingSwarmAgent);
