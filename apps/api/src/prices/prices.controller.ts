import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { demoPrices, demoSeries } from '../demo-data';

@ApiTags('prices')
@Controller('products/:slug')
export class PricesController {
  @Get('prices')
  @ApiParam({ name: 'slug', example: 'zoegas-skane-mellanrost-450g' })
  @ApiOkResponse({ description: 'Demo product price quotes.' })
  listPrices(@Param('slug') slug: string) {
    return demoPrices.filter((price) => price.productSlug === slug);
  }

  @Get('series')
  @ApiParam({ name: 'slug', example: 'zoegas-skane-mellanrost-450g' })
  @ApiOkResponse({ description: 'Demo 90-day price series.' })
  getSeries(@Param('slug') slug: string) {
    return (
      demoSeries.find((series) => series.productSlug === slug) ?? {
        productSlug: slug,
        range: '90d',
        points: [],
        demo: true,
      }
    );
  }
}
