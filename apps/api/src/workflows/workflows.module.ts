import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WorkflowsService } from './workflows.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'ai-agent-queue' }),
  ],
  providers: [WorkflowsService],
})
export class WorkflowsModule {}
