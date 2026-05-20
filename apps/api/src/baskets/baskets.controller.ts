import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { BasketItem } from '@groceryview/api-contracts';
import { demoBasket } from '../demo-data';
import { parseBasketItemBody } from '../request-validation';

@ApiTags('baskets')
@Controller('me/weekly-basket')
export class BasketsController {
  @Get()
  @ApiOkResponse({ description: 'Demo weekly basket summary.' })
  getBasket() {
    return demoBasket;
  }

  @Post('items')
  @ApiCreatedResponse({ description: 'Demo basket item echo.' })
  createBasketItem(@Body() body: unknown): BasketItem {
    const item = parseBasketItemBody(body);
    return {
      productSlug: item.productSlug,
      quantity: item.quantity ?? 1,
      demo: true,
    };
  }
}
