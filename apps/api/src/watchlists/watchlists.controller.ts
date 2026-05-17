import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import type { WatchlistItem } from '@groceryview/api-contracts';

export class CreateWatchlistItemDto {
  @IsString()
  productSlug!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetPrice?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class WatchlistItemResponse implements WatchlistItem {
  id!: string;
  productSlug!: string;
  productName!: string;
  targetPrice!: number | null;
  currency!: 'SEK';
  currentBestPrice!: number;
  alertEnabled!: boolean;
  demo!: true;
}

const DEMO_WATCHLIST: WatchlistItemResponse[] = [
  {
    id: 'demo-watch-zoegas-skane-450g',
    productSlug: 'zoegas-skane-mellanrost-450g',
    productName: 'Zoégas Skåne Mellanrost 450g',
    targetPrice: 50,
    currency: 'SEK',
    currentBestPrice: 49.9,
    alertEnabled: true,
    demo: true,
  },
];

@ApiTags('watchlists')
@Controller('me/watchlist')
export class WatchlistsController {
  @Get()
  @ApiOkResponse({ type: WatchlistItemResponse, isArray: true })
  findMine(): WatchlistItemResponse[] {
    return DEMO_WATCHLIST;
  }

  @Post()
  @ApiCreatedResponse({ type: WatchlistItemResponse })
  create(@Body() body: CreateWatchlistItemDto): WatchlistItemResponse {
    return {
      id: `demo-watch-${body.productSlug}`,
      productSlug: body.productSlug,
      productName: 'Seed/demo watched product',
      targetPrice: body.targetPrice ?? null,
      currency: 'SEK',
      currentBestPrice: 49.9,
      alertEnabled: true,
      demo: true,
    };
  }
}
