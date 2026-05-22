import { BadRequestException, Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi, productPrices } from '../demo-data.js';
import { CheapestNowService } from './cheapest-now.service.js';
import { PriceHistoryService, type ProductPriceHistoryFilter } from './price-history.service.js';
import type { ProductPriceHistoryPriceType } from '@groceryview/api';

@ApiTags('prices')
@Controller('products/:productId')
export class PricesController {
  constructor(
    private readonly cheapestNowService: CheapestNowService,
    private readonly priceHistory: PriceHistoryService
  ) {}

  @Get('cheapest-now')
  @ApiOkResponse({ description: 'Cheapest current observed price per chain for one product' })
  async cheapestNow(@Param('productId') productId: string) {
    const cheapest = await this.cheapestNowService.getProductCheapestNow(productId);
    if (!cheapest) throw new NotFoundException('Product not found');
    return cheapest;
  }

  @Get('prices')
  @ApiOkResponse({ description: 'Latest store prices with provenance' })
  latest(@Param('productId') productId: string) {
    if (!groceryApi.getProduct(productId)) throw new NotFoundException('Product not found');
    return productPrices(productId);
  }

  @Get('price-history')
  @ApiOkResponse({ description: 'Persisted product price observations over time' })
  async priceHistoryReport(
    @Param('productId') productId: string,
    @Query('priceType') priceType?: string,
    @Query('from') observedFrom?: string,
    @Query('to') observedTo?: string,
    @Query('limit') limit?: string
  ) {
    const filter = parsePriceHistoryFilter({ priceType, observedFrom, observedTo, limit });
    const report = await this.priceHistory.getProductPriceHistory(productId, filter);
    if (!report) throw new NotFoundException('Product not found');
    return report;
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

const priceHistoryTypes = ['shelf', 'online', 'member', 'promotion', 'receipt', 'community', 'estimated'] as const;

function parseOptionalPriceType(value: string | undefined): ProductPriceHistoryPriceType | undefined {
  if (value === undefined) return undefined;
  if (!(priceHistoryTypes as readonly string[]).includes(value)) {
    throw new BadRequestException(`priceType must be one of: ${priceHistoryTypes.join(', ')}.`);
  }
  return value as ProductPriceHistoryPriceType;
}

function parseOptionalDate(value: string | undefined, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (Number.isNaN(Date.parse(value))) throw new BadRequestException(`${field} must be an ISO date/time.`);
  return value;
}

function parseOptionalLimit(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1000) throw new BadRequestException('limit must be an integer between 1 and 1000.');
  return parsed;
}

function parsePriceHistoryFilter(input: {
  priceType?: string;
  observedFrom?: string;
  observedTo?: string;
  limit?: string;
}): ProductPriceHistoryFilter {
  const parsedPriceType = parseOptionalPriceType(input.priceType);
  const parsedFrom = parseOptionalDate(input.observedFrom, 'from');
  const parsedTo = parseOptionalDate(input.observedTo, 'to');
  const parsedLimit = parseOptionalLimit(input.limit);
  return {
    ...(parsedPriceType ? { priceType: parsedPriceType } : {}),
    ...(parsedFrom ? { observedFrom: parsedFrom } : {}),
    ...(parsedTo ? { observedTo: parsedTo } : {}),
    ...(parsedLimit ? { limit: parsedLimit } : {})
  };
}
