import { pgTable, text, timestamp, uuid, jsonb, integer } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces';
import { leads } from './leads';
import { emailTemplates } from './email_templates';

export const emailSequences = pgTable('email_sequences', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),

  name: text('name').notNull(),
  description: text('description'),

  // Sequence steps: [{ day: 0, templateId: '...', condition: 'always' }, { day: 3, templateId: '...', condition: 'not_opened' }]
  steps: jsonb('steps').$type<Array<{
    day: number;
    templateId: string;
    condition?: 'always' | 'not_opened' | 'opened_no_reply' | 'not_replied';
  }>>(),

  active: text('active').notNull().default('true'), // 'true' or 'false' as text

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sequenceEnrollments = pgTable('sequence_enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  sequenceId: uuid('sequence_id').notNull().references(() => emailSequences.id),
  leadId: uuid('lead_id').notNull().references(() => leads.id),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),

  currentStep: integer('current_step').notNull().default(0),
  status: text('status').notNull().default('active'), // active, paused, completed

  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});
