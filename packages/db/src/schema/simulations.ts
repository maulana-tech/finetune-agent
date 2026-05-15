import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces';

export const simulationStatusEnum = pgEnum('simulation_status', [
  'pending',
  'running',
  'completed',
  'failed',
]);

export const simulationRiskLevelEnum = pgEnum('simulation_risk_level', [
  'low',
  'medium',
  'high',
  'critical',
]);

/**
 * Cashflow forecast point — one entry per forecasted month.
 * Stored inside `cashflowForecast` JSONB.
 */
export interface CashflowForecastPoint {
  month: string; // ISO yyyy-mm
  projectedIncome: number;
  projectedExpense: number;
  projectedNet: number;
}

/**
 * Scenario parameters that drive the simulation — mirrors fiswarm's 4 sliders.
 * Stored inside `scenarioParams` JSONB.
 *
 * Field names use snake_case to match the Zod schema in `@repo/ai`
 * (`FinanceScenarioSchema`). This keeps the data shape identical end-to-end:
 * API DTO → DB row → orchestrator input → LLM prompt.
 */
export interface SimulationScenarioParams {
  price_change_pct: number; // -30 to +50
  hiring_delta: number; // 0 to 10 (employees)
  inventory_budget_monthly: number; // IDR
  market_growth_pct: number; // -20 to +30
}

export const simulations = pgTable('simulations', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id),

  title: text('title').notNull(),
  executionId: uuid('execution_id').notNull(),

  scenarioParams: jsonb('scenario_params')
    .$type<SimulationScenarioParams>()
    .notNull(),
  forecastMonths: integer('forecast_months').notNull(), // 1, 2, 3, or 6
  dataSeedMonths: integer('data_seed_months').notNull().default(6),

  status: simulationStatusEnum('status').notNull().default('pending'),

  // Result fields — filled by Synthesizer after all 4 stakeholder agents complete
  cashflowForecast: jsonb('cashflow_forecast').$type<CashflowForecastPoint[]>(),
  riskLevel: simulationRiskLevelEnum('risk_level'),
  summary: text('summary'),
  finalReasoning: text('final_reasoning'),
  confidence: integer('confidence'), // 0-100, from synthesizer

  // Metrics
  totalDurationMs: integer('total_duration_ms'),
  totalTokensUsed: integer('total_tokens_used'),

  errorMessage: text('error_message'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export type Simulation = typeof simulations.$inferSelect;
export type NewSimulation = typeof simulations.$inferInsert;
