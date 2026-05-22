import { Swarm } from '../run-loop';
import { agentRegistry } from '../registry';
import { createSwarmContext } from '../context';
import { SwarmRunResult } from '../types';
import '../agents/finsim-coordinator.swarm';
import '../agents/owner.swarm';
import '../agents/supplier.swarm';
import '../agents/customer.swarm';
import '../agents/bank.swarm';
import '../agents/finsim-synthesizer.swarm';

export interface FinanceSimulationSwarmInput {
  simulationId: string;
  workspaceId: string;
  scenario: {
    price_change_pct: number;
    hiring_delta: number;
    inventory_budget_monthly: number;
    market_growth_pct: number;
  };
  forecastMonths: number;
  seed: {
    monthsCovered: number;
    totalIncome: number;
    totalExpense: number;
    averageMonthlyIncome: number;
    averageMonthlyExpense: number;
    topIncomeCategories: { category: string; total: number }[];
    topExpenseCategories: { category: string; total: number }[];
    transactionCount: number;
  };
}

/**
 * Finance Simulation Swarm
 *
 * Topology:
 *   finsim-coordinator
 *     ↓ _parallel fan-out
 *   [owner ∥ supplier ∥ customer ∥ bank]   (4 agents, concurrent)
 *     ↓ all complete
 *   finsim-synthesizer                      (terminal)
 */
export async function runFinanceSimulationSwarm(
  input: FinanceSimulationSwarmInput,
): Promise<SwarmRunResult> {
  const context = createSwarmContext({
    workspaceId: input.workspaceId,
    simulationId: input.simulationId,
    initialData: {
      scenario: input.scenario,
      forecastMonths: input.forecastMonths,
      seed: input.seed,
    },
  });

  const swarm = new Swarm(agentRegistry);
  return swarm.run('finsim-coordinator', context);
}
