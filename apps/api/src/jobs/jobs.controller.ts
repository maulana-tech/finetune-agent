import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';
import type { ScrapeJobPayload } from '@repo/shared';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('scrape')
  async startScrape(@Body() payload: ScrapeJobPayload) {
    return this.jobsService.queueMapScrape(payload);
  }

  @Get()
  async getJobs(@Query('workspaceId') workspaceId: string) {
    return this.jobsService.getJobs(workspaceId);
  }
}
