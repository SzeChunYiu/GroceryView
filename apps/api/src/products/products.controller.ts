import { Body, Controller, ForbiddenException, Get, Headers, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { facetedProductSearchEndpoint } from '@groceryview/api';
import { allProducts, groceryApi } from '../demo-data.js';
import { resolveProductNameLocale } from '../product-name-locale.js';
import { apiRouteTraceSpans, traceApiRoute } from '../instrumentation.js';
import { RealCatalogService } from '../real-catalog/real-catalog.service.js';

function requireAdminReviewer(value: string | undefined): void {
  if (!['true', '1', 'reviewer'].includes((value ?? '').trim().toLowerCase())) {
    throw new ForbiddenException('Admin reviewer credentials required.');
  }
}

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly realCatalog: RealCatalogService) {}

  @Get()
  @ApiOkResponse({ description: 'Searchable product list' })
  list(@Query('q') query = '') {
    return traceApiRoute(apiRouteTraceSpans.products, { route: 'products.list', hasQuery: Boolean(query) }, () => allProducts(query));
  }

  @Get(facetedProductSearchEndpoint.actionPath)
  @ApiOkResponse({ description: 'Real faceted product search from persisted catalog and latest prices' })
  facetedSearch(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('brand') brand?: string,
    @Query('chain') chain?: string,
    @Query('store') store?: string,
    @Query('priceType') priceType?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('locale') locale?: string,
    @Headers('x-groceryview-locale') groceryViewLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
    @Headers('cookie') cookie?: string
  ) {
    return traceApiRoute(apiRouteTraceSpans.products, { route: 'products.facetedSearch', hasQuery: Boolean(q), category, chain, store }, () => this.realCatalog.facetedSearch({
      q,
      category,
      brand,
      chain,
      store,
      priceType,
      minPrice,
      maxPrice,
      limit,
      cursor,
      productNameLocale: resolveProductNameLocale({ locale, groceryViewLocale, acceptLanguage, cookie })
    }));
  }

  @Get('search/reviewer/aliases')
  @ApiOkResponse({ description: 'Admin review queue for faceted-search no-result aliases' })
  listPendingSearchAliases(@Headers('x-groceryview-admin') adminReviewer?: string, @Query('limit') limit?: string) {
    requireAdminReviewer(adminReviewer);
    return this.realCatalog.listPendingSearchAliases({ limit });
  }

  @Post('search/reviewer/aliases/:aliasId/approve')
  @ApiOkResponse({ description: 'Admin approval for a pending faceted-search alias' })
  approvePendingSearchAlias(
    @Headers('x-groceryview-admin') adminReviewer: string | undefined,
    @Param('aliasId') aliasId: string,
    @Body() body: { productId?: string; reviewedAt?: string } = {}
  ) {
    requireAdminReviewer(adminReviewer);
    return this.realCatalog.approvePendingSearchAlias({ aliasId, productId: body.productId ?? '', reviewedAt: body.reviewedAt });
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

  @Get(':id/history-confidence')
  @ApiOkResponse({ description: 'Product price history confidence disclosure and claim guardrails' })
  historyConfidence(@Param('id') id: string) {
    const report = groceryApi.getProductHistoryConfidence(id);
    if (!report) throw new NotFoundException('Product not found');
    return { ...report, demo: true };
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

  @Get(':id/history')
  @ApiOkResponse({ description: 'Raw product price history points' })
  history(@Param('id') id: string) {
    if (!groceryApi.getProduct(id)) throw new NotFoundException('Product not found');
    return groceryApi.getProductHistory(id).map((point) => ({ ...point, productId: id, demo: true }));
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Product detail data' })
  detail(@Param('id') id: string) {
    const product = groceryApi.getProduct(id);
    if (!product) throw new NotFoundException('Product not found');
    return { ...product, demo: true };
  }
}
