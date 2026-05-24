import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { allProducts, groceryApi } from '../demo-data.js';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  @Get()
  @ApiOkResponse({ description: 'Searchable product list' })
  list(@Query('q') query = '') {
    return allProducts(query);
  }

  @Get(':id/terminal')
  @ApiOkResponse({ description: 'Product price terminal distribution, quote, and chart data' })
  terminal(@Param('id') id: string, @Query('asOf') asOf?: string) {
    const terminal = groceryApi.getProductPriceTerminal(id, { asOf });
    if (!terminal) throw new NotFoundException('Product not found');
    return { ...terminal, demo: true };
  }

  @Get(':id/spread')
  @ApiOkResponse({ description: 'Current verified store price spread for a product' })
  spread(@Param('id') id: string) {
    const spread = groceryApi.getProductPriceSpread(id);
    if (!spread) throw new NotFoundException('Product not found');
    return { ...spread, demo: true };
  }
}
