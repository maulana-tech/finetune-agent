import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ScrapeSchedulesService,
  type CreateScheduleDto,
  type UpdateScheduleDto,
} from './scrape-schedules.service';

@Controller('scrape-schedules')
export class ScrapeSchedulesController {
  constructor(private readonly service: ScrapeSchedulesService) {}

  @Get()
  list(@Query('workspaceId') workspaceId: string) {
    return this.service.list(workspaceId);
  }

  @Post()
  create(@Body() dto: CreateScheduleDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.service.update(id, workspaceId, dto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.service.delete(id, workspaceId);
  }

  @Post(':id/run-now')
  runNow(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.service.runNow(id, workspaceId);
  }
}
