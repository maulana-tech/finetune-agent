import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  MarketService,
  type CreateMarketAnalysisDto,
  type CreateMarketDataDto,
  type RunMarketScrapeDto,
} from './market.service';

@Controller('market')
export class MarketController {
  constructor(private readonly market: MarketService) {}

  // ============ Market data ============

  @Post('data')
  createMarketData(@Body() dto: CreateMarketDataDto) {
    return this.market.createMarketData(dto);
  }

  @Get('data')
  listMarketData(@Query('workspaceId') workspaceId: string) {
    return this.market.listMarketData(workspaceId);
  }

  @Delete('data/:id')
  deleteMarketData(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.market.deleteMarketData(id, workspaceId);
  }

  // ============ Scrape ============

  @Post('scrape')
  runScrape(@Body() dto: RunMarketScrapeDto) {
    return this.market.runScrape(dto);
  }

  // ============ Analyses ============

  @Post('analyses')
  createAnalysis(@Body() dto: CreateMarketAnalysisDto) {
    return this.market.createMarketAnalysis(dto);
  }

  @Get('analyses')
  listAnalyses(@Query('workspaceId') workspaceId: string) {
    return this.market.listMarketAnalyses(workspaceId);
  }

  @Get('analyses/:id')
  getAnalysis(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.market.getMarketAnalysis(id, workspaceId);
  }
}
