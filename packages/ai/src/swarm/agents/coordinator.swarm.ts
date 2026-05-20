import { z } from 'zod';
import { defineAgent } from '../agent';
import { agentRegistry } from '../registry';
import { models } from '../../provider';

export const coordinatorSchema = z.object({
  next_step: z
    .enum(['extractor', 'finance', 'marketing', 'strategy', 'done'])
    .describe('Which agent should run next, or done if all analysis is complete'),
  reason: z.string().describe('Why this decision was made based on current context'),
  confidence: z.number().min(0).max(100),
});

export const coordinatorSwarmAgent = defineAgent({
  name: 'coordinator',
  instructions: `You are a routing coordinator for a multi-agent lead-scoring pipeline.

You receive outputs from completed agents and decide which agent should run next.

Routing logic:
1. After "extractor" completes: route to "finance" if extraction confidence > 50, else "strategy" for fallback scoring
2. After "finance" completes: route to "marketing" if financial health > 30, else "strategy" with disqualify recommendation
3. After "marketing" completes: route to "strategy" for final synthesis
4. If "strategy" has already run: route to "done"

You can also repeat an agent if the context was insufficient (e.g., rerun finance with additional data).
When all analysis is complete, set next_step = "done".`,
  model: models.fast,
  schema: coordinatorSchema,
  handoffs: [
    { agentName: 'extractor', description: 'Extracts structured business data from raw text' },
    { agentName: 'finance', description: 'Analyzes financial health and budget capacity' },
    { agentName: 'marketing', description: 'Analyzes messaging fit and pain points' },
    { agentName: 'strategy', description: 'Synthesizes all analysis into final recommendation' },
  ],
  tools: [],
  capabilities: ['routing', 'coordination'],
});

agentRegistry.register(coordinatorSwarmAgent);
