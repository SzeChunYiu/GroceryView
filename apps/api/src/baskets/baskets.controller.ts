import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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

  @Post('items')
  @ApiCreatedResponse({ description: 'Basket item created' })
  addItem(@Body() body: BasketItemDto) {
    groceryApi.addBasketItem('demo', body);
    return body;
  }
}
