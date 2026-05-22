import { Controller, Get, Query } from '@nestjs/common';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get('search')
  search(
    @Query('workspaceId') workspaceId: string,
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ) {
    return this.leads.search(workspaceId, q ?? '', limit ? parseInt(limit, 10) : 20);
  }
}
