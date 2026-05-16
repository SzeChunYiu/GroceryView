import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class WeeklyBasketItemResponse {
  id!: string;
  productSlug!: string;
  productName!: string;
  quantity!: number;
  unit!: string;
  bestPrice!: number;
  bestStoreSlug!: string;
  currency!: 'SEK';
  demo!: true;
}

export class WeeklyBasketResponse {
  id!: string;
  weekStartsOn!: string;
  currency!: 'SEK';
  estimatedTotal!: number;
  savingsVsMedian!: number;
  items!: WeeklyBasketItemResponse[];
  demo!: true;
}

export class AddWeeklyBasketItemDto {
  @IsString()
  productSlug!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

const DEMO_BASKET: WeeklyBasketResponse = {
  id: 'demo-weekly-basket-current',
  weekStartsOn: '2026-05-18',
  currency: 'SEK',
  estimatedTotal: 67.4,
  savingsVsMedian: 12.5,
  items: [
    {
      id: 'demo-basket-item-zoegas',
      productSlug: 'zoegas-skane-mellanrost-450g',
      productName: 'Zoégas Skåne Mellanrost 450g',
      quantity: 1,
      unit: 'package',
      bestPrice: 49.9,
      bestStoreSlug: 'willys-odenplan',
      currency: 'SEK',
      demo: true,
    },
    {
      id: 'demo-basket-item-oatly',
      productSlug: 'oatly-ikaffe-1l',
      productName: 'Oatly iKaffe 1L',
      quantity: 1,
      unit: 'liter',
      bestPrice: 17.5,
      bestStoreSlug: 'ica-kvantum-liljeholmen',
      currency: 'SEK',
      demo: true,
    },
  ],
  demo: true,
};

@ApiTags('baskets')
@Controller('me/weekly-basket')
export class BasketsController {
  @Get()
  @ApiOkResponse({ type: WeeklyBasketResponse })
  findCurrent(): WeeklyBasketResponse {
    return DEMO_BASKET;
  }

  @Post('items')
  @ApiCreatedResponse({ type: WeeklyBasketItemResponse })
  addItem(@Body() body: AddWeeklyBasketItemDto): WeeklyBasketItemResponse {
    return {
      id: `demo-basket-item-${body.productSlug}`,
      productSlug: body.productSlug,
      productName: 'Seed/demo basket product',
      quantity: body.quantity ?? 1,
      unit: 'package',
      bestPrice: 49.9,
      bestStoreSlug: 'willys-odenplan',
      currency: 'SEK',
      demo: true,
    };
  }
}
