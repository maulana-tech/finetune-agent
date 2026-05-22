import { v4 as uuidv4 } from 'uuid';
import {
  AgentResponse,
  FinanceDataSeed,
  FinanceScenario,
  FinanceSimulationContext,
  SynthesizerOutput,
  OwnerOutput,
  SupplierOutput,
  CustomerOutput,
  BankOutput,
} from './types';
import { ownerAgent } from './agents/finance-sim/owner';
import { supplierAgent } from './agents/finance-sim/supplier';
import { customerAgent } from './agents/finance-sim/customer';
import { bankAgent } from './agents/finance-sim/bank';
import { synthesizerAgent } from './agents/finance-sim/synthesizer';

/**
 * Finance Multi-Agent Orchestrator
 *
 * Topology: 4 stakeholder agents run in PARALLEL, then a Synthesizer reconciles
 * their independent views. This differs from the lead-scoring orchestrator
 * (sequential, context-passing) — finance perspectives are independent lenses
 * on the same scenario, and parallel execution is both faster and more faithful
 * to the swarm-intelligence model.
 *
 * Pipeline:
 *   ┌── Owner ────┐
 *   ├── Supplier ─┤  (parallel)
 *   ├── Customer ─┤
 *   └── Bank ─────┘
 *           │
 *           ▼
 *      Synthesizer  → cashflow forecast + risk level
 */

export interface FinanceOrchestratorInput {
  simulationId: string;
  workspaceId: string;
  scenario: FinanceScenario;
  forecastMonths: number;
  seed: FinanceDataSeed;
}

export interface FinanceOrchestratorStep {
  agentName: 'owner' | 'supplier' | 'customer' | 'bank' | 'synthesizer';
  stepNumber: number;
  output: unknown;
  reasoning: string;
  confidence: number;
  durationMs: number;
  tokensUsed?: number;
  handoffFrom?: string;
  parallelGroup?: string;
}

export interface FinanceOrchestratorResult {
  executionId: string;
  success: boolean;
  steps: FinanceOrchestratorStep[];
  finalForecast: SynthesizerOutput;
  totalDurationMs: number;
  totalTokensUsed: number;
}

export async function runFinanceSimulation(
  input: FinanceOrchestratorInput
): Promise<FinanceOrchestratorResult> {
  const executionId = uuidv4();
  const startTime = Date.now();

  const ctx: FinanceSimulationContext = {
    executionId,
    simulationId: input.simulationId,
    workspaceId: input.workspaceId,
    scenario: input.scenario,
    forecastMonths: input.forecastMonths,
    seed: input.seed,
  };

  console.log(
    `[FinanceOrchestrator] Starting execution ${executionId} for simulation ${input.simulationId}`
  );

  // ============ STAKEHOLDER PHASE — parallel ============
  console.log('[FinanceOrchestrator] Running Owner/Supplier/Customer/Bank in parallel');

  const [ownerRes, supplierRes, customerRes, bankRes] = await Promise.all([
    ownerAgent(ctx) as Promise<AgentResponse<OwnerOutput>>,
    supplierAgent(ctx) as Promise<AgentResponse<SupplierOutput>>,
    customerAgent(ctx) as Promise<AgentResponse<CustomerOutput>>,
    bankAgent(ctx) as Promise<AgentResponse<BankOutput>>,
  ]);

  const stakeholderSteps: FinanceOrchestratorStep[] = [
    {
      agentName: 'owner',
      stepNumber: 1,
      output: ownerRes.output,
      reasoning: ownerRes.reasoning,
      confidence: ownerRes.confidence,
      durationMs: ownerRes.durationMs,
      tokensUsed: ownerRes.tokensUsed,
    },
    {
      agentName: 'supplier',
      stepNumber: 1,
      output: supplierRes.output,
      reasoning: supplierRes.reasoning,
      confidence: supplierRes.confidence,
      durationMs: supplierRes.durationMs,
      tokensUsed: supplierRes.tokensUsed,
    },
    {
      agentName: 'customer',
      stepNumber: 1,
      output: customerRes.output,
      reasoning: customerRes.reasoning,
      confidence: customerRes.confidence,
      durationMs: customerRes.durationMs,
      tokensUsed: customerRes.tokensUsed,
    },
    {
      agentName: 'bank',
      stepNumber: 1,
      output: bankRes.output,
      reasoning: bankRes.reasoning,
      confidence: bankRes.confidence,
      durationMs: bankRes.durationMs,
      tokensUsed: bankRes.tokensUsed,
    },
  ];

  for (const s of stakeholderSteps) {
    console.log(
      `[FinanceOrchestrator]   ✓ ${s.agentName} confidence=${s.confidence}% in ${s.durationMs}ms`
    );
  }

  // ============ SYNTHESIS PHASE ============
  console.log('[FinanceOrchestrator] Running Synthesizer with 4 stakeholder views');

  const synthRes = await synthesizerAgent({
    ctx,
    owner: ownerRes.output,
    supplier: supplierRes.output,
    customer: customerRes.output,
    bank: bankRes.output,
  });

  const synthesizerStep: FinanceOrchestratorStep = {
    agentName: 'synthesizer',
    stepNumber: 2,
    output: synthRes.output,
    reasoning: synthRes.reasoning,
    confidence: synthRes.confidence,
    durationMs: synthRes.durationMs,
    tokensUsed: synthRes.tokensUsed,
  };

  const steps: FinanceOrchestratorStep[] = [...stakeholderSteps, synthesizerStep];

  const totalDurationMs = Date.now() - startTime;
  const totalTokensUsed = steps.reduce(
    (sum, s) => sum + (s.tokensUsed || 0),
    0
  );

  console.log(
    `[FinanceOrchestrator] Done. risk=${synthRes.output.risk_level} confidence=${synthRes.confidence}% total=${totalDurationMs}ms tokens=${totalTokensUsed}`
  );

  return {
    executionId,
    success: true,
    steps,
    finalForecast: synthRes.output,
    totalDurationMs,
    totalTokensUsed,
  };
}
