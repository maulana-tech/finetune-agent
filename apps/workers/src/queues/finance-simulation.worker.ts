import { Worker } from 'bullmq';
import { eq, and, gte } from 'drizzle-orm';
import {
  runFinanceSimulation,
  runFinanceSimulationSwarm,
  type SwarmRunResult,
  FinanceDataSeed,
  FinanceScenario,
} from '@repo/ai';
import {
  db,
  agentLogs,
  simulations,
  swarmRuns,
  transactions,
  type CashflowForecastPoint,
} from '@repo/db';
import type { FinanceSimulationJobPayload } from '@repo/shared';

const AGENT_ROLES: Record<string, string> = {
  owner:
    'Business owner perspective — revenue strategy, margin, hiring, growth ambition',
  supplier:
    'Upstream supply chain — raw material cost, lead time, inventory adequacy',
  customer:
    'Demand side — price sensitivity, willingness to pay, churn risk under scenario changes',
  bank:
    'Lender / treasury — runway, debt service, credit recommendation',
  synthesizer:
    'Synthesizer — reconciles 4 stakeholder views into a single cashflow forecast',
};

/**
 * Finance Simulation Worker
 *
 * Consumes `finance-simulation-queue` jobs:
 * 1. Loads simulation row (created by API in 'pending' status)
 * 2. Builds the historical data seed from `transactions`
 * 3. Runs the multi-agent orchestrator (4 stakeholders in parallel + synthesizer)
 * 4. Logs every agent execution to `agent_logs`
 * 5. Writes final cashflow forecast + risk level back to the simulation row
 */
export const startFinanceSimulationWorker = () => {
  const worker = new Worker(
    'finance-simulation-queue',
    async (job) => {
      const { simulationId, workspaceId } = job.data as FinanceSimulationJobPayload;
      console.log(`[FinanceSim] Picked up simulation ${simulationId}`);

      // 1. Load the simulation row
      const [sim] = await db
        .select()
        .from(simulations)
        .where(eq(simulations.id, simulationId))
        .limit(1);

      if (!sim) {
        throw new Error(`Simulation ${simulationId} not found`);
      }

      // 2. Mark running
      await db
        .update(simulations)
        .set({ status: 'running' })
        .where(eq(simulations.id, simulationId));

      try {
        // 3. Build data seed from historical transactions
        const seed = await buildDataSeed(workspaceId, sim.dataSeedMonths);

        // 4. Run orchestrator (swarm or legacy)
        const useSwarm = process.env.USE_SWARM_AGENTS === 'true';
        const result = useSwarm
          ? await runFinanceSimulationSwarm({
              simulationId,
              workspaceId,
              scenario: sim.scenarioParams as any,
              forecastMonths: sim.forecastMonths,
              seed,
            })
          : await runFinanceSimulation({
              simulationId,
              workspaceId,
              scenario: sim.scenarioParams as FinanceScenario,
              forecastMonths: sim.forecastMonths,
              seed,
            });

        const steps = useSwarm
          ? swarmStepsToOrchestratorSteps(result as SwarmRunResult)
          : (result as Awaited<ReturnType<typeof runFinanceSimulation>>).steps;
        const finalForecast = useSwarm
          ? swarmOutputToFinalForecast(result as SwarmRunResult)
          : (result as Awaited<ReturnType<typeof runFinanceSimulation>>).finalForecast;
        const executionId = result.executionId;
        const totalDurationMs = result.totalDurationMs;
        const totalTokensUsed = result.totalTokensUsed;

        // 5. Log every agent execution
        for (const step of steps) {
          await db.insert(agentLogs).values({
            workspaceId,
            simulationId,
            agentName: step.agentName,
            agentRole: AGENT_ROLES[step.agentName] ?? 'Unknown agent role',
            executionId,
            stepNumber: step.stepNumber,
            input: {
              scenario: sim.scenarioParams,
              forecastMonths: sim.forecastMonths,
              seedMonthsCovered: seed.monthsCovered,
            },
            output: step.output as object,
            reasoning: step.reasoning,
            confidence: step.confidence,
            contextFromPreviousAgent:
              step.agentName === 'synthesizer'
                ? {
                    stakeholders: steps
                      .filter((s) => s.stepNumber === 1)
                      .reduce(
                        (acc, s) => ({ ...acc, [s.agentName]: s.output }),
                        {}
                      ),
                  }
                : null,
            contextSharedToNextAgent:
              step.stepNumber === 1 ? { [step.agentName]: step.output } : null,
            durationMs: step.durationMs,
            tokensUsed: step.tokensUsed,
            handoffFrom: step.handoffFrom ?? null,
            parallelGroup: step.parallelGroup ?? null,
          });
        }

        // 6. Write final result back to simulation row
        const forecast: CashflowForecastPoint[] =
          finalForecast.monthly_forecast.map((p) => ({
            month: monthOffsetToISO(p.month_offset),
            projectedIncome: p.projected_income,
            projectedExpense: p.projected_expense,
            projectedNet: p.projected_net,
          }));

        await db
          .update(simulations)
          .set({
            status: 'completed',
            executionId,
            cashflowForecast: forecast,
            riskLevel: finalForecast.risk_level,
            summary: finalForecast.summary,
            finalReasoning: finalForecast.reasoning,
            confidence: finalForecast.confidence,
            totalDurationMs,
            totalTokensUsed,
            completedAt: new Date(),
          })
          .where(eq(simulations.id, simulationId));

        // Record the swarm run for observability
        if (useSwarm) {
          await db.insert(swarmRuns).values({
            workspaceId,
            executionId,
            workflowName: 'finance-simulation',
            entryAgent: 'finsim-coordinator',
            simulationId,
            totalSteps: steps.length,
            totalDurationMs,
            totalTokensUsed,
            status: 'completed',
          });
        }

        console.log(
          `[FinanceSim] Completed ${simulationId} risk=${finalForecast.risk_level}`
        );

        return {
          success: true,
          executionId,
          riskLevel: finalForecast.risk_level,
          totalDurationMs,
          totalTokensUsed,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FinanceSim] Failed ${simulationId}:`, message);
        await db
          .update(simulations)
          .set({ status: 'failed', errorMessage: message })
          .where(eq(simulations.id, simulationId));
        throw err;
      }
    },
    {
      connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
    }
  );

  worker.on('completed', (job) =>
    console.log(`[FinanceSim] Job ${job.id} completed`)
  );
  worker.on('failed', (job, err) =>
    console.log(`[FinanceSim] Job ${job?.id} failed: ${err.message}`)
  );

  console.log('[FinanceSim] Worker started - listening to finance-simulation-queue');
};

/* =============================================================
   Swarm adapters
   ============================================================= */

function swarmStepsToOrchestratorSteps(
  result: SwarmRunResult,
): { agentName: string; stepNumber: number; output: any; reasoning: string; confidence: number; durationMs: number; tokensUsed?: number; handoffFrom?: string; parallelGroup?: string }[] {
  return result.steps.map((s, i) => ({
    agentName: s.agentName,
    stepNumber: i + 1,
    output: s.output as Record<string, unknown>,
    reasoning: s.reasoning,
    confidence: s.confidence,
    durationMs: s.durationMs,
    tokensUsed: s.tokensUsed,
    handoffFrom: s.handoffFrom,
    parallelGroup: s.parallelGroup,
  }));
}

function swarmOutputToFinalForecast(result: SwarmRunResult) {
  const out = (result.finalOutput ?? result.steps[result.steps.length - 1]?.output) as Record<string, unknown> | undefined;
  return {
    risk_level: (out?.risk_level as 'low' | 'medium' | 'high' | 'critical') ?? 'medium',
    summary: (out?.summary as string) ?? '',
    monthly_forecast: (out?.monthly_forecast as { month_offset: number; projected_income: number; projected_expense: number; projected_net: number }[]) ?? [],
    reasoning: (out?.reasoning as string) ?? '',
    confidence: (out?.confidence as number) ?? 0,
  };
}

/* =============================================================
   Helpers
   ============================================================= */

/**
 * Aggregates the last N months of transactions into a compact seed structure.
 * Falls back to an empty seed if the workspace has no history yet.
 */
async function buildDataSeed(
  workspaceId: string,
  months: number
): Promise<FinanceDataSeed> {
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  const sinceStr = since.toISOString().slice(0, 10);

  const rows = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.workspaceId, workspaceId),
        gte(transactions.txDate, sinceStr)
      )
    );

  let totalIncome = 0;
  let totalExpense = 0;
  const incomeByCat: Record<string, number> = {};
  const expenseByCat: Record<string, number> = {};

  for (const r of rows) {
    const amount = Number(r.amount);
    if (r.type === 'income' || r.type === 'invoice') {
      totalIncome += amount;
      incomeByCat[r.category] = (incomeByCat[r.category] ?? 0) + amount;
    } else if (r.type === 'expense') {
      totalExpense += amount;
      expenseByCat[r.category] = (expenseByCat[r.category] ?? 0) + amount;
    }
  }

  const top = (m: Record<string, number>) =>
    Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, total]) => ({ category, total }));

  return {
    monthsCovered: months,
    totalIncome,
    totalExpense,
    averageMonthlyIncome: totalIncome / months,
    averageMonthlyExpense: totalExpense / months,
    topIncomeCategories: top(incomeByCat),
    topExpenseCategories: top(expenseByCat),
    transactionCount: rows.length,
  };
}

/** Convert orchestrator's 1-based month offset to a yyyy-MM string. */
function monthOffsetToISO(offset: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 7);
}

