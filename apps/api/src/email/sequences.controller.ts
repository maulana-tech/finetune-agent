import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { SequencesService } from './sequences.service';

@Controller('email/sequences')
export class SequencesController {
  constructor(private readonly sequences: SequencesService) {}

  @Get()
  list(@Query('workspaceId') workspaceId: string) {
    return this.sequences.list(workspaceId);
  }

  @Get(':id')
  getById(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.sequences.getById(id, workspaceId);
  }

  @Post()
  create(
    @Body()
    body: {
      name: string;
      description?: string;
      steps: Array<{
        day: number;
        templateId: string;
        condition?: 'always' | 'not_opened' | 'opened_no_reply' | 'not_replied';
      }>;
    },
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.sequences.create(body, workspaceId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      steps?: Array<{
        day: number;
        templateId: string;
        condition?: 'always' | 'not_opened' | 'opened_no_reply' | 'not_replied';
      }>;
    },
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.sequences.update(id, body, workspaceId);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.sequences.delete(id, workspaceId);
  }

  @Post(':id/enroll')
  enrollLead(
    @Param('id') sequenceId: string,
    @Body() body: { leadId: string },
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.sequences.enrollLead(sequenceId, body.leadId, workspaceId);
  }

  @Get(':id/enrollments')
  getEnrollments(
    @Param('id') sequenceId: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.sequences.getEnrollments(sequenceId, workspaceId);
  }

  @Post('enrollments/:enrollmentId/pause')
  pauseEnrollment(
    @Param('enrollmentId') enrollmentId: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.sequences.pauseEnrollment(enrollmentId, workspaceId);
  }

  @Post('enrollments/:enrollmentId/resume')
  resumeEnrollment(
    @Param('enrollmentId') enrollmentId: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.sequences.resumeEnrollment(enrollmentId, workspaceId);
  }

  @Post('process-due-steps')
  processDueSteps() {
    return this.sequences.processDueSteps();
  }
}
