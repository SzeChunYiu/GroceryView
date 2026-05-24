import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { jsonResponse, query } from '../openapi.js';
import { DealsService } from './deals.service.js';

@ApiTags('deals')
@Controller('deals')
export class DealsController {
  constructor(private readonly deals: DealsService) {}

  @Get('flyer-offers')
  @jsonResponse('Active per-branch weekly flyer offers with source evidence')
  @query('asOf', false, 'Optional ISO-8601 timestamp filter for effective flyer offers.')
  @query('storeId', false, 'Optional store id filter.')
  @query('chain', false, 'Optional chain slug filter.')
  @query('category', false, 'Optional category slug filter.')
  @query('productId', false, 'Optional product id filter.')
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
  @jsonResponse('Active per-branch weekly discounts with source evidence')
  @query('asOf', false, 'Optional ISO-8601 timestamp filter for effective discount offers.')
  @query('storeId', false, 'Optional store id filter.')
  @query('chain', false, 'Optional chain slug filter.')
  @query('category', false, 'Optional category slug filter.')
  @query('productId', false, 'Optional product id filter.')
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
