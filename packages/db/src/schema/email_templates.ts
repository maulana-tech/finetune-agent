import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces';

export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),

  name: text('name').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),

  // Template variables that can be replaced (e.g., ["company_name", "industry", "owner_name"])
  variables: jsonb('variables').$type<string[]>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
