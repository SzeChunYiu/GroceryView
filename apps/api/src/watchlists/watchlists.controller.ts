import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('watchlists')
@Controller('watchlists')
export class WatchlistsController {
  @Get()
  @ApiOkResponse({ description: 'List a user watchlist.' })
  getWatchlist(@Query('userId') userId: string) {
    return { userId, items: [] };
  }

  @Post()
  @ApiCreatedResponse({ description: 'Add a product to a user watchlist.' })
  addWatchlistItem(@Body() body: Record<string, unknown>) {
    return { accepted: true, item: body };
  }
}
