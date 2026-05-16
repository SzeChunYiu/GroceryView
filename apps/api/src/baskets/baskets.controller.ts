import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class WeeklyBasketItemDto {
  productSlug!: string;
  quantity!: number;
  estimatedPriceAmount!: number;
  currency!: 'SEK';
}

export class WeeklyBasketDto {
  id!: string;
  currency!: 'SEK';
  estimatedTotalAmount!: number;
  items!: WeeklyBasketItemDto[];
  demo!: true;
}

export class CreateWeeklyBasketItemDto {
  @IsString()
  productSlug!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

const WEEKLY_BASKET: WeeklyBasketDto = {
  id: 'demo-weekly-basket',
  currency: 'SEK',
  estimatedTotalAmount: 49.9,
  items: [
    {
      productSlug: 'zoegas-skane-mellanrost-450g',
      quantity: 1,
      estimatedPriceAmount: 49.9,
      currency: 'SEK',
    },
  ],
  demo: true,
};

@Controller('me/weekly-basket')
@ApiTags('baskets')
export class BasketsController {
  @Get()
  @ApiOperation({ summary: 'Get the demo weekly basket for the current user' })
  @ApiOkResponse({ type: WeeklyBasketDto })
  getWeeklyBasket(): WeeklyBasketDto {
    return WEEKLY_BASKET;
  }

  @Post('items')
  @ApiOperation({ summary: 'Create a demo weekly basket item placeholder' })
  @ApiCreatedResponse({ type: WeeklyBasketItemDto })
  createWeeklyBasketItem(
    @Body() body: CreateWeeklyBasketItemDto,
  ): WeeklyBasketItemDto {
    return {
      productSlug: body.productSlug,
      quantity: body.quantity,
      estimatedPriceAmount: 0,
      currency: 'SEK',
    };
  }
}
