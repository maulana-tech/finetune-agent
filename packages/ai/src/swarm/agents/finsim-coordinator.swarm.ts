import { z } from 'zod';
import { defineAgent } from '../agent';
import { agentRegistry } from '../registry';
import { models } from '../../provider';

/**
 * Finance Simulation Coordinator — emits _parallel to fan out all 4 stakeholder
 * agents concurrently, then routes to finsim-synthesizer.
 *
 * Schema explicitly includes _parallel so the run-loop can execute the fan-out.
 * The coordinator itself does no analysis — it exists purely to trigger the
 * parallel execution pattern in a swarm-native way.
 */
export const finsimCoordinatorSchema = z.object({
  reasoning: z.string().describe('Brief acknowledgment of the scenario and confirmation that all 4 stakeholders will be consulted'),
  confidence: z.number().min(0).max(100),
  _parallel: z.object({
    agents: z
      .array(z.string())
      .describe('FIXED: always ["owner", "supplier", "customer", "bank"]'),
    groupKey: z
      .string()
      .describe('FIXED: always "stakeholders"'),
    nextAfterAll: z
      .string()
      .describe('FIXED: always "finsim-synthesizer"'),
  }).describe(
    'Parallel fan-out config. The runtime will run all listed agents concurrently ' +
    'and store their outputs under groupKey before routing to nextAfterAll.',
  ),
});

export const finsimCoordinatorSwarmAgent = defineAgent({
  name: 'finsim-coordinator',
  instructions: `You are the coordinator for a multi-stakeholder finance simulation.

Your only job is to trigger parallel execution of all 4 stakeholder agents.
Always output _parallel with EXACTLY these values:
  agents: ["owner", "supplier", "customer", "bank"]
  groupKey: "stakeholders"
  nextAfterAll: "finsim-synthesizer"

In your reasoning, briefly acknowledge the scenario parameters from context.`,
  model: models.fast,
  schema: finsimCoordinatorSchema,
  handoffs: [], // routing is done via _parallel, not _handoff
  tools: [],
  capabilities: ['coordination', 'simulation'],
});

agentRegistry.register(finsimCoordinatorSwarmAgent);
