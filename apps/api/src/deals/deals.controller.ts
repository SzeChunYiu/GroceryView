import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { optionalSingleQueryParameter, validateNoUnexpectedQueryParameters } from '../middleware/validate.js';
import { DealsService } from './deals.service.js';

@ApiTags('deals')
@Controller('deals')
export class DealsController {
  constructor(private readonly deals: DealsService) {}

  @Get()
  @ApiOkResponse({ description: 'Current items priced below their 30-day rolling average, sorted by discount percentage' })
  rollingAverageDeals(@Query() query: Record<string, unknown>) {
    validateNoUnexpectedQueryParameters(query, ['category'], 'deals');
    return this.deals.rollingAverageDeals({ category: optionalSingleQueryParameter(query, 'category') });
  }

  @Get('flyer-offers')
  @ApiOkResponse({ description: 'Active per-branch weekly flyer offers with source evidence' })
  flyerOffers(
    @Query('asOf') asOf?: string,
    @Query('storeId') storeId?: string,
    @Query('chain') chain?: string,
    @Query('category') category?: string,
    @Query('productId') productId?: string
  ) {
    return this.deals.flyerOffers({ asOf, storeId, chain, category, productId });
  }

  @Get('discounts')
  @ApiOkResponse({ description: 'Active per-branch weekly discounts with source evidence' })
  discounts(
    @Query('asOf') asOf?: string,
    @Query('storeId') storeId?: string,
    @Query('chain') chain?: string,
    @Query('category') category?: string,
    @Query('productId') productId?: string
  ) {
    return this.deals.flyerOffers({ asOf, storeId, chain, category, productId });
  }
}
