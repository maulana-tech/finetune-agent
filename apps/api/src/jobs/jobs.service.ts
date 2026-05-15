import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ScrapeJobPayload } from '@repo/shared';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('scrape-map') private scrapeQueue: Queue,
    @InjectQueue('orchestrated-ai-queue') private orchestratedAiQueue: Queue,
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
}
