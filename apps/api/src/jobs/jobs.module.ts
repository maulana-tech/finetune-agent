import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'scrape-map',
    }),
    BullModule.registerQueue({
      name: 'orchestrated-ai-queue',
    }),
    BullModule.registerQueue({
      name: 'finance-simulation-queue',
    }),
    BullModule.registerQueue({
      name: 'market-analysis-queue',
    }),
    BullModule.registerQueue({
      name: 'market-scrape-queue',
    }),
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
