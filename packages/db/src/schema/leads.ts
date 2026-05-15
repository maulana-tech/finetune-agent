import { pgTable, text, timestamp, uuid, jsonb, doublePrecision } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces';

export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  name: text('name').notNull(),
  address: text('address'),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  phone: text('phone'),
  website: text('website'),
  category: text('category'),
  emails: jsonb('emails').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
