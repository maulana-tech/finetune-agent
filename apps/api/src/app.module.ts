import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobsModule } from './jobs/jobs.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { FinanceModule } from './finance/finance.module';
import { MarketModule } from './market/market.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
    }),
    JobsModule,
    WorkflowsModule,
    FinanceModule,
    MarketModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
