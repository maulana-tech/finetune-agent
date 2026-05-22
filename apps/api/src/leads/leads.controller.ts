import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  list(@Query('workspaceId') workspaceId: string) {
    return this.leads.list(workspaceId);
  }

  @Get('scores')
  scores(@Query('workspaceId') workspaceId: string) {
    return this.leads.scores(workspaceId);
  }

  @Get('search')
  search(
    @Query('workspaceId') workspaceId: string,
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ) {
    return this.leads.search(workspaceId, q ?? '', limit ? parseInt(limit, 10) : 20);
  }

  @Get(':id')
  getById(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.leads.getById(id, workspaceId);
  }

  @Post(':id/analyze')
  analyze(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.leads.analyze(id, workspaceId);
  }

  @Post(':id/email')
  generateEmail(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.leads.generateEmail(id, workspaceId);
  }

  @Get(':id/insights')
  getInsights(@Param('id') id: string) {
    return this.leads.getInsights(id);
  }

  @Get(':id/notes')
  getNotes(@Param('id') id: string) {
    return this.leads.getNotes(id);
  }

  @Post(':id/notes')
  addNote(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() body: { content: string; author: string },
  ) {
    return this.leads.addNote(id, workspaceId, body.content, body.author);
  }

  @Delete('note/:noteId')
  deleteNote(
    @Param('noteId') noteId: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.leads.deleteNote(noteId, workspaceId);
  }

  @Post()
  create(
    @Body() body: any,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.leads.create(body, workspaceId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: any,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.leads.update(id, body, workspaceId);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.leads.delete(id, workspaceId);
  }
}
