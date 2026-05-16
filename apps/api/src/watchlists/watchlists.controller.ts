import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class WatchlistItemDto {
  id!: string;
  productSlug!: string;
  targetPriceAmount!: number | null;
  currency!: 'SEK';
  demo!: true;
}

export class CreateWatchlistItemDto {
  @IsString()
  productSlug!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetPriceAmount?: number;
}

const WATCHLIST: WatchlistItemDto[] = [
  {
    id: 'demo-watch-zoegas',
    productSlug: 'zoegas-skane-mellanrost-450g',
    targetPriceAmount: 45,
    currency: 'SEK',
    demo: true,
  },
];

@Controller('me/watchlist')
@ApiTags('watchlists')
export class WatchlistsController {
  @Get()
  @ApiOperation({ summary: 'List demo watchlist items for the current user' })
  @ApiOkResponse({ type: WatchlistItemDto, isArray: true })
  listWatchlist(): WatchlistItemDto[] {
    return WATCHLIST;
  }

  @Post()
  @ApiOperation({ summary: 'Create a demo watchlist item placeholder' })
  @ApiCreatedResponse({ type: WatchlistItemDto })
  createWatchlistItem(@Body() body: CreateWatchlistItemDto): WatchlistItemDto {
    return {
      id: `demo-watch-${body.productSlug}`,
      productSlug: body.productSlug,
      targetPriceAmount: body.targetPriceAmount ?? null,
      currency: 'SEK',
      demo: true,
    };
  }
}
