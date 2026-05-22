import { Module } from '@nestjs/common';
import { ScrapeSchedulesController } from './scrape-schedules.controller';
import { ScrapeSchedulesService } from './scrape-schedules.service';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [JobsModule],
  controllers: [ScrapeSchedulesController],
  providers: [ScrapeSchedulesService],
})
export class ScrapeSchedulesModule {}
