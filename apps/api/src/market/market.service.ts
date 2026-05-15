import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import {
  db,
  marketAnalyses,
  marketData,
  agentLogs,
  type NewMarketData,
  type MarketAnalysisScenarioParams,
} from '@repo/db';
import { JobsService } from '../jobs/jobs.service';

export interface CreateMarketAnalysisDto {
  workspaceId: string;
  title: string;
  scenarioParams: MarketAnalysisScenarioParams;
}

export interface CreateMarketDataDto {
  workspaceId: string;
  source: 'google_maps' | 'web_scrape' | 'manual' | 'news_feed' | 'social';
  dataType:
    | 'competitor_listing'
    | 'pricing_signal'
    | 'industry_news'
    | 'trend_signal'
    | 'demand_signal'
    | 'regulatory';
  url?: string;
  title?: string;
  payload: Record<string, unknown>;
  industry?: string;
  region?: string;
}

export interface RunMarketScrapeDto {
  workspaceId: string;
  industry: string;
  region: string;
  limit?: number;
}

@Injectable()
export class MarketService {
  constructor(private readonly jobsService: JobsService) {}

  // ============ Market data ============

  async createMarketData(dto: CreateMarketDataDto) {
    const value: NewMarketData = {
      workspaceId: dto.workspaceId,
      source: dto.source,
      dataType: dto.dataType,
      url: dto.url ?? null,
      title: dto.title ?? null,
      payload: dto.payload,
      industry: dto.industry ?? null,
      region: dto.region ?? null,
    };
    const [row] = await db.insert(marketData).values(value).returning();
    return row;
  }

  async listMarketData(workspaceId: string) {
    return db
      .select()
      .from(marketData)
      .where(eq(marketData.workspaceId, workspaceId))
      .orderBy(desc(marketData.scrapedAt));
  }

  async deleteMarketData(id: string, workspaceId: string) {
    const result = await db
      .delete(marketData)
      .where(and(eq(marketData.id, id), eq(marketData.workspaceId, workspaceId)))
      .returning();
    if (result.length === 0) {
      throw new NotFoundException(`market_data ${id} not found`);
    }
    return { deleted: true };
  }

  // ============ Scrape trigger ============

  async runScrape(dto: RunMarketScrapeDto) {
    return this.jobsService.queueMarketScrape({
      workspaceId: dto.workspaceId,
      industry: dto.industry,
      region: dto.region,
      limit: dto.limit ?? 10,
    });
  }

  // ============ Market analyses ============

  /**
   * Creates a 'pending' market_analyses row, then enqueues a worker job.
   * Worker will run the 5-agent pipeline and flip status to 'completed' / 'failed'.
   */
  async createMarketAnalysis(dto: CreateMarketAnalysisDto) {
    const [row] = await db
      .insert(marketAnalyses)
      .values({
        workspaceId: dto.workspaceId,
        title: dto.title,
        executionId: crypto.randomUUID(),
        scenarioParams: dto.scenarioParams,
        status: 'pending',
      })
      .returning();

    const { jobId } = await this.jobsService.queueMarketAnalysis({
      marketAnalysisId: row.id,
      workspaceId: row.workspaceId,
    });

    return { analysis: row, jobId };
  }

  async listMarketAnalyses(workspaceId: string) {
    return db
      .select()
      .from(marketAnalyses)
      .where(eq(marketAnalyses.workspaceId, workspaceId))
      .orderBy(desc(marketAnalyses.createdAt));
  }

  async getMarketAnalysis(id: string, workspaceId: string) {
    const [analysis] = await db
      .select()
      .from(marketAnalyses)
      .where(
        and(
          eq(marketAnalyses.id, id),
          eq(marketAnalyses.workspaceId, workspaceId),
        ),
      )
      .limit(1);

    if (!analysis) {
      throw new NotFoundException(`Market analysis ${id} not found`);
    }

    const logs = await db
      .select()
      .from(agentLogs)
      .where(eq(agentLogs.marketAnalysisId, id))
      .orderBy(agentLogs.stepNumber, agentLogs.createdAt);

    return { analysis, agentLogs: logs };
  }
}
