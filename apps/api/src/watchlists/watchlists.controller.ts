import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, ServiceUnavailableException } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { groceryApi } from '../demo-data.js';
import { WatchlistsService } from './watchlists.service.js';

const allowedWatchlistPriceTypes = ['shelf', 'member', 'promotion', 'counter_meat', 'counter_deli', 'counter_fish', 'estimated'] as const;

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

class WatchlistPriceAlertDto {
  @IsString()
  productId!: string;

  @IsNumber()
  @Min(0)
  targetPrice!: number;

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
  constructor(private readonly watchlists: WatchlistsService) {}

  @Get()
  @ApiOkResponse({ description: 'Demo user watchlist' })
  async list() {
    if (this.watchlists.isConfigured()) return this.watchlists.list('demo');
    return groceryApi.getWatchlist('demo');
  }

  @Post()
  @ApiCreatedResponse({ description: 'Watchlist item created' })
  async create(@Body() body: WatchlistItemDto) {
    const item = { ...body, favoriteStoresOnly: body.favoriteStoresOnly ?? false };
    if (this.watchlists.isConfigured()) {
      try {
        return await this.watchlists.create('demo', item);
      } catch (error) {
        asProductNotFound(error);
      }
    }
    groceryApi.addWatchlistItem('demo', item);
    return item;
  }

  @Get('price-alerts')
  @ApiOkResponse({ description: 'Active real watchlist target-price alerts for the demo user' })
  async priceAlerts() {
    if (!this.watchlists.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required for real watchlist price-alert data.');
    }
    return this.watchlists.priceAlerts('demo');
  }

  @Post('price-alerts')
  @ApiCreatedResponse({ description: 'Watchlist target-price alert created' })
  async createPriceAlert(@Body() body: WatchlistPriceAlertDto) {
    try {
      if (!this.watchlists.isConfigured()) {
        throw new ServiceUnavailableException('DATABASE_URL is required for real watchlist price-alert data.');
      }
      const report = await this.watchlists.createPriceAlert('demo', {
        productId: body.productId,
        targetPrice: body.targetPrice,
        favoriteStoresOnly: body.favoriteStoresOnly,
        allowedPriceTypes: body.allowedPriceTypes
      });
      return report;
    } catch (error) {
      asProductNotFound(error);
    }
  }

  @Patch(':productId')
  @ApiOkResponse({ description: 'Watchlist item updated' })
  async update(@Param('productId') productId: string, @Body() body: WatchlistPatchDto) {
    try {
      if (this.watchlists.isConfigured()) {
        const watchlist = await this.watchlists.update('demo', productId, body);
        return { productId, item: watchlist.items.find((item) => item.productId === productId), watchlist };
      }
      groceryApi.updateWatchlistItem('demo', productId, body);
      const watchlist = groceryApi.getWatchlist('demo');
      return { productId, item: watchlist.items.find((item) => item.productId === productId), watchlist, demo: true };
    } catch (error) {
      asProductNotFound(error);
    }
  }

  @Delete(':productId')
  @ApiOkResponse({ description: 'Watchlist item removed' })
  async remove(@Param('productId') productId: string) {
    try {
      if (this.watchlists.isConfigured()) {
        const result = await this.watchlists.remove('demo', productId);
        return { productId, ...result };
      }
      const result = groceryApi.removeWatchlistItem('demo', productId);
      return { productId, ...result, watchlist: groceryApi.getWatchlist('demo'), demo: true };
    } catch (error) {
      asProductNotFound(error);
    }
  }
}
