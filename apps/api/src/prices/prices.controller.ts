import { Readable } from 'node:stream';
import { BadRequestException, Controller, Get, NotFoundException, Param, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { csvResponse, jsonArrayResponse, jsonResponse, param, query } from '../openapi.js';
import { groceryApi } from '../demo-data.js';
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
  @param('productId', true, 'Product identifier used to locate the cheapest currently observed price report.')
  @jsonResponse('Cheapest current observed price per chain for one product')
  async cheapestNow(@Param('productId') productId: string) {
    const cheapest = await this.cheapestNowService.getProductCheapestNow(productId);
    if (!cheapest) throw new NotFoundException('Product not found');
    return cheapest;
  }

  @Get('prices')
  @param('productId', true, 'Product identifier used for latest retail price snapshot.')
  @jsonArrayResponse('Latest store prices with provenance')
  async latest(@Param('productId') productId: string) {
    const prices = await this.latestPricesService.getProductLatestPrices(productId);
    if (!prices) throw new NotFoundException('Product not found');
    return prices;
  }

  @Get(productPriceHistoryEndpoint.actionPath)
  @param('productId', true, 'Product identifier used for price-history report.')
  @query('priceType', false, 'Optional price type filter.', undefined, 'string')
  @query('chain', false, 'Optional chain filter slug.')
  @query('store', false, 'Optional store filter slug.')
  @query('sourceRun', false, 'Optional source run identifier.')
  @query('minConfidence', false, 'Optional minimum confidence threshold (0-1).', undefined, 'number')
  @query('from', false, 'Optional inclusive start date (ISO timestamp).')
  @query('to', false, 'Optional inclusive end date (ISO timestamp).')
  @query('limit', false, 'Optional max results (1-1000).', undefined, 'integer')
  @jsonResponse('Persisted product price observations over time')
  async priceHistoryReport(
    @Param('productId') productId: string,
    @Query('priceType') priceType?: string,
    @Query('chain') chain?: string,
    @Query('store') store?: string,
    @Query('sourceRun') sourceRun?: string,
    @Query('minConfidence') minConfidence?: string,
    @Query('from') observedFrom?: string,
    @Query('to') observedTo?: string,
    @Query('limit') limit?: string
  ) {
    const filter = parsePriceHistoryFilter({ priceType, chain, store, sourceRun, minConfidence, observedFrom, observedTo, limit });
    const report = await this.priceHistory.getProductPriceHistory(productId, filter);
    if (!report) throw new NotFoundException('Product not found');
    return report;
  }

  @Get('history.csv')
  @param('productId', true, 'Product identifier used for price-history CSV download.')
  @query('priceType', false, 'Optional price type filter.', undefined, 'string')
  @query('chain', false, 'Optional chain filter slug.')
  @query('store', false, 'Optional store filter slug.')
  @query('sourceRun', false, 'Optional source run identifier.')
  @query('minConfidence', false, 'Optional minimum confidence threshold (0-1).', undefined, 'number')
  @query('from', false, 'Optional inclusive start date (ISO timestamp).')
  @query('to', false, 'Optional inclusive end date (ISO timestamp).')
  @query('limit', false, 'Optional max rows (1-1000).', undefined, 'integer')
  @csvResponse('Persisted product price history as CSV')
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
    @Query('limit') limit?: string
  ) {
    const filter = parsePriceHistoryFilter({ priceType, chain, store, sourceRun, minConfidence, observedFrom, observedTo, limit });
    const report = await this.priceHistory.getProductPriceHistory(productId, filter);
    if (!report) throw new NotFoundException('Product not found');

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${csvFilename(report.productSlug)}-history.csv"`);

    return new StreamableFile(Readable.from([productPriceHistoryCsv(report.points)]));
  }

  @Get('observations')
  @param('productId', true, 'Product identifier used for raw observation list.')
  @jsonArrayResponse('Price observations')
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
