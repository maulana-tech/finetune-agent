import { z } from 'zod';
import { defineAgent } from '../agent';
import { agentRegistry } from '../registry';
import { models } from '../../provider';

/**
 * Market Analysis Coordinator — emits _parallel to fan out all 4 perspective
 * agents concurrently, then routes to market-synthesizer.
 *
 * Schema explicitly includes _parallel so the run-loop can execute the fan-out.
 * The coordinator itself does no analysis — it exists purely to trigger the
 * parallel execution pattern in a swarm-native way.
 */
export const marketCoordinatorSchema = z.object({
  reasoning: z.string().describe('Brief acknowledgment of the market scenario and confirmation that all 4 perspective agents will be consulted'),
  confidence: z.number().min(0).max(100),
  _parallel: z.object({
    agents: z
      .array(z.string())
      .describe('FIXED: always ["competitor", "trend", "risk", "demand"]'),
    groupKey: z
      .string()
      .describe('FIXED: always "perspectives"'),
    nextAfterAll: z
      .string()
      .describe('FIXED: always "market-synthesizer"'),
  }).describe(
    'Parallel fan-out config. The runtime will run all listed agents concurrently ' +
    'and store their outputs under groupKey before routing to nextAfterAll.',
  ),
});

export const marketCoordinatorSwarmAgent = defineAgent({
  name: 'market-coordinator',
  instructions: `You are the coordinator for a multi-perspective market analysis.

Your only job is to trigger parallel execution of all 4 perspective agents.
Always output _parallel with EXACTLY these values:
  agents: ["competitor", "trend", "risk", "demand"]
  groupKey: "perspectives"
  nextAfterAll: "market-synthesizer"

In your reasoning, briefly acknowledge the market scenario and industry from context.`,
  model: models.fast,
  schema: marketCoordinatorSchema,
  handoffs: [], // routing is done via _parallel, not _handoff
  tools: [],
  capabilities: ['coordination', 'market'],
});

agentRegistry.register(marketCoordinatorSwarmAgent);
