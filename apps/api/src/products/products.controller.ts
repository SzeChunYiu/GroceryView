import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { facetedProductSearchEndpoint } from '@groceryview/api';
import { jsonArrayResponse, jsonResponse, param, query } from '../openapi.js';
import { allProducts, groceryApi } from '../demo-data.js';
import { RealCatalogService } from '../real-catalog/real-catalog.service.js';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly realCatalog: RealCatalogService) {}

  @Get()
  @jsonArrayResponse('Searchable product list')
  @query('q', false, 'Optional full-text product query string.')
  list(@Query('q') query = '') {
    return allProducts(query);
  }

  @Get(facetedProductSearchEndpoint.actionPath)
  @jsonArrayResponse('Real faceted product search from persisted catalog and latest prices')
  @query('q', false, 'Optional full-text product query string.')
  @query('category', false, 'Optional category slug filter.')
  @query('brand', false, 'Optional brand slug filter.')
  @query('chain', false, 'Optional chain slug filter.')
  @query('store', false, 'Optional store slug filter.')
  @query('priceType', false, 'Optional price type filter.')
  @query('minPrice', false, 'Optional minimum price threshold (string/number).', undefined, 'number')
  @query('maxPrice', false, 'Optional maximum price threshold (string/number).', undefined, 'number')
  @query('limit', false, 'Optional result limit.', undefined, 'integer')
  facetedSearch(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('brand') brand?: string,
    @Query('chain') chain?: string,
    @Query('store') store?: string,
    @Query('priceType') priceType?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('limit') limit?: string
  ) {
    return this.realCatalog.facetedSearch({ q, category, brand, chain, store, priceType, minPrice, maxPrice, limit });
  }

  @Get(':id/terminal')
  @param('id', true, 'Product identifier used for terminal distribution lookup.')
  @jsonResponse('Product price terminal distribution, quote, and chart data')
  @query('asOf', false, 'Optional ISO-8601 timestamp for terminal snapshot.')
  terminal(@Param('id') id: string, @Query('asOf') asOf?: string) {
    const terminal = groceryApi.getProductPriceTerminal(id, { asOf });
    if (!terminal) throw new NotFoundException('Product not found');
    return { ...terminal, demo: true };
  }

  @Get(':id/spread')
  @param('id', true, 'Product identifier used for spread report.')
  @jsonResponse('Current verified store price spread for a product')
  spread(@Param('id') id: string) {
    const spread = groceryApi.getProductPriceSpread(id);
    if (!spread) throw new NotFoundException('Product not found');
    return { ...spread, demo: true };
  }

  @Get(':id/store-savings')
  @param('id', true, 'Product identifier used for store savings report.')
  @jsonResponse('Product store savings against the highest current verified quote')
  storeSavings(@Param('id') id: string) {
    const savings = groceryApi.getProductStoreSavings(id);
    if (!savings) throw new NotFoundException('Product not found');
    return { ...savings, demo: true };
  }

  @Get(':id/history-summary')
  @param('id', true, 'Product identifier used for history summary lookup.')
  @jsonResponse('Product price history summary and movement guardrails')
  historySummary(@Param('id') id: string) {
    const summary = groceryApi.getProductHistorySummary(id);
    if (!summary) throw new NotFoundException('Product not found');
    return { ...summary, demo: true };
  }

  @Get(':id/history-confidence')
  @param('id', true, 'Product identifier used for confidence report.')
  @jsonResponse('Product price history confidence disclosure and claim guardrails')
  historyConfidence(@Param('id') id: string) {
    const report = groceryApi.getProductHistoryConfidence(id);
    if (!report) throw new NotFoundException('Product not found');
    return { ...report, demo: true };
  }

  @Get(':id/deal-score')
  @param('id', true, 'Product identifier used for deal score lookup.')
  @jsonResponse('Deal Score v1 report with customer-facing reasons')
  @query('distanceKm', false, 'Optional distance in kilometers used to score regional deal impact.', undefined, 'number')
  dealScore(@Param('id') id: string, @Query('distanceKm') distanceKm?: string) {
    const parsedDistanceKm = distanceKm === undefined ? undefined : Number(distanceKm);
    const report = groceryApi.getDealScore(id, { distanceKm: parsedDistanceKm });
    if (!report) throw new NotFoundException('Product not found');
    return { ...report, demo: true };
  }

  @Get(':id/equivalents')
  @param('id', true, 'Product identifier used for equivalent products lookup.')
  @jsonArrayResponse('Comparable same-category product alternatives')
  equivalents(@Param('id') id: string) {
    if (!groceryApi.getProduct(id)) throw new NotFoundException('Product not found');
    return groceryApi.getProductEquivalents(id).map((equivalent) => ({ ...equivalent, demo: true }));
  }

  @Get(':id/history')
  @param('id', true, 'Product identifier used for raw history points.')
  @jsonArrayResponse('Raw product price history points')
  history(@Param('id') id: string) {
    if (!groceryApi.getProduct(id)) throw new NotFoundException('Product not found');
    return groceryApi.getProductHistory(id).map((point) => ({ ...point, productId: id, demo: true }));
  }

  @Get(':id')
  @param('id', true, 'Product identifier used for detail lookup.')
  @jsonResponse('Product detail data')
  detail(@Param('id') id: string) {
    const product = groceryApi.getProduct(id);
    if (!product) throw new NotFoundException('Product not found');
    return { ...product, demo: true };
  }
}
