import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi, productPrices } from '../demo-data.js';

@ApiTags('prices')
@Controller('products/:productId')
export class PricesController {
  @Get('prices')
  @ApiOkResponse({ description: 'Latest store prices with provenance' })
  latest(@Param('productId') productId: string) {
    if (!groceryApi.getProduct(productId)) throw new NotFoundException('Product not found');
    return productPrices(productId);
  }

  @Get('observations')
  @ApiOkResponse({ description: 'Price observations' })
  observations(@Param('productId') productId: string) {
    const product = groceryApi.getProduct(productId);
    if (!product) throw new NotFoundException('Product not found');
    return product.history.map((point) => ({
      productId,
      observedAt: `${point.date}T09:00:00Z`,
      price: point.price,
      currency: 'SEK',
      priceType: 'shelf',
      confidence: point.verified ? 'high' : 'low',
      sourceType: 'demo_seed',
      provenance: `demo://history/${productId}/${point.date}`
    }));
  }
}
