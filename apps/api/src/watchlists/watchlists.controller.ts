import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { groceryApi } from '../demo-data.js';

class WatchlistItemDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  alertDealScoreAt?: number;

  @IsOptional()
  @IsBoolean()
  favoriteStoresOnly = false;
}

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
  create(@Body() body: WatchlistItemDto) {
    const item = { ...body, favoriteStoresOnly: body.favoriteStoresOnly ?? false };
    groceryApi.addWatchlistItem('demo', item);
    return item;
  }
}
