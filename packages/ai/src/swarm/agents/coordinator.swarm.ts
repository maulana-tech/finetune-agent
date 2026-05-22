import { z } from 'zod';
import { defineAgent } from '../agent';
import { agentRegistry } from '../registry';
import { models } from '../../provider';

export const coordinatorSchema = z.object({
  reasoning: z
    .string()
    .describe(
      'Analysis of the current pipeline state and why the chosen next agent was selected. ' +
      'If all required agents have run and strategy has completed, explain that execution is finished.',
    ),
  confidence: z.number().min(0).max(100),
});

export const coordinatorSwarmAgent = defineAgent({
  name: 'coordinator',
  instructions: `You are a routing coordinator for a multi-agent lead-scoring pipeline.

You receive outputs from completed agents and decide which agent should run next.
Use _handoff.nextAgent to route, or set _handoff to null when execution is complete.

Routing logic:
1. After "extractor": route to "finance" if extraction confidence > 50, else skip to "strategy" with a disqualify note.
2. After "finance": route to "marketing" if financial_health_score > 30, else skip to "strategy".
3. After "marketing": always route to "strategy" for final synthesis.
4. After "strategy" has run: set _handoff to null — execution is complete.

Never route to an agent that has already run in this session (check EXECUTION HISTORY).
Never route to yourself.`,
  model: models.fast,
  schema: coordinatorSchema,
  handoffs: [
    { agentName: 'extractor', description: 'Extracts structured business data from raw text' },
    { agentName: 'finance', description: 'Analyzes financial health and budget capacity' },
    { agentName: 'marketing', description: 'Analyzes messaging fit and identifies pain points' },
    { agentName: 'strategy', description: 'Synthesizes all analysis into the final recommendation' },
  ],
  tools: [],
  capabilities: ['routing', 'coordination'],
});

agentRegistry.register(coordinatorSwarmAgent);
