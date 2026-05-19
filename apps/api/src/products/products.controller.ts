import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  @Get()
  @ApiOkResponse({ description: 'Search products by query text.' })
  searchProducts(@Query('q') query = '') {
    return { items: [], query };
  }

  @Get(':slug')
  @ApiOkResponse({ description: 'Fetch one product by slug.' })
  getProduct(@Param('slug') slug: string) {
    return { slug };
  }
}
