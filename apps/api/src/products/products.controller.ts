import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { demoProducts, toProductSummary } from '../demo-data';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  @Get()
  @ApiOkResponse({ description: 'Demo product list with price summary.' })
  listProducts() {
    return demoProducts.map(toProductSummary);
  }

  @Get(':slug')
  @ApiParam({ name: 'slug', example: 'zoegas-skane-mellanrost-450g' })
  @ApiOkResponse({ description: 'Demo product detail.' })
  getProduct(@Param('slug') slug: string) {
    const product = demoProducts.find((item) => item.slug === slug);
    if (!product) {
      throw new NotFoundException(`Unknown product slug: ${slug}`);
    }
    return product;
  }
}
