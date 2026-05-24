import { Readable } from 'node:stream';
import { BadRequestException, Controller, Get, Headers, NotFoundException, Param, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiOkResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';
import { resolveProductNameLocale } from '../product-name-locale.js';
import { CheapestNowService } from './cheapest-now.service.js';
import { LatestPricesService } from './latest-prices.service.js';
import { PriceHistoryService, type ProductPriceHistoryFilter } from './price-history.service.js';
import {
  productCheapestNowEndpoint,
  productPriceHistoryEndpoint,
  productPriceHistoryPriceTypes,
  type ProductPriceHistoryPriceType
} from '@groceryview/api';

@ApiTags('prices')
@Controller('products/:productId')
export class PricesController {
  constructor(
    private readonly cheapestNowService: CheapestNowService,
    private readonly latestPricesService: LatestPricesService,
    private readonly priceHistory: PriceHistoryService
  ) {}

  @Get(productCheapestNowEndpoint.actionPath)
  @ApiOkResponse({ description: 'Cheapest current observed price per chain for one product' })
  async cheapestNow(
    @Param('productId') productId: string,
    @Query('locale') locale?: string,
    @Headers('x-groceryview-locale') groceryViewLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
    @Headers('cookie') cookie?: string
  ) {
    const cheapest = await this.cheapestNowService.getProductCheapestNow(
      productId,
      resolveProductNameLocale({ locale, groceryViewLocale, acceptLanguage, cookie })
    );
    if (!cheapest) throw new NotFoundException('Product not found');
    return cheapest;
  }

  @Get('prices')
  @ApiOkResponse({ description: 'Latest store prices with provenance' })
  async latest(
    @Param('productId') productId: string,
    @Query('locale') locale?: string,
    @Headers('x-groceryview-locale') groceryViewLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
    @Headers('cookie') cookie?: string
  ) {
    const prices = await this.latestPricesService.getProductLatestPrices(
      productId,
      resolveProductNameLocale({ locale, groceryViewLocale, acceptLanguage, cookie })
    );
    if (!prices) throw new NotFoundException('Product not found');
    return prices;
  }

  @Get(productPriceHistoryEndpoint.actionPath)
  @ApiOkResponse({ description: 'Persisted product price observations over time' })
  async priceHistoryReport(
    @Param('productId') productId: string,
    @Query('priceType') priceType?: string,
    @Query('chain') chain?: string,
    @Query('store') store?: string,
    @Query('sourceRun') sourceRun?: string,
    @Query('minConfidence') minConfidence?: string,
    @Query('from') observedFrom?: string,
    @Query('to') observedTo?: string,
    @Query('limit') limit?: string,
    @Query('locale') locale?: string,
    @Headers('x-groceryview-locale') groceryViewLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
    @Headers('cookie') cookie?: string
  ) {
    const filter = parsePriceHistoryFilter({ priceType, chain, store, sourceRun, minConfidence, observedFrom, observedTo, limit });
    const report = await this.priceHistory.getProductPriceHistory(
      productId,
      filter,
      resolveProductNameLocale({ locale, groceryViewLocale, acceptLanguage, cookie })
    );
    if (!report) throw new NotFoundException('Product not found');
    return report;
  }

  @Get('history.csv')
  @ApiOkResponse({ description: 'Persisted product price history as CSV' })
  @ApiProduces('text/csv')
  async priceHistoryCsv(
    @Param('productId') productId: string,
    @Res({ passthrough: true }) response: { setHeader(name: string, value: string): void },
    @Query('priceType') priceType?: string,
    @Query('chain') chain?: string,
    @Query('store') store?: string,
    @Query('sourceRun') sourceRun?: string,
    @Query('minConfidence') minConfidence?: string,
    @Query('from') observedFrom?: string,
    @Query('to') observedTo?: string,
    @Query('limit') limit?: string,
    @Query('locale') locale?: string,
    @Headers('x-groceryview-locale') groceryViewLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
    @Headers('cookie') cookie?: string
  ) {
    const filter = parsePriceHistoryFilter({ priceType, chain, store, sourceRun, minConfidence, observedFrom, observedTo, limit });
    const report = await this.priceHistory.getProductPriceHistory(
      productId,
      filter,
      resolveProductNameLocale({ locale, groceryViewLocale, acceptLanguage, cookie })
    );
    if (!report) throw new NotFoundException('Product not found');

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${csvFilename(report.productSlug)}-history.csv"`);

    return new StreamableFile(Readable.from([productPriceHistoryCsv(report.points)]));
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

function csvFilename(value: string): string {
  const normalized = value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return normalized || 'product';
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function productPriceHistoryCsv(points: Array<{ observedAt: string; chainSlug?: string; chainName?: string; chainId: string; price: number; unitPrice: number }>): string {
  const rows = points.map((point) => [
    point.observedAt,
    point.chainSlug ?? point.chainName ?? point.chainId,
    point.price,
    point.unitPrice
  ]);
  return [['date', 'chain', 'price', 'unit'], ...rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\n') + '\n';
}

function parseOptionalPriceType(value: string | undefined): ProductPriceHistoryPriceType | undefined {
  if (value === undefined) return undefined;
  if (!(productPriceHistoryPriceTypes as readonly string[]).includes(value)) {
    throw new BadRequestException(`priceType must be one of: ${productPriceHistoryPriceTypes.join(', ')}.`);
  }
  return value as ProductPriceHistoryPriceType;
}

function parseOptionalDate(value: string | undefined, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (Number.isNaN(Date.parse(value))) throw new BadRequestException(`${field} must be an ISO date/time.`);
  return value;
}

function parseOptionalIdentifier(value: string | undefined, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (!/^[a-zA-Z0-9:_-]+$/.test(value)) throw new BadRequestException(`${field} must be a slug or id.`);
  return value;
}

function parseOptionalLimit(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1000) throw new BadRequestException('limit must be an integer between 1 and 1000.');
  return parsed;
}

function parseOptionalConfidence(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) throw new BadRequestException('minConfidence must be a number between 0 and 1.');
  return parsed;
}

function parsePriceHistoryFilter(input: {
  priceType?: string;
  chain?: string;
  store?: string;
  sourceRun?: string;
  minConfidence?: string;
  observedFrom?: string;
  observedTo?: string;
  limit?: string;
}): ProductPriceHistoryFilter {
  const parsedPriceType = parseOptionalPriceType(input.priceType);
  const parsedChain = parseOptionalIdentifier(input.chain, 'chain');
  const parsedStore = parseOptionalIdentifier(input.store, 'store');
  const parsedSourceRun = parseOptionalIdentifier(input.sourceRun, 'sourceRun');
  const parsedMinConfidence = parseOptionalConfidence(input.minConfidence);
  const parsedFrom = parseOptionalDate(input.observedFrom, 'from');
  const parsedTo = parseOptionalDate(input.observedTo, 'to');
  if (parsedFrom && parsedTo && Date.parse(parsedFrom) > Date.parse(parsedTo)) {
    throw new BadRequestException('from must be before or equal to to.');
  }
  const parsedLimit = parseOptionalLimit(input.limit);
  return {
    ...(parsedPriceType ? { priceType: parsedPriceType } : {}),
    ...(parsedChain ? { chain: parsedChain } : {}),
    ...(parsedStore ? { store: parsedStore } : {}),
    ...(parsedSourceRun ? { sourceRun: parsedSourceRun } : {}),
    ...(parsedMinConfidence === undefined ? {} : { minConfidence: parsedMinConfidence }),
    ...(parsedFrom ? { observedFrom: parsedFrom } : {}),
    ...(parsedTo ? { observedTo: parsedTo } : {}),
    ...(parsedLimit ? { limit: parsedLimit } : {})
  };
}
