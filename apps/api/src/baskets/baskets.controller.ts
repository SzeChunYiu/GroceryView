import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddWeeklyBasketItemDto {
  @ApiProperty({ example: 'zoegas-skane-450g' })
  @IsString()
  productSlug!: string;

  @ApiProperty({ example: 2, minimum: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

interface WeeklyBasketItemResponse {
  id: string;
  productSlug: string;
  productName: string;
  quantity: number;
  estimatedUnitPrice: number;
  currency: 'SEK';
}

interface WeeklyBasketResponse {
  id: string;
  weekStart: string;
  currency: 'SEK';
  selectedStoreSlugs: string[];
  estimatedTotal: number;
  items: WeeklyBasketItemResponse[];
  dataStatus: 'seed_demo';
}

const demoBasketItems: WeeklyBasketItemResponse[] = [
  {
    id: 'basket_item_zoegas',
    productSlug: 'zoegas-skane-450g',
    productName: 'Zoégas Skåne Mörkrost',
    quantity: 1,
    estimatedUnitPrice: 49.9,
    currency: 'SEK',
  },
  {
    id: 'basket_item_arla_milk',
    productSlug: 'arla-mellanmjolk-1l',
    productName: 'Arla Mellanmjölk',
    quantity: 2,
    estimatedUnitPrice: 14.5,
    currency: 'SEK',
  },
];

@Controller('me/weekly-basket')
@ApiTags('baskets')
export class BasketsController {
  @Get()
  @ApiOperation({ summary: 'Get the demo weekly basket' })
  getWeeklyBasket(): WeeklyBasketResponse {
    return {
      id: 'basket_demo_week_2026_21',
      weekStart: '2026-05-18',
      currency: 'SEK',
      selectedStoreSlugs: ['willys-odenplan', 'ica-kvantum-liljeholmen'],
      estimatedTotal: 78.9,
      items: demoBasketItems,
      dataStatus: 'seed_demo',
    };
  }

  @Post('items')
  @ApiOperation({ summary: 'Preview adding an item to the demo weekly basket' })
  addWeeklyBasketItem(
    @Body() body: AddWeeklyBasketItemDto,
  ): WeeklyBasketItemResponse {
    return {
      id: `basket_item_${body.productSlug.replaceAll('-', '_')}`,
      productSlug: body.productSlug,
      productName: body.productSlug,
      quantity: body.quantity ?? 1,
      estimatedUnitPrice: 0,
      currency: 'SEK',
    };
  }
}
