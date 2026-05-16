import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AddWatchlistItemDto {
  @ApiProperty({ example: 'zoegas-skane-450g' })
  @IsString()
  productSlug!: string;

  @ApiProperty({ example: 'Notify below 50 SEK', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

interface WatchlistItemResponse {
  id: string;
  productSlug: string;
  productName: string;
  targetPrice: number;
  currency: 'SEK';
  lastSeenPrice: number;
  alertEnabled: boolean;
  dataStatus: 'seed_demo';
}

const demoWatchlist: WatchlistItemResponse[] = [
  {
    id: 'watch_zoegas_skane_450g',
    productSlug: 'zoegas-skane-450g',
    productName: 'Zoégas Skåne Mörkrost',
    targetPrice: 50,
    currency: 'SEK',
    lastSeenPrice: 49.9,
    alertEnabled: true,
    dataStatus: 'seed_demo',
  },
];

@Controller('me/watchlist')
@ApiTags('watchlists')
export class WatchlistsController {
  @Get()
  @ApiOperation({ summary: 'List the demo user watchlist' })
  listWatchlist(): WatchlistItemResponse[] {
    return demoWatchlist;
  }

  @Post()
  @ApiOperation({ summary: 'Preview adding a product to the demo watchlist' })
  addWatchlistItem(@Body() body: AddWatchlistItemDto): WatchlistItemResponse {
    return {
      id: `watch_${body.productSlug.replaceAll('-', '_')}`,
      productSlug: body.productSlug,
      productName: body.productSlug,
      targetPrice: 0,
      currency: 'SEK',
      lastSeenPrice: 0,
      alertEnabled: false,
      dataStatus: 'seed_demo',
    };
  }
}
