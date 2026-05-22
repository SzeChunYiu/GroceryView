import { Controller, Get, NotFoundException, Param, Query, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { allStores, groceryApi } from '../demo-data.js';
import { DealsService } from '../deals/deals.service.js';

@ApiTags('stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  @ApiOkResponse({ description: 'Store list' })
  list() {
    return allStores();
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
  @ApiOkResponse({ description: 'Store detail' })
  detail(@Param('id') id: string) {
    const store = groceryApi.getStore(id);
    if (!store) throw new NotFoundException('Store not found');
    return { ...store, demo: true };
  }
}
