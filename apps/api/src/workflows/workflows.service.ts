import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class WorkflowsService {
  constructor(@InjectQueue('ai-agent-queue') private aiQueue: Queue) {}

  async triggerAiAgent(taskType: string, payload: any) {
    return await this.aiQueue.add('agent-task', { taskType, payload });
  }
}
