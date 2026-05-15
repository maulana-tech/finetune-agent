import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces';

export const marketReports = pgTable('market_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  query: text('query').notNull(),
  content: jsonb('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
