import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';
import { validateBody } from '../middleware/validate.js';
import { basketItemSchema, type BasketItemInput } from '../routes/items.js';

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

  @Post('items')
  @ApiCreatedResponse({ description: 'Basket item created' })
  addItem(@Body(validateBody(basketItemSchema)) body: BasketItemInput) {
    groceryApi.addBasketItem('demo', body);
    return body;
  }
}
