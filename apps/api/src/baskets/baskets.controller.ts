import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
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

class BasketItemQuantityDto {
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

  @Get('recurring-digest')
  @ApiOkResponse({ description: 'Recurring basket changes since last shop' })
  recurringDigest(
    @Query('templateId') templateId = 'weekly-basics',
    @Query('templateName') templateName = 'Weekly basics',
    @Query('cadence') cadence: 'weekly' | 'biweekly' | 'monthly' = 'weekly',
    @Query('asOf') asOf = '2026-05-22T08:00:00.000Z',
    @Query('lastPurchasedAt') lastPurchasedAt?: string
  ) {
    return {
      ...groceryApi.getRecurringBasketDigest('demo', {
        templateId,
        templateName,
        cadence,
        asOf,
        ...(lastPurchasedAt ? { lastPurchasedAt } : {})
      }),
      demo: true
    };
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

  @Patch('items/:productId')
  @ApiOkResponse({ description: 'Basket item quantity updated' })
  updateItem(@Param('productId') productId: string, @Body() body: BasketItemQuantityDto) {
    try {
      groceryApi.updateBasketItem('demo', productId, body.quantity);
      return groceryApi.getBasket('demo');
    } catch (error) {
      if (error instanceof Error && /(Unknown productId|Basket item not found)/.test(error.message)) {
        throw new NotFoundException('Basket item not found');
      }
      throw error;
    }
  }

  @Delete('items/:productId')
  @ApiOkResponse({ description: 'Basket item removed' })
  removeItem(@Param('productId') productId: string) {
    try {
      groceryApi.removeBasketItem('demo', productId);
      return groceryApi.getBasket('demo');
    } catch (error) {
      if (error instanceof Error && /(Unknown productId|Basket item not found)/.test(error.message)) {
        throw new NotFoundException('Basket item not found');
      }
      throw error;
    }
  }
}
