import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { WebhooksController } from './webhooks.controller';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { SequencesService } from './sequences.service';
import { SequencesController } from './sequences.controller';

@Module({
  controllers: [WebhooksController, TemplatesController, SequencesController],
  providers: [EmailService, TemplatesService, SequencesService],
  exports: [EmailService, TemplatesService, SequencesService],
})
export class EmailModule {}
