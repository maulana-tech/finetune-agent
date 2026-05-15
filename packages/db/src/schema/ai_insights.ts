import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { leads } from './leads';

export const aiInsights = pgTable('ai_insights', {
  id: uuid('id').defaultRandom().primaryKey(),
  leadId: uuid('lead_id').notNull().references(() => leads.id),
  agentType: text('agent_type').notNull(), // finance, marketing
  content: jsonb('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
