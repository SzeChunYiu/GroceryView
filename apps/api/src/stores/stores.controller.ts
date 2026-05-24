import { Controller, Get, NotFoundException, Param, Query, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { allStores, groceryApi } from '../demo-data.js';
import { DealsService } from '../deals/deals.service.js';
import { jsonArrayResponse, jsonResponse, param, query } from '../openapi.js';

@ApiTags('stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  @jsonResponse('Store list')
  list() {
    return allStores();
  }

  @Get(':id/deals')
  @param('id', true, 'Store identifier used for in-store deal lookup.')
  @jsonArrayResponse('Ranked in-store deals for one store')
  deals(@Param('id') id: string) {
    if (!groceryApi.getStore(id)) throw new NotFoundException('Store not found');
    return groceryApi.getStoreDeals(id).map((deal) => ({ ...deal, demo: true }));
  }

  @Get(':id/deal-summary')
  @param('id', true, 'Store identifier used for deal summary lookup.')
  @jsonResponse('Store deal summary with category leaders and score guardrails')
  dealSummary(@Param('id') id: string) {
    if (!groceryApi.getStore(id)) throw new NotFoundException('Store not found');
    return { ...groceryApi.getStoreDealSummary(id), demo: true };
  }

  @Get(':id/flyer-offers')
  @param('id', true, 'Store identifier used for real flyer offer lookup.')
  @query('asOf', false, 'Optional ISO-8601 timestamp controlling source freshness.')
  @jsonResponse('Active weekly flyer offers captured for one branch')
  async flyerOffers(@Param('id') id: string, @Query('asOf') asOf?: string) {
    if (!this.dealsService.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required for real store flyer-offer data.');
    }
    const report = await this.dealsService.storeFlyerOffers(id, { asOf });
    if (!report) throw new NotFoundException('Store not found');
    return report;
  }

  @Get(':id/discounts')
  @param('id', true, 'Store identifier used for real discount lookup.')
  @query('asOf', false, 'Optional ISO-8601 timestamp controlling source freshness.')
  @jsonResponse('Active weekly discounts captured for one branch')
  async discounts(@Param('id') id: string, @Query('asOf') asOf?: string) {
    if (!this.dealsService.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required for real store discount data.');
    }
    const report = await this.dealsService.storeFlyerOffers(id, { asOf });
    if (!report) throw new NotFoundException('Store not found');
    return report;
  }

  @Get(':id/coverage')
  @param('id', true, 'Store identifier used for coverage report.')
  @jsonResponse('Verified shelf price coverage for one store')
  coverage(@Param('id') id: string) {
    if (!groceryApi.getStore(id)) throw new NotFoundException('Store not found');
    return { ...groceryApi.getStorePriceCoverage(id), demo: true };
  }

  @Get(':id/category-coverage')
  @param('id', true, 'Store identifier used for category coverage lookup.')
  @jsonResponse('Verified shelf price coverage grouped by category for one store')
  categoryCoverage(@Param('id') id: string) {
    if (!groceryApi.getStore(id)) throw new NotFoundException('Store not found');
    return { ...groceryApi.getStoreCategoryCoverage(id), demo: true };
  }

  @Get(':id')
  @param('id', true, 'Store identifier used for detail lookup.')
  @jsonResponse('Store detail with opening hours and assortment overview')
  detail(@Param('id') id: string) {
    const detail = groceryApi.getStoreDetail(id);
    if (!detail) throw new NotFoundException('Store not found');
    return { ...detail, demo: true };
  }
}
