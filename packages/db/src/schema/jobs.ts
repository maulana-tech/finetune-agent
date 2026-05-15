import { pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces';

export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  type: text('type').notNull().default('map-scrape'),
  query: text('query').notNull(),
  status: text('status').notNull().default('pending'), // pending, processing, completed, failed
  resultCount: integer('result_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
