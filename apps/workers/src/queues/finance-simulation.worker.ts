import { Worker } from 'bullmq';
import { eq, and, gte } from 'drizzle-orm';
import {
  runFinanceSimulation,
  FinanceDataSeed,
  FinanceScenario,
} from '@repo/ai';
import {
  db,
  agentLogs,
  simulations,
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

        // 4. Run orchestrator
        const result = await runFinanceSimulation({
          simulationId,
          workspaceId,
          scenario: sim.scenarioParams as FinanceScenario,
          forecastMonths: sim.forecastMonths,
          seed,
        });

        // 5. Log every agent execution
        for (const step of result.steps) {
          await db.insert(agentLogs).values({
            workspaceId,
            simulationId,
            agentName: step.agentName,
            agentRole: AGENT_ROLES[step.agentName] ?? 'Unknown agent role',
            executionId: result.executionId,
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
                    stakeholders: result.steps
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
          });
        }

        // 6. Write final result back to simulation row
        const forecast: CashflowForecastPoint[] =
          result.finalForecast.monthly_forecast.map((p) => ({
            month: monthOffsetToISO(p.month_offset),
            projectedIncome: p.projected_income,
            projectedExpense: p.projected_expense,
            projectedNet: p.projected_net,
          }));

        await db
          .update(simulations)
          .set({
            status: 'completed',
            executionId: result.executionId,
            cashflowForecast: forecast,
            riskLevel: result.finalForecast.risk_level,
            summary: result.finalForecast.summary,
            finalReasoning: result.finalForecast.reasoning,
            confidence: result.finalForecast.confidence,
            totalDurationMs: result.totalDurationMs,
            totalTokensUsed: result.totalTokensUsed,
            completedAt: new Date(),
          })
          .where(eq(simulations.id, simulationId));

        console.log(
          `[FinanceSim] Completed ${simulationId} risk=${result.finalForecast.risk_level}`
        );

        return {
          success: true,
          executionId: result.executionId,
          riskLevel: result.finalForecast.risk_level,
          totalDurationMs: result.totalDurationMs,
          totalTokensUsed: result.totalTokensUsed,
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

