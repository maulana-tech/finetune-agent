import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces';
import { leads } from './leads';

export const emailOutreach = pgTable('email_outreach', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  leadId: uuid('lead_id').notNull().references(() => leads.id),

  // Email details
  fromEmail: text('from_email').notNull(),
  toEmail: text('to_email').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),

  // Delivery tracking
  status: text('status').notNull().default('draft'), // draft, queued, sent, delivered, bounced, failed

  // Engagement tracking (from Resend webhooks)
  openedAt: timestamp('opened_at'),
  clickedAt: timestamp('clicked_at'),
  repliedAt: timestamp('replied_at'),

  // Metadata
  resendEmailId: text('resend_email_id'), // For webhook matching
  errorMessage: text('error_message'),

  // Scheduling
  scheduledFor: timestamp('scheduled_for'), // When to send (null = send immediately)

  createdAt: timestamp('created_at').defaultNow().notNull(),
  sentAt: timestamp('sent_at'),
});
