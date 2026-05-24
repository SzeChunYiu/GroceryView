import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';
import { validateBody } from '../middleware/validate.js';
import { type WatchlistItemInput, watchlistItemSchema } from '../routes/alerts.js';

@ApiTags('watchlists')
@Controller('users/demo/watchlist')
export class WatchlistsController {
  @Get()
  @ApiOkResponse({ description: 'Demo user watchlist' })
  list() {
    return groceryApi.getWatchlist('demo');
  }

  @Post()
  @ApiCreatedResponse({ description: 'Watchlist item created' })
  create(@Body(validateBody(watchlistItemSchema)) body: WatchlistItemInput) {
    const item = { ...body, favoriteStoresOnly: body.favoriteStoresOnly ?? false };
    groceryApi.addWatchlistItem('demo', item);
    return item;
  }
}
