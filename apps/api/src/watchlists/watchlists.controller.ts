import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
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

class WatchlistPatchDto {
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
  favoriteStoresOnly?: boolean;

  @IsOptional()
  @IsArray()
  @IsIn(allowedWatchlistPriceTypes, { each: true })
  allowedPriceTypes?: Array<(typeof allowedWatchlistPriceTypes)[number]>;
}

function asProductNotFound(error: unknown) {
  if (error instanceof Error && /Unknown productId|Watchlist item not found/.test(error.message)) {
    throw new NotFoundException('Product not found');
  }
  throw error;
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

  @Patch(':productId')
  @ApiOkResponse({ description: 'Watchlist item updated' })
  update(@Param('productId') productId: string, @Body() body: WatchlistPatchDto) {
    try {
      groceryApi.updateWatchlistItem('demo', productId, body);
      const watchlist = groceryApi.getWatchlist('demo');
      return { productId, item: watchlist.items.find((item) => item.productId === productId), watchlist, demo: true };
    } catch (error) {
      asProductNotFound(error);
    }
  }

  @Delete(':productId')
  @ApiOkResponse({ description: 'Watchlist item removed' })
  remove(@Param('productId') productId: string) {
    try {
      const result = groceryApi.removeWatchlistItem('demo', productId);
      return { productId, ...result, watchlist: groceryApi.getWatchlist('demo'), demo: true };
    } catch (error) {
      asProductNotFound(error);
    }
  }
}
