import { generateObject } from 'ai';
import { AgentRegistry } from './registry';
import {
  SwarmContext,
  SwarmRunResult,
  MAX_SWARM_ITERATIONS,
} from './types';
import { withHandoff } from './handoff';
import { MaxIterationsError } from './errors';

/** Builds the prompt string for an agent */
function buildPrompt(
  instructions: string,
  accumulatedContext: Record<string, unknown>,
  steps: SwarmRunResult['steps'],
): string {
  const contextLines = Object.entries(accumulatedContext)
    .filter(([key]) => key !== '_handoff')
    .map(([key, value]) => `${key}: ${JSON.stringify(value, null, 2)}`)
    .join('\n\n');

  const historyLines = steps
    .map(
      (s, i) =>
        `Step ${i + 1} (${s.agentName}): confidence=${s.confidence}%${s.handoff ? ` → handed off to ${s.handoff}` : ''}`,
    )
    .join('\n');

  return `You are an AI agent. Follow your instructions precisely.

INSTRUCTIONS:
${instructions}

${accumulatedContext && Object.keys(accumulatedContext).length > 0 ? `ACCUMULATED CONTEXT:\n${contextLines}\n` : ''}${historyLines ? `EXECUTION HISTORY:\n${historyLines}\n` : ''}

IMPORTANT:
- Output your structured response as defined by your schema.
- If you include a _handoff field, the runtime will route to the next agent.
- If _handoff is null, execution is complete.`;
}

export class Swarm {
  constructor(private registry: AgentRegistry) {}

  async run(
    entryAgentName: string,
    context: SwarmContext,
    input?: Record<string, unknown>,
  ): Promise<SwarmRunResult> {
    const steps: SwarmRunResult['steps'] = [];
    const startTime = Date.now();
    let currentAgentName: string | null = entryAgentName;
    let accumulatedContext: Record<string, unknown> = {
      ...context.data,
      ...input,
    };

    while (currentAgentName && steps.length < MAX_SWARM_ITERATIONS) {
      const agent = this.registry.get(currentAgentName);

      const prompt = buildPrompt(
        agent.instructions,
        accumulatedContext,
        steps,
      );

      const augmentedSchema = withHandoff(agent.schema, agent.handoffs);
      const { object, usage } = await generateObject({
        model: agent.model,
        schema: augmentedSchema,
        prompt,
      });

      const obj = object as Record<string, unknown>;
      const handoffField = obj._handoff as
        | { nextAgent: string | null; contextToPass?: Record<string, unknown>; reason: string }
        | null
        | undefined;

      const { _handoff: _, ...taskOutput } = obj;

      const stepResult = {
        agentName: currentAgentName,
        iteration: steps.length + 1,
        output: taskOutput,
        reasoning: (taskOutput.reasoning as string) || '',
        confidence: (taskOutput.confidence as number) || 0,
        durationMs: Date.now() - startTime,
        tokensUsed: usage?.totalTokens,
        handoff: handoffField?.nextAgent ?? undefined,
      };

      steps.push(stepResult);

      context.agentOutputs.set(currentAgentName, taskOutput);
      context.iterationCount = steps.length;

      if (usage?.totalTokens) {
        context.tokenUsage.push({
          agentName: currentAgentName,
          tokens: usage.totalTokens,
        });
      }

      accumulatedContext = {
        ...accumulatedContext,
        ...handoffField?.contextToPass,
        [currentAgentName]: taskOutput,
      };

      if (handoffField?.nextAgent) {
        currentAgentName = handoffField.nextAgent;
      } else {
        currentAgentName = null;
      }
    }

    if (steps.length >= MAX_SWARM_ITERATIONS && currentAgentName) {
      throw new MaxIterationsError(currentAgentName, MAX_SWARM_ITERATIONS);
    }

    return {
      executionId: context.executionId,
      success: true,
      steps,
      finalOutput: steps[steps.length - 1]?.output,
      totalDurationMs: Date.now() - startTime,
      totalTokensUsed: context.tokenUsage.reduce(
        (sum, t) => sum + t.tokens,
        0,
      ),
    };
  }
}
