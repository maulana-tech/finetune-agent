import { Controller, Post, Body } from '@nestjs/common';
import { JobsService } from './jobs.service';
import type { ScrapeJobPayload } from '@repo/shared';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('scrape')
  async startScrape(@Body() payload: ScrapeJobPayload) {
    return this.jobsService.queueMapScrape(payload);
  }
}
