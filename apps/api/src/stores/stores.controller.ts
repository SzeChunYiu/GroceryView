import { BadRequestException, Controller, Get, NotFoundException, Param, Query, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { allStores, groceryApi } from '../demo-data.js';
import { DealsService } from '../deals/deals.service.js';
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
