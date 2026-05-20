import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { WatchlistItem } from '@groceryview/api-contracts';
import { demoWatchlist } from '../demo-data';
import { parseWatchlistItemBody } from '../request-validation';

@ApiTags('watchlists')
@Controller('me/watchlist')
export class WatchlistsController {
  @Get()
  @ApiOkResponse({ description: 'Demo user watchlist.' })
  getWatchlist() {
    return demoWatchlist;
  }

  @Post()
  @ApiCreatedResponse({ description: 'Demo watchlist item echo.' })
  createWatchlistItem(@Body() body: unknown): WatchlistItem {
    const item = parseWatchlistItemBody(body);
    return {
      productSlug: item.productSlug,
      targetPrice: item.targetPrice ?? 0,
      alertEnabled: true,
      demo: true,
    };
  }
}
