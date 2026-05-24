import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { incrementProductViewCount, productById, productPrices } from '../demo-data.js';

@ApiTags('products')
@Controller('products')
export class ProductItemsController {
  @Get(':id')
  @ApiOkResponse({ description: 'Product detail' })
  detail(@Param('id') id: string) {
    const product = productById(id);
    if (!product) throw new NotFoundException('Product not found');

    const views = incrementProductViewCount(id);
    return {
      ...product,
      currentPrices: productPrices(id),
      viewCount: views,
      views,
      demo: true
    };
  }
}
