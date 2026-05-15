import { pgTable, text, timestamp, uuid, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces';

/**
 * Source of a market_data point. Drives which scraper / pipeline produced it
 * and helps agents reason about reliability.
 */
export const marketDataSourceEnum = pgEnum('market_data_source', [
  'google_maps',
  'web_scrape',
  'manual',
  'news_feed',
  'social',
]);

/**
 * Type tag attached to each scraped record so agents can filter / weight
 * payloads by what they represent.
 */
export const marketDataTypeEnum = pgEnum('market_data_type', [
  'competitor_listing',
  'pricing_signal',
  'industry_news',
  'trend_signal',
  'demand_signal',
  'regulatory',
]);

/**
 * Raw market intelligence records. Populated by the market scraper worker
 * (or seeded manually). Consumed by the market-analysis multi-agent pipeline
 * as its data seed.
 */
export const marketData = pgTable('market_data', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),

  source: marketDataSourceEnum('source').notNull(),
  dataType: marketDataTypeEnum('data_type').notNull(),

  // Where the record came from
  url: text('url'),
  title: text('title'),

  // Full structured payload — shape depends on dataType
  payload: jsonb('payload').notNull(),

  // Optional categorisation
  industry: text('industry'),
  region: text('region'),

  scrapedAt: timestamp('scraped_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type MarketData = typeof marketData.$inferSelect;
export type NewMarketData = typeof marketData.$inferInsert;
