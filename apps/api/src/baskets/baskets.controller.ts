import { randomUUID } from 'node:crypto';
import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Headers, HttpCode, NotFoundException, Param, Patch, Post, Query, Req, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { basketCompareEndpoint, savedBasketCompareEndpoint } from '@groceryview/api';
import { groceryApi } from '../demo-data.js';
import { AuthGuard, authenticatedUserId, type AuthenticatedRequest } from '../middleware/auth.js';
import { resolveProductNameLocale } from '../product-name-locale.js';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';
import { RealCatalogService } from '../real-catalog/real-catalog.service.js';

class BasketItemDto {
  @IsString()
  productId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;
}

class BasketItemQuantityDto {
  @IsNumber()
  @Min(1)
  quantity!: number;
}


class BasketImportSourceDto {
  @IsString()
  sourceKind!: 'bookmarklet' | 'browser_extension' | 'copy_paste';

  @IsString()
  retailerId!: string;

  @IsString()
  origin!: string;

  @IsString()
  capturedAt!: string;

  @IsBoolean()
  consentGranted!: boolean;
}

class BasketImportLineDto {
  @IsString()
  rawName!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  productUrl?: string;
}

class BasketImportExportDto {
  @ValidateNested()
  @Type(() => BasketImportSourceDto)
  source!: BasketImportSourceDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BasketImportLineDto)
  capturedLines!: BasketImportLineDto[];
}

class BasketImportReviewDecisionDto {
  @IsString()
  decision!: 'accept_as_product' | 'dismiss';

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}

class CompareBasketRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BasketItemDto)
  items!: BasketItemDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  storeSlugs?: string[];
}

class MultiWeekStockUpRowDto {
  @IsOptional()
  @IsString()
  rowId?: string;

  @IsString()
  productId!: string;

  @IsString()
  productName!: string;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsString()
  storeName!: string;

  @IsInt()
  @Min(1)
  @Max(26)
  planningWeeks!: number;

  @IsNumber()
  @Min(0.001)
  weeklyNeedUnits!: number;

  @IsNumber()
  @Min(0.001)
  packageUnits!: number;

  @IsString()
  comparableUnit!: string;

  @IsNumber()
  @Min(0)
  currentUnitPrice!: number;

  @IsNumber()
  @Min(0)
  historicalLowUnitPrice!: number;

  @IsNumber()
  @Min(0)
  typicalUnitPrice!: number;

  @IsIn(['high', 'medium', 'low'])
  confidence!: 'high' | 'medium' | 'low';

  @IsString()
  historyWindowStart!: string;

  @IsString()
  historyWindowEnd!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(26)
  storageLimitWeeks?: number;

  @IsOptional()
  @IsString()
  noForecastReason?: string;

  @IsOptional()
  @IsString()
  reviewTrigger?: string;
}

class MultiWeekStockUpRowPatchDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(26)
  planningWeeks?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.001)
  weeklyNeedUnits?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.001)
  packageUnits?: number;

  @IsOptional()
  @IsString()
  comparableUnit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentUnitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  historicalLowUnitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  typicalUnitPrice?: number;

  @IsOptional()
  @IsIn(['high', 'medium', 'low'])
  confidence?: 'high' | 'medium' | 'low';

  @IsOptional()
  @IsString()
  historyWindowStart?: string;

  @IsOptional()
  @IsString()
  historyWindowEnd?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(26)
  storageLimitWeeks?: number;

  @IsOptional()
  @IsString()
  noForecastReason?: string;

  @IsOptional()
  @IsString()
  reviewTrigger?: string;
}

type MultiWeekStockUpSqlRow = {
  row_id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  store_id: string | null;
  store_name: string;
  planning_weeks: number | string;
  weekly_need_units: number | string;
  package_units: number | string;
  comparable_unit: string;
  current_unit_price: number | string;
  historical_low_unit_price: number | string;
  typical_unit_price: number | string;
  confidence: 'high' | 'medium' | 'low';
  history_window_start: string | Date;
  history_window_end: string | Date;
  storage_limit_weeks: number | string | null;
  no_forecast_reason: string;
  review_trigger: string;
  updated_at: string | Date;
};

const stockUpListGuardrails = [
  'Rows are account-owned and require a signed-in user before create, list, or update.',
  'Historical low and typical prices are persisted as observed facts with confidence; no future price forecast is stored.',
  'Missing or stale observed history must lower confidence instead of filling a forecasted price.',
  'Planning weeks and storage limits are shopper-entered editable fields, not price outlooks.'
];

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

function optionalTrim(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function requireIsoDate(value: string | undefined, field: string): string {
  const trimmed = value?.trim();
  if (!trimmed || Number.isNaN(Date.parse(trimmed))) throw new BadRequestException(`${field} must be an ISO date string.`);
  return trimmed;
}

function assertHistoryWindow(start: string, end: string) {
  if (Date.parse(start) > Date.parse(end)) throw new BadRequestException('historyWindowStart must be before or equal to historyWindowEnd.');
}

function mapStockUpRow(row: MultiWeekStockUpSqlRow) {
  return {
    rowId: row.row_id,
    userId: row.user_id,
    productId: row.product_id,
    productName: row.product_name,
    ...(row.store_id ? { storeId: row.store_id } : {}),
    storeName: row.store_name,
    planningWeeks: Number(row.planning_weeks),
    weeklyNeedUnits: Number(row.weekly_need_units),
    packageUnits: Number(row.package_units),
    comparableUnit: row.comparable_unit,
    currentUnitPrice: Number(row.current_unit_price),
    historicalLowUnitPrice: Number(row.historical_low_unit_price),
    typicalUnitPrice: Number(row.typical_unit_price),
    confidence: row.confidence,
    historyWindowStart: iso(row.history_window_start),
    historyWindowEnd: iso(row.history_window_end),
    ...(row.storage_limit_weeks === null ? {} : { storageLimitWeeks: Number(row.storage_limit_weeks) }),
    noForecastReason: row.no_forecast_reason,
    reviewTrigger: row.review_trigger,
    updatedAt: iso(row.updated_at)
  };
}

function stockUpListResponse(userId: string, rows: MultiWeekStockUpSqlRow[]) {
  return {
    userId,
    itemCount: rows.length,
    rows: rows.map(mapStockUpRow),
    guardrails: stockUpListGuardrails,
    evidence: {
      sourceTables: ['multi_week_stock_up_rows', 'app_users'],
      noForecast: true,
      historicalPriceFields: ['historicalLowUnitPrice', 'typicalUnitPrice', 'confidence', 'historyWindowStart', 'historyWindowEnd']
    }
  };
}

function assertOwnUser(request: AuthenticatedRequest, userId: string): string {
  const authenticated = authenticatedUserId(request);
  if (authenticated !== userId) throw new ForbiddenException('Authenticated user does not match requested stock-up list owner.');
  return authenticated;
}

@ApiTags('baskets')
@Controller('users/demo/basket')
export class BasketsController {
  @Get()
  @ApiOkResponse({ description: 'Demo user basket' })
  basket() {
    return groceryApi.getBasket('demo');
  }

  @Get('comparison')
  @ApiOkResponse({ description: 'Basket price comparison' })
  comparison() {
    return groceryApi.compareBasketReport('demo');
  }

  @Get('local-offers')
  @ApiOkResponse({ description: 'Ranked local offer basket coverage' })
  localOffers(@Query('asOf') asOf?: string) {
    return { ...groceryApi.getLocalOfferBasketReport('demo', asOf), demo: true };
  }

  @Post('import-export')
  @ApiCreatedResponse({ description: 'Import consented bookmarklet or extension basket rows for review' })
  importExport(@Body() body: BasketImportExportDto) {
    return { ...groceryApi.importBasketFromRetailerPage('demo', body), demo: true };
  }

  @Get('import-review')
  @ApiOkResponse({ description: 'Account-bound retailer basket import review rows' })
  importReview() {
    return { ...groceryApi.getBasketImportReviewQueue('demo'), demo: true };
  }

  @Post('import-review/:reviewItemId/decisions')
  @ApiCreatedResponse({ description: 'Resolve an account-bound retailer basket import review row' })
  importReviewDecision(@Param('reviewItemId') reviewItemId: string, @Body() body: BasketImportReviewDecisionDto) {
    try {
      return { ...groceryApi.resolveBasketImportReviewItem('demo', reviewItemId, body), demo: true };
    } catch (error) {
      if (error instanceof Error && /Basket import review item not found/.test(error.message)) {
        throw new NotFoundException('Basket import review item not found');
      }
      throw error;
    }
  }

  @Get('handoff/:retailerId')
  @ApiOkResponse({ description: 'Retailer handoff actions and support matrix guardrails' })
  handoff(@Param('retailerId') retailerId: string) {
    try {
      return { ...groceryApi.getRetailerHandoffPlan('demo', retailerId), demo: true };
    } catch (error) {
      if (error instanceof Error && /Unsupported retailerId/.test(error.message)) {
        throw new NotFoundException('Retailer handoff not supported');
      }
      throw error;
    }
  }

  @Get('transfer/:retailerId')
  @ApiOkResponse({ description: 'Secure retailer basket transfer preflight' })
  transfer(@Param('retailerId') retailerId: string) {
    try {
      return { ...groceryApi.getRetailerBasketTransferSession('demo', retailerId), demo: true };
    } catch (error) {
      if (error instanceof Error && /Unsupported retailerId/.test(error.message)) {
        throw new NotFoundException('Retailer transfer not supported');
      }
      throw error;
    }
  }

  @Get('fulfillment-slots/:retailerId/:storeId')
  @ApiOkResponse({ description: 'Fulfillment slot evidence without reservation claims' })
  fulfillmentSlots(@Param('retailerId') retailerId: string, @Param('storeId') storeId: string) {
    try {
      return { ...groceryApi.getBasketFulfillmentSlots('demo', retailerId, storeId), demo: true };
    } catch (error) {
      if (error instanceof Error && /Unknown storeId/.test(error.message)) {
        throw new NotFoundException('Store not found');
      }
      throw error;
    }
  }

  @Get('trip-cost')
  @ApiOkResponse({ description: 'Basket plus travel-cost optimizer' })
  tripCost(
    @Query('travelMode') travelMode: 'walk' | 'bike' | 'transit' | 'car' | 'delivery' = 'car',
    @Query('valueOfTimePerHour') valueOfTimePerHour = '120',
    @Query('carCostPerKm') carCostPerKm = '3.5',
    @Query('transitFare') transitFare?: string,
    @Query('splitTripPenalty') splitTripPenalty = '15'
  ) {
    return {
      ...groceryApi.getBasketTripCostReport('demo', {
        travelMode,
        valueOfTimePerHour: Number(valueOfTimePerHour),
        carCostPerKm: Number(carCostPerKm),
        ...(transitFare === undefined ? {} : { transitFare: Number(transitFare) }),
        splitTripPenalty: Number(splitTripPenalty)
      }),
      demo: true
    };
  }

  @Get('recurring-digest')
  @ApiOkResponse({ description: 'Recurring basket changes since last shop' })
  recurringDigest(
    @Query('templateId') templateId = 'weekly-basics',
    @Query('templateName') templateName = 'Weekly basics',
    @Query('cadence') cadence: 'weekly' | 'biweekly' | 'monthly' = 'weekly',
    @Query('asOf') asOf = '2026-05-22T08:00:00.000Z',
    @Query('lastPurchasedAt') lastPurchasedAt?: string
  ) {
    return {
      ...groceryApi.getRecurringBasketDigest('demo', {
        templateId,
        templateName,
        cadence,
        asOf,
        ...(lastPurchasedAt ? { lastPurchasedAt } : {})
      }),
      demo: true
    };
  }

  @Get('stores/:storeId/quote')
  @ApiOkResponse({ description: 'Quote the demo basket at one store' })
  storeQuote(@Param('storeId') storeId: string) {
    try {
      return { ...groceryApi.quoteBasketAtStore('demo', storeId), demo: true };
    } catch (error) {
      if (error instanceof Error && /Unknown storeId/.test(error.message)) {
        throw new NotFoundException('Store not found');
      }
      throw error;
    }
  }

  @Post('items')
  @ApiCreatedResponse({ description: 'Basket item created' })
  addItem(@Body() body: BasketItemDto) {
    groceryApi.addBasketItem('demo', body);
    return body;
  }

  @Patch('items/:productId')
  @ApiOkResponse({ description: 'Basket item quantity updated' })
  updateItem(@Param('productId') productId: string, @Body() body: BasketItemQuantityDto) {
    try {
      groceryApi.updateBasketItem('demo', productId, body.quantity);
      return groceryApi.getBasket('demo');
    } catch (error) {
      if (error instanceof Error && /(Unknown productId|Basket item not found)/.test(error.message)) {
        throw new NotFoundException('Basket item not found');
      }
      throw error;
    }
  }

  @Delete('items/:productId')
  @ApiOkResponse({ description: 'Basket item removed' })
  removeItem(@Param('productId') productId: string) {
    try {
      groceryApi.removeBasketItem('demo', productId);
      return groceryApi.getBasket('demo');
    } catch (error) {
      if (error instanceof Error && /(Unknown productId|Basket item not found)/.test(error.message)) {
        throw new NotFoundException('Basket item not found');
      }
      throw error;
    }
  }
}

@ApiTags('baskets')
@ApiBearerAuth()
@Controller()
export class RealBasketsController {
  constructor(private readonly realCatalog: RealCatalogService, private readonly postgres: PostgresQueryExecutorService) {}

  @Post(basketCompareEndpoint.actionPath)
  @HttpCode(200)
  @ApiOkResponse({ description: 'Compare an arbitrary basket using persisted latest price rows' })
  compare(
    @Body() body: CompareBasketRequestDto,
    @Query('locale') locale?: string,
    @Headers('x-groceryview-locale') groceryViewLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
    @Headers('cookie') cookie?: string
  ) {
    return this.realCatalog.compareBasket({
      items: body.items,
      storeSlugs: body.storeSlugs,
      productNameLocale: resolveProductNameLocale({ locale, groceryViewLocale, acceptLanguage, cookie })
    });
  }

  @Get(savedBasketCompareEndpoint.actionPath)
  @ApiOkResponse({ description: 'Compare the latest saved user basket using persisted latest price rows' })
  compareSaved(
    @Param('userId') userId: string,
    @Query('stores') stores?: string,
    @Query('locale') locale?: string,
    @Headers('x-groceryview-locale') groceryViewLocale?: string,
    @Headers('accept-language') acceptLanguage?: string,
    @Headers('cookie') cookie?: string
  ) {
    return this.realCatalog.compareSavedBasket(
      userId,
      stores
        ?.split(',')
        .map((store) => store.trim())
        .filter(Boolean),
      resolveProductNameLocale({ locale, groceryViewLocale, acceptLanguage, cookie })
    );
  }

  @Get('users/:userId/basket/stock-up-list')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ description: 'List signed-in editable multi-week stock-up rows without price forecasts' })
  async listStockUpRows(@Param('userId') userId: string, @Req() request: AuthenticatedRequest) {
    assertOwnUser(request, userId);
    this.requireStockUpDatabase();
    return stockUpListResponse(userId, await this.fetchStockUpRows(userId));
  }

  @Post('users/:userId/basket/stock-up-list/rows')
  @UseGuards(AuthGuard)
  @ApiCreatedResponse({ description: 'Create a signed-in multi-week stock-up row from observed historical price facts' })
  async createStockUpRow(@Param('userId') userId: string, @Req() request: AuthenticatedRequest, @Body() body: MultiWeekStockUpRowDto) {
    assertOwnUser(request, userId);
    this.requireStockUpDatabase();
    const historyWindowStart = requireIsoDate(body.historyWindowStart, 'historyWindowStart');
    const historyWindowEnd = requireIsoDate(body.historyWindowEnd, 'historyWindowEnd');
    assertHistoryWindow(historyWindowStart, historyWindowEnd);
    await this.postgres.query(
      `insert into multi_week_stock_up_rows (
         user_id, row_id, product_id, product_name, store_id, store_name, planning_weeks, weekly_need_units,
         package_units, comparable_unit, current_unit_price, historical_low_unit_price, typical_unit_price,
         confidence, history_window_start, history_window_end, storage_limit_weeks, no_forecast_reason, review_trigger
       ) values (
         $1, $2, $3, $4, $5, $6, $7, $8,
         $9, $10, $11, $12, $13,
         $14, $15::timestamptz, $16::timestamptz, $17, $18, $19
       )
       on conflict (user_id, row_id) do update set
         product_id = excluded.product_id,
         product_name = excluded.product_name,
         store_id = excluded.store_id,
         store_name = excluded.store_name,
         planning_weeks = excluded.planning_weeks,
         weekly_need_units = excluded.weekly_need_units,
         package_units = excluded.package_units,
         comparable_unit = excluded.comparable_unit,
         current_unit_price = excluded.current_unit_price,
         historical_low_unit_price = excluded.historical_low_unit_price,
         typical_unit_price = excluded.typical_unit_price,
         confidence = excluded.confidence,
         history_window_start = excluded.history_window_start,
         history_window_end = excluded.history_window_end,
         storage_limit_weeks = excluded.storage_limit_weeks,
         no_forecast_reason = excluded.no_forecast_reason,
         review_trigger = excluded.review_trigger,
         updated_at = now()`,
      [
        userId,
        optionalTrim(body.rowId) ?? randomUUID(),
        body.productId.trim(),
        body.productName.trim(),
        optionalTrim(body.storeId),
        body.storeName.trim(),
        body.planningWeeks,
        body.weeklyNeedUnits,
        body.packageUnits,
        body.comparableUnit.trim(),
        body.currentUnitPrice,
        body.historicalLowUnitPrice,
        body.typicalUnitPrice,
        body.confidence,
        historyWindowStart,
        historyWindowEnd,
        body.storageLimitWeeks ?? null,
        optionalTrim(body.noForecastReason) ?? 'Historical low and typical prices are observed facts only; no future shelf price is predicted.',
        optionalTrim(body.reviewTrigger) ?? 'Re-check observed prices before restocking or when a new verified row arrives.'
      ]
    );
    return stockUpListResponse(userId, await this.fetchStockUpRows(userId));
  }

  @Patch('users/:userId/basket/stock-up-list/rows/:rowId')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ description: 'Update a signed-in multi-week stock-up row while preserving no-forecast guardrails' })
  async updateStockUpRow(
    @Param('userId') userId: string,
    @Param('rowId') rowId: string,
    @Req() request: AuthenticatedRequest,
    @Body() body: MultiWeekStockUpRowPatchDto
  ) {
    assertOwnUser(request, userId);
    this.requireStockUpDatabase();
    if (Object.values(body).every((value) => value === undefined)) throw new BadRequestException('At least one stock-up row field is required.');
    const historyWindowStart = body.historyWindowStart === undefined ? undefined : requireIsoDate(body.historyWindowStart, 'historyWindowStart');
    const historyWindowEnd = body.historyWindowEnd === undefined ? undefined : requireIsoDate(body.historyWindowEnd, 'historyWindowEnd');
    const rows = await this.postgres.query<MultiWeekStockUpSqlRow>(
      `update multi_week_stock_up_rows set
         product_id = coalesce($3, product_id),
         product_name = coalesce($4, product_name),
         store_id = coalesce($5, store_id),
         store_name = coalesce($6, store_name),
         planning_weeks = coalesce($7, planning_weeks),
         weekly_need_units = coalesce($8, weekly_need_units),
         package_units = coalesce($9, package_units),
         comparable_unit = coalesce($10, comparable_unit),
         current_unit_price = coalesce($11, current_unit_price),
         historical_low_unit_price = coalesce($12, historical_low_unit_price),
         typical_unit_price = coalesce($13, typical_unit_price),
         confidence = coalesce($14, confidence),
         history_window_start = coalesce($15::timestamptz, history_window_start),
         history_window_end = coalesce($16::timestamptz, history_window_end),
         storage_limit_weeks = coalesce($17, storage_limit_weeks),
         no_forecast_reason = coalesce($18, no_forecast_reason),
         review_trigger = coalesce($19, review_trigger),
         updated_at = now()
       where user_id = $1 and row_id = $2
       returning row_id, user_id, product_id, product_name, store_id, store_name, planning_weeks, weekly_need_units,
         package_units, comparable_unit, current_unit_price, historical_low_unit_price, typical_unit_price,
         confidence, history_window_start, history_window_end, storage_limit_weeks, no_forecast_reason, review_trigger, updated_at`,
      [
        userId,
        rowId,
        optionalTrim(body.productId),
        optionalTrim(body.productName),
        optionalTrim(body.storeId),
        optionalTrim(body.storeName),
        body.planningWeeks ?? null,
        body.weeklyNeedUnits ?? null,
        body.packageUnits ?? null,
        body.comparableUnit?.trim() || null,
        body.currentUnitPrice ?? null,
        body.historicalLowUnitPrice ?? null,
        body.typicalUnitPrice ?? null,
        body.confidence ?? null,
        historyWindowStart ?? null,
        historyWindowEnd ?? null,
        body.storageLimitWeeks ?? null,
        optionalTrim(body.noForecastReason),
        optionalTrim(body.reviewTrigger)
      ]
    );
    if (rows.length === 0) throw new NotFoundException('Stock-up row not found');
    const updated = rows[0]!;
    assertHistoryWindow(iso(updated.history_window_start), iso(updated.history_window_end));
    return stockUpListResponse(userId, await this.fetchStockUpRows(userId));
  }

  private requireStockUpDatabase() {
    if (!this.postgres.isConfigured()) throw new ServiceUnavailableException('DATABASE_URL is required for signed-in stock-up lists.');
  }

  private fetchStockUpRows(userId: string) {
    return this.postgres.query<MultiWeekStockUpSqlRow>(
      `select row_id, user_id, product_id, product_name, store_id, store_name, planning_weeks, weekly_need_units,
         package_units, comparable_unit, current_unit_price, historical_low_unit_price, typical_unit_price,
         confidence, history_window_start, history_window_end, storage_limit_weeks, no_forecast_reason, review_trigger, updated_at
       from multi_week_stock_up_rows
       where user_id = $1
       order by updated_at desc, row_id`,
      [userId]
    );
  }
}
