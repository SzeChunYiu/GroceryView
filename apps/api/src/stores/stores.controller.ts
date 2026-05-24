import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query, ServiceUnavailableException } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { allStores, groceryApi } from '../demo-data.js';
import { DealsService } from '../deals/deals.service.js';
import { storesRoutes } from '../routes/stores.js';
import { NearestStoresService } from './nearest-stores.service.js';

@ApiTags('stores')
@Controller('stores')
export class StoresController {
  constructor(
    private readonly dealsService: DealsService,
    private readonly nearestStoresService: NearestStoresService
  ) {}

  @Get()
  @ApiOkResponse({ description: 'Store list' })
  list() {
    return allStores();
  }

  @Get('nearest')
  @ApiOkResponse({ description: 'Nearest stores sorted by Haversine distance' })
  async nearest(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
    @Query('chain') chain?: string
  ) {
    if (!this.nearestStoresService.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required for nearest-store lookups.');
    }

    const latitude = parseRequiredFiniteQueryNumber(lat, 'lat');
    const longitude = parseRequiredFiniteQueryNumber(lng, 'lng');
    const radiusKm = parseRequiredFiniteQueryNumber(radius ?? '10', 'radius');
    if (radiusKm <= 0) throw new BadRequestException('radius must be greater than 0.');
    const normalizedChain = chain?.trim() || undefined;
    const stores = await this.nearestStoresService.nearest({ latitude, longitude, radiusKm, chain: normalizedChain });

    return {
      lat: latitude,
      lng: longitude,
      radiusKm,
      chain: normalizedChain ?? null,
      stores
    };
  }

  @Get(':id/deals')
  @ApiOkResponse({ description: 'Ranked in-store deals for one store' })
  deals(@Param('id') id: string) {
    if (!groceryApi.getStore(id)) throw new NotFoundException('Store not found');
    return groceryApi.getStoreDeals(id).map((deal) => ({ ...deal, demo: true }));
  }

  @Get(':id/deal-summary')
  @ApiOkResponse({ description: 'Store deal summary with category leaders and score guardrails' })
  dealSummary(@Param('id') id: string) {
    if (!groceryApi.getStore(id)) throw new NotFoundException('Store not found');
    return { ...groceryApi.getStoreDealSummary(id), demo: true };
  }

  @Get(':id/flyer-offers')
  @ApiOkResponse({ description: 'Active weekly flyer offers captured for one branch' })
  async flyerOffers(@Param('id') id: string, @Query('asOf') asOf?: string) {
    if (!this.dealsService.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required for real store flyer-offer data.');
    }
    const report = await this.dealsService.storeFlyerOffers(id, { asOf });
    if (!report) throw new NotFoundException('Store not found');
    return report;
  }

  @Get(':id/discounts')
  @ApiOkResponse({ description: 'Active weekly discounts captured for one branch' })
  async discounts(@Param('id') id: string, @Query('asOf') asOf?: string) {
    if (!this.dealsService.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required for real store discount data.');
    }
    const report = await this.dealsService.storeFlyerOffers(id, { asOf });
    if (!report) throw new NotFoundException('Store not found');
    return report;
  }

  @Get(':id/coverage')
  @ApiOkResponse({ description: 'Verified shelf price coverage for one store' })
  coverage(@Param('id') id: string) {
    if (!groceryApi.getStore(id)) throw new NotFoundException('Store not found');
    return { ...groceryApi.getStorePriceCoverage(id), demo: true };
  }

  @Get(':id/category-coverage')
  @ApiOkResponse({ description: 'Verified shelf price coverage grouped by category for one store' })
  categoryCoverage(@Param('id') id: string) {
    if (!groceryApi.getStore(id)) throw new NotFoundException('Store not found');
    return { ...groceryApi.getStoreCategoryCoverage(id), demo: true };
  }

  @Get(storesRoutes.ratingSummaryActionPath)
  @ApiOkResponse({ description: storesRoutes.ratingDescription })
  ratingSummary(@Param('id') id: string, @Query('userId') userId?: string) {
    return storeRatingSummary(parseRatingStoreId(id), userId);
  }

  @Post(storesRoutes.ratingsActionPath)
  @ApiCreatedResponse({ description: 'Store rating accepted' })
  rateStore(@Param('id') id: string, @Body() body: { userId?: string; rating?: number | string }) {
    const storeId = parseRatingStoreId(id);
    const userId = parseRatingUserId(body.userId);
    const rating = parseStoreRating(body.rating);
    storeRatingOverrides.set(`${storeId}:${userId}`, rating);
    return storeRatingSummary(storeId, userId);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Store detail with opening hours and assortment overview' })
  detail(@Param('id') id: string) {
    const detail = groceryApi.getStoreDetail(id);
    if (!detail) throw new NotFoundException('Store not found');
    return { ...detail, demo: true };
  }
}

function parseRequiredFiniteQueryNumber(value: string | undefined, name: string): number {
  if (value === undefined || value.trim().length === 0) {
    throw new BadRequestException(`${name} query parameter is required.`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new BadRequestException(`${name} query parameter must be a finite number.`);
  }
  return parsed;
}

const storeRatingOverrides = new Map<string, number>();

function storeRatingSeedFor(storeId: string): number {
  return [...storeId].reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 17), 0);
}

function seededStoreRatingSummary(storeId: string) {
  const seed = storeRatingSeedFor(storeId);
  const ratingCount = 4 + (seed % 37);
  const averageRating = Math.min(5, Math.max(1, Math.round((3.2 + (seed % 18) / 10) * 10) / 10));
  return { averageRating, ratingCount };
}

function parseRatingUserId(value: string | undefined): string {
  const userId = value?.trim() || 'demo';
  if (!/^[a-zA-Z0-9:_-]+$/.test(userId)) throw new BadRequestException('userId must be a slug or id.');
  return userId;
}

function parseRatingStoreId(value: string): string {
  const storeId = value.trim();
  if (!/^[a-zA-Z0-9:_-]+$/.test(storeId)) throw new BadRequestException('store id must be a slug or id.');
  return storeId;
}

function parseStoreRating(value: number | string | undefined): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < storesRoutes.minRating || parsed > storesRoutes.maxRating) {
    throw new BadRequestException(`rating must be an integer from ${storesRoutes.minRating} to ${storesRoutes.maxRating}.`);
  }
  return parsed;
}

function storeRatingSummary(storeId: string, userId?: string) {
  const seeded = seededStoreRatingSummary(storeId);
  const parsedUserId = userId ? parseRatingUserId(userId) : undefined;
  const userRating = parsedUserId ? storeRatingOverrides.get(`${storeId}:${parsedUserId}`) ?? null : null;
  const overrideRatings = [...storeRatingOverrides.entries()]
    .filter(([key]) => key.startsWith(`${storeId}:`))
    .map(([, rating]) => rating);
  const total = seeded.averageRating * seeded.ratingCount + overrideRatings.reduce((sum, rating) => sum + rating, 0);
  const ratingCount = seeded.ratingCount + overrideRatings.length;
  const averageRating = Math.round((total / ratingCount) * 10) / 10;

  return {
    storeId,
    averageRating,
    ratingCount,
    userRating,
    minRating: storesRoutes.minRating,
    maxRating: storesRoutes.maxRating,
    demo: true
  };
}
