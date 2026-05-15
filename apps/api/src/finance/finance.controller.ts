import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  FinanceService,
  type CreateTransactionDto,
  type CreateSimulationDto,
} from './finance.service';

@Controller('finance')
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  // ============ Transactions ============

  @Post('transactions')
  createTransaction(@Body() dto: CreateTransactionDto) {
    return this.finance.createTransaction(dto);
  }

  @Get('transactions')
  listTransactions(@Query('workspaceId') workspaceId: string) {
    return this.finance.listTransactions(workspaceId);
  }

  @Delete('transactions/:id')
  deleteTransaction(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.finance.deleteTransaction(id, workspaceId);
  }

  @Post('transactions/import')
  @UseInterceptors(FileInterceptor('file'))
  async importTransactions(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('workspaceId') workspaceId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded (expected multipart field "file")');
    }
    if (!workspaceId) {
      throw new BadRequestException('Missing workspaceId field');
    }
    return this.finance.importTransactionsFromCsv(
      workspaceId,
      file.buffer.toString('utf-8'),
    );
  }

  // ============ Simulations ============

  @Post('simulations')
  createSimulation(@Body() dto: CreateSimulationDto) {
    return this.finance.createSimulation(dto);
  }

  @Get('simulations')
  listSimulations(@Query('workspaceId') workspaceId: string) {
    return this.finance.listSimulations(workspaceId);
  }

  @Get('simulations/:id')
  getSimulation(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.finance.getSimulation(id, workspaceId);
  }
}
