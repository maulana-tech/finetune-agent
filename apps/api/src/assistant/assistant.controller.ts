import { Controller, Post, Body, Query } from '@nestjs/common';
import { AssistantService } from './assistant.service';

@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Post('chat')
  chat(
    @Body() body: { question: string },
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.assistant.chat(body.question, workspaceId);
  }
}
