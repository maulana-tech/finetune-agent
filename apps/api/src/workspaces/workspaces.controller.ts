import { Controller, Put, Param, Body } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.workspaces.update(id, body);
  }
}
