import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { groceryApi } from '../demo-data.js';

const allowedWatchlistPriceTypes = ['shelf', 'member', 'promotion', 'estimated'] as const;

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

  @IsOptional()
  @IsArray()
  @IsIn(allowedWatchlistPriceTypes, { each: true })
  allowedPriceTypes?: Array<(typeof allowedWatchlistPriceTypes)[number]>;
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
