import { Module } from '@nestjs/common';
import { SmtpService } from './smtp.service';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { SequencesService } from './sequences.service';
import { SequencesController } from './sequences.controller';

@Module({
  controllers: [TemplatesController, SequencesController],
  providers: [SmtpService, TemplatesService, SequencesService],
  exports: [SmtpService, TemplatesService, SequencesService],
})
export class EmailModule {}
