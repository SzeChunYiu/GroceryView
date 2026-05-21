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

  @Get(':id/store-savings')
  @ApiOkResponse({ description: 'Product store savings against the highest current verified quote' })
  storeSavings(@Param('id') id: string) {
    const savings = groceryApi.getProductStoreSavings(id);
    if (!savings) throw new NotFoundException('Product not found');
    return { ...savings, demo: true };
  }

  @Get(':id/history-summary')
  @ApiOkResponse({ description: 'Product price history summary and movement guardrails' })
  historySummary(@Param('id') id: string) {
    const summary = groceryApi.getProductHistorySummary(id);
    if (!summary) throw new NotFoundException('Product not found');
    return { ...summary, demo: true };
  }

  @Get(':id/deal-score')
  @ApiOkResponse({ description: 'Deal Score v1 report with customer-facing reasons' })
  dealScore(@Param('id') id: string, @Query('distanceKm') distanceKm?: string) {
    const parsedDistanceKm = distanceKm === undefined ? undefined : Number(distanceKm);
    const report = groceryApi.getDealScore(id, { distanceKm: parsedDistanceKm });
    if (!report) throw new NotFoundException('Product not found');
    return { ...report, demo: true };
  }

  @Get(':id/equivalents')
  @ApiOkResponse({ description: 'Comparable same-category product alternatives' })
  equivalents(@Param('id') id: string) {
    if (!groceryApi.getProduct(id)) throw new NotFoundException('Product not found');
    return groceryApi.getProductEquivalents(id).map((equivalent) => ({ ...equivalent, demo: true }));
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Product detail data' })
  detail(@Param('id') id: string) {
    const product = groceryApi.getProduct(id);
    if (!product) throw new NotFoundException('Product not found');
    return { ...product, demo: true };
  }
}
