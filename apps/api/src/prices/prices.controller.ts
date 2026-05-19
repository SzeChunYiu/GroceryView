import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('prices')
@Controller()
export class PricesController {
  @Get('products/:slug/prices')
  @ApiOkResponse({ description: 'List latest store prices for a product.' })
  getLatestPrices(@Param('slug') slug: string) {
    return { productSlug: slug, items: [] };
  }

  @Get('products/:slug/price-observations')
  @ApiOkResponse({ description: 'List observed product prices with provenance.' })
  getPriceObservations(@Param('slug') slug: string) {
    return { productSlug: slug, items: [] };
  }
}
