import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  ScrapeJobPayload,
  FinanceSimulationJobPayload,
  MarketAnalysisJobPayload,
  MarketScrapeJobPayload,
} from '@repo/shared';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('scrape-map') private scrapeQueue: Queue,
    @InjectQueue('orchestrated-ai-queue') private orchestratedAiQueue: Queue,
    @InjectQueue('finance-simulation-queue') private financeSimulationQueue: Queue,
    @InjectQueue('market-analysis-queue') private marketAnalysisQueue: Queue,
    @InjectQueue('market-scrape-queue') private marketScrapeQueue: Queue,
  ) {}

  async queueMapScrape(payload: ScrapeJobPayload) {
    const job = await this.scrapeQueue.add('map-scrape-job', payload);
    return { jobId: job.id };
  }

  async queueOrchestratedAI(payload: {
    leadId: string;
    workspaceId: string;
    rawText: string;
    ourProduct: string;
  }) {
    const job = await this.orchestratedAiQueue.add('orchestrated-workflow', payload);
    return { jobId: job.id };
  }

  async queueFinanceSimulation(payload: FinanceSimulationJobPayload) {
    const job = await this.financeSimulationQueue.add('finance-simulation', payload);
    return { jobId: job.id };
  }

  async queueMarketAnalysis(payload: MarketAnalysisJobPayload) {
    const job = await this.marketAnalysisQueue.add('market-analysis', payload);
    return { jobId: job.id };
  }

  async queueMarketScrape(payload: MarketScrapeJobPayload) {
    const job = await this.marketScrapeQueue.add('market-scrape-job', payload);
    return { jobId: job.id };
  }
}
