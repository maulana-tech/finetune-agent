import { Controller, Post, Param, Query } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze/:leadId')
  async analyzeLead(
    @Param('leadId') leadId: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.aiService.analyzeLead(leadId, workspaceId);
  }
}
