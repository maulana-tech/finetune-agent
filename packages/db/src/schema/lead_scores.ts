import { pgTable, text, timestamp, uuid, integer, doublePrecision } from 'drizzle-orm/pg-core';
import { leads } from './leads';

export const leadScores = pgTable('lead_scores', {
  id: uuid('id').defaultRandom().primaryKey(),
  leadId: uuid('lead_id').notNull().references(() => leads.id).unique(),

  // Multi-agent derived scores
  qualityScore: integer('quality_score').notNull(), // 0-100, aggregated from all agents
  conversionProbability: doublePrecision('conversion_probability').notNull(), // 0.0 - 1.0
  estimatedValue: integer('estimated_value'), // in USD, predicted deal size
  priorityTier: text('priority_tier').notNull(), // A, B, C, D (based on aggregate analysis)

  // Contributing factors (from each agent)
  financialHealth: integer('financial_health'), // 0-100 from finance agent
  messagingFit: integer('messaging_fit'), // 0-100 from marketing agent
  strategicAlignment: integer('strategic_alignment'), // 0-100 from strategy agent

  // Business impact
  recommendedAction: text('recommended_action').notNull(), // "immediate_outreach", "nurture", "disqualify"
  reasoning: text('reasoning').notNull(), // why this score?

  computedAt: timestamp('computed_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
