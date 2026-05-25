import { randomUUID } from 'node:crypto';
import { BadRequestException, Body, Controller, Get, HttpCode, NotFoundException, Param, Post, Query, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IsInt, IsString, Matches, Max, Min } from 'class-validator';
import { allStores, groceryApi } from '../demo-data.js';
import { DealsService } from '../deals/deals.service.js';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';
import { NearestStoresService } from './nearest-stores.service.js';

class StoreRatingDto {
  @IsString()
  @Matches(/^[A-Za-z0-9:_./@-]{3,160}$/)
  userId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
}

type StoreRatingAggregateRow = {
  averageRating: number | string | null;
  ratingCount: number | string;
  userRating?: number | string | null;
};

@ApiTags('stores')
@Controller('stores')
export class StoresController {
  constructor(
    private readonly dealsService: DealsService,
    private readonly nearestStoresService: NearestStoresService,
    private readonly postgres: PostgresQueryExecutorService
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

  @Get(':id/rating')
  @ApiOkResponse({ description: 'Average user rating for one store' })
  async rating(@Param('id') id: string, @Query('userId') userId?: string) {
    if (!this.postgres.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required for store ratings.');
    }
    return this.storeRatingSummary(id, userId);
  }

  @Post(':id/rating')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Create or update a user rating for one store' })
  async rate(@Param('id') id: string, @Body() body: StoreRatingDto) {
    if (!this.postgres.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required for store ratings.');
    }
    await this.postgres.query(
      `
        insert into store_ratings (id, user_id, store_id, rating, created_at, updated_at)
        values ($1, $2, $3, $4, current_timestamp, current_timestamp)
        on conflict (user_id, store_id)
        do update set rating = excluded.rating, updated_at = current_timestamp
      `,
      [randomUUID(), body.userId, id, body.rating]
    );
    return this.storeRatingSummary(id, body.userId);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Store detail with opening hours and assortment overview' })
  detail(@Param('id') id: string) {
    const detail = groceryApi.getStoreDetail(id);
    if (!detail) throw new NotFoundException('Store not found');
    return { ...detail, demo: true };
  }

  private async storeRatingSummary(storeId: string, userId?: string) {
    const rows = await this.postgres.query<StoreRatingAggregateRow>(
      `
        select
          avg(rating)::float as "averageRating",
          count(*)::int as "ratingCount",
          max(case when user_id = $2 then rating else null end)::int as "userRating"
        from store_ratings
        where store_id = $1
      `,
      [storeId, userId ?? null]
    );
    const row = rows[0] ?? { averageRating: null, ratingCount: 0, userRating: null };
    const averageRating = row.averageRating === null ? null : Number(row.averageRating);
    const userRating = row.userRating === null || row.userRating === undefined ? null : Number(row.userRating);

    return {
      storeId,
      averageRating: averageRating === null || Number.isNaN(averageRating) ? null : Math.round(averageRating * 10) / 10,
      ratingCount: Number(row.ratingCount) || 0,
      userRating: userRating === null || Number.isNaN(userRating) ? null : userRating
    };
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
