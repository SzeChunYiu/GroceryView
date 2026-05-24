import { Body, Controller, Delete, Get, Headers, HttpCode, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { basketCompareEndpoint, savedBasketCompareEndpoint } from '@groceryview/api';
import { groceryApi } from '../demo-data.js';
import { resolveProductNameLocale } from '../product-name-locale.js';
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
@Controller()
export class RealBasketsController {
  constructor(private readonly realCatalog: RealCatalogService) {}

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
}
