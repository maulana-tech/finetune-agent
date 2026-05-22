import { generateObject } from 'ai';
import { z } from 'zod';
import { AgentRegistry } from './registry';
import {
  SwarmContext,
  SwarmRunResult,
  ParallelFanOut,
  SwarmAgent,
  MAX_SWARM_ITERATIONS,
} from './types';
import { withHandoff } from './handoff';
import { MaxIterationsError } from './errors';

function buildPrompt(
  instructions: string,
  accumulatedContext: Record<string, unknown>,
  steps: SwarmRunResult['steps'],
): string {
  const contextLines = Object.entries(accumulatedContext)
    .filter(([key]) => key !== '_handoff' && key !== '_parallel')
    .map(([key, value]) => `${key}: ${JSON.stringify(value, null, 2)}`)
    .join('\n\n');

  const historyLines = steps
    .map(
      (s, i) =>
        `Step ${i + 1} (${s.agentName}): confidence=${s.confidence}%` +
        (s.parallelGroup ? ` [parallel:${s.parallelGroup}]` : '') +
        (s.handoff ? ` → ${s.handoff}` : ''),
    )
    .join('\n');

  return `You are an AI agent. Follow your instructions precisely.

INSTRUCTIONS:
${instructions}

${Object.keys(accumulatedContext).length > 0 ? `ACCUMULATED CONTEXT:\n${contextLines}\n` : ''}${historyLines ? `EXECUTION HISTORY:\n${historyLines}\n` : ''}

IMPORTANT:
- Output your structured response as defined by your schema.
- If you include a _handoff field, set nextAgent to the next agent name, or null to finish.
- If _handoff is null or absent, execution is complete.`;
}

/**
 * Augment an agent's schema with the _toolCall field when the agent declares tools.
 * The agent can emit _toolCall to request execution of a tool; the run-loop will
 * execute it and re-run the agent with the result added to context.
 */
function withToolCall<T extends z.ZodObject<any>>(schema: T, agent: SwarmAgent): z.ZodObject<any> {
  if (agent.tools.length === 0) return schema;

  const toolNames = agent.tools.map((t) => t.name) as [string, ...string[]];
  return schema.extend({
    _toolCall: z
      .object({
        toolName: z.enum(toolNames).describe('Name of the tool to call'),
        params: z.record(z.unknown()).describe('Parameters to pass to the tool'),
      })
      .nullable()
      .optional()
      .describe('Request a tool call. null or absent = no tool needed.'),
  });
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
    let handoffFromAgent: string | null = null; // tracks who handed off to current agent
    let accumulatedContext: Record<string, unknown> = {
      ...context.data,
      ...input,
    };

    while (currentAgentName && steps.length < MAX_SWARM_ITERATIONS) {
      const agent = this.registry.get(currentAgentName);

      // ── Tool execution sub-loop ───────────────────────────────────────────
      // If this agent declares tools, we allow up to agent.maxIterations (default 3)
      // tool calls before it must emit a final output without _toolCall.
      const maxToolCalls = agent.tools.length > 0 ? (agent.maxIterations ?? 3) : 0;
      let toolCallCount = 0;
      const agentToolCalls: { toolName: string; result: unknown }[] = [];
      let agentContext = accumulatedContext;

      let obj: Record<string, unknown>;
      let usage: { totalTokens?: number } | undefined;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const prompt = buildPrompt(agent.instructions, agentContext, steps);
        const baseSchema = withHandoff(agent.schema, agent.handoffs);
        const augmentedSchema =
          toolCallCount < maxToolCalls ? withToolCall(baseSchema, agent) : baseSchema;

        const result = await generateObject({
          model: agent.model,
          schema: augmentedSchema,
          prompt,
        });

        obj = result.object as Record<string, unknown>;
        usage = result.usage;

        const toolCallField = obj._toolCall as
          | { toolName: string; params: Record<string, unknown> }
          | null
          | undefined;

        if (toolCallField && toolCallCount < maxToolCalls) {
          // Find the tool and execute it
          const tool = agent.tools.find((t) => t.name === toolCallField.toolName);
          if (tool) {
            const toolResult = await tool.execute(toolCallField.params, context);
            agentToolCalls.push({ toolName: toolCallField.toolName, result: toolResult });
            toolCallCount++;
            // Merge tool result into agent context so the re-run can see it
            agentContext = {
              ...agentContext,
              _tool_results: {
                ...(agentContext._tool_results as Record<string, unknown> | undefined),
                [toolCallField.toolName]: toolResult,
              },
            };
            // Re-run the agent with the updated context
            continue;
          }
        }

        // No tool call (or tool not found) — proceed with the output
        break;
      }

      const handoffField = obj._handoff as
        | { nextAgent: string | null; contextToPass?: Record<string, unknown>; reason: string }
        | null
        | undefined;
      const parallelField = obj._parallel as ParallelFanOut | null | undefined;

      // Strip control fields so they don't appear in task output
      const { _handoff: _h, _parallel: _p, _toolCall: _tc, ...taskOutput } = obj;
      void _h;
      void _p;
      void _tc;

      const stepResult: SwarmRunResult['steps'][number] = {
        agentName: currentAgentName,
        iteration: steps.length + 1,
        output: taskOutput,
        reasoning: (taskOutput.reasoning as string) || '',
        confidence: (taskOutput.confidence as number) || 0,
        durationMs: Date.now() - startTime,
        tokensUsed: usage?.totalTokens,
        handoff: parallelField?.nextAfterAll ?? handoffField?.nextAgent ?? undefined,
        handoffFrom: handoffFromAgent ?? undefined,
        ...(agentToolCalls.length > 0 ? { toolCalls: agentToolCalls } : {}),
      };

      steps.push(stepResult);
      context.agentOutputs.set(currentAgentName, taskOutput);
      context.iterationCount = steps.length;

      if (usage?.totalTokens) {
        context.tokenUsage.push({ agentName: currentAgentName, tokens: usage.totalTokens });
      }

      accumulatedContext = {
        ...accumulatedContext,
        ...handoffField?.contextToPass,
        [currentAgentName]: taskOutput,
      };

      if (parallelField && parallelField.agents.length > 0) {
        // ── Parallel fan-out ──────────────────────────────────────────────
        const fanOutStart = Date.now();
        const coordinatorName = currentAgentName; // capture before async

        const parallelResults = await Promise.all(
          parallelField.agents.map(async (parallelAgentName) => {
            const parallelAgent = this.registry.get(parallelAgentName);
            const parallelPrompt = buildPrompt(
              parallelAgent.instructions,
              accumulatedContext,
              steps,
            );
            const { object: parallelObj, usage: parallelUsage } = await generateObject({
              model: parallelAgent.model,
              schema: parallelAgent.schema,
              prompt: parallelPrompt,
            });
            return {
              agentName: parallelAgentName,
              output: parallelObj as Record<string, unknown>,
              tokensUsed: parallelUsage?.totalTokens,
              durationMs: Date.now() - fanOutStart,
            };
          }),
        );

        for (const pr of parallelResults) {
          steps.push({
            agentName: pr.agentName,
            iteration: steps.length + 1,
            output: pr.output,
            reasoning: (pr.output.reasoning as string) || '',
            confidence: (pr.output.confidence as number) || 0,
            durationMs: pr.durationMs,
            tokensUsed: pr.tokensUsed,
            handoffFrom: coordinatorName,
            parallelGroup: parallelField.groupKey,
          });
          context.agentOutputs.set(pr.agentName, pr.output);
          if (pr.tokensUsed) {
            context.tokenUsage.push({ agentName: pr.agentName, tokens: pr.tokensUsed });
          }
        }

        const groupResults = parallelResults.reduce(
          (acc, r) => ({ ...acc, [r.agentName]: r.output }),
          {} as Record<string, unknown>,
        );
        accumulatedContext = {
          ...accumulatedContext,
          [parallelField.groupKey]: groupResults,
        };

        context.iterationCount = steps.length;
        handoffFromAgent = coordinatorName; // synthesizer's handoffFrom = coordinator
        currentAgentName = parallelField.nextAfterAll;
      } else if (handoffField?.nextAgent) {
        handoffFromAgent = currentAgentName;
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
      totalTokensUsed: context.tokenUsage.reduce((sum, t) => sum + t.tokens, 0),
    };
  }
}
