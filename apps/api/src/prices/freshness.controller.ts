import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';

@ApiTags('prices')
@Controller('prices')
export class PriceFreshnessController {
  @Get('freshness')
  @ApiOkResponse({ description: 'Price freshness and stale-price backfill queue' })
  freshness(@Query('asOf') asOf?: string) {
    return { ...groceryApi.getPriceFreshnessReport(asOf), demo: true };
  }
}
