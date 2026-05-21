import { Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';
import { groceryApi } from '../demo-data.js';

class BasketItemDto {
  @IsString()
  productId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;
}

@ApiTags('baskets')
@Controller('users/demo/basket')
export class BasketsController {
  @Get()
  @ApiOkResponse({ description: 'Demo user basket' })
  basket() {
    return groceryApi.getBasket('demo');
  }

  @Get('comparison')
  @ApiOkResponse({ description: 'Basket price comparison' })
  comparison() {
    return groceryApi.compareBasketReport('demo');
  }

  @Get('local-offers')
  @ApiOkResponse({ description: 'Ranked local offer basket coverage' })
  localOffers(@Query('asOf') asOf?: string) {
    return { ...groceryApi.getLocalOfferBasketReport('demo', asOf), demo: true };
  }

  @Get('stores/:storeId/quote')
  @ApiOkResponse({ description: 'Quote the demo basket at one store' })
  storeQuote(@Param('storeId') storeId: string) {
    try {
      return { ...groceryApi.quoteBasketAtStore('demo', storeId), demo: true };
    } catch (error) {
      if (error instanceof Error && /Unknown storeId/.test(error.message)) {
        throw new NotFoundException('Store not found');
      }
      throw error;
    }
  }

  @Post('items')
  @ApiCreatedResponse({ description: 'Basket item created' })
  addItem(@Body() body: BasketItemDto) {
    groceryApi.addBasketItem('demo', body);
    return body;
  }
}
