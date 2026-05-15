import { FinanceSimulationContext } from '../../types';

/**
 * Renders the simulation context as a stable prompt block consumed by every
 * stakeholder agent. Keeping a single formatter ensures all agents reason over
 * an identical view of the scenario.
 */
export function renderScenarioBlock(ctx: FinanceSimulationContext): string {
  const { scenario, forecastMonths, seed } = ctx;
  return `SCENARIO PARAMETERS (user-defined):
- Price change: ${scenario.price_change_pct}%
- New hires this period: ${scenario.hiring_delta}
- Monthly inventory budget: IDR ${scenario.inventory_budget_monthly.toLocaleString('id-ID')}
- Expected market growth: ${scenario.market_growth_pct}%
- Forecast window: ${forecastMonths} month(s)

DATA SEED (historical, ${seed.monthsCovered} months, ${seed.transactionCount} transactions):
- Total income: IDR ${seed.totalIncome.toLocaleString('id-ID')}
- Total expense: IDR ${seed.totalExpense.toLocaleString('id-ID')}
- Avg monthly income: IDR ${seed.averageMonthlyIncome.toLocaleString('id-ID')}
- Avg monthly expense: IDR ${seed.averageMonthlyExpense.toLocaleString('id-ID')}
- Top income categories: ${
    seed.topIncomeCategories
      .map((c) => `${c.category} (IDR ${c.total.toLocaleString('id-ID')})`)
      .join(', ') || 'none recorded'
  }
- Top expense categories: ${
    seed.topExpenseCategories
      .map((c) => `${c.category} (IDR ${c.total.toLocaleString('id-ID')})`)
      .join(', ') || 'none recorded'
  }

EXECUTION CONTEXT:
- Execution ID: ${ctx.executionId}
- Simulation ID: ${ctx.simulationId}
- Workspace ID: ${ctx.workspaceId}`;
}

/**
 * Standard rules every stakeholder agent must follow. Keeps tone consistent
 * across the swarm and prevents buzzwords from leaking into reasoning logs.
 */
export const COMMON_RULES = `CRITICAL RULES:
1. Clinical, analytical tone — no buzzwords, no marketing speak.
2. Ground every claim in the scenario parameters or data seed above.
3. State concrete risks and opportunities — avoid vague phrasing.
4. Reasoning must be 2-4 sentences explaining HOW you arrived at the numbers.
5. Confidence (0-100) reflects how much the data seed supports your conclusion.`;
