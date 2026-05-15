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

export const marketAnalysisStatusEnum = pgEnum('market_analysis_status', [
  'pending',
  'running',
  'completed',
  'failed',
]);

export const marketAnalysisRiskLevelEnum = pgEnum('market_analysis_risk_level', [
  'low',
  'medium',
  'high',
  'critical',
]);

/**
 * Scenario inputs that drive a market analysis run — mirrors the
 * Zod `MarketScenarioSchema` in @repo/ai. Field names use snake_case
 * to match prompt-level conventions.
 */
export interface MarketAnalysisScenarioParams {
  industry: string;
  region: string;
  target_segment: string;
  competitor_focus: 'pricing' | 'product' | 'positioning' | 'all';
  time_horizon_months: number;
}

/**
 * Final shape of the synthesizer output stored back on the row.
 */
export interface MarketAnalysisResult {
  opportunity_score: number; // 0-100
  positioning_recommendation: string;
  top_opportunities: string[];
  top_threats: string[];
  primary_drivers: string[];
}

/**
 * Header row per market-analysis run. Per-agent reasoning lives in
 * `agent_logs` (linked via `marketAnalysisId`).
 */
export const marketAnalyses = pgTable('market_analyses', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),

  title: text('title').notNull(),
  executionId: uuid('execution_id').notNull(),

  scenarioParams: jsonb('scenario_params')
    .$type<MarketAnalysisScenarioParams>()
    .notNull(),
  dataSeedSize: integer('data_seed_size').notNull().default(0), // how many market_data rows fed in

  status: marketAnalysisStatusEnum('status').notNull().default('pending'),

  // Result fields — filled by Synthesizer
  result: jsonb('result').$type<MarketAnalysisResult>(),
  riskLevel: marketAnalysisRiskLevelEnum('risk_level'),
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

export type MarketAnalysis = typeof marketAnalyses.$inferSelect;
export type NewMarketAnalysis = typeof marketAnalyses.$inferInsert;
