import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';

@ApiTags('deals')
@Controller('deals')
export class DealsController {
  @Get('flyer-offers')
  @ApiOkResponse({ description: 'Active per-branch weekly flyer offers with source evidence' })
  flyerOffers(
    @Query('asOf') asOf?: string,
    @Query('storeId') storeId?: string,
    @Query('chain') chain?: string,
    @Query('category') category?: string,
    @Query('productId') productId?: string
  ) {
    return {
      ...groceryApi.getFlyerOffers({ asOf, storeId, chain, category, productId }),
      demo: true
    };
  }
}
