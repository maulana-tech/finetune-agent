import { Swarm } from '../run-loop';
import { agentRegistry } from '../registry';
import { createSwarmContext } from '../context';
import { SwarmRunResult } from '../types';
import '../agents/extractor.swarm';
import '../agents/coordinator.swarm';
import '../agents/finance.swarm';
import '../agents/marketing.swarm';
import '../agents/strategy.swarm';

export interface LeadScoringSwarmInput {
  leadId: string;
  workspaceId: string;
  rawText: string;
  ourProduct: string;
}

export async function runLeadScoringSwarm(
  input: LeadScoringSwarmInput,
): Promise<SwarmRunResult> {
  const context = createSwarmContext({
    workspaceId: input.workspaceId,
    leadId: input.leadId,
    initialData: { rawText: input.rawText, ourProduct: input.ourProduct },
  });

  const swarm = new Swarm(agentRegistry);
  return swarm.run('extractor', context);
}
