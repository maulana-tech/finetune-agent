import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { leads } from './leads';
import { workspaces } from './workspaces';

export const leadNotes = pgTable('lead_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  leadId: uuid('lead_id').notNull().references(() => leads.id),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  content: text('content').notNull(),
  author: text('author').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
