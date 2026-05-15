import {
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  date,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces';

/**
 * Transaction type — mirrors fiswarm's income/expense/invoice categorization.
 * Drives both the bookkeeping view and the data seed fed to the multi-agent
 * finance simulation.
 */
export const transactionTypeEnum = pgEnum('transaction_type', [
  'income',
  'expense',
  'invoice',
]);

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id),

  type: transactionTypeEnum('type').notNull(),
  category: text('category').notNull(),
  description: text('description'),

  // numeric(15, 2) — up to 13 integer digits, 2 decimals
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('IDR'),

  txDate: date('tx_date').notNull(),
  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
