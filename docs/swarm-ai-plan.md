# Swarm AI Agent — Implementation Plan

> Replacing rigid orchestration pipelines with dynamic Swarm-based multi-agent architecture.
> Current date: 2026-05-20

---

## Table of Contents

1. [Current State & Why Swarm](#1-current-state--why-swarm)
2. [Multi-Model Strategy](#2-multi-model-strategy)
3. [Architecture Overview](#3-architecture-overview)
4. [Fase 1 — Swarm Runtime Engine](#4-fase-1--swarm-runtime-engine)
5. [Fase 2 — Agent Registry & Discovery](#5-fase-2--agent-registry--discovery)
6. [Fase 3 — Refactor Existing Pipelines to Swarm](#6-fase-3--refactor-existing-pipelines-to-swarm)
7. [Fase 4 — Observability, Tracing & Memory](#7-fase-4--observability-tracing--memory)
8. [Fase 5 — Dynamic Routing & Tool-Use](#8-fase-5--dynamic-routing--tool-use)
9. [File Touchpoints Summary](#9-file-touchpoints-summary)
10. [Migration Path](#10-migration-path)
11. [Risk & Mitigation](#11-risk--mitigation)

---

## 1. Current State & Why Swarm

### What We Have Today

| Pipeline | Topology | Execution |
|---|---|---|
| **Lead-scoring** | Hardcoded sequential (Extractor → Finance → Marketing → Strategy) | Single orchestrator function |
| **Finance Simulation** | Hardcoded parallel (Owner/Supplier/Customer/Bank ∥ → Synthesizer) | Single orchestrator function |
| **Market Analysis** | Hardcoded parallel (Competitor/Trend/Risk/Demand ∥ → Synthesizer) | Single orchestrator function |

**Problems:**
- No dynamic routing — pipeline order is hardcoded, can't skip irrelevant agents
- No agent-to-agent communication — only one-way context passing
- Adding a new agent means editing the orchestrator AND the worker
- Can't reuse agents across pipelines (e.g., Extractor could serve multiple entry points)
- No runtime agent registry — agents are just imported functions
- All agents use the same provider; no per-agent model selection

### What Swarm Gives Us

- **Dynamic handoff** — agent decides which agent to call next via function calling
- **Reusable agents** — same agent can participate in multiple workflows
- **Flexible topology** — sequential, parallel, conditional, loop — decided at runtime, not compile-time
- **Per-agent model config** — pick the right model for each agent's task
- **Extensible** — new agents register themselves; no orchestrator changes needed

---

## 2. Multi-Model Strategy

### Recommendation Per Agent Tier

| Tier | Use Case | Recommended Model | Provider | Cost Tier |
|---|---|---|---|---|
| **Fast (8B)** | Extraction, parsing, classification, simple routing, summarization | `meta/llama-3.1-8b-instruct` | NVIDIA NIM (existing) | $ |
| **Standard (70B)** | Analysis, reasoning, scoring, stakeholder perspective | `meta/llama-3.1-70b-instruct` | NVIDIA NIM (existing) | $$ |
| **Heavy (100B+)** | Synthesis, reconciliation, strategic recommendation, conflict resolution | `meta/llama-3.1-405b-instruct` or `claude-sonnet-4` or `gpt-4o` | NVIDIA NIM / Anthropic / OpenAI | $$$ |
| **Router** | Dynamic routing, handoff decisions, capability matching | 70B class | NVIDIA NIM | $$ |

### Implementation

```typescript
// packages/ai/src/provider.ts
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

export const nvidia = createOpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY,
});

export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // optional, for heavy tier
});

export const models = {
  fast: nvidia('meta/llama-3.1-8b-instruct'),
  standard: nvidia('meta/llama-3.1-70b-instruct'),
  heavy: nvidia('meta/llama-3.1-405b-instruct'),
  router: nvidia('meta/llama-3.1-70b-instruct'),
};
```

**Why not all 405B:** Cost. 8B is ~10x cheaper than 70B, which is ~5x cheaper than 405B. Use the smallest model that can reliably do the task.

**Progressive fallback:** If a model's confidence < threshold, route to the next tier (e.g., fast < 70 → retry with standard).

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BullMQ Queue                             │
│  orchestrated-ai-queue / finance-simulation-queue / ...         │
└────────────────────────┬────────────────────────────────────────┘
                         │ job payload
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Swarm Run Loop                               │
│  (agentic loop: execute → tool_call → handoff → repeat)         │
│                                                                  │
│  while (activeAgent && iterations < maxIterations) {             │
│    result = await activeAgent.run(context);                       │
│    if (result.handoff) activeAgent = registry.get(result.handoff)│
│    if (result.tool_calls) execute and feed back                   │
│    if (result.done) break                                         │
│  }                                                                │
└──────┬──────────────────────────────────────────────────────────┘
       │ agent selected from registry
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Agent Registry                                 │
│                                                                  │
│  Map<agentName, {                                                │
│    instructions,                                                 │
│    model,                                                        │
│    tools[],                                                      │
│    handoffs[],          // agents this one can delegate to        │
│    capabilities[],      // for dynamic routing                   │
│    schema,                                                       │
│  }>                                                               │
└──────┬──────────────────────────────────────────────────────────┘
       │ agent execution
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Per-Agent Execution                             │
│                                                                  │
│  generateObject({                                                │
│    model: agent.model,                                           │
│    schema: agent.schema ∪ SwarmOutputSchema,                     │
│    prompt: agent.instructions + context + available_tools        │
│  })                                                               │
│                                                                  │
│  → structured output + optional handoff + optional tool_calls     │
└─────────────────────────────────────────────────────────────────┘
```

### Core Data Flow

```
1. Queue delivers job to worker
2. Worker calls Swarm.run(entryAgent, context)
3. Run loop:
   a. Execute current agent (generateObject with its schema + handoff schema)
   b. Agent output includes: task_output, handoff?, tool_calls?
   c. If handoff → look up next agent from registry → loop
   d. If tool_calls → execute → feed result back → loop
   e. If done/completion → break
4. Worker persists results to DB (agent_logs, lead_scores, etc.)
```

---

## 4. Fase 1 — Swarm Runtime Engine

### Directory Structure

```
packages/ai/src/swarm/
  ├── index.ts           # Public exports
  ├── types.ts           # Core types (Agent, SwarmContext, RunResult)
  ├── agent.ts           # Agent definition factory
  ├── registry.ts        # Global agent registry
  ├── run-loop.ts        # Core run loop
  ├── handoff.ts         # Handoff schema + function tool wrapper
  ├── tool.ts            # Tool definition helper
  ├── context.ts         # SwarmContext builder + accumulator
  └── errors.ts          # Swarm-specific errors
```

### 4.1 Core Types (`types.ts`)

```typescript
/** What an agent can hand off to */
export interface HandoffTarget {
  agentName: string;
  description: string;   // What this agent does (for routing decisions)
  inputContext?: Record<string, unknown>;
}

/** A tool an agent can call */
export interface SwarmTool {
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
  execute: (params: unknown, context: SwarmContext) => Promise<unknown>;
}

/** Agent definition (registered) */
export interface SwarmAgent {
  name: string;
  instructions: string;          
  model: LanguageModel;          // Per-agent model
  schema: z.ZodObject<any>;      // Structured output schema
  handoffs: HandoffTarget[];     // Agents this one can delegate to
  tools: SwarmTool[];            // Tools this agent can invoke
  capabilities: string[];        // For dynamic routing
  maxIterations?: number;        // Per-agent call limit (default 1)
}

/** Context accumulated across the swarm run */
export interface SwarmContext {
  executionId: string;
  workspaceId: string;
  leadId?: string;
  simulationId?: string;
  marketAnalysisId?: string;

  // Accumulated outputs keyed by agent name
  agentOutputs: Map<string, unknown>;

  // Shared data store
  data: Record<string, unknown>;

  // Metadata
  startTime: number;
  iterationCount: number;
  tokenUsage: { agentName: string; tokens: number }[];
}

/** Result of a single agent execution */
export interface SwarmAgentResult {
  output: unknown;                // Validated against agent.schema
  handoff?: string;               // Name of next agent, or undefined = done
  handoffContext?: Record<string, unknown>;
  toolCalls?: { toolName: string; result: unknown }[];
  reasoning: string;
  confidence: number;
  tokensUsed?: number;
}

/** Final result of the entire swarm run */
export interface SwarmRunResult {
  executionId: string;
  success: boolean;
  steps: {
    agentName: string;
    iteration: number;
    output: unknown;
    reasoning: string;
    confidence: number;
    durationMs: number;
    tokensUsed?: number;
    handoff?: string;
  }[];
  finalOutput: unknown;           // Output of the last agent
  totalDurationMs: number;
  totalTokensUsed: number;
}
```

### 4.2 Agent Definition (`agent.ts`)

```typescript
export function defineAgent(config: SwarmAgent): SwarmAgent {
  // Validate + set defaults
  return {
    maxIterations: 1,
    ...config,
  };
}
```

### 4.3 Handoff Schema (`handoff.ts`)

Every agent's output schema gets augmented with handoff capability:

```typescript
/** Appends handoff fields to any agent schema */
export function withHandoff<T extends z.ZodObject<any>>(
  schema: T,
  handoffs: HandoffTarget[]
): z.ZodObject<any> {
  if (handoffs.length === 0) return schema;

  return schema.extend({
    _handoff: z
      .object({
        nextAgent: z
          .enum(handoffs.map((h) => h.agentName) as [string, ...string[]])
          .nullable()
          .describe('Name of the next agent to run, or null if done'),
        contextToPass: z
          .record(z.any())
          .optional()
          .describe('Context to pass to the next agent'),
        reason: z.string().describe('Why this handoff decision was made'),
      })
      .nullable()
      .describe('Handoff decision. null = execution complete.'),
  });
}
```

### 4.4 Run Loop (`run-loop.ts`)

```typescript
export class Swarm {
  constructor(private registry: AgentRegistry) {}

  async run(
    entryAgentName: string,
    context: SwarmContext,
    input?: Record<string, unknown>
  ): Promise<SwarmRunResult> {
    const steps: SwarmRunResult['steps'] = [];
    const startTime = Date.now();
    let currentAgentName: string | null = entryAgentName;
    let accumulatedContext = { ...context.data, ...input };

    while (currentAgentName && steps.length < MAX_ITERATIONS) {
      const agent = this.registry.get(currentAgentName);
      if (!agent) throw new SwarmError(`Agent ${currentAgentName} not found`);

      // Build prompt: system instructions + accumulated context + handoff options
      const prompt = buildPrompt(agent, accumulatedContext, steps);

      // Execute agent with augmented schema (includes handoff)
      const augmentedSchema = withHandoff(agent.schema, agent.handoffs);
      const { object, usage } = await generateObject({
        model: agent.model,
        schema: augmentedSchema,
        prompt,
      });

      // Extract handoff decision from output
      const { _handoff, ...taskOutput } = object as any;

      const stepResult = {
        agentName: currentAgentName,
        iteration: steps.length + 1,
        output: taskOutput,
        reasoning: object.reasoning || '',
        confidence: object.confidence || 0,
        durationMs: Date.now() - startTime,
        tokensUsed: usage?.totalTokens,
        handoff: _handoff?.nextAgent ?? undefined,
      };
      steps.push(stepResult);

      // Update context with this agent's output
      accumulatedContext = {
        ...accumulatedContext,
        ..._handoff?.contextToPass,
        [currentAgentName]: taskOutput,
      };

      // Move to next agent or terminate
      currentAgentName = _handoff?.nextAgent ?? null;
      context.iterationCount = steps.length;
    }

    return {
      executionId: context.executionId,
      success: true,
      steps,
      finalOutput: steps[steps.length - 1]?.output,
      totalDurationMs: Date.now() - startTime,
      totalTokensUsed: steps.reduce((s, step) => s + (step.tokensUsed || 0), 0),
    };
  }
}
```

### 4.5 Agent Registry (`registry.ts`)

```typescript
export class AgentRegistry {
  private agents = new Map<string, SwarmAgent>();

  register(agent: SwarmAgent): void {
    if (this.agents.has(agent.name)) {
      throw new SwarmError(`Agent "${agent.name}" already registered`);
    }
    this.agents.set(agent.name, agent);
  }

  get(name: string): SwarmAgent {
    const agent = this.agents.get(name);
    if (!agent) throw new SwarmError(`Agent "${name}" not found`);
    return agent;
  }

  findByCapability(capability: string): SwarmAgent[] {
    return Array.from(this.agents.values()).filter((a) =>
      a.capabilities.includes(capability)
    );
  }

  list(): SwarmAgent[] {
    return Array.from(this.agents.values());
  }
}

// Singleton
export const agentRegistry = new AgentRegistry();
```

### 4.6 Context Builder (`context.ts`)

```typescript
import { v4 as uuidv4 } from 'uuid';
import { SwarmContext } from './types';

export function createSwarmContext(params: {
  workspaceId: string;
  leadId?: string;
  simulationId?: string;
  marketAnalysisId?: string;
  initialData?: Record<string, unknown>;
}): SwarmContext {
  return {
    executionId: uuidv4(),
    workspaceId: params.workspaceId,
    leadId: params.leadId,
    simulationId: params.simulationId,
    marketAnalysisId: params.marketAnalysisId,
    agentOutputs: new Map(),
    data: params.initialData ?? {},
    startTime: Date.now(),
    iterationCount: 0,
    tokenUsage: [],
  };
}
```

---

## 5. Fase 2 — Agent Registry & Discovery

### Static Registration (start with this)

Each agent file registers itself:

```typescript
// packages/ai/src/swarm/agents/extractor.swarm.ts
import { defineAgent } from '../agent';
import { agentRegistry } from '../registry';
import { models } from '../../provider';
import { ExtractorOutputSchema } from '../../types';

export const extractorAgent = defineAgent({
  name: 'extractor',
  instructions: `You are a data extraction specialist. Extract structured business information from raw text...`,
  model: models.fast,
  schema: ExtractorOutputSchema,
  handoffs: ['finance', 'marketing', 'strategy'],
  tools: [],
  capabilities: ['extraction', 'parsing'],
});

agentRegistry.register(extractorAgent);
```

### Dynamic Discovery (Phase 4)

```typescript
// Auto-discover agents in a directory
import { glob } from 'fs/promises';
import path from 'path';

export async function discoverAgents(agentDir: string): Promise<void> {
  const files = await glob(`${agentDir}/**/*.swarm.ts`);
  for (const file of files) {
    await import(path.resolve(file)); // side-effect: calls agentRegistry.register()
  }
}
```

### Capability-Based Routing

```typescript
class CapabilityRouter {
  async route(
    task: string,
    context: SwarmContext,
    requiredCapabilities: string[]
  ): Promise<string> {
    // Find agents that match required capabilities
    const candidates = agentRegistry.findByCapability(requiredCapabilities[0]);
    // Optionally: use a router model to pick the best match
    // For now: return first match
    return candidates[0]?.name || 'fallback-agent';
  }
}
```

---

## 6. Fase 3 — Refactor Existing Pipelines to Swarm

### 6.1 Lead-Scoring Pipeline

**Before (hardcoded sequential):**
```
orchestrator.ts — Extractor → Finance → Marketing → Strategy
```

**After (swarm with dynamic routing):**

```
Lead-scoring Coordinator (router agent)
  │
  ├──→ [extractor]      ← always runs first
  │       │ handoff to coordinator
  │       ▼
  ├──→ [coordinator]    ← decides: need financial analysis? marketing analysis?
  │       │
  │       ├──→ [finance]   ← if yes
  │       │       │ handoff to coordinator
  │       │       ▼
  │       ├──→ [coordinator] ← re-evaluate: now do marketing?
  │       │       │
  │       │       ├──→ [marketing]  ← if lead has enough data
  │       │       │       │ handoff to coordinator
  │       │       │       ▼
  │       │       └──→ [coordinator] ← all analysis done, synthesize?
  │       │               │
  │       │               └──→ [strategy]  ← final recommendation
  │       │                       │ handoff = null (done)
  │       │                       ▼
  │       └──→ [done]
```

**New files:**
- `packages/ai/src/swarm/agents/coordinator.swarm.ts` — routing agent
- `packages/ai/src/swarm/agents/extractor.swarm.ts` — migrate from `agents/extractor.ts`
- `packages/ai/src/swarm/agents/finance.swarm.ts` — migrate from `agents/finance.ts`
- `packages/ai/src/swarm/agents/marketing.swarm.ts` — migrate from `agents/marketing.ts`
- `packages/ai/src/swarm/agents/strategy.swarm.ts` — migrate from `agents/strategy.ts`
- `packages/ai/src/swarm/workflows/lead-scoring.workflow.ts` — entry point

### 6.2 Finance Simulation Pipeline

**Before:** Hardcoded parallel (Promise.all) + sequential synthesizer.

**After — Option A (Coordinator pattern, preferred):**

```
FinSim Coordinator
  │
  ├──→ [owner]      ← parallel fan-out
  ├──→ [supplier]   ← parallel fan-out
  ├──→ [customer]   ← parallel fan-out
  ├──→ [bank]       ← parallel fan-out
  │
  └──→ [finsim-synthesizer]  ← runs after all 4 complete
          │ handoff = null (done)
          ▼
```

The run loop needs a **parallel fan-out** extension — or simpler: the coordinator can be a prelude agent that emits a special signal, and the run loop handles it:

```typescript
if (result._parallel) {
  const results = await Promise.all(
    result._parallel.agents.map((name) => runAgent(name, context))
  );
  context.data[result._parallel.groupKey] = results;
  currentAgentName = result._parallel.nextAfterAll;
}
```

**New files:**
- `packages/ai/src/swarm/agents/owner.swarm.ts`
- `packages/ai/src/swarm/agents/supplier.swarm.ts`
- `packages/ai/src/swarm/agents/customer.swarm.ts`
- `packages/ai/src/swarm/agents/bank.swarm.ts`
- `packages/ai/src/swarm/agents/finsim-synthesizer.swarm.ts`
- `packages/ai/src/swarm/workflows/finance-simulation.workflow.ts`

### 6.3 Market Analysis Pipeline

**After — same pattern as finance sim:**

```
Market Coordinator
  │
  ├──→ [competitor]  ← parallel
  ├──→ [trend]
  ├──→ [risk]
  ├──→ [demand]
  │
  └──→ [market-synthesizer]
```

**New files:**
- `packages/ai/src/swarm/agents/competitor.swarm.ts`
- `packages/ai/src/swarm/agents/trend.swarm.ts`
- `packages/ai/src/swarm/agents/risk.swarm.ts`
- `packages/ai/src/swarm/agents/demand.swarm.ts`
- `packages/ai/src/swarm/agents/market-synthesizer.swarm.ts`
- `packages/ai/src/swarm/workflows/market-analysis.workflow.ts`

### 6.4 Workflow Entry Points

```typescript
// packages/ai/src/swarm/workflows/lead-scoring.workflow.ts
export async function runLeadScoringSwarm(input: {
  leadId: string;
  workspaceId: string;
  rawText: string;
  ourProduct: string;
}): Promise<SwarmRunResult> {
  const context = createSwarmContext({
    workspaceId: input.workspaceId,
    leadId: input.leadId,
    initialData: { rawText: input.rawText, ourProduct: input.ourProduct },
  });

  const swarm = new Swarm(agentRegistry);
  return swarm.run('extractor', context);
}
```

### 6.5 Workers — Simplified

```typescript
// apps/workers/src/queues/orchestrated-ai.worker.ts
export const startOrchestratedAiWorker = () => {
  const worker = new Worker(
    'orchestrated-ai-queue',
    async (job) => {
      const result = await runLeadScoringSwarm(job.data);
      // Persist agent_logs + lead_scores (same as today)
      await persistSwarmResult(result, job.data);
    },
    { connection: { url: process.env.REDIS_URL } }
  );
};
```

Instead of 4 worker files (ai.worker, orchestrated-ai.worker, finance-simulation.worker, market-analysis.worker), we can have **2 workers**: one for lead-scoring, one for analysis (finance + market share a similar parallel pattern). Or even **1 generic swarm worker** that accepts `workflowName` in the job payload.

---

## 7. Fase 4 — Observability, Tracing & Memory

### Agent Logging (upgrade existing `agent_logs` table)

Current `agent_logs` schema is adequate. Add:

```sql
-- New columns
swarm_execution_id uuid          -- groups all agents in one Swarm run
iteration         integer        -- iteration within the run loop
handoff_from      varchar(100)   -- which agent handed off to this one
handoff_reason    text           -- why the handoff was made
parallel_group    varchar(50)    -- for parallel fan-out tracking
```

### Swarm Run Logging (new table)

```sql
-- packages/db/src/schema/swarm_runs.ts
createTable('swarm_runs', {
  id: uuid().defaultRandom().primaryKey(),
  workspaceId: uuid().notNull(),
  workflowName: varchar({ length: 100 }).notNull(), -- 'lead-scoring', 'finance-simulation', etc.
  entryAgent: varchar({ length: 100 }).notNull(),
  totalIterations: integer().notNull(),
  totalDurationMs: integer().notNull(),
  totalTokensUsed: integer().notNull(),
  status: varchar({ length: 20 }).notNull().default('completed'), -- 'completed', 'failed', 'max_iterations'
  errorMessage: text(),
  createdAt: timestamp().defaultNow().notNull(),
});
```

### Tracing

```typescript
// Decorator or middleware for each agent execution
async function tracedRun(
  agent: SwarmAgent,
  context: SwarmContext,
  runFn: () => Promise<SwarmAgentResult>
): Promise<SwarmAgentResult> {
  const start = Date.now();
  try {
    const result = await runFn();
    await db.insert(agentLogs).values({
      swarmExecutionId: context.executionId,
      workspaceId: context.workspaceId,
      agentName: agent.name,
      iteration: context.iterationCount,
      output: result.output,
      reasoning: result.reasoning,
      confidence: result.confidence,
      handoff: result.handoff,
      durationMs: Date.now() - start,
      tokensUsed: result.tokensUsed,
    });
    return result;
  } catch (err) {
    await db.insert(agentLogs).values({
      swarmExecutionId: context.executionId,
      agentName: agent.name,
      status: 'failed',
      errorMessage: (err as Error).message,
    });
    throw err;
  }
}
```

### Memory (Cross-Run Context)

For agents that benefit from past execution context (e.g., Strategy agent referencing previous lead scores):

```typescript
// Optional: store/retrieve compressed summaries
export class SwarmMemory {
  async getRecentContext(workspaceId: string, agentName: string, limit = 5) {
    return db
      .select()
      .from(agentLogs)
      .where(
        and(
          eq(agentLogs.workspaceId, workspaceId),
          eq(agentLogs.agentName, agentName)
        )
      )
      .orderBy(desc(agentLogs.createdAt))
      .limit(limit);
  }
}
```

---

## 8. Fase 5 — Dynamic Routing & Tool-Use

### Tool-Using Agents

Agents can call external tools (DB queries, APIs, scrapers):

```typescript
const dbLookupTool: SwarmTool = {
  name: 'query_lead_by_name',
  description: 'Search for an existing lead by business name',
  parameters: z.object({
    name: z.string().describe('Business name to search'),
  }),
  execute: async (params: { name: string }, context: SwarmContext) => {
    const result = await db
      .select()
      .from(leads)
      .where(and(
        eq(leads.workspaceId, context.workspaceId),
        ilike(leads.name, `%${params.name}%`)
      ))
      .limit(5);
    return result;
  },
};
```

### Dynamic Router Agent

A meta-agent that plans the workflow before executing:

```typescript
const routerAgent = defineAgent({
  name: 'router',
  instructions: `You are a workflow planner. Given a user request and available agents,
plan which agents to call and in what order.`,
  model: models.router,
  schema: z.object({
    plan: z.array(z.object({
      agentName: z.string(),
      purpose: z.string(),
      parallel: z.boolean().default(false),
    })),
    reasoning: z.string(),
  }),
  handoffs: [], // doesn't handoff directly; plan is executed externally
  tools: [], // has access to agent list as context
  capabilities: ['routing', 'planning'],
});
```

The run loop can optionally call a router agent first to generate a plan, then execute it:

```typescript
if (useDynamicRouting) {
  const plan = await routerAgent.run(context);
  for (const step of plan.plan) {
    // Execute each step, respecting parallel flags
    ...
  }
}
```

### Tools Registry

```typescript
// packages/ai/src/swarm/tools/index.ts
export const availableTools: SwarmTool[] = [
  dbLookupTool,
  searchLeadTool,
  getWorkspaceProductTool,
  fetchGoogleReviewsTool,
  // ...
];

// Attach relevant tools to each agent
export const extractorAgent = defineAgent({
  ...baseConfig,
  tools: [dbLookupTool],
});
```

---

## 9. File Touchpoints Summary

### New Files

```
packages/ai/src/swarm/
  ├── index.ts
  ├── types.ts
  ├── agent.ts
  ├── registry.ts
  ├── run-loop.ts
  ├── handoff.ts
  ├── tool.ts
  ├── context.ts
  ├── errors.ts
  ├── memory.ts
  ├── tools/
  │   ├── index.ts
  │   ├── db-lookup.ts
  │   └── scraper.ts
  ├── agents/
  │   ├── coordinator.swarm.ts
  │   ├── extractor.swarm.ts
  │   ├── finance.swarm.ts
  │   ├── marketing.swarm.ts
  │   ├── strategy.swarm.ts
  │   ├── owner.swarm.ts
  │   ├── supplier.swarm.ts
  │   ├── customer.swarm.ts
  │   ├── bank.swarm.ts
  │   ├── finsim-synthesizer.swarm.ts
  │   ├── competitor.swarm.ts
  │   ├── trend.swarm.ts
  │   ├── risk.swarm.ts
  │   ├── demand.swarm.ts
  │   ├── market-synthesizer.swarm.ts
  │   └── router.swarm.ts                    (Fase 5)
  └── workflows/
      ├── lead-scoring.workflow.ts
      ├── finance-simulation.workflow.ts
      └── market-analysis.workflow.ts

packages/db/src/schema/swarm_runs.ts          (Fase 4)
```

### Modified Files

| File | Change |
|---|---|
| `packages/ai/src/index.ts` | Export swarm runtime + all swarm agents |
| `packages/ai/src/provider.ts` | Add multi-model config (fast, standard, heavy, router) |
| `packages/ai/src/types.ts` | Keep existing schemas; may refactor some to swarm |
| `packages/ai/src/orchestrator.ts` | **Deprecated** — replaced by swarm workflow; keep for BC |
| `packages/ai/src/finance-orchestrator.ts` | **Deprecated** — replaced by swarm workflow; keep for BC |
| `packages/ai/src/market-orchestrator.ts` | **Deprecated** — replaced by swarm workflow; keep for BC |
| `packages/ai/src/agents/*.ts` | **Deprecated** — migrate logic to swarm agents |
| `apps/workers/src/index.ts` | Replace legacy workers with swarm workers |
| `apps/workers/src/queues/*.ts` | Simplify to use swarm workflows |
| `apps/api/src/jobs/jobs.service.ts` | Update to trigger swarm workflows |
| `packages/db/src/schema/agent_logs.ts` | Add swarm columns (Fase 4) |
| `packages/db/src/index.ts` | Export swarm_runs |
| `packages/ai/package.json` | May need additional deps |

### Deprecated (Kept for Backward Compatibility)

After migration, these files remain but are no longer actively used:

```
packages/ai/src/orchestrator.ts
packages/ai/src/finance-orchestrator.ts
packages/ai/src/market-orchestrator.ts
packages/ai/src/agents/extractor.ts
packages/ai/src/agents/finance.ts
packages/ai/src/agents/marketing.ts
packages/ai/src/agents/strategy.ts
packages/ai/src/agents/finance-sim/*.ts
packages/ai/src/agents/market-sim/*.ts
```

Cleanup after proving swarm is stable (Fase 5 or later).

---

## 10. Migration Path

### Strategy: Parallel Run (no big bang)

Each pipeline is migrated independently. Old and new coexist during transition.

```
Fase 1         Fase 2        Fase 3                Fase 4         Fase 5
───────       ───────       ─────────              ───────        ───────
Swarm    →   Register     → Refactor lead-       → Add          → Dynamic
Runtime      all agents     scoring pipeline        tracing +      routing +
Engine       (stub           to swarm               memory         tool-use
             schemas)       │                               (optional)
                            ├── Verify accuracy
                            ├── Keep old path as fallback
                            │
                            ├── Refactor finance-sim
                            ├── Verify accuracy
                            │
                            ├── Refactor market-analysis
                            └── Verify accuracy
```

### Phase Timeline (Conservative Estimate)

| Phase | What | Est. Time | Dependencies |
|---|---|---|---|
| Fase 1 | Swarm runtime (types, registry, run-loop, handoff, context) | 3-4 days | None |
| Fase 2 | Register all 15 agents with stub schemas | 1 day | Fase 1 |
| Fase 3A | Lead-scoring swarm (coordinator + 4 agents + workflow) | 2-3 days | Fase 2 |
| Fase 3B | Finance sim swarm (coordinator + 5 agents + workflow) | 1-2 days | Fase 3A |
| Fase 3C | Market analysis swarm (coordinator + 5 agents + workflow) | 1-2 days | Fase 3B |
| Fase 4 | Observability (swarm_runs table, tracing, memory) | 1-2 days | Fase 3 |
| Fase 5 | Dynamic routing + tool-use | Optional | Fase 4 |

**Total: ~10-15 days for full migration.**

### Rollout Plan

1. **Fase 1-2:** No user-visible changes. Run existing pipelines as before.
2. **Fase 3A:** Lead-scoring routes through swarm by default. Old orchestrator kept as fallback. Toggle via env var `SWARM_LEAD_SCORING=1`.
3. **Fase 3B:** Same toggle pattern for finance sim.
4. **Fase 3C:** Same for market analysis.
5. **After Fase 4 stable:** Remove old orchestrators and toggle env vars.

---

## 11. Risk & Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| **Agent hallucinates handoff** (routes to wrong next agent) | Wrong analysis | Handoff enum is constrained to valid targets. Coordinator re-validates before executing. Max iteration limit. |
| **Infinite loop** (agent keeps handing off to itself) | Run never terminates | `maxIterations` default = 10. Circuit breaker in run loop. |
| **Swarm slower than hardcoded pipeline** | User-facing latency | Each handoff = 1 extra LLM call. Mitigation: cache coordinator decisions for repeated patterns. Use fast model for coordinator. Parallel fan-out for independent agents. |
| **Backward compatibility** (existing workers expect old output) | Workers break | Old orchestrators kept until all consumers migrate. New `SwarmRunResult` mapped to old `OrchestratorOutput` shape via adapter. |
| **Cost increase** from extra LLM calls for routing | Higher NIM bill | Router uses fast model (8B). Cost per routing call ~$0.0001. Even 10k runs/month negligible. |
| **Debugging difficulty** (non-deterministic routing) | Hard to reproduce bugs | Full agent_logs with handoff_reason, iteration, swarm_execution_id. Replay mode: re-run swarm with same context + fixed seed. |
| **Parallel fan-out complexity** in run loop | Run loop gets complicated | Handle parallel as special case (not all swarms need it). Finance sim can alternatively run coordinator sequentially 4 times without parallel — simpler, slightly slower. |

---

## Appendix A: Existing Agent Inventory (pre-migration)

| # | Agent Name | Current File | Current Model | Pipeline |
|---|---|---|---|---|
| 1 | extractor | `agents/extractor.ts` | 8B (fast) | Lead-scoring |
| 2 | finance | `agents/finance.ts` | 70B | Lead-scoring |
| 3 | marketing | `agents/marketing.ts` | 70B | Lead-scoring |
| 4 | strategy | `agents/strategy.ts` | 70B | Lead-scoring |
| 5 | owner | `agents/finance-sim/owner.ts` | 70B | Finance Sim |
| 6 | supplier | `agents/finance-sim/supplier.ts` | 70B | Finance Sim |
| 7 | customer | `agents/finance-sim/customer.ts` | 70B | Finance Sim |
| 8 | bank | `agents/finance-sim/bank.ts` | 70B | Finance Sim |
| 9 | synthesizer (fin) | `agents/finance-sim/synthesizer.ts` | 70B | Finance Sim |
| 10 | competitor | `agents/market-sim/competitor.ts` | 70B | Market Analysis |
| 11 | trend | `agents/market-sim/trend.ts` | 70B | Market Analysis |
| 12 | risk | `agents/market-sim/risk.ts` | 70B | Market Analysis |
| 13 | demand | `agents/market-sim/demand.ts` | 70B | Market Analysis |
| 14 | synthesizer (mkt) | `agents/market-sim/synthesizer.ts` | 70B | Market Analysis |
| — | coordinator | _new_ | 8B or 70B | _swarm routing_ |
| — | router | _new (Fase 5)_ | 70B | _dynamic routing_ |

---

## Appendix B: Swarm Agent Schema Template

```typescript
// Template for creating a new swarm agent
export const myNewSwarmAgent = defineAgent({
  name: 'my-agent',
  instructions: `You are an agent that... [clear, specific instructions]`,
  model: models.standard,  // or models.fast or models.heavy
  schema: z.object({
    // Structured output fields
    result_field: z.string(),
    reasoning: z.string().describe('Brief reasoning for this output'),
    confidence: z.number().min(0).max(100),
  }),
  handoffs: [
    { agentName: 'next-agent', description: 'What the next agent does' },
  ],
  tools: [],
  capabilities: ['my-capability'],
});
```

---

## Appendix C: Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Handoff mechanism | Function-calling based (augmented schema via `_handoff` field) | Simple, fits `generateObject` pattern, no separate orchestration API needed |
| Registry pattern | Singleton + side-effect registration | Familiar pattern, easy to test (reset registry between tests) |
| Parallel execution | Special `_parallel` signal in agent output | Avoids forcing a distributed DAG executor into the run loop; only used where needed |
| Agent discovery | Static imports first, dynamic glob later | Static is simpler for current 15 agents; dynamic only when agent count grows significantly |
| Migration strategy | Parallel run (old + new) with env toggle | Zero risk rollout; compare outputs before switching |
| Old orchestrators | Keep as deprecated code | Don't delete until swarm is battle-tested in production |
| Model per agent | Configured in `defineAgent()` | Clean separation, easy to swap models per agent without changing business logic |
