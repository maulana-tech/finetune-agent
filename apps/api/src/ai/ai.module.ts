import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'orchestrated-ai-queue',
    }),
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
